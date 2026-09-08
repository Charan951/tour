class ApiConfig {
  /// Toggle between Production (`true`) and Localhost (`false`)
  static bool isProduction = true;

  // Endpoint URLs
  static const String productionHost = 'https://tour.speshway.site';
  static String localHost = 'http://localhost:5000';
  static String hostIp = '192.168.1.20';
  static String? customHost;

  static String get serverHost {
    if (customHost != null && customHost!.trim().isNotEmpty) {
      final host = customHost!.trim();
      if (host.startsWith('http')) {
        return host.endsWith('/api/v1') ? host.replaceAll('/api/v1', '') : host;
      }
      return 'https://$host';
    }

    if (isProduction) {
      return productionHost;
    }

    return localHost;
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
    return 'wss://$host';
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

  static String formatImageUrl(String? url, {int width = 500}) {
    if (url == null || url.trim().isEmpty) {
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=$width&q=75&auto=format&fit=crop';
    }
    final cleanUrl = url.trim();
    if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('assets/')) {
      return cleanUrl;
    }
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      String result = cleanUrl;
      if (result.contains(':5000')) {
        result = result.replaceFirst(RegExp(r'http://[^/]+:5000'), serverHost);
      }

      // Optimize Unsplash images for instant mobile loading (small WebP/JPEG payload)
      if (result.contains('images.unsplash.com')) {
        if (result.contains('w=')) {
          result = result.replaceAll(RegExp(r'w=\d+'), 'w=$width');
        } else {
          result += '&w=$width';
        }
        if (!result.contains('q=')) result += '&q=75';
        if (!result.contains('auto=')) result += '&auto=format';
        if (!result.contains('fit=')) result += '&fit=crop';
      }
      return result;
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
