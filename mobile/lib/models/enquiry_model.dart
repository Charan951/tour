class EnquiryModel {
  final String? id;
  final String name;
  final String email;
  final String phone;
  final String destination;
  final String? packageTitle;
  final int adults;
  final int children;
  final int travelers;
  final String travelDate;
  final String message;
  final String status;
  final String? adminResponse;
  final String createdAt;

  EnquiryModel({
    this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.destination,
    this.packageTitle,
    this.adults = 1,
    this.children = 0,
    this.travelers = 1,
    required this.travelDate,
    this.message = '',
    this.status = 'New',
    this.adminResponse,
    this.createdAt = '',
  });

  factory EnquiryModel.fromJson(Map<String, dynamic> json) {
    String destName = '';
    if (json['destination'] is Map && json['destination']['name'] != null) {
      destName = json['destination']['name'];
    } else if (json['destination'] != null && json['destination'].toString().isNotEmpty) {
      destName = json['destination'].toString();
    } else if (json['preferredDestination'] != null && json['preferredDestination'].toString().isNotEmpty) {
      destName = json['preferredDestination'].toString();
    }

    String? pkgTitle;
    if (json['package'] is Map && json['package']['title'] != null) {
      pkgTitle = json['package']['title'];
    } else if (json['package'] != null && json['package'].toString().length > 5 && !json['package'].toString().startsWith('6')) {
      pkgTitle = json['package'].toString();
    } else if (json['packageName'] != null && json['packageName'].toString().isNotEmpty) {
      pkgTitle = json['packageName'].toString();
    }

    int a = 1;
    if (json['adults'] != null) {
      a = int.tryParse(json['adults'].toString()) ?? 1;
    } else if (json['travelers'] is Map && json['travelers']['adults'] != null) {
      a = int.tryParse(json['travelers']['adults'].toString()) ?? 1;
    } else if (json['travelers'] is int) {
      a = json['travelers'];
    }

    int c = 0;
    if (json['children'] != null) {
      c = int.tryParse(json['children'].toString()) ?? 0;
    } else if (json['travelers'] is Map && json['travelers']['children'] != null) {
      c = int.tryParse(json['travelers']['children'].toString()) ?? 0;
    }

    return EnquiryModel(
      id: json['_id'] ?? json['id'] ?? json['enquiryId'],
      name: json['fullName'] ?? json['name'] ?? 'Traveler',
      email: json['email'] ?? '',
      phone: json['mobile'] ?? json['phone'] ?? '',
      destination: destName,
      packageTitle: pkgTitle,
      adults: a,
      children: c,
      travelers: a + c,
      travelDate: json['travelDate'] != null ? json['travelDate'].toString().split('T').first : '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'New',
      adminResponse: json['adminResponse'] ?? json['response'] ?? json['adminNotes'],
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
      'adults': adults,
      'children': children,
      'travelers': travelers,
      'travelDate': travelDate,
      'message': message,
      'source': 'ContactForm',
    };
  }
}

