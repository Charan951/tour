class BookingAddOnModel {
  final String? id;
  final String title;
  final double price;

  BookingAddOnModel({
    this.id,
    required this.title,
    required this.price,
  });

  factory BookingAddOnModel.fromJson(Map<String, dynamic> json) {
    return BookingAddOnModel(
      id: json['id'] ?? json['_id'],
      title: json['title'] ?? 'Add-on',
      price: (json['price'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'price': price,
  };
}

class BookingModel {
  final String? id;
  final String bookingId;
  final String bookingType;
  final String? packageId;
  final String? packageName;
  final String? packageCode;
  final String? activityId;
  final String? activityName;
  final String? activityCode;
  final String? destinationName;
  final String customerName;
  final String email;
  final String mobile;
  final String travelDate;
  final int adults;
  final int children;
  final String pricingTier;
  final List<BookingAddOnModel> selectedAddOns;
  final double totalPrice;
  final double advanceAmount;
  final bool advancePaid;
  final double remainingBalance;
  final String paymentStatus;
  final String paymentMethod;
  final String transactionId;
  final String specialRequests;
  final String status;
  final String createdAt;

  BookingModel({
    this.id,
    required this.bookingId,
    this.bookingType = 'package',
    this.packageId,
    this.packageName,
    this.packageCode,
    this.activityId,
    this.activityName,
    this.activityCode,
    this.destinationName,
    required this.customerName,
    required this.email,
    required this.mobile,
    required this.travelDate,
    this.adults = 1,
    this.children = 0,
    this.pricingTier = 'Standard',
    this.selectedAddOns = const [],
    required this.totalPrice,
    this.advanceAmount = 0.0,
    this.advancePaid = false,
    this.remainingBalance = 0.0,
    this.paymentStatus = 'Pending Advance',
    this.paymentMethod = 'UPI / Online',
    this.transactionId = '',
    this.specialRequests = '',
    this.status = 'Pending',
    this.createdAt = '',
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    List<BookingAddOnModel> addOns = [];
    if (json['selectedAddOns'] is List) {
      addOns = (json['selectedAddOns'] as List)
          .map((item) => BookingAddOnModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return BookingModel(
      id: json['_id'] ?? json['id'],
      bookingId: json['bookingId'] ?? 'BK-TOUR',
      bookingType: json['bookingType'] ?? 'package',
      packageId: json['package'] is Map ? json['package']['_id'] : json['package']?.toString(),
      packageName: json['packageName'] ?? (json['package'] is Map ? json['package']['title'] : ''),
      packageCode: json['packageCode'] ?? (json['package'] is Map ? json['package']['packageCode'] : ''),
      activityId: json['activity'] is Map ? json['activity']['_id'] : json['activity']?.toString(),
      activityName: json['activityName'] ?? (json['activity'] is Map ? json['activity']['title'] : ''),
      activityCode: json['activityCode'] ?? (json['activity'] is Map ? json['activity']['activityCode'] : ''),
      destinationName: json['destinationName'] ?? (json['destination'] is Map ? json['destination']['name'] : ''),
      customerName: json['customerName'] ?? json['name'] ?? 'Guest',
      email: json['email'] ?? '',
      mobile: json['mobile'] ?? json['phone'] ?? '',
      travelDate: json['travelDate'] != null ? json['travelDate'].toString().split('T').first : '',
      adults: json['adults'] != null ? int.tryParse(json['adults'].toString()) ?? 1 : 1,
      children: json['children'] != null ? int.tryParse(json['children'].toString()) ?? 0 : 0,
      pricingTier: json['pricingTier'] ?? 'Standard',
      selectedAddOns: addOns,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      advanceAmount: (json['advanceAmount'] ?? 0).toDouble(),
      advancePaid: json['advancePaid'] ?? false,
      remainingBalance: (json['remainingBalance'] ?? 0).toDouble(),
      paymentStatus: json['paymentStatus'] ?? 'Pending Advance',
      paymentMethod: json['paymentMethod'] ?? 'UPI / Online',
      transactionId: json['transactionId'] ?? '',
      specialRequests: json['specialRequests'] ?? '',
      status: json['status'] ?? 'Pending',
      createdAt: json['createdAt'] != null ? json['createdAt'].toString().split('T').first : '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bookingType': bookingType,
      'package': packageId,
      'packageName': packageName,
      'packageCode': packageCode,
      'activity': activityId,
      'activityName': activityName,
      'activityCode': activityCode,
      'destinationName': destinationName,
      'customerName': customerName,
      'email': email,
      'mobile': mobile,
      'travelDate': travelDate,
      'adults': adults,
      'children': children,
      'pricingTier': pricingTier,
      'selectedAddOns': selectedAddOns.map((a) => a.toJson()).toList(),
      'totalPrice': totalPrice,
      'advanceAmount': advanceAmount,
      'advancePaid': advancePaid,
      'remainingBalance': remainingBalance,
      'paymentStatus': paymentStatus,
      'paymentMethod': paymentMethod,
      'transactionId': transactionId,
      'specialRequests': specialRequests,
      'status': status,
    };
  }
}
