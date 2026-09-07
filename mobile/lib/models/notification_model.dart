class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type; // 'booking', 'enquiry', 'payment', 'general'
  final DateTime timestamp;
  final bool isRead;
  final String? status;
  final String? referenceId;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
    this.status,
    this.referenceId,
  });

  NotificationModel copyWith({
    String? id,
    String? title,
    String? message,
    String? type,
    DateTime? timestamp,
    bool? isRead,
    String? status,
    String? referenceId,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      status: status ?? this.status,
      referenceId: referenceId ?? this.referenceId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
      'status': status,
      'referenceId': referenceId,
    };
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final id = (json['_id'] ?? json['id'] ?? '').toString();
    final title = (json['title'] ?? 'Notification').toString();
    final message = (json['message'] ?? '').toString();
    final type = (json['type'] ?? 'general').toString();
    final isRead = json['isRead'] == true;
    final status = json['status']?.toString();
    final refId = (json['entityId'] ?? json['referenceId'])?.toString();

    DateTime ts = DateTime.now();
    if (json['createdAt'] != null) {
      ts = DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now();
    } else if (json['timestamp'] != null) {
      ts = DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now();
    }

    return NotificationModel(
      id: id,
      title: title,
      message: message,
      type: type,
      timestamp: ts,
      isRead: isRead,
      status: status,
      referenceId: refId,
    );
  }
}
