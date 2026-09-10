import 'package:flutter/material.dart';
import '../config/app_globals.dart';
import '../views/booking/my_bookings_screen.dart';
import '../views/enquiry/my_enquiries_screen.dart';
import '../views/notifications/notifications_screen.dart';

/// Routes a tapped push / in-app notification to the screen it's about.
/// Falls back to the Notifications list when the type is unknown.
class NotificationRouter {
  /// Returns the screen a notification of [rawType] is about, or null when it's
  /// just informational.
  static Widget? _targetFor(String? rawType) {
    final t = (rawType ?? '').toLowerCase();
    if (t.contains('book') || t.contains('payment') || t.contains('pay')) {
      return const MyBookingsScreen();
    }
    if (t.contains('enquir') || t.contains('quote') || t.contains('lead')) {
      return const MyEnquiriesScreen();
    }
    return null;
  }

  /// Handle a tap coming from an FCM `RemoteMessage.data` map or a local
  /// notification payload map. Unknown types open the Notifications list.
  static void handleData(Map<String, dynamic>? data) {
    final type = data?['type'] ?? data?['topicType'] ?? data?['category'];
    _push(_targetFor(type?.toString()) ?? const NotificationsScreen());
  }

  /// Handle a tap on an in-app notification row. Unknown / general types stay
  /// on the list (no-op).
  static void handleType(String? type) {
    final target = _targetFor(type);
    if (target != null) _push(target);
  }

  static void _push(Widget target) {
    final nav = navigatorKey.currentState;
    if (nav == null) return;
    // Defer a frame so this works even when triggered during app launch
    // (terminated → opened via notification).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      nav.push(MaterialPageRoute(builder: (_) => target));
    });
  }
}
