class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String mobile;
  final String role;
  final String? avatar;
  final String city;
  final String language;
  final String currency;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.mobile,
    required this.role,
    this.avatar,
    this.city = '',
    this.language = 'English',
    this.currency = 'INR',
  });

  String get fullName => '$firstName $lastName';

  UserModel copyWith({
    String? firstName,
    String? lastName,
    String? mobile,
    String? avatar,
    String? city,
    String? language,
    String? currency,
  }) {
    return UserModel(
      id: id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email,
      mobile: mobile ?? this.mobile,
      role: role,
      avatar: avatar ?? this.avatar,
      city: city ?? this.city,
      language: language ?? this.language,
      currency: currency ?? this.currency,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final prefs = json['preferences'];
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      mobile: json['mobile'] ?? '',
      role: json['role'] is String
          ? json['role']
          : (json['role']?['name'] ?? 'Customer'),
      avatar: json['avatar'],
      city: json['city'] ?? '',
      language: (prefs is Map ? prefs['language'] : null) ?? 'English',
      currency: (prefs is Map ? prefs['currency'] : null) ?? 'INR',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'mobile': mobile,
      'role': role,
      'avatar': avatar,
      'city': city,
      'preferences': {'language': language, 'currency': currency},
    };
  }
}
