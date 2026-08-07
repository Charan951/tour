import '../config/api_config.dart';
import '../models/banner_model.dart';
import 'api_service.dart';

class BannerService {
  Future<List<BannerModel>> getBanners() async {
    try {
      final response = await ApiService.get(ApiConfig.banners);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        if (list.isNotEmpty) {
          return list.map((json) => BannerModel.fromJson(json)).toList();
        }
      }
      return _getFallbackBanners();
    } catch (_) {
      return _getFallbackBanners();
    }
  }

  List<BannerModel> _getFallbackBanners() {
    return [
      BannerModel(
        id: 'b1',
        title: 'Explore Tropical Paradises',
        subtitle: 'Hand-crafted beach resort packages in Maldives, Goa & Bali',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
      ),
      BannerModel(
        id: 'b2',
        title: 'Majestic Mountain Escapes',
        subtitle: 'Bespoke holiday itineraries for Kashmir, Manali & Ladakh',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
      ),
      BannerModel(
        id: 'b3',
        title: 'Exotic Island & Cultural Tours',
        subtitle: 'Unforgettable international journeys to Vietnam, Thailand & Dubai',
        imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
      ),
      BannerModel(
        id: 'b4',
        title: 'Serene Backwaters & Heritage',
        subtitle: 'Relaxing houseboat stays & authentic South Indian experiences',
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
      ),
    ];
  }
}
