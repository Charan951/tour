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
      return _getFallbackDestinations();
    }
  }

  List<DestinationModel> _getFallbackDestinations() {
    return [
      DestinationModel(
        id: '1',
        name: 'Kerala',
        slug: 'kerala',
        state: 'Kerala',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944',
        description: 'God\'s Own Country famous for serene backwaters, tea gardens, and lush greenery.',
        bestTimeToVisit: ['September - March'],
        isPopular: true,
      ),
      DestinationModel(
        id: '2',
        name: 'Maldives',
        slug: 'maldives',
        state: 'Male',
        country: 'Maldives',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8',
        description: 'World-renowned tropical paradise with overwater villas and crystal clear turquoise lagoons.',
        bestTimeToVisit: ['November - April'],
        isPopular: true,
      ),
      DestinationModel(
        id: '3',
        name: 'Manali',
        slug: 'manali',
        state: 'Himachal Pradesh',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23',
        description: 'High-altitude Himalayan resort town known for snow peaks, river rafting, and adventure sports.',
        bestTimeToVisit: ['October - June'],
        isPopular: true,
      ),
    ];
  }
}
