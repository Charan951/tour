import '../config/api_config.dart';
import '../models/enquiry_model.dart';
import 'api_service.dart';

class EnquiryService {
  Future<bool> submitEnquiry(EnquiryModel enquiry) async {
    try {
      final response =
          await ApiService.post(ApiConfig.enquiries, enquiry.toJson());
      return response['success'] == true;
    } catch (e) {
      throw Exception('Failed to submit enquiry: ${e.toString()}');
    }
  }

  Future<List<EnquiryModel>> getUserEnquiries() async {
    try {
      final response = await ApiService.get(ApiConfig.myEnquiries);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'] as List;
        return list.map((json) => EnquiryModel.fromJson(json)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
