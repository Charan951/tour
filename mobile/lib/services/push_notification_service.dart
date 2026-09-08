import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'auth_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print('🌙 Handling background FCM message: ${message.messageId}');
  }
}

class PushNotificationService {
  PushNotificationService._privateConstructor();
  static final PushNotificationService instance = PushNotificationService._privateConstructor();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get currentToken => _fcmToken;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel',
    'High Importance Notifications',
    description: 'This channel is used for urgent alerts, bookings, and enquiry notifications.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    try {
      // 1. Initialize Firebase App if not already
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      // 2. Set Background Handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 3. Request User Permission for Push Notifications
      NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );

      if (kDebugMode) {
        print('🔔 Notification permission status: ${settings.authorizationStatus}');
      }

      // 4. Create High Importance Android Notification Channel (for Heads-up & Lock Screen)
      final androidPlugin = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(_channel);
        await androidPlugin.requestNotificationsPermission();
      }

      // 5. Initialize Local Notifications Plugin
      const initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
      const initializationSettingsDarwin = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          if (kDebugMode) {
            print('👆 Local notification tapped: ${response.payload}');
          }
        },
      );

      // 6. Set Foreground Notification Presentation Options for iOS
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 7. Get and sync FCM Token
      await _retrieveAndSyncToken();

      // 8. Listen for Token Refreshes
      _fcm.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        syncTokenWithBackend();
      });

      // 9. Listen for Foreground FCM Messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('📲 Foreground FCM Message received: ${message.notification?.title}');
        }
        _showForegroundNotification(message);
      });

      // 10. Listen for Notification Click when App in Background/Terminated
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('🚀 Notification tapped from background: ${message.data}');
        }
      });

      RemoteMessage? initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        if (kDebugMode) {
          print('🏁 App launched from terminated state via notification: ${initialMessage.data}');
        }
      }

    } catch (e) {
      if (kDebugMode) {
        print('❌ PushNotificationService initialization error: $e');
      }
    }
  }

  Future<void> _retrieveAndSyncToken() async {
    try {
      _fcmToken = await _fcm.getToken();
      if (kDebugMode) {
        print('🔑 FCM Token obtained: $_fcmToken');
      }
      await syncTokenWithBackend();
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Error obtaining FCM token: $e');
      }
    }
  }

  Future<void> syncTokenWithBackend() async {
    if (_fcmToken == null || _fcmToken!.isEmpty) return;
    try {
      final user = await AuthService().getSavedUser();
      await ApiService.saveFcmToken(_fcmToken!, email: user?.email);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Failed to sync FCM token to backend: $e');
      }
    }
  }

  Future<void> removeTokenFromBackend() async {
    if (_fcmToken == null || _fcmToken!.isEmpty) return;
    try {
      final user = await AuthService().getSavedUser();
      await ApiService.removeFcmToken(_fcmToken!, email: user?.email);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Failed to remove FCM token from backend: $e');
      }
    }
  }

  void _showForegroundNotification(RemoteMessage message) {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null) {
      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
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
        payload: message.data.toString(),
      );
    }
  }
}
