import 'package:flutter/foundation.dart';

class ApiConfig {
  // LAN IP of the development machine — matches NETWORK_IP in server/.env
  // so physical Android/iOS devices on the same WiFi can reach the server.
  static String hostIp = '192.168.1.20';
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

    // Android: default to localhost — with `adb reverse tcp:5000 tcp:5000`
    // running, the device/emulator loopback tunnels to the host over USB,
    // which is far faster than a LAN IP over Wi-Fi. Set `customHost` (or an
    // explicit `hostIp` other than 'localhost') only if you can't use adb.
    if (defaultTargetPlatform == TargetPlatform.android) {
      final ip = (hostIp.isNotEmpty && hostIp != 'localhost') ? hostIp : 'localhost';
      return 'http://$ip:5000';
    }

    return 'http://localhost:5000';
  }

  // Centralized Base API URL
  static String get baseUrl => '$serverHost/api/v1';

  static String get socketUrl {
    final host = serverHost;
    if (host.startsWith('https://')) {
      return host.replaceFirst('https://', 'wss://');
    } else if (host.startsWith('http://')) {
      return host.replaceFirst('http://', 'ws://');
    }
    return 'ws://$host:5000';
  }

  static String get notifications => '$baseUrl/notifications';
  static String get adminNotifications => '$baseUrl/admin/notifications';
  static String get myNotifications => '$baseUrl/notifications/my';
  static String myNotificationsForEmail(String email) =>
      '$baseUrl/notifications/my?email=${Uri.encodeQueryComponent(email)}';
  static String myNotificationReadUrl(String id, String email) =>
      '$baseUrl/notifications/my/$id/read?email=${Uri.encodeQueryComponent(email)}';
  static String myNotificationDeleteUrl(String id, String email) =>
      '$baseUrl/notifications/my/$id?email=${Uri.encodeQueryComponent(email)}';
  static String myNotificationsReadAll(String email) =>
      '$baseUrl/notifications/my/read-all?email=${Uri.encodeQueryComponent(email)}';

  static String formatImageUrl(String? url) {
    if (url == null || url.trim().isEmpty) {
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop';
    }
    final cleanUrl = url.trim();
    if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('assets/')) {
      return cleanUrl;
    }
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
  static String get me => '$baseUrl/auth/me';
  static String get updateProfile => '$baseUrl/auth/me';
  static String get changePassword => '$baseUrl/auth/change-password';
  static String get uploadImage => '$baseUrl/upload/single';

  static String get packages => '$baseUrl/packages';
  static String packageBySlug(String slug) => '$baseUrl/packages/$slug';

  static String get activities => '$baseUrl/activities';
  static String activityBySlug(String slug) => '$baseUrl/activities/$slug';

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

  static String get bookings => '$baseUrl/bookings';
  static String get myBookings => '$baseUrl/bookings/my';
  static String myBookingsForEmail(String email) =>
      '$baseUrl/bookings/my?email=${Uri.encodeQueryComponent(email)}';
  static String get adminBookings => '$baseUrl/admin/bookings';

  static String get contact => '$baseUrl/contact';
}
