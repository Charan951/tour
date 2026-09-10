import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../config/api_config.dart';

class RealtimeService {
  static final RealtimeService _instance = RealtimeService._internal();
  static RealtimeService get instance => _instance;

  RealtimeService._internal();

  socket_io.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserEmail;

  StreamController<Map<String, dynamic>> _eventController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get eventStream {
    if (_eventController.isClosed) {
      _eventController = StreamController<Map<String, dynamic>>.broadcast();
    }
    return _eventController.stream;
  }

  bool get isConnected => _isConnected;

  void init({String? userEmail}) {
    if (userEmail != null && userEmail.isNotEmpty) {
      _currentUserEmail = userEmail.trim().toLowerCase();
    }
    connect();
  }

  void setCurrentUserEmail(String? email) {
    final normalized = email?.trim().toLowerCase();
    if (_currentUserEmail != normalized) {
      _currentUserEmail = normalized;
      if (_socket != null && _socket!.connected && _currentUserEmail != null) {
        _socket?.emit('join_user', _currentUserEmail);
        if (kDebugMode) debugPrint('👤 [RealtimeService] Joined user room for: $_currentUserEmail');
      }
    }
  }

  void reconnect() {
    if (kDebugMode) debugPrint('🔄 [RealtimeService] Reconnecting Socket.io to updated serverHost: ${ApiConfig.serverHost}');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    connect();
  }

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    if (_eventController.isClosed) {
      _eventController = StreamController<Map<String, dynamic>>.broadcast();
    }

    final url = ApiConfig.serverHost;
    if (kDebugMode) debugPrint('🔌 [RealtimeService] Connecting to Socket.io: $url');

    try {
      _socket?.dispose();

      _socket = socket_io.io(
        url,
        socket_io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(99999)
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .build(),
      );

      _socket?.onConnect((_) {
        _isConnected = true;
        if (kDebugMode) debugPrint('✅ [RealtimeService] Socket.io Connected! Socket ID: ${_socket?.id}');

        // Join general updates room
        _socket?.emit('join_updates', {'room': 'general_updates'});

        if (_currentUserEmail != null && _currentUserEmail!.isNotEmpty) {
          _socket?.emit('join_user', _currentUserEmail);
          if (kDebugMode) debugPrint('👤 [RealtimeService] Joined user room for: $_currentUserEmail');
        }
      });

      // List of socket events to route to listeners
      final events = [
        'notification_created',
        'user_notification',
        'notification_deleted',
        'user_notification_deleted',
        'data_updated',
        'hc_data_updated',
        'enquiry:created',
        'enquiry:updated',
        'enquiry:deleted',
        'booking:created',
        'booking:updated',
        'booking:deleted',
      ];

      for (final eventName in events) {
        _socket?.on(eventName, (data) {
          if (kDebugMode) debugPrint('📩 [RealtimeService] Socket Event: $eventName');
          if (!_eventController.isClosed) {
            _eventController.add({
              'event': eventName,
              'data': data,
              'timestamp': DateTime.now().toIso8601String(),
            });
          }
        });
      }

      _socket?.onDisconnect((reason) {
        _isConnected = false;
        if (kDebugMode) debugPrint('❌ [RealtimeService] Socket disconnected: $reason');
      });

      _socket?.onError((err) {
        if (kDebugMode) debugPrint('⚠️ [RealtimeService] Socket error: $err');
      });

      _socket?.onConnectError((err) {
        if (kDebugMode) debugPrint('⚠️ [RealtimeService] Socket connect error: $err');
      });

      _socket?.connect();
    } catch (e) {
      if (kDebugMode) debugPrint('🔴 [RealtimeService] Socket init exception: $e');
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    if (!_eventController.isClosed) {
      _eventController.close();
    }
  }
}
