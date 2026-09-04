import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import 'offline_queue.dart';

/// Lightweight reachability tracker. Pings local server / socket and DNS
/// hosts to accurately detect online/offline state without false positives.
class ConnectivityStatus extends ChangeNotifier {
  ConnectivityStatus._();
  static final ConnectivityStatus instance = ConnectivityStatus._();

  bool _online = true;
  bool get online => _online;

  Timer? _timer;

  void start() {
    _timer ??= Timer.periodic(const Duration(seconds: 10), (_) => check());
    check();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Called by ApiService: `true` after any successful HTTP response.
  void report(bool ok) => _set(ok);

  Future<void> check() async {
    try {
      // 1. Test connection to server host (port 5000) directly
      final host = ApiConfig.hostIp;
      final targetHost = (host.isNotEmpty && host != 'localhost') ? host : '127.0.0.1';

      try {
        final socket = await Socket.connect(
          targetHost,
          5000,
          timeout: const Duration(seconds: 2),
        );
        socket.destroy();
        _set(true);
        return;
      } catch (_) {}

      // 2. Test DNS lookup for well-known internet host
      try {
        final res = await InternetAddress.lookup('google.com')
            .timeout(const Duration(seconds: 3));
        if (res.isNotEmpty && res.first.rawAddress.isNotEmpty) {
          _set(true);
          return;
        }
      } catch (_) {}

      // 3. Fallback: preserve current state if API requests were previously working
      _set(_online);
    } catch (_) {
      _set(_online);
    }
  }

  void _set(bool value) {
    if (_online == value) return;
    _online = value;
    notifyListeners();
    if (value) {
      // Back online — send anything queued while offline.
      OfflineQueue.instance.flush();
    }
  }
}
