import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'offline_queue.dart';

/// Lightweight reachability tracker — no plugin. Pings a well-known host on
/// start and every 12s, and `ApiService` also nudges it on request
/// success/failure so the offline banner reacts immediately.
class ConnectivityStatus extends ChangeNotifier {
  ConnectivityStatus._();
  static final ConnectivityStatus instance = ConnectivityStatus._();

  bool _online = true;
  bool get online => _online;

  Timer? _timer;

  void start() {
    _timer ??= Timer.periodic(const Duration(seconds: 12), (_) => check());
    check();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Called by ApiService: `true` after any successful response, `false` after
  /// a socket/timeout failure on every candidate.
  void report(bool ok) => _set(ok);

  Future<void> check() async {
    try {
      final res = await InternetAddress.lookup('one.one.one.one')
          .timeout(const Duration(seconds: 4));
      _set(res.isNotEmpty && res.first.rawAddress.isNotEmpty);
    } catch (_) {
      _set(false);
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
