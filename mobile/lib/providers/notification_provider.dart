import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/realtime_service.dart';

class NotificationProvider extends ChangeNotifier {
  static const String _storageKey = 'holidaycity_user_notifications_v3';
  static const String _deletedNotifsKey = 'holidaycity_deleted_notifications_v3';

  final List<NotificationModel> _notifications = [];
  final Set<String> _deletedNotificationIds = {};
  String? _userEmail;

  Timer? _syncTimer;
  StreamSubscription? _socketSubscription;

  List<NotificationModel> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _initProvider();
  }

  Future<void> _initProvider() async {
    await _loadFromStorage();
    _connectRealtimeSockets();
    _startRealtimeSync();
  }

  /// Call this when the user logs in so we can fetch their notifications
  void setUserEmail(String? email) {
    final normalized = email?.trim().toLowerCase();
    if (_userEmail != normalized) {
      _userEmail = normalized;
      RealtimeService.instance.setCurrentUserEmail(_userEmail);
      // Refresh notifications for this user
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        _fetchUserNotifications();
      }
    }
  }

  String? get userEmail => _userEmail;

  void _connectRealtimeSockets() {
    try {
      RealtimeService.instance.init(userEmail: _userEmail);
      _socketSubscription?.cancel();
      _socketSubscription =
          RealtimeService.instance.eventStream.listen((event) {
        _handleSocketEvent(event);
      });
    } catch (e) {
      if (kDebugMode) print('Realtime socket init error: $e');
    }
  }

  void _handleSocketEvent(Map<String, dynamic> event) {
    final eventName = event['event'] as String? ?? '';
    final payload = event['data'];

    if (eventName.isEmpty) return;

    try {
      // Handle user notification events
      if (eventName == 'user_notification' ||
          eventName == 'notification_created' ||
          eventName == 'hc_data_updated' ||
          eventName == 'data_updated' ||
          eventName == 'enquiry:updated' ||
          eventName == 'booking:updated') {
        
        // If payload is a direct notification object, process immediately
        if (payload is Map<String, dynamic> && payload['_id'] != null) {
          final payloadEmail = payload['userEmail']?.toString().toLowerCase();
          if (payloadEmail == null || payloadEmail == _userEmail) {
            try {
              final model = NotificationModel.fromJson(payload);
              if (!_deletedNotificationIds.contains(model.id)) {
                final idx = _notifications.indexWhere((n) => n.id == model.id);
                if (idx == -1) {
                  _notifications.insert(0, model);
                } else {
                  _notifications[idx] = model;
                }
                _notifications.sort((a, b) => b.timestamp.compareTo(a.timestamp));
                notifyListeners();
                _saveNotificationsToStorage();
              }
            } catch (_) {}
          }
        }

        // Fetch fresh user notifications from server as well
        if (_userEmail != null && _userEmail!.isNotEmpty) {
          _fetchUserNotifications();
        }
      }

      // Handle deletion events
      if (eventName == 'user_notification_deleted' ||
          eventName == 'notification_deleted') {
        if (payload is Map && payload['id'] != null) {
          final deletedId = payload['id'].toString();
          _deletedNotificationIds.add(deletedId);
          _notifications.removeWhere((n) => n.id == deletedId);
          notifyListeners();
          _saveNotificationsToStorage();
        }
      }
    } catch (e) {
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        _fetchUserNotifications();
      }
    }
  }

  void _startRealtimeSync() {
    _syncTimer?.cancel();
    // Poll every 10 seconds as fallback
    _syncTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        _fetchUserNotifications();
      }
    });
    // Run immediate check
    if (_userEmail != null && _userEmail!.isNotEmpty) {
      _fetchUserNotifications();
    }
  }

  /// Primary source of truth: fetch user-scoped notifications from server DB
  Future<void> _fetchUserNotifications() async {
    if (_userEmail == null || _userEmail!.isEmpty) return;
    try {
      final url = ApiConfig.myNotificationsForEmail(_userEmail!);
      final res = await ApiService.get(url);
      if (res is Map && res['data'] is List) {
        final List serverList = res['data'];
        bool changed = false;

        for (final item in serverList) {
          if (item is Map<String, dynamic>) {
            final model = NotificationModel.fromJson(item);
            // Skip if deleted locally
            if (_deletedNotificationIds.contains(model.id)) continue;

            final existingIdx = _notifications.indexWhere((n) => n.id == model.id);
            if (existingIdx == -1) {
              // New notification from server
              _notifications.insert(0, model);
              changed = true;
            } else {
              // Update read status from server
              if (_notifications[existingIdx].isRead != model.isRead) {
                _notifications[existingIdx] = model;
                changed = true;
              }
            }
          }
        }

        // Sort by timestamp descending
        _notifications.sort((a, b) => b.timestamp.compareTo(a.timestamp));

        if (changed) {
          notifyListeners();
          await _saveNotificationsToStorage();
        }
      }
    } catch (e) {
      if (kDebugMode) print('User notifications fetch error: $e');
    }
  }

  Future<void> checkForUpdates({String? userEmail}) async {
    if (userEmail != null && userEmail.isNotEmpty) {
      setUserEmail(userEmail);
    }
    await _fetchUserNotifications();
  }

  Future<void> markAsRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
      await _saveNotificationsToStorage();
    }

    try {
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        await ApiService.patch(
            ApiConfig.myNotificationReadUrl(id, _userEmail!), {});
      } else {
        await ApiService.patch('${ApiConfig.notifications}/$id/read', {});
      }
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    bool changed = false;
    for (int i = 0; i < _notifications.length; i++) {
      if (!_notifications[i].isRead) {
        _notifications[i] = _notifications[i].copyWith(isRead: true);
        changed = true;
      }
    }
    if (changed) {
      notifyListeners();
      await _saveNotificationsToStorage();
    }

    try {
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        await ApiService.patch(
            ApiConfig.myNotificationsReadAll(_userEmail!), {});
      } else {
        await ApiService.patch('${ApiConfig.notifications}/read-all', {});
      }
    } catch (_) {}
  }

  /// Delete notification permanently from both local state AND database
  Future<void> deleteNotification(String id) async {
    _deletedNotificationIds.add(id);
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();

    await _saveNotificationsToStorage();
    await _saveDeletedIdsToStorage();

    try {
      if (_userEmail != null && _userEmail!.isNotEmpty) {
        // Hard delete from DB via user-scoped endpoint
        await ApiService.delete(
            ApiConfig.myNotificationDeleteUrl(id, _userEmail!));
      } else {
        await ApiService.delete('${ApiConfig.notifications}/$id');
      }
    } catch (e) {
      if (kDebugMode) print('Error deleting notification from server: $e');
    }
  }

  Future<void> clearAll() async {
    for (final n in _notifications) {
      _deletedNotificationIds.add(n.id);
    }
    _notifications.clear();
    notifyListeners();
    await _saveNotificationsToStorage();
    await _saveDeletedIdsToStorage();

    try {
      await ApiService.delete('${ApiConfig.notifications}/clear-all');
    } catch (_) {}
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<String>? deletedList = prefs.getStringList(_deletedNotifsKey);
      if (deletedList != null) {
        _deletedNotificationIds.addAll(deletedList);
      }

      final String? jsonStr = prefs.getString(_storageKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final List rawList = jsonDecode(jsonStr);
        _notifications.clear();
        for (final e in rawList) {
          final item =
              NotificationModel.fromJson(e as Map<String, dynamic>);
          if (!_deletedNotificationIds.contains(item.id)) {
            _notifications.add(item);
          }
        }
      }
      notifyListeners();
    } catch (e) {
      if (kDebugMode) print('Error loading notifications storage: $e');
    }
  }

  Future<void> _saveNotificationsToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final listJson = _notifications.map((n) => n.toJson()).toList();
      await prefs.setString(_storageKey, jsonEncode(listJson));
    } catch (_) {}
  }

  Future<void> _saveDeletedIdsToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
          _deletedNotifsKey, _deletedNotificationIds.toList());
    } catch (_) {}
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    _socketSubscription?.cancel();
    super.dispose();
  }
}
