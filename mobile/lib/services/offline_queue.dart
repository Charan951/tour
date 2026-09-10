import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// A tiny durable outbox for POSTs made while offline (e.g. enquiries).
/// Items are stored in SharedPreferences and flushed when connectivity
/// returns (ConnectivityStatus calls [flush]).
class OfflineQueue {
  OfflineQueue._();
  static final OfflineQueue instance = OfflineQueue._();

  static const _key = 'hc_pending_posts';
  bool _flushing = false;

  Future<List<Map<String, dynamic>>> _read() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw);
      return list is List ? list.cast<Map<String, dynamic>>() : [];
    } catch (_) {
      return [];
    }
  }

  Future<void> _write(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(items));
  }

  Future<int> pendingCount() async => (await _read()).length;

  Future<void> enqueue(String url, Map<String, dynamic> body) async {
    final items = await _read();
    items.add({
      'url': url,
      'body': body,
      'ts': DateTime.now().toIso8601String(),
    });
    await _write(items);
    if (kDebugMode) debugPrint('📥 Offline queue: ${items.length} pending');
  }

  /// Send pending items oldest-first. Stops at the first failure so order and
  /// data are preserved for the next attempt.
  Future<void> flush() async {
    if (_flushing) return;
    _flushing = true;
    try {
      var items = await _read();
      while (items.isNotEmpty) {
        final item = items.first;
        try {
          final res = await ApiService.post(
            item['url'] as String,
            Map<String, dynamic>.from(item['body'] as Map),
          );
          if (res is Map && res['success'] == true) {
            items = items.sublist(1);
            await _write(items);
          } else {
            break; // server rejected — leave it, try later
          }
        } catch (_) {
          break; // still offline
        }
      }
    } finally {
      _flushing = false;
    }
  }
}
