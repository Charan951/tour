import 'package:intl/intl.dart';

class EnquiryModel {
  final String? id;
  final String name;
  final String email;
  final String phone;
  final String destination;
  final String? packageTitle;
  final String? activityTitle;
  final String? activityId;
  final String enquiryType;
  final int adults;
  final int children;
  final int travelers;
  final String travelDate;
  final String message;
  final List<Map<String, dynamic>> selectedAddOns;
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
    this.activityTitle,
    this.activityId,
    this.enquiryType = 'package',
    this.adults = 1,
    this.children = 0,
    this.travelers = 1,
    required this.travelDate,
    this.selectedAddOns = const [],
    this.message = '',
    this.status = 'New',
    this.adminResponse,
    this.createdAt = '',
  });

  String get formattedCreatedDateTime {
    if (createdAt.isEmpty) return 'N/A';
    final dt = DateTime.tryParse(createdAt)?.toLocal();
    if (dt == null) return createdAt;
    return DateFormat('MMM d, yyyy • h:mm a').format(dt);
  }

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

    String? actTitle;
    String? actId;
    if (json['activity'] is Map) {
      actTitle = json['activity']['title'];
      actId = json['activity']['_id'] ?? json['activity']['id'];
    } else if (json['activity'] != null && json['activity'].toString().isNotEmpty) {
      actId = json['activity'].toString();
    }
    if (actTitle == null && json['activityTitle'] != null && json['activityTitle'].toString().isNotEmpty) {
      actTitle = json['activityTitle'].toString();
    }

    String type = json['enquiryType'] ?? (actTitle != null && actTitle.isNotEmpty ? 'activity' : 'package');

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

    List<Map<String, dynamic>> addOnsList = [];
    if (json['selectedAddOns'] is List) {
      addOnsList = (json['selectedAddOns'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }

    return EnquiryModel(
      id: json['_id'] ?? json['id'] ?? json['enquiryId'],
      name: json['fullName'] ?? json['name'] ?? 'Traveler',
      email: json['email'] ?? '',
      phone: json['mobile'] ?? json['phone'] ?? '',
      destination: destName,
      packageTitle: pkgTitle,
      activityTitle: actTitle,
      activityId: actId,
      enquiryType: type,
      adults: a,
      children: c,
      travelers: a + c,
      travelDate: json['travelDate'] != null ? json['travelDate'].toString().split('T').first : '',
      selectedAddOns: addOnsList,
      message: json['message'] ?? '',
      status: json['status'] ?? 'New',
      adminResponse: json['adminResponse'] ?? json['response'] ?? json['adminNotes'],
      createdAt: json['createdAt'] != null ? json['createdAt'].toString() : '',
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
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
      'selectedAddOns': selectedAddOns,
      'message': message,
      'source': 'ContactForm',
      'enquiryType': enquiryType,
    };
    if (activityTitle != null && activityTitle!.isNotEmpty) {
      data['activityTitle'] = activityTitle;
    }
    if (activityId != null && activityId!.isNotEmpty) {
      data['activity'] = activityId;
    }
    if (packageTitle != null && packageTitle!.isNotEmpty) {
      data['packageTitle'] = packageTitle;
    }
    return data;
  }
}

