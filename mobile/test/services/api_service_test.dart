import 'package:flutter_test/flutter_test.dart';
import 'package:holidaycity_mobile/config/api_config.dart';

void main() {
  group('ApiConfig Unit Tests', () {
    test('Base URL contains api/v1 prefix', () {
      final url = ApiConfig.baseUrl;
      expect(url.contains('/api/v1'), isTrue);
    });

    test('Endpoint URIs format correctly', () {
      expect(ApiConfig.login.endsWith('/auth/login'), isTrue);
      expect(ApiConfig.packages.endsWith('/packages'), isTrue);
      expect(ApiConfig.destinations.endsWith('/destinations'), isTrue);
      expect(ApiConfig.enquiries.endsWith('/enquiries'), isTrue);
    });

    test('Custom host override updates base URL', () {
      // A bare host (no scheme) is treated as an HTTPS host — production and
      // any real remote backend are TLS-only.
      ApiConfig.customHost = '192.168.1.100';
      expect(ApiConfig.baseUrl, equals('https://192.168.1.100/api/v1'));

      // An explicit scheme is preserved as-is (local dev over http).
      ApiConfig.customHost = 'http://192.168.1.100:5000';
      expect(ApiConfig.baseUrl, equals('http://192.168.1.100:5000/api/v1'));

      ApiConfig.customHost = null; // reset
    });
  });
}
