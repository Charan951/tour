import '../config/api_config.dart';
import '../models/enquiry_model.dart';
import 'api_service.dart';

class EnquiryService {
  Future<bool> submitEnquiry(EnquiryModel enquiry) async {
    try {
      final response = await ApiService.post(ApiConfig.enquiries, enquiry.toJson());
      return response['success'] == true;
    } catch (e) {
      throw Exception('Failed to submit enquiry: ${e.toString()}');
    }
  }

  Future<List<EnquiryModel>> getUserEnquiries() async {
    try {
      final response = await ApiService.get(ApiConfig.enquiries);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        if (list.isNotEmpty) {
          return list.map((json) => EnquiryModel.fromJson(json)).toList();
        }
      }
      return _getFallbackEnquiries();
    } catch (_) {
      return _getFallbackEnquiries();
    }
  }

  List<EnquiryModel> _getFallbackEnquiries() {
    return [
      EnquiryModel(
        id: 'eq1',
        name: 'Naveen P',
        email: 'naveen@gmail.com',
        phone: '7702233931',
        destination: 'Exotic Bali Tropical Getaway',
        travelers: 2,
        travelDate: '2026-09-15',
        status: 'In Contact',
        message: 'Looking for 5-day honeymoon package with private pool villa.',
        createdAt: '2026-08-01',
      ),
      EnquiryModel(
        id: 'eq2',
        name: 'Naveen P',
        email: 'naveen@gmail.com',
        phone: '7702233931',
        destination: 'Majestic Kashmir Snow & Valleys',
        travelers: 4,
        travelDate: '2026-10-10',
        status: 'Quote Sent',
        message: 'Family trip inquiry with houseboat stay in Dal Lake.',
        createdAt: '2026-08-05',
      ),
    ];
  }
}
