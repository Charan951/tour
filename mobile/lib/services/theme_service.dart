import '../config/api_config.dart';
import '../models/theme_model.dart';
import 'api_service.dart';

class ThemeService {
  Future<List<ThemeModel>> getThemes() async {
    try {
      final response = await ApiService.get(ApiConfig.themes);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        return list.map((json) => ThemeModel.fromJson(json)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  List<ThemeModel> getThemesSync() {
    return [];
  }
}
