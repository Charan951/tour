import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'connectivity.dart';
import 'realtime_service.dart';

/// Thrown when the server responds with a non-2xx status code.
/// This is a logical error (auth, validation, not-found, etc.) — NOT a
/// network failure — so the IP-fallback loop must NOT retry on this.
class _ApiException implements Exception {
  final String message;
  const _ApiException(this.message);
  @override
  String toString() => message;
}

/// Thrown on 5xx server/gateway errors (500, 502, 503, 530 Cloudflare errors).
/// Unlike 4xx logical errors, this allows the candidate retry loop to try the next host.
class _ApiServerException implements Exception {
  final String message;
  const _ApiServerException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  // Remote HTTPS server: allow for DNS + TLS handshake + response on slow
  // mobile-data / weak-Wi-Fi links. 3s was far too aggressive and made every
  // request fail on anything but a fast connection.
  static const int timeoutDuration = 20;
  static final http.Client _client = http.Client();
  static String? _workingHost;
  static String? _cachedToken;

  static void resetWorkingHost() {
    _workingHost = null;
  }

  static ImageProvider? getAvatarImageProvider(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    final clean = url.trim();
    if (clean.startsWith('data:')) {
      try {
        final base64String = clean.split(',').last;
        return MemoryImage(base64Decode(base64String));
      } catch (_) {
        return null;
      }
    }
    return NetworkImage(ApiConfig.formatImageUrl(clean));
  }

  static Future<String> uploadImageBytes(Uint8List bytes, {String? filename}) async {
    final candidateUrls = _generateCandidateUrls(ApiConfig.uploadImage);
    Object? lastError;
    final fname = (filename != null && filename.isNotEmpty)
        ? filename
        : 'profile_photo_${DateTime.now().millisecondsSinceEpoch}.jpg';

    for (final targetUrl in candidateUrls) {
      try {
        final request = http.MultipartRequest('POST', Uri.parse(targetUrl));
        final headers = await _getHeaders();
        if (headers.containsKey('Authorization')) {
          request.headers['Authorization'] = headers['Authorization']!;
        }

        final multipartFile = http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: fname,
        );
        request.files.add(multipartFile);

        final streamedResponse = await request.send().timeout(const Duration(seconds: 15));
        final response = await http.Response.fromStream(streamedResponse);
        final body = _processResponse(response, targetUrl: targetUrl);

        if (body is Map) {
          final url = body['url'] ?? body['data']?['url'] ?? body['secure_url'];
          if (url != null && url.toString().isNotEmpty) {
            _onHostSuccess(targetUrl);
            return url.toString();
          }
        }
      } catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('Upload image error ($targetUrl): $e');
      }
    }

    // Fallback: Return data URI base64 string if network endpoint is unreachable
    try {
      final base64Str = base64Encode(bytes);
      return 'data:image/jpeg;base64,$base64Str';
    } catch (_) {}

    throw Exception(
        'Could not upload image: ${lastError != null ? lastError.toString() : "Network error"}');
  }

  static Future<void> initToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _cachedToken = prefs.getString('hc_access_token') ?? prefs.getString('hc_token');
    } catch (_) {}
  }

  static void setToken(String? token) {
    _cachedToken = token;
  }

  static Future<Map<String, String>> _getHeaders() async {
    if (_cachedToken == null) {
      await initToken();
    }

    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (_cachedToken != null && _cachedToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_cachedToken';
    }

    return headers;
  }

  static List<String> _generateCandidateUrls(String originalUrl) {
    final candidates = <String>[];

    if (_workingHost != null && _workingHost!.isNotEmpty) {
      try {
        final uri = Uri.parse(originalUrl);
        if (uri.host != _workingHost) {
          candidates.add(originalUrl.replaceAll(uri.host, _workingHost!));
        }
      } catch (_) {}
    }

    if (!candidates.contains(originalUrl)) {
      candidates.add(originalUrl);
    }

    try {
      final uri = Uri.parse(originalUrl);
      final host = uri.host;
      final portSuffix = uri.hasPort ? ':${uri.port}' : '';
      final hostWithPort = '$host$portSuffix';

      // 1. ADB reverse / local host fallback (http://127.0.0.1:5000)
      final alt127 = originalUrl.replaceAll(hostWithPort, '127.0.0.1:5000').replaceAll('https://', 'http://');
      if (!candidates.contains(alt127)) candidates.add(alt127);

      // 2. Localhost fallback (http://localhost:5000)
      final altLocal = originalUrl.replaceAll(hostWithPort, 'localhost:5000').replaceAll('https://', 'http://');
      if (!candidates.contains(altLocal)) candidates.add(altLocal);

      // 3. Android emulator fallback (http://10.0.2.2:5000)
      final altEmulator = originalUrl.replaceAll(hostWithPort, '10.0.2.2:5000').replaceAll('https://', 'http://');
      if (!candidates.contains(altEmulator)) candidates.add(altEmulator);

      // 3. Custom host / Wi-Fi IP fallback
      if (ApiConfig.hostIp.isNotEmpty) {
        final targetHost = ApiConfig.hostIp.contains(':') ? ApiConfig.hostIp : '${ApiConfig.hostIp}:5000';
        final altLan = originalUrl.replaceAll(hostWithPort, targetHost).replaceAll('https://', 'http://');
        if (!candidates.contains(altLan)) candidates.add(altLan);
      }

      // 4. Production remote fallback (only when explicitly in Production mode)
      if (ApiConfig.isProduction && ApiConfig.productionHost.isNotEmpty) {
        final prodUri = Uri.parse(ApiConfig.productionHost);
        final altProd = originalUrl.replaceAll(hostWithPort, prodUri.host).replaceAll('http://', 'https://');
        if (!candidates.contains(altProd)) candidates.add(altProd);
      }
    } catch (_) {}

    return candidates;
  }

  static void _onHostSuccess(String targetUrl) {
    ConnectivityStatus.instance.report(true);
    try {
      final uri = Uri.parse(targetUrl);
      if (uri.host.isNotEmpty && _workingHost != uri.host) {
        final oldHost = _workingHost;
        _workingHost = uri.host;
        if (uri.host != 'localhost' && uri.host != '127.0.0.1') {
          ApiConfig.hostIp = uri.host;
          if (kDebugMode) debugPrint('🚀 Cached working host IP: ${uri.host}');
          if (oldHost == null || oldHost == 'localhost' || oldHost == '127.0.0.1') {
            RealtimeService.instance.reconnect();
          }
        }
      }
    } catch (_) {}
  }

  static Future<dynamic> get(String url) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        if (kDebugMode) {
          debugPrint('========== API REQUEST (GET) ==========');
          debugPrint('URL: $targetUrl');
        }
        final headers = await _getHeaders();
        final response = await _client
            .get(Uri.parse(targetUrl), headers: headers)
            .timeout(const Duration(seconds: timeoutDuration));

        return _processResponse(response, targetUrl: targetUrl);
      } on _ApiException {
        rethrow;
      } on _ApiServerException catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('GET 5XX ERROR ($targetUrl): $e');
      } catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('GET ERROR ($targetUrl): $e');
      }
    }

    return await _handleOfflineFallback('GET', url, null, lastError!);
  }

  static Future<dynamic> post(String url, Map<String, dynamic> body) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        if (kDebugMode) {
          // Never log the request body: it can contain passwords / payment data.
          debugPrint('========== API REQUEST (POST) ==========');
          debugPrint('URL: $targetUrl');
        }
        final headers = await _getHeaders();
        final response = await _client
            .post(
              Uri.parse(targetUrl),
              headers: headers,
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: timeoutDuration));

        return _processResponse(response, targetUrl: targetUrl);
      } on _ApiException {
        rethrow;
      } on _ApiServerException catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('POST 5XX ERROR ($targetUrl): $e');
      } catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('POST ERROR ($targetUrl): $e');
      }
    }

    return await _handleOfflineFallback('POST', url, body, lastError!);
  }

  static Future<dynamic> put(String url, Map<String, dynamic> body) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        final headers = await _getHeaders();
        final response = await _client
            .put(Uri.parse(targetUrl), headers: headers, body: jsonEncode(body))
            .timeout(const Duration(seconds: timeoutDuration));

        return _processResponse(response, targetUrl: targetUrl);
      } on _ApiException {
        rethrow;
      } on _ApiServerException catch (e) {
        lastError = e;
      } catch (e) {
        lastError = e;
      }
    }

    return await _handleOfflineFallback('PUT', url, body, lastError!);
  }

  static Future<dynamic> patch(String url, Map<String, dynamic> body) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        final headers = await _getHeaders();
        final response = await _client
            .patch(Uri.parse(targetUrl),
                headers: headers, body: jsonEncode(body))
            .timeout(const Duration(seconds: timeoutDuration));

        return _processResponse(response, targetUrl: targetUrl);
      } on _ApiException {
        rethrow;
      } on _ApiServerException catch (e) {
        lastError = e;
      } catch (e) {
        lastError = e;
      }
    }

    return await _handleOfflineFallback('PATCH', url, body, lastError!);
  }

  static Future<dynamic> delete(String url) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        final headers = await _getHeaders();
        final response = await _client
            .delete(Uri.parse(targetUrl), headers: headers)
            .timeout(const Duration(seconds: timeoutDuration));

        return _processResponse(response, targetUrl: targetUrl);
      } on _ApiException {
        rethrow;
      } on _ApiServerException catch (e) {
        lastError = e;
      } catch (e) {
        lastError = e;
      }
    }

    return await _handleOfflineFallback('DELETE', url, null, lastError!);
  }

  static dynamic _processResponse(http.Response response, {String? targetUrl}) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      if (response.statusCode == 404) {
        throw const _ApiServerException('Resource endpoint not found on server (404)');
      }
      if (response.statusCode == 429) {
        throw Exception('Rate limited (429)');
      }
      if (response.statusCode >= 500) {
        throw _ApiServerException(
          response.statusCode == 530
              ? 'Server unavailable (Error 530)'
              : 'Server error (${response.statusCode})',
        );
      }
      throw _ApiException('Invalid server response (${response.statusCode})');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (targetUrl != null) _onHostSuccess(targetUrl);
      return body;
    } else if (response.statusCode == 429) {
      throw Exception('Rate limited (429)');
    } else if (response.statusCode >= 500) {
      final message = (body is Map && body['message'] != null)
          ? body['message']
          : (response.statusCode == 530
              ? 'Server unavailable (Error 530)'
              : 'Server error (${response.statusCode})');
      throw _ApiServerException(message.toString());
    } else {
      final message = (body is Map && body['message'] != null)
          ? body['message']
          : 'Server error (${response.statusCode})';
      final msgStr = message.toString();
      if (msgStr.toLowerCase().contains('too many') || msgStr.toLowerCase().contains('rate limit')) {
        throw Exception('Rate limited: $msgStr');
      }
      throw _ApiException(msgStr);
    }
  }

  static Future<dynamic> _handleOfflineFallback(
      String method, String url, Map<String, dynamic>? body, Object error) async {
    if (kDebugMode) debugPrint('⚡ All candidate network endpoints unreachable for ($url).');
    ConnectivityStatus.instance.report(false);

    // No fabricated success responses. Every write that never reached the
    // server must surface an honest failure so the UI shows an error / retry
    // state instead of telling the user an enquiry, profile change, password
    // change or payment succeeded when it did not.
    return {
      'success': false,
      'data': null,
      'message': 'Server unreachable.',
    };
  }

  static Future<dynamic> saveFcmToken(String token, {String? email, String? role, String? mobile, String? platform}) async {
    final body = <String, dynamic>{'token': token};
    if (email != null && email.isNotEmpty) body['email'] = email;
    if (role != null && role.isNotEmpty) body['role'] = role;
    if (mobile != null && mobile.isNotEmpty) body['mobile'] = mobile;
    body['platform'] = platform ?? (defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android');
    return post(ApiConfig.fcmToken, body);
  }

  static Future<dynamic> removeFcmToken(String token, {String? email}) async {
    final body = <String, dynamic>{'token': token};
    if (email != null && email.isNotEmpty) body['email'] = email;
    return post('${ApiConfig.fcmToken}/remove', body);
  }
}
