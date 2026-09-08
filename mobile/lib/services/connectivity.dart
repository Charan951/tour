import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import 'offline_queue.dart';

/// Accurate reachability tracker.
/// Uses direct IP sockets (Cloudflare 1.1.1.1 / Google 8.8.8.8) and DNS lookup
/// to reliably detect real internet status without false positives on mobile networks.
class ConnectivityStatus extends ChangeNotifier {
  ConnectivityStatus._();
  static final ConnectivityStatus instance = ConnectivityStatus._();

  bool _online = true;
  bool get online => _online;

  bool _isChecking = false;
  bool get isChecking => _isChecking;

  Timer? _timer;

  void start() {
    _timer ??= Timer.periodic(const Duration(seconds: 1), (_) => check());
    check();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Called by ApiService: `true` after any successful HTTP response, `false` on network failure.
  void report(bool ok) => _set(ok);

  Future<bool> check() async {
    _isChecking = true;
    notifyListeners();

    bool detected = false;
    try {
      // 1. Direct IP socket test to 1.1.1.1 or 8.8.8.8 (No DNS lookup required!)
      try {
        final socket = await Socket.connect(
          InternetAddress('1.1.1.1'),
          53,
          timeout: const Duration(seconds: 1),
        );
        socket.destroy();
        detected = true;
      } catch (_) {
        try {
          final socket = await Socket.connect(
            InternetAddress('8.8.8.8'),
            53,
            timeout: const Duration(seconds: 1),
          );
          socket.destroy();
          detected = true;
        } catch (_) {}
      }

      // 2. Fallback: DNS lookup for well-known internet host (1 second timeout)
      if (!detected) {
        try {
          final res = await InternetAddress.lookup('google.com')
              .timeout(const Duration(seconds: 1));
          if (res.isNotEmpty && res.first.rawAddress.isNotEmpty) {
            detected = true;
          }
        } catch (_) {}
      }

      // 3. Fallback: Server host IP check if configured (1 second timeout)
      if (!detected && ApiConfig.hostIp.isNotEmpty && ApiConfig.hostIp != 'localhost') {
        try {
          final socket = await Socket.connect(
            ApiConfig.hostIp,
            5000,
            timeout: const Duration(seconds: 1),
          );
          socket.destroy();
          detected = true;
        } catch (_) {}
      }

      _set(detected);
    } catch (_) {
      _set(false);
    } finally {
      _isChecking = false;
      notifyListeners();
    }
    return _online;
  }

  void _set(bool value) {
    if (_online == value) return;
    _online = value;
    notifyListeners();
    if (value) {
      // Back online — flush queued offline requests.
      OfflineQueue.instance.flush();
    }
  }
}
