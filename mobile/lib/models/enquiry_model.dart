class EnquiryModel {
  final String? id;
  final String name;
  final String email;
  final String phone;
  final String destination;
  final int travelers;
  final String travelDate;
  final String message;
  final String status;
  final String createdAt;

  EnquiryModel({
    this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.destination,
    this.travelers = 2,
    required this.travelDate,
    this.message = '',
    this.status = 'New',
    this.createdAt = '',
  });

  factory EnquiryModel.fromJson(Map<String, dynamic> json) {
    String destName = 'General Query';
    if (json['destination'] is Map && json['destination']['name'] != null) {
      destName = json['destination']['name'];
    } else if (json['package'] is Map && json['package']['title'] != null) {
      destName = json['package']['title'];
    } else if (json['destination'] != null && json['destination'].toString().isNotEmpty) {
      destName = json['destination'].toString();
    }

    return EnquiryModel(
      id: json['_id'] ?? json['id'] ?? json['enquiryId'],
      name: json['fullName'] ?? json['name'] ?? 'Traveler',
      email: json['email'] ?? '',
      phone: json['mobile'] ?? json['phone'] ?? '',
      destination: destName,
      travelers: json['adults'] ?? json['travelers'] ?? 2,
      travelDate: json['travelDate'] != null ? json['travelDate'].toString().split('T').first : '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'New Lead',
      createdAt: json['createdAt'] != null ? json['createdAt'].toString().split('T').first : '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullName': name,
      'name': name,
      'email': email,
      'mobile': phone,
      'phone': phone,
      'destination': destination,
      'adults': travelers,
      'travelers': travelers,
      'travelDate': travelDate,
      'message': message,
      'source': 'ContactForm',
    };
  }
}

