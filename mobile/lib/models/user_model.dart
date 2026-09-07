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

  String get fullName => '$firstName $lastName'.trim();

  String get displayName {
    final name = fullName;
    if (name.isNotEmpty) return name;
    if (email.isNotEmpty && email.contains('@')) {
      final username = email.split('@').first.trim();
      if (username.isNotEmpty) {
        return username[0].toUpperCase() + username.substring(1);
      }
    }
    return 'Traveler';
  }

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
    String fName = (json['firstName'] ?? '').toString().trim();
    String lName = (json['lastName'] ?? '').toString().trim();
    if (fName.isEmpty && lName.isEmpty) {
      final raw = (json['fullName'] ?? json['name'] ?? '').toString().trim();
      if (raw.isNotEmpty) {
        final parts = raw.split(RegExp(r'\s+'));
        fName = parts.isNotEmpty ? parts.first : '';
        lName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
      }
    }

    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      firstName: fName,
      lastName: lName,
      email: json['email'] ?? '',
      mobile: json['mobile'] ?? json['phone'] ?? '',
      role: json['role'] is String
          ? json['role']
          : (json['role']?['name'] ?? 'Customer'),
      avatar: json['avatar'],
      city: json['city'] ?? json['address'] ?? '',
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

