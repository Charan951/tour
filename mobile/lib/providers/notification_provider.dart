import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_model.dart';
import '../services/enquiry_service.dart';
import '../services/booking_service.dart';

class NotificationProvider extends ChangeNotifier {
  static const String _storageKey = 'holidaycity_user_notifications_v1';
  static const String _enquiryStateKey = 'holidaycity_tracked_enquiries_v1';
  static const String _bookingStateKey = 'holidaycity_tracked_bookings_v1';

  final List<NotificationModel> _notifications = [];
  final EnquiryService _enquiryService = EnquiryService();
  final BookingService _bookingService = BookingService();

  Timer? _syncTimer;

  // Track known status of items to detect changes
  Map<String, String> _knownEnquiryStatuses = {};
  Map<String, Map<String, dynamic>> _knownBookingStates = {};

  List<NotificationModel> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _initProvider();
  }

  Future<void> _initProvider() async {
    await _loadFromStorage();
    _startRealtimeSync();
  }

  void _startRealtimeSync() {
    _syncTimer?.cancel();
    // Poll every 8 seconds for instant real-time status updates
    _syncTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      checkForUpdates();
    });
    // Run initial check immediately
    checkForUpdates();
  }

  Future<void> checkForUpdates({String? userEmail}) async {
    try {
      await _checkEnquiryUpdates(userEmail: userEmail);
      await _checkBookingUpdates(userEmail: userEmail);
    } catch (e) {
      if (kDebugMode) {
        print('NotificationProvider sync error: $e');
      }
    }
  }

  Future<void> _checkEnquiryUpdates({String? userEmail}) async {
    final enquiries = await _enquiryService.getUserEnquiries(email: userEmail);
    bool stateChanged = false;

    for (final eq in enquiries) {
      final id = eq.id;
      if (id == null || id.isEmpty) continue;

      final currentStatus = eq.status.trim();
      final destinationName = eq.destination.isNotEmpty
          ? eq.destination
          : ((eq.packageTitle != null && eq.packageTitle!.isNotEmpty)
              ? eq.packageTitle!
              : 'Tour Enquiry');

      if (!_knownEnquiryStatuses.containsKey(id)) {
        // Initial discovery - record baseline status
        _knownEnquiryStatuses[id] = currentStatus;
        stateChanged = true;
      } else {
        final prevStatus = _knownEnquiryStatuses[id];
        if (prevStatus != currentStatus) {
          // Status updated by admin!
          _knownEnquiryStatuses[id] = currentStatus;
          stateChanged = true;

          final notification = NotificationModel(
            id: 'enquiry_${id}_${DateTime.now().millisecondsSinceEpoch}',
            title: 'Enquiry Status Update',
            message:
                'Your enquiry for "$destinationName" status has been updated to "$currentStatus".',
            type: 'enquiry',
            timestamp: DateTime.now(),
            status: currentStatus,
            referenceId: id,
          );

          _addNotificationToList(notification);
        }
      }
    }

    if (stateChanged) {
      await _saveStateToStorage();
    }
  }

  Future<void> _checkBookingUpdates({String? userEmail}) async {
    final bookings = await _bookingService.getUserBookings(email: userEmail);
    bool stateChanged = false;

    for (final bk in bookings) {
      final id = (bk['_id'] ?? bk['id'] ?? '').toString();
      if (id.isEmpty) continue;

      final currentStatus = (bk['status'] ?? 'Pending').toString();
      final currentPayment = (bk['paymentStatus'] ?? 'Pending').toString();
      final remainingBal = (bk['remainingBalance'] ?? 0).toString();
      final packageName = (bk['package'] is Map
              ? bk['package']['title']
              : bk['packageName']) ??
          'Booking';
      final bookingCode = (bk['bookingCode'] ?? id).toString();

      final previousState = _knownBookingStates[id];

      if (previousState == null) {
        // Initial baseline recording
        _knownBookingStates[id] = {
          'status': currentStatus,
          'paymentStatus': currentPayment,
          'remainingBalance': remainingBal,
        };
        stateChanged = true;
      } else {
        final prevStatus = previousState['status'];
        final prevPayment = previousState['paymentStatus'];

        if (prevStatus != currentStatus) {
          _knownBookingStates[id]!['status'] = currentStatus;
          stateChanged = true;

          final notification = NotificationModel(
            id: 'booking_status_${id}_${DateTime.now().millisecondsSinceEpoch}',
            title: 'Booking Status Update',
            message:
                'Booking #$bookingCode ($packageName) is now "$currentStatus".',
            type: 'booking',
            timestamp: DateTime.now(),
            status: currentStatus,
            referenceId: id,
          );

          _addNotificationToList(notification);
        }

        if (prevPayment != currentPayment) {
          _knownBookingStates[id]!['paymentStatus'] = currentPayment;
          stateChanged = true;

          final notification = NotificationModel(
            id: 'booking_payment_${id}_${DateTime.now().millisecondsSinceEpoch}',
            title: 'Payment Status Update',
            message:
                'Payment for booking #$bookingCode has been updated to "$currentPayment".',
            type: 'payment',
            timestamp: DateTime.now(),
            status: currentPayment,
            referenceId: id,
          );

          _addNotificationToList(notification);
        }
      }
    }

    if (stateChanged) {
      await _saveStateToStorage();
    }
  }

  void _addNotificationToList(NotificationModel item) {
    // Avoid duplicate notifications with same title/message created within 5 seconds
    final isDuplicate = _notifications.any((n) =>
        n.title == item.title &&
        n.message == item.message &&
        item.timestamp.difference(n.timestamp).inSeconds.abs() < 5);

    if (!isDuplicate) {
      _notifications.insert(0, item);
      notifyListeners();
      _saveNotificationsToStorage();
    }
  }

  Future<void> markAsRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
      await _saveNotificationsToStorage();
    }
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
  }

  Future<void> clearAll() async {
    _notifications.clear();
    notifyListeners();
    await _saveNotificationsToStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? jsonStr = prefs.getString(_storageKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final List rawList = jsonDecode(jsonStr);
        _notifications.clear();
        _notifications.addAll(
          rawList.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)),
        );
      }

      final String? enqStateStr = prefs.getString(_enquiryStateKey);
      if (enqStateStr != null) {
        _knownEnquiryStatuses = Map<String, String>.from(jsonDecode(enqStateStr));
      }

      final String? bkStateStr = prefs.getString(_bookingStateKey);
      if (bkStateStr != null) {
        final Map rawBkMap = jsonDecode(bkStateStr);
        _knownBookingStates = rawBkMap.map((k, v) =>
            MapEntry(k.toString(), Map<String, dynamic>.from(v as Map)));
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

  Future<void> _saveStateToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_enquiryStateKey, jsonEncode(_knownEnquiryStatuses));
      await prefs.setString(_bookingStateKey, jsonEncode(_knownBookingStates));
    } catch (_) {}
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}
