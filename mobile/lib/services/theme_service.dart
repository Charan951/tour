import '../config/api_config.dart';
import '../models/theme_model.dart';
import 'api_service.dart';

class ThemeService {
  Future<List<ThemeModel>> getThemes() async {
    try {
      final response = await ApiService.get(ApiConfig.themes);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        if (list.isNotEmpty) {
          return list.map((json) => ThemeModel.fromJson(json)).toList();
        }
      }
      return _getFallbackThemes();
    } catch (_) {
      return _getFallbackThemes();
    }
  }

  List<ThemeModel> _getFallbackThemes() {
    return [
      ThemeModel(
        id: 't1',
        name: 'Honeymoon Tour',
        rating: '4.9 ★ (348 Reviews)',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't2',
        name: 'Leisure',
        rating: '4.8 ★ (162 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't3',
        name: 'Hill Station',
        rating: '4.9 ★ (81 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't4',
        name: 'Trekking',
        rating: '5.0 ★ (55 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't5',
        name: 'Adventure',
        rating: '4.9 ★ (141 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't6',
        name: 'Religious',
        rating: '5.0 ★ (41 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't7',
        name: 'Family Tour',
        rating: '4.8 ★ (210 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop',
      ),
      ThemeModel(
        id: 't8',
        name: 'Wildlife Safari',
        rating: '4.9 ★ (35 Packages)',
        imageUrl: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?q=80&w=800&auto=format&fit=crop',
      ),
    ];
  }
}
