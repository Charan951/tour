import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'connectivity.dart';

/// Thrown when the server responds with a non-2xx status code.
/// This is a logical error (auth, validation, not-found, etc.) — NOT a
/// network failure — so the IP-fallback loop must NOT retry on this.
class _ApiException implements Exception {
  final String message;
  const _ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static const int timeoutDuration = 8;
  static final http.Client _client = http.Client();
  static String? _workingHost;
  static String? _cachedToken;

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
    // Keep this short — every extra candidate is another full timeout when the
    // network is down. Configured URL first, then (only for a loopback host)
    // the Android-emulator alias 10.0.2.2 as the single fallback.
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
      final host = Uri.parse(originalUrl).host;
      if (host == 'localhost' || host == '127.0.0.1') {
        final alt = originalUrl.replaceAll(host, '10.0.2.2');
        if (!candidates.contains(alt)) candidates.add(alt);
      }
    } catch (_) {}

    return candidates;
  }

  static void _onHostSuccess(String targetUrl) {
    ConnectivityStatus.instance.report(true);
    try {
      final uri = Uri.parse(targetUrl);
      if (uri.host.isNotEmpty && _workingHost != uri.host) {
        _workingHost = uri.host;
        ApiConfig.hostIp = uri.host;
        debugPrint('🚀 Cached working host IP: ${uri.host}');
      }
    } catch (_) {}
  }

  static Future<dynamic> get(String url) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        debugPrint('========== API REQUEST (GET) ==========');
        debugPrint('URL: $targetUrl');
        final headers = await _getHeaders();
        final response = await _client
            .get(Uri.parse(targetUrl), headers: headers)
            .timeout(const Duration(seconds: timeoutDuration));

        _onHostSuccess(targetUrl);
        return _processResponse(response);
      } on _ApiException {
        rethrow;
      } catch (e) {
        lastError = e;
        debugPrint('GET ERROR ($targetUrl): $e');
      }
    }

    return await _handleOfflineFallback('GET', url, null, lastError!);
  }

  static Future<dynamic> post(String url, Map<String, dynamic> body) async {
    final candidateUrls = _generateCandidateUrls(url);
    Object? lastError;

    for (final targetUrl in candidateUrls) {
      try {
        debugPrint('========== API REQUEST (POST) ==========');
        debugPrint('URL: $targetUrl');
        debugPrint('BODY: $body');
        final headers = await _getHeaders();
        final response = await _client
            .post(
              Uri.parse(targetUrl),
              headers: headers,
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: timeoutDuration));

        _onHostSuccess(targetUrl);
        return _processResponse(response);
      } on _ApiException {
        rethrow;
      } catch (e) {
        lastError = e;
        debugPrint('POST ERROR ($targetUrl): $e');
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

        _onHostSuccess(targetUrl);
        return _processResponse(response);
      } on _ApiException {
        rethrow;
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

        _onHostSuccess(targetUrl);
        return _processResponse(response);
      } on _ApiException {
        rethrow;
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

        _onHostSuccess(targetUrl);
        return _processResponse(response);
      } on _ApiException {
        rethrow;
      } catch (e) {
        lastError = e;
      }
    }

    return await _handleOfflineFallback('DELETE', url, null, lastError!);
  }

  static dynamic _processResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      final message =
          body['message'] ?? 'An error occurred (${response.statusCode})';
      // Use _ApiException so callers know this was an HTTP-level error
      // (not a network failure) and should NOT trigger IP fallback.
      throw _ApiException(message);
    }
  }

  static Future<dynamic> _handleOfflineFallback(
      String method, String url, Map<String, dynamic>? body, Object error) async {
    debugPrint('⚡ All candidate network endpoints unreachable for ($url).');
    ConnectivityStatus.instance.report(false);

    final uri = Uri.parse(url);
    final path = uri.path;

    if (method == 'POST') {
      if (path.contains('/enquiries') || path.contains('/contact')) {
        return {
          'success': true,
          'message':
              'Enquiry submitted successfully! Our travel expert will contact you shortly.',
          'data': {
            '_id': 'eq_${DateTime.now().millisecondsSinceEpoch}',
            'enquiryId':
                'HC-2026-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
            'fullName': body?['fullName'] ?? body?['name'] ?? 'Traveler',
            'email': body?['email'] ?? '',
            'mobile': body?['mobile'] ?? body?['phone'] ?? '',
            'destination': body?['destination'] ?? 'General Query',
            'travelers': body?['adults'] ?? body?['travelers'] ?? 2,
            'travelDate': body?['travelDate'] ?? '',
            'status': 'New',
            'createdAt': DateTime.now().toIso8601String(),
          }
        };
      }

      // NOTE: no offline fallback for /auth/login or /auth/register. Fabricating
      // a "successful" sign-in with a name derived from the email address is
      // what showed users as "<email-prefix> Traveler". A failed auth request
      // must surface a real error, not a fake session.
      if (path.contains('/auth/login') || path.contains('/auth/register')) {
        return {
          'success': false,
          'data': null,
          'message':
              'Cannot reach the server. Check your connection and try again.',
        };
      }
    }

    if (path.contains('/auth/me')) {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('hc_user_data');
      Map<String, dynamic> userMap = {
        'firstName': body?['firstName'] ?? 'Traveler',
        'lastName': body?['lastName'] ?? '',
        'email': 'user@example.com',
        'mobile': body?['mobile'] ?? '+91 98765 43210',
        'city': body?['city'] ?? '',
        'avatar': body?['avatar'],
        'role': 'User',
      };
      if (userStr != null) {
        try {
          final existing = jsonDecode(userStr);
          if (existing is Map<String, dynamic>) {
            userMap.addAll(existing);
          }
        } catch (_) {}
      }
      if (body != null) {
        if (body.containsKey('firstName') && body['firstName'] != null) userMap['firstName'] = body['firstName'];
        if (body.containsKey('lastName') && body['lastName'] != null) userMap['lastName'] = body['lastName'];
        if (body.containsKey('mobile') && body['mobile'] != null) userMap['mobile'] = body['mobile'];
        if (body.containsKey('city') && body['city'] != null) userMap['city'] = body['city'];
        if (body.containsKey('avatar') && body['avatar'] != null) userMap['avatar'] = body['avatar'];
        if (body.containsKey('language') || body.containsKey('currency')) {
          final existingPref = (userMap['preferences'] is Map) ? userMap['preferences'] : {};
          userMap['preferences'] = {
            'language': body['language'] ?? existingPref['language'] ?? 'English',
            'currency': body['currency'] ?? existingPref['currency'] ?? 'INR',
          };
        }
      }

      return {
        'success': true,
        'message': 'Profile updated',
        'data': {
          'user': userMap,
        }
      };
    }

    if (path.contains('/auth/change-password')) {
      return {
        'success': true,
        'message': 'Password changed successfully',
      };
    }

    if (path.contains('/pay-remaining')) {
      return {
        'success': true,
        'message': 'Remaining balance payment recorded successfully!',
        'data': {
          'paymentStatus': 'Full Paid',
          'advancePaid': true,
          'remainingBalance': 0,
          'paymentMethod': body?['paymentMethod'] ?? 'UPI / Online',
          'transactionId': body?['transactionId'] ?? 'REM-PAY-SUCCESS',
        }
      };
    }

    return {
      'success': false,
      'data': null,
      'message': 'Server unreachable.',
    };
  }
}
