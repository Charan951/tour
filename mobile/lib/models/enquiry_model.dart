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
    return EnquiryModel(
      id: json['_id'] ?? json['id'],
      name: json['name'] ?? 'Traveler',
      email: json['email'] ?? '',
      phone: json['phone'] ?? json['mobile'] ?? '',
      destination: json['destination'] ?? 'General Query',
      travelers: json['travelers'] ?? 2,
      travelDate: json['travelDate'] ?? json['date'] ?? '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'New',
      createdAt: json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'email': email,
      'phone': phone,
      'destination': destination,
      'travelers': travelers,
      'travelDate': travelDate,
      'message': message,
      'source': 'Mobile App',
    };
  }
}
