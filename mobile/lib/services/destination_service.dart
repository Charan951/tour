import '../config/api_config.dart';
import '../models/destination_model.dart';
import 'api_service.dart';

class DestinationService {
  Future<List<DestinationModel>> getDestinations() async {
    try {
      final response = await ApiService.get(ApiConfig.destinations);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        return list.map((json) => DestinationModel.fromJson(json)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  List<DestinationModel> getDestinationsSync() {
    return [];
  }
}
