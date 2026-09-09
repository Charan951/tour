import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import 'offline_queue.dart';

/// Accurate reachability tracker with debounce to prevent false-positive
/// offline screens caused by transient mobile network blips.
///
/// Rules:
///   - Goes OFFLINE only after 3 consecutive failed checks (3 s debounce)
///   - Goes ONLINE immediately on any single success or successful API call
class ConnectivityStatus extends ChangeNotifier {
  ConnectivityStatus._();
  static final ConnectivityStatus instance = ConnectivityStatus._();

  // Start optimistically online — no flash of offline on cold boot
  bool _online = true;
  bool get online => _online;

  bool _isChecking = false;
  bool get isChecking => _isChecking;

  /// Consecutive fail counter — offline screen shown only after this hits the threshold
  int _failStreak = 0;
  static const int _failThreshold = 3; // must fail 3 consecutive times (~3 s)

  Timer? _timer;

  void start() {
    _timer?.cancel();
    // Check every 3 seconds instead of every 1 s — reduces battery drain and
    // avoids false-positive flicker on cellular handover
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => check());
    check();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Called by ApiService after any HTTP response:
  ///   report(true)  → immediately mark online, reset fail streak
  ///   report(false) → increment fail streak; go offline only after threshold
  void report(bool ok) {
    if (ok) {
      _failStreak = 0;
      _setOnline(true);
    } else {
      _failStreak++;
      if (_failStreak >= _failThreshold) {
        _setOnline(false);
      }
      // Below threshold — silently wait; don't flash the error screen yet
    }
  }

  Future<bool> check() async {
    _isChecking = true;
    notifyListeners();

    bool detected = false;
    try {
      // 1. Direct IP socket to Cloudflare DNS (1.1.1.1:53)
      try {
        final socket = await Socket.connect(
          InternetAddress('1.1.1.1'),
          53,
          timeout: const Duration(seconds: 3),
        );
        socket.destroy();
        detected = true;
      } catch (_) {
        // 2. Fallback: Google DNS (8.8.8.8:53)
        try {
          final socket = await Socket.connect(
            InternetAddress('8.8.8.8'),
            53,
            timeout: const Duration(seconds: 3),
          );
          socket.destroy();
          detected = true;
        } catch (_) {}
      }

      // 3. DNS lookup fallback (handles cases where raw IP sockets are blocked)
      if (!detected) {
        try {
          final res = await InternetAddress.lookup('google.com')
              .timeout(const Duration(seconds: 3));
          if (res.isNotEmpty && res.first.rawAddress.isNotEmpty) {
            detected = true;
          }
        } catch (_) {}
      }

      // 4. Server host check as last resort
      if (!detected &&
          ApiConfig.hostIp.isNotEmpty &&
          ApiConfig.hostIp != 'localhost') {
        try {
          final socket = await Socket.connect(
            ApiConfig.hostIp,
            5000,
            timeout: const Duration(seconds: 3),
          );
          socket.destroy();
          detected = true;
        } catch (_) {}
      }

      if (detected) {
        _failStreak = 0;
        _setOnline(true);
      } else {
        _failStreak++;
        if (_failStreak >= _failThreshold) {
          _setOnline(false);
        }
      }
    } catch (_) {
      _failStreak++;
      if (_failStreak >= _failThreshold) {
        _setOnline(false);
      }
    } finally {
      _isChecking = false;
      notifyListeners();
    }
    return _online;
  }

  void _setOnline(bool value) {
    if (_online == value) return;
    _online = value;
    notifyListeners();
    if (value) {
      if (kDebugMode) print('✅ [Connectivity] Back online — flushing offline queue');
      OfflineQueue.instance.flush();
    } else {
      if (kDebugMode) print('📵 [Connectivity] Confirmed offline after $_failStreak consecutive failures');
    }
  }
}
