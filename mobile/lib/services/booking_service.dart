import 'dart:async';
import '../config/api_config.dart';
import 'api_service.dart';
import 'auth_service.dart';

class BookingService {
  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> bookingData) async {
    try {
      final response = await ApiService.post(ApiConfig.bookings, bookingData);
      if (response['success'] == true) {
        return {
          'success': true,
          'message': response['message'] ?? 'Booking submitted successfully!',
          'data': response['data'],
        };
      }
      return {
        'success': false,
        'message': response['message'] ?? 'Failed to submit booking',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  Future<List<Map<String, dynamic>>> getUserBookings({String? email}) async {
    String? resolvedEmail = email?.trim();
    if (resolvedEmail == null || resolvedEmail.isEmpty) {
      final user = await AuthService().getSavedUser();
      resolvedEmail = user?.email.trim();
    }
    if (resolvedEmail == null || resolvedEmail.isEmpty) {
      resolvedEmail = 'user@example.com';
    }

    final Map<String, Map<String, dynamic>> combinedBookings = {};

    // 1. Query by email parameter
    try {
      final url = ApiConfig.myBookingsForEmail(resolvedEmail);
      final response = await ApiService.get(url);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'] as List;
        for (final item in list) {
          if (item is Map) {
            final mapItem = Map<String, dynamic>.from(item);
            final id = (mapItem['_id'] ?? mapItem['id'] ?? '').toString();
            if (id.isNotEmpty) {
              combinedBookings[id] = mapItem;
            }
          }
        }
      }
    } catch (_) {}

    // 2. Query by authenticated token endpoint
    try {
      final response = await ApiService.get(ApiConfig.myBookings);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'] as List;
        for (final item in list) {
          if (item is Map) {
            final mapItem = Map<String, dynamic>.from(item);
            final id = (mapItem['_id'] ?? mapItem['id'] ?? '').toString();
            if (id.isNotEmpty) {
              combinedBookings[id] = mapItem;
            }
          }
        }
      }
    } catch (_) {}

    return combinedBookings.values.toList();
  }
}
