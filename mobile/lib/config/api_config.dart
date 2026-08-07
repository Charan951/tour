import 'package:flutter/foundation.dart';

class ApiConfig {
  // PC's LAN IPv4 address (for physical Android phone & local development)
  static String hostIp = '192.168.1.32';
  static String? customHost;

  // Centralized Base API URL
  static String get baseUrl {
    final host = customHost ?? hostIp;
    if (kIsWeb && customHost == null) {
      return 'http://$hostIp:5000/api/v1';
    }
    if (host.startsWith('http')) {
      return host.endsWith('/api/v1') ? host : '$host/api/v1';
    }
    return 'http://$host:5000/api/v1';
  }

  // Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get forgotPassword => '$baseUrl/auth/forgot-password';
  static String get me => '$baseUrl/admin/auth/me';

  static String get packages => '$baseUrl/packages';
  static String packageBySlug(String slug) => '$baseUrl/packages/$slug';

  static String get destinations => '$baseUrl/destinations';
  static String destinationBySlug(String slug) => '$baseUrl/destinations/$slug';

  static String get banners => '$baseUrl/banners';
  static String get themes => '$baseUrl/themes';
  static String get blogs => '$baseUrl/blogs';
  static String get testimonials => '$baseUrl/testimonials';
  static String get faqs => '$baseUrl/faq';

  static String get enquiries => '$baseUrl/enquiries';
  static String get contact => '$baseUrl/contact';
}
