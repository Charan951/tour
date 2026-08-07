import '../config/api_config.dart';
import '../models/package_model.dart';
import 'api_service.dart';

class PackageService {
  Future<List<PackageModel>> getPackages({String? category, String? search}) async {
    try {
      String url = ApiConfig.packages;
      List<String> queryParams = [];

      if (category != null && category.isNotEmpty && category != 'All') {
        queryParams.add('category=${Uri.encodeComponent(category)}');
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
      // Fallback mock data if server is offline during development
      return _getFallbackPackages();
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

  List<PackageModel> _getFallbackPackages() {
    return [
      PackageModel(
        id: '1',
        title: 'Exotic Bali Tropical Getaway',
        slug: 'exotic-bali-tropical-getaway',
        destination: 'Bali, Indonesia',
        duration: '5 Days / 4 Nights',
        price: 34999,
        originalPrice: 42000,
        category: 'Honeymoon',
        images: [
          'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
          'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2',
        ],
        overview: 'Experience the magic of Bali with luxury resorts, pristine beaches, and vibrant culture.',
        highlights: ['Private Beach Resort', 'Kintamani Volcano Tour', 'Sunset Dinner Cruise'],
        itinerary: [
          {'day': 1, 'title': 'Arrival in Bali', 'description': 'Airport transfer & welcome drink.'},
          {'day': 2, 'title': 'Ubud Cultural Tour', 'description': 'Visit Rice Terraces & Monkey Forest.'},
        ],
        inclusions: ['4-Star Hotel Stay', 'Daily Breakfast', 'Airport Transfers', 'Guided Tours'],
        exclusions: ['International Flights', 'Personal Expenses'],
        isFeatured: true,
        rating: 4.9,
      ),
      PackageModel(
        id: '2',
        title: 'Majestic Kashmir Snow & Valleys',
        slug: 'majestic-kashmir-snow-valleys',
        destination: 'Kashmir, India',
        duration: '6 Days / 5 Nights',
        price: 24999,
        originalPrice: 29999,
        category: 'Family',
        images: [
          'https://images.unsplash.com/photo-1566837945700-30057527ade0',
        ],
        overview: 'Discover Paradise on Earth with Houseboat stays in Dal Lake and snow adventures in Gulmarg.',
        highlights: ['Shikara Ride in Dal Lake', 'Gulmarg Gondola Ride', 'Pahalgam Valley Tour'],
        itinerary: [
          {'day': 1, 'title': 'Arrival in Srinagar', 'description': 'Check-in to Luxury Houseboat.'},
          {'day': 2, 'title': 'Gulmarg Snow Expedition', 'description': 'Full day in Gulmarg with Gondola.'},
        ],
        inclusions: ['Houseboat & Hotel Stay', 'Breakfast & Dinner', 'Shikara Ride'],
        exclusions: ['Gondola Tickets', 'Airfare'],
        isFeatured: true,
        rating: 4.8,
      ),
    ];
  }
}
