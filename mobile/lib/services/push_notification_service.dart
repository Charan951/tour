import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'auth_service.dart';
import 'notification_router.dart';

/// The one Android notification channel. Kept as a top-level const so the
/// background isolate can create it without touching the service singleton.
const AndroidNotificationChannel kHighImportanceChannel = AndroidNotificationChannel(
  'high_importance_channel',
  'High Importance Notifications',
  description: 'Urgent alerts, bookings, and enquiry notifications.',
  importance: Importance.max,
  playSound: true,
  enableVibration: true,
);

/// Builds and shows a heads-up / lock-screen notification from an FCM message.
/// Works in the main isolate AND the background isolate (killed-app delivery),
/// which is why it lives at top level and takes its own plugin instance.
Future<void> _displayNotification(RemoteMessage message) async {
  final n = message.notification;
  final title = n?.title ?? message.data['title'] ?? message.data['subject'];
  final body = n?.body ?? message.data['body'] ?? message.data['message'];
  if (title == null || title.toString().isEmpty) return;

  final plugin = FlutterLocalNotificationsPlugin();
  await plugin.initialize(
    const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    ),
  );
  await plugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(kHighImportanceChannel);

  await plugin.show(
    message.messageId?.hashCode ?? message.hashCode,
    title.toString(),
    body?.toString(),
    NotificationDetails(
      android: AndroidNotificationDetails(
        kHighImportanceChannel.id,
        kHighImportanceChannel.name,
        channelDescription: kHighImportanceChannel.description,
        icon: '@mipmap/ic_launcher',
        importance: Importance.max,
        priority: Priority.high,
        visibility: NotificationVisibility.public,
        playSound: true,
        enableVibration: true,
      ),
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    ),
    payload: jsonEncode(message.data),
  );
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print('🌙 Background FCM: ${message.messageId} data=${message.data}');
  }
  // Server sends Android data-only messages, so nothing shows unless we render
  // it here. iOS delivers an aps.alert and is shown by the OS — skip to avoid
  // a duplicate.
  if (defaultTargetPlatform == TargetPlatform.android) {
    await _displayNotification(message);
  }
}

class PushNotificationService {
  PushNotificationService._privateConstructor();
  static final PushNotificationService instance =
      PushNotificationService._privateConstructor();

  FirebaseMessaging get _fcm => FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get currentToken => _fcmToken;

  AuthorizationStatus _permission = AuthorizationStatus.notDetermined;

  /// True when the user has actively turned notifications off — the app can
  /// then surface a "turn these back on in Settings" hint.
  bool get notificationsDenied => _permission == AuthorizationStatus.denied;

  /// Re-checks the OS permission (e.g. after returning from Settings).
  Future<void> refreshPermissionStatus() async {
    try {
      final s = await _fcm.getNotificationSettings();
      _permission = s.authorizationStatus;
    } catch (_) {}
  }

  // Retry timer for token sync
  Timer? _retryTimer;
  int _retryCount = 0;
  static const int _maxRetries = 5;

  static const AndroidNotificationChannel _channel = kHighImportanceChannel;

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    try {
      // 1. Ensure Firebase is initialized
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      // 2. Register background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 3. Request permission — critical on Android 13+
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      _permission = settings.authorizationStatus;
      if (kDebugMode) {
        print('🔔 Notification permission: ${settings.authorizationStatus}');
      }

      // 4. Initialize local notifications
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      await _localNotifications.initialize(
        const InitializationSettings(android: androidInit, iOS: iosInit),
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          if (kDebugMode) print('👆 Notification tapped: ${response.payload}');
          _routeFromPayload(response.payload);
        },
      );

      // 5. Create Android high-importance channel
      final androidPlugin = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(_channel);
        await androidPlugin.requestNotificationsPermission();
      }

      // 6. iOS foreground presentation
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 7. Get FCM token and sync to backend (with retry)
      await _retrieveAndSyncToken();

      // 8. Listen for token refresh
      _fcm.onTokenRefresh.listen((newToken) async {
        _fcmToken = newToken;
        _retryCount = 0;
        if (kDebugMode) print('🔄 FCM Token refreshed — re-syncing...');
        await syncTokenWithBackend();
      });

      // 9. Foreground message handler
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('📲 Foreground FCM: ${message.notification?.title ?? message.data['title']}');
        }
        _showForegroundNotification(message);
      });

      // 10. Background → foreground tap
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) print('🚀 Notification tapped from background: ${message.data}');
        NotificationRouter.handleData(message.data);
      });

      // 11. Terminated state launch
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        if (kDebugMode) print('🏁 App launched via notification: ${initialMessage.data}');
        NotificationRouter.handleData(initialMessage.data);
      }
    } catch (e) {
      if (kDebugMode) print('❌ PushNotificationService init error: $e');
    }
  }

  Future<void> _retrieveAndSyncToken() async {
    try {
      // Get token with timeout — avoids hanging on no-network startup
      _fcmToken = await _fcm.getToken().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          if (kDebugMode) print('⏱️ FCM getToken() timed out — will retry later');
          return null;
        },
      );

      if (_fcmToken == null || _fcmToken!.isEmpty) {
        if (kDebugMode) print('⚠️ FCM token is null/empty — scheduling retry');
        _scheduleRetry();
        return;
      }

      if (kDebugMode) print('🔑 FCM Token obtained: ${_fcmToken!.substring(0, 20)}...');
      await syncTokenWithBackend();
    } catch (e) {
      if (kDebugMode) print('⚠️ Error getting FCM token: $e');
      _scheduleRetry();
    }
  }

  void _scheduleRetry() {
    if (_retryCount >= _maxRetries) {
      if (kDebugMode) print('⚠️ Max FCM token sync retries reached');
      return;
    }
    final delay = Duration(seconds: ((_retryCount + 1) * 5).clamp(5, 30));
    _retryCount++;
    _retryTimer?.cancel();
    _retryTimer = Timer(delay, () async {
      if (kDebugMode) print('🔁 Retrying FCM token sync (attempt $_retryCount)...');
      await _retrieveAndSyncToken();
    });
  }

  /// Syncs FCM token to backend with the user's email and role.
  /// This enables role-based push notification targeting:
  ///   - Admin role → DeviceToken.isAdmin = true  → receives admin notifications
  ///   - Customer/guest → DeviceToken.isAdmin = false → receives user notifications
  Future<void> syncTokenWithBackend() async {
    try {
      if (_fcmToken == null || _fcmToken!.isEmpty) {
        _fcmToken = await _fcm.getToken();
      }
      if (_fcmToken == null || _fcmToken!.isEmpty) {
        if (kDebugMode) print('⚠️ Cannot sync — FCM token still empty');
        _scheduleRetry();
        return;
      }

      final user = await AuthService().getSavedUser();
      final result = await ApiService.saveFcmToken(
        _fcmToken!,
        email: user?.email,
        mobile: user?.mobile,
        role: user?.role,
      );

      if (result is Map && result['success'] == true) {
        _retryCount = 0; // Reset retry counter on success
        if (kDebugMode) {
          print('✅ FCM token synced → ${user?.email ?? 'guest'} | role: ${user?.role ?? 'none'}');
        }
      } else {
        if (kDebugMode) print('⚠️ FCM sync returned non-success: $result');
        _scheduleRetry();
      }
    } catch (e) {
      if (kDebugMode) print('⚠️ FCM token sync failed: $e');
      _scheduleRetry();
    }
  }

  Future<void> removeTokenFromBackend() async {
    _retryTimer?.cancel();
    if (_fcmToken == null || _fcmToken!.isEmpty) return;
    try {
      final user = await AuthService().getSavedUser();
      await ApiService.removeFcmToken(_fcmToken!, email: user?.email);
      _fcmToken = null;
      if (kDebugMode) print('🗑️ FCM token removed from backend');
    } catch (e) {
      if (kDebugMode) print('⚠️ Failed to remove FCM token: $e');
    }
  }

  void _routeFromPayload(String? payload) {
    if (payload == null || payload.isEmpty) return;
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map) {
        NotificationRouter.handleData(Map<String, dynamic>.from(decoded));
      }
    } catch (_) {
      // Legacy `message.data.toString()` payloads — best-effort type sniff.
      NotificationRouter.handleData({'type': payload});
    }
  }

  void _showForegroundNotification(RemoteMessage message) {
    // Same renderer as the background isolate — one code path, one look.
    _displayNotification(message);
  }
}
