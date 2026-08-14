import 'package:flutter/foundation.dart';

class ApiConfig {
  // Configured server host IP (192.168.1.32 matches local network address for physical Android devices)
  static String hostIp = '192.168.1.32';
  static String? customHost;

  static String get serverHost {
    if (customHost != null && customHost!.trim().isNotEmpty) {
      final host = customHost!.trim();
      if (host.startsWith('http')) {
        return host.endsWith('/api/v1') ? host.replaceAll('/api/v1', '') : host;
      }
      return 'http://$host:5000';
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      final ip = hostIp.isNotEmpty ? hostIp : "192.168.1.32";
      return 'http://$ip:5000';
    }

    return 'http://localhost:5000';
  }

  // Centralized Base API URL
  static String get baseUrl => '$serverHost/api/v1';

  static String formatImageUrl(String? url) {
    if (url == null || url.trim().isEmpty) {
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop';
    }
    final cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      if (cleanUrl.contains(':5000')) {
        return cleanUrl.replaceFirst(RegExp(r'http://[^/]+:5000'), serverHost);
      }
      return cleanUrl;
    }
    if (cleanUrl.startsWith('/')) {
      return '$serverHost$cleanUrl';
    }
    return '$serverHost/$cleanUrl';
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
  static String get myEnquiries => '$baseUrl/enquiries/my';
  static String myEnquiriesForEmail(String email) =>
      '$baseUrl/enquiries/my?email=${Uri.encodeQueryComponent(email)}';
  static String get adminEnquiries => '$baseUrl/admin/enquiries';
  static String adminEnquiryById(String id) => '$baseUrl/admin/enquiries/$id';
  static String adminEnquiryStatus(String id) =>
      '$baseUrl/admin/enquiries/$id/status';
  static String get contact => '$baseUrl/contact';
}
