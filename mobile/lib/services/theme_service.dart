import '../config/api_config.dart';
import '../models/theme_model.dart';
import 'api_service.dart';

class ThemeService {
  Future<List<ThemeModel>> getThemes() async {
    try {
      final response = await ApiService.get(ApiConfig.themes);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        final themes = list.map((json) => ThemeModel.fromJson(json)).toList();
        if (themes.isNotEmpty) return themes;
      }
      return _getFallbackThemes();
    } catch (_) {
      return _getFallbackThemes();
    }
  }

  List<ThemeModel> getThemesSync() {
    return _getFallbackThemes();
  }

  List<ThemeModel> _getFallbackThemes() {
    return [
      ThemeModel(
        id: 't1',
        name: 'Honeymoon Tour',
        rating: '4.9 ★ (348 Reviews)',
        imageUrl:
            'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
        description:
            'Romantic getaways with candlelight dinners, luxury stays, scenic sunset moments, and memorable couple experiences.',
      ),
      ThemeModel(
        id: 't2',
        name: 'Leisure',
        rating: '4.8 ★ (162 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        description:
            'Easygoing holidays that blend beach relaxation, resort stays, and curated city or coastal sightseeing.',
      ),
      ThemeModel(
        id: 't3',
        name: 'Hill Station',
        rating: '4.9 ★ (81 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop',
        description:
            'Cool-weather escapes with mountain views, pine valleys, tea gardens, and peaceful nature retreats.',
      ),
      ThemeModel(
        id: 't4',
        name: 'Trekking',
        rating: '5.0 ★ (55 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        description:
            'Trail-based adventures through scenic mountains, guided treks, camp stays, and landscape-rich routes.',
      ),
      ThemeModel(
        id: 't5',
        name: 'Adventure',
        rating: '4.9 ★ (141 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop',
        description:
            'High-energy trips featuring rafting, zipline rides, off-road thrills, and adrenaline-filled experiences.',
      ),
      ThemeModel(
        id: 't6',
        name: 'Religious',
        rating: '5.0 ★ (41 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop',
        description:
            'Sacred journeys to temples, heritage sites, and peaceful spiritual destinations with guided comfort.',
      ),
      ThemeModel(
        id: 't7',
        name: 'Family Tour',
        rating: '4.8 ★ (210 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop',
        description:
            'Comfort-focused family holidays with sightseeing, kid-friendly activities, and memorable shared experiences.',
      ),
      ThemeModel(
        id: 't8',
        name: 'Wildlife Safari',
        rating: '4.9 ★ (35 Packages)',
        imageUrl:
            'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
        description:
            'Wildlife-rich escapes with jungle safaris, nature lodges, forest drives, and unforgettable animal encounters.',
      ),
    ];
  }
}
