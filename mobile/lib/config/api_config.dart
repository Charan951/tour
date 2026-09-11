import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'theme.dart';

class ApiConfig {
  static const String _prefIsProductionKey = 'hc_api_is_production';
  static const String _prefCustomHostKey = 'hc_api_custom_host';

  /// Backend selector:
  ///   true  -> production backend (https://tour.speshway.site)
  ///   false -> localhost backend  (http://localhost:5000)
  static bool isProduction = false;

  // Endpoint URLs
  static const String productionHost = 'https://tour.speshway.site';
  static String localHost = 'http://localhost:5000';

  /// Kept for the connectivity / candidate-URL fallback logic in
  /// `services/api_service.dart` and `services/connectivity.dart`.
  static String hostIp = '';
  static String? customHost;

  /// Load persisted environment settings from SharedPreferences
  static Future<void> loadSavedEnvironment() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.containsKey(_prefIsProductionKey)) {
        isProduction = prefs.getBool(_prefIsProductionKey) ?? kReleaseMode;
      }
      if (prefs.containsKey(_prefCustomHostKey)) {
        customHost = prefs.getString(_prefCustomHostKey);
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Error loading saved API environment: $e');
    }
  }

  /// Toggle environment between Production and Localhost
  static Future<void> toggleEnvironment() async {
    await setProduction(!isProduction);
  }

  /// Set Production or Localhost environment
  static Future<void> setProduction(bool prod) async {
    isProduction = prod;
    customHost = null; // Clear custom override when switching explicitly
    ApiService.resetWorkingHost();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefIsProductionKey, isProduction);
      await prefs.remove(_prefCustomHostKey);
    } catch (e) {
      if (kDebugMode) debugPrint('Error saving API environment preference: $e');
    }
  }

  /// Shortcut to switch to Production
  static Future<void> useProduction() async {
    await setProduction(true);
  }

  /// Shortcut to switch to Localhost
  static Future<void> useLocalHost() async {
    await setProduction(false);
  }

  /// Set a custom IP or host override (e.g. 192.168.1.15:5000)
  static Future<void> setCustomHost(String? host) async {
    if (host == null || host.trim().isEmpty) {
      customHost = null;
    } else {
      customHost = host.trim();
    }
    ApiService.resetWorkingHost();
    try {
      final prefs = await SharedPreferences.getInstance();
      if (customHost != null) {
        await prefs.setString(_prefCustomHostKey, customHost!);
      } else {
        await prefs.remove(_prefCustomHostKey);
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Error saving custom host preference: $e');
    }
  }

  /// Reset to default settings
  static Future<void> resetToDefault() async {
    isProduction = kReleaseMode;
    customHost = null;
    ApiService.resetWorkingHost();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefIsProductionKey);
      await prefs.remove(_prefCustomHostKey);
    } catch (e) {
      if (kDebugMode) debugPrint('Error resetting API environment: $e');
    }
  }

  /// Display text for current mode
  static String get currentModeName {
    if (customHost != null && customHost!.trim().isNotEmpty) {
      return 'Custom ($customHost)';
    }
    return isProduction ? 'Production' : 'Localhost';
  }

  static String get serverHost {
    if (customHost != null && customHost!.trim().isNotEmpty) {
      final host = customHost!.trim();
      if (host.startsWith('http')) {
        return host.endsWith('/api/v1') ? host.replaceAll('/api/v1', '') : host;
      }
      return 'https://$host';
    }

    return isProduction ? productionHost : localHost;
  }

  // Centralized Base API URL
  static String get baseUrl => '$serverHost/api/v1';

  /// Public marketing site (same host as the API deploy). The mobile app shows
  /// Terms / Privacy in-app via `LegalScreen`; these URLs are the web equivalents.
  static String get webUrl => serverHost;
  static String get termsUrl => '$webUrl/terms';
  static String get privacyUrl => '$webUrl/privacy';

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
    if (cleanUrl.startsWith('data:') ||
        cleanUrl.startsWith('blob:') ||
        cleanUrl.startsWith('assets/')) {
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
  static String get deleteAccount => '$baseUrl/auth/me';
  static String get uploadImage => '$baseUrl/upload/single';
  static String get fcmToken => '$baseUrl/users/fcm-token';

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

  /// Displays an interactive modal dialog allowing the user to toggle between
  /// Production and Localhost environments or enter a custom IP/host.
  static Future<void> showServerConfigDialog(
    BuildContext context, {
    VoidCallback? onSaved,
  }) async {
    return showDialog(
      context: context,
      builder: (dialogContext) {
        return _ServerConfigDialogWidget(onSaved: onSaved);
      },
    );
  }
}

class _ServerConfigDialogWidget extends StatefulWidget {
  final VoidCallback? onSaved;
  const _ServerConfigDialogWidget({this.onSaved});

  @override
  State<_ServerConfigDialogWidget> createState() =>
      __ServerConfigDialogWidgetState();
}

class __ServerConfigDialogWidgetState extends State<_ServerConfigDialogWidget> {
  late bool _selectedIsProduction;
  late TextEditingController _customHostController;
  bool _useCustomHost = false;

  @override
  void initState() {
    super.initState();
    _selectedIsProduction = ApiConfig.isProduction;
    _useCustomHost =
        ApiConfig.customHost != null && ApiConfig.customHost!.trim().isNotEmpty;
    _customHostController =
        TextEditingController(text: ApiConfig.customHost ?? '');
  }

  @override
  void dispose() {
    _customHostController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Icon(Icons.tune_rounded, color: AppTheme.primaryColor),
          const SizedBox(width: 10),
          const Text('Backend Environment',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select target backend environment:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),

            // Production Option Card
            InkWell(
              onTap: () {
                setState(() {
                  _selectedIsProduction = true;
                  _useCustomHost = false;
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (_selectedIsProduction && !_useCustomHost)
                        ? AppTheme.primaryColor
                        : Colors.grey.shade300,
                    width: (_selectedIsProduction && !_useCustomHost) ? 2 : 1,
                  ),
                  color: (_selectedIsProduction && !_useCustomHost)
                      ? AppTheme.primaryColor.withValues(alpha: 0.08)
                      : Colors.transparent,
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.cloud_done_rounded,
                      color: (_selectedIsProduction && !_useCustomHost)
                          ? AppTheme.primaryColor
                          : Colors.grey,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Production Server',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            ApiConfig.productionHost,
                            style: TextStyle(
                              fontSize: 11,
                              color: theme.textTheme.bodySmall?.color ??
                                  Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (_selectedIsProduction && !_useCustomHost)
                              ? AppTheme.primaryColor
                              : Colors.grey,
                          width: (_selectedIsProduction && !_useCustomHost)
                              ? 6
                              : 2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Localhost Option Card
            InkWell(
              onTap: () {
                setState(() {
                  _selectedIsProduction = false;
                  _useCustomHost = false;
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (!_selectedIsProduction && !_useCustomHost)
                        ? AppTheme.primaryColor
                        : Colors.grey.shade300,
                    width: (!_selectedIsProduction && !_useCustomHost) ? 2 : 1,
                  ),
                  color: (!_selectedIsProduction && !_useCustomHost)
                      ? AppTheme.primaryColor.withValues(alpha: 0.08)
                      : Colors.transparent,
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.laptop_chromebook_rounded,
                      color: (!_selectedIsProduction && !_useCustomHost)
                          ? AppTheme.primaryColor
                          : Colors.grey,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Localhost Server',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            ApiConfig.localHost,
                            style: TextStyle(
                              fontSize: 11,
                              color: theme.textTheme.bodySmall?.color ??
                                  Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (!_selectedIsProduction && !_useCustomHost)
                              ? AppTheme.primaryColor
                              : Colors.grey,
                          width: (!_selectedIsProduction && !_useCustomHost)
                              ? 6
                              : 2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Custom Host Option Toggle
            InkWell(
              onTap: () {
                setState(() {
                  _useCustomHost = !_useCustomHost;
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _useCustomHost
                        ? AppTheme.primaryColor
                        : Colors.grey.shade300,
                    width: _useCustomHost ? 2 : 1,
                  ),
                  color: _useCustomHost
                      ? AppTheme.primaryColor.withValues(alpha: 0.08)
                      : Colors.transparent,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.dns_rounded,
                          color: _useCustomHost
                              ? AppTheme.primaryColor
                              : Colors.grey,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Custom IP / Host',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Switch(
                          value: _useCustomHost,
                          onChanged: (val) {
                            setState(() {
                              _useCustomHost = val;
                            });
                          },
                        ),
                      ],
                    ),
                    if (_useCustomHost) ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: _customHostController,
                        decoration: const InputDecoration(
                          hintText: 'e.g. 192.168.1.15:5000',
                          labelText: 'Host IP or Domain',
                          isDense: true,
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Active URL Preview
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link,
                      size: 16, color: AppTheme.primaryColor),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Target URL: ${_computePreviewUrl()}',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryColor,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            if (_useCustomHost &&
                _customHostController.text.trim().isNotEmpty) {
              await ApiConfig.setCustomHost(_customHostController.text.trim());
            } else {
              await ApiConfig.setProduction(_selectedIsProduction);
            }
            if (context.mounted) {
              Navigator.pop(context);
              widget.onSaved?.call();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Server switched to ${ApiConfig.currentModeName}: ${ApiConfig.baseUrl}',
                  ),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            }
          },
          child: const Text('Save & Apply'),
        ),
      ],
    );
  }

  String _computePreviewUrl() {
    if (_useCustomHost && _customHostController.text.trim().isNotEmpty) {
      final host = _customHostController.text.trim();
      if (host.startsWith('http')) return host;
      return 'https://$host';
    }
    return _selectedIsProduction
        ? ApiConfig.productionHost
        : ApiConfig.localHost;
  }
}
