import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ChatMessageItem {
  final String? id;
  final String topicId;
  final String senderType;
  final String senderName;
  final String senderEmail;
  final String message;
  final DateTime? createdAt;

  ChatMessageItem({
    this.id,
    required this.topicId,
    required this.senderType,
    required this.senderName,
    required this.senderEmail,
    required this.message,
    this.createdAt,
  });

  factory ChatMessageItem.fromJson(Map<String, dynamic> json) {
    return ChatMessageItem(
      id: json['_id'],
      topicId: json['topicId'] ?? '',
      senderType: json['senderType'] ?? 'User',
      senderName: json['senderName'] ?? 'Traveler',
      senderEmail: json['senderEmail'] ?? '',
      message: json['message'] ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}

class ChatService {
  static Future<List<ChatMessageItem>> getMessages(String topicId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/chat/messages/$topicId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List list = data['data'];
          return list.map((item) => ChatMessageItem.fromJson(item)).toList();
        }
      }
    } catch (e) {
      if (kDebugMode) debugPrint('ChatService getMessages error: $e');
    }
    return [];
  }

  static Future<bool> sendMessage({
    required String topicId,
    required String topicType,
    String? topicTitle,
    required String senderName,
    required String senderEmail,
    required String message,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/chat/messages'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'topicId': topicId,
          'topicType': topicType,
          'topicTitle': topicTitle ?? '',
          'senderType': 'User',
          'senderName': senderName,
          'senderEmail': senderEmail,
          'message': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('ChatService sendMessage error: $e');
    }
    return false;
  }
}
