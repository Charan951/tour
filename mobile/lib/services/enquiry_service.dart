import 'dart:async';
import '../config/api_config.dart';
import '../models/enquiry_model.dart';
import 'api_service.dart';

class EnquiryService {
  // In-memory cache for instant retrieval
  static final Map<String, List<EnquiryModel>> _enquiryCache = {};

  static bool isAdminRole(String? role) {
    if (role == null) return false;
    final normalized = role.trim().toLowerCase();
    if (normalized.isEmpty) return false;

    final adminKeywords = [
      'super admin',
      'admin',
      'sales executive',
      'content manager',
      'marketing manager',
      'travel manager',
      'operations manager',
      'manager',
      'management',
      'staff'
    ];

    return adminKeywords.any(
        (keyword) => normalized == keyword || normalized.contains(keyword));
  }

  // Get cached enquiries immediately without waiting
  static List<EnquiryModel> getCachedEnquiries(String? email) {
    final cacheKey = email ?? 'all';
    return _enquiryCache[cacheKey] ?? [];
  }

  // Cache enquiries for instant retrieval next time
  static void _setCachedEnquiries(String? email, List<EnquiryModel> enquiries) {
    final cacheKey = email ?? 'all';
    _enquiryCache[cacheKey] = enquiries;
  }

  Future<bool> submitEnquiry(EnquiryModel enquiry) async {
    try {
      final response =
          await ApiService.post(ApiConfig.enquiries, enquiry.toJson());
      return response['success'] == true;
    } catch (e) {
      throw Exception('Failed to submit enquiry: ${e.toString()}');
    }
  }

  Future<List<EnquiryModel>> getUserEnquiries({String? email}) async {
    final candidateUrls = <String>[];
    if (email != null && email.trim().isNotEmpty) {
      candidateUrls.add(ApiConfig.myEnquiriesForEmail(email.trim()));
    }
    candidateUrls.add(ApiConfig.myEnquiries);

    for (final url in candidateUrls) {
      try {
        final response = await ApiService.get(url);
        if (response['success'] == true && response['data'] != null) {
          final List list = response['data'] as List;
          final enquiries =
              list.map((json) => EnquiryModel.fromJson(json)).toList();
          // Cache the results
          _setCachedEnquiries(email, enquiries);
          return enquiries;
        }
      } catch (_) {
        continue;
      }
    }

    return [];
  }

  Future<List<EnquiryModel>> getProfileEnquiries(
      {String? role, String? email}) async {
    try {
      final personalEnquiries = await getUserEnquiries(email: email);
      final isStaffRole = isAdminRole(role);

      List<EnquiryModel> result;
      if (!isStaffRole || personalEnquiries.isNotEmpty) {
        result = personalEnquiries;
      } else {
        final response = await ApiService.get(ApiConfig.adminEnquiries);
        if (response['success'] == true && response['data'] != null) {
          final List list = response['data'] as List;
          result = list.map((json) => EnquiryModel.fromJson(json)).toList();
        } else {
          result = personalEnquiries;
        }
      }

      // Cache the results for instant retrieval next time
      _setCachedEnquiries(email, result);
      return result;
    } catch (_) {
      final fallback = await getUserEnquiries(email: email);
      // Cache even the fallback result
      _setCachedEnquiries(email, fallback);
      return fallback;
    }
  }

  Future<bool> updateEnquiryStatus(String enquiryId, String status) async {
    if (enquiryId.trim().isEmpty) return false;

    try {
      final response = await ApiService.patch(
        ApiConfig.adminEnquiryStatus(enquiryId),
        {'status': status},
      );
      return response['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Start listening for enquiry status updates
  /// Polls the server every [intervalSeconds] seconds
  void startEnquiryStatusListener(
    Function(List<EnquiryModel>) onUpdate, {
    int intervalSeconds = 8,
  }) {
    Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
      try {
        final enquiries = await getUserEnquiries();
        onUpdate(enquiries);
      } catch (_) {
        // Silent failure - continue polling
      }
    });
  }
}
