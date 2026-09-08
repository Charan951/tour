import '../config/api_config.dart';
import '../models/package_model.dart';
import 'api_service.dart';

class PackageService {
  Future<List<PackageModel>> getPackages({
    String? category,
    String? search,
    String? theme,
    String? destination,
  }) async {
    try {
      String url = ApiConfig.packages;
      List<String> queryParams = [];

      if (category != null && category.isNotEmpty && category != 'All') {
        queryParams.add('category=${Uri.encodeComponent(category)}');
      }
      if (theme != null && theme.isNotEmpty && theme != 'All') {
        queryParams.add('theme=${Uri.encodeComponent(theme)}');
      }
      if (destination != null && destination.isNotEmpty && destination != 'All') {
        queryParams.add('destination=${Uri.encodeComponent(destination)}');
      }
      if (search != null && search.isNotEmpty) {
        queryParams.add('search=${Uri.encodeComponent(search)}');
      }

      if (queryParams.isNotEmpty) {
        url += '?${queryParams.join('&')}';
      }

      final response = await ApiService.get(url);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        return list.map((json) => PackageModel.fromJson(json)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<PackageModel?> getPackageBySlug(String slug) async {
    try {
      final response = await ApiService.get(ApiConfig.packageBySlug(slug));
      if (response['success'] == true && response['data'] != null) {
        return PackageModel.fromJson(response['data']);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  List<PackageModel> getPackagesSync() {
    return [];
  }
}
