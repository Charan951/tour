import 'dart:async';
import '../config/api_config.dart';
import 'api_service.dart';

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
    final candidateUrls = <String>[];
    if (email != null && email.trim().isNotEmpty) {
      candidateUrls.add(ApiConfig.myBookingsForEmail(email.trim()));
    }
    candidateUrls.add(ApiConfig.myBookings);

    for (final url in candidateUrls) {
      try {
        final response = await ApiService.get(url);
        if (response['success'] == true && response['data'] != null) {
          final List list = response['data'] as List;
          return list.cast<Map<String, dynamic>>();
        }
      } catch (_) {
        continue;
      }
    }
    return [];
  }
}
