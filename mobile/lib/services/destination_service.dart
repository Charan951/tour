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
      return _getFallbackDestinations();
    } catch (_) {
      return _getFallbackDestinations();
    }
  }

  List<DestinationModel> getDestinationsSync() {
    return _getFallbackDestinations();
  }

  List<DestinationModel> _getFallbackDestinations() {
    return [
      DestinationModel(
        id: '1',
        name: 'Kerala',
        slug: 'kerala',
        state: 'Kerala',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
        description: 'God\'s Own Country famous for serene backwaters, tea gardens & luxury houseboats.',
        bestTimeToVisit: ['Sep - Mar'],
        isPopular: true,
      ),
      DestinationModel(
        id: '2',
        name: 'Maldives',
        slug: 'maldives',
        state: 'Male Atoll',
        country: 'Maldives',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop',
        description: 'World-renowned tropical paradise with overwater villas and crystal clear turquoise lagoons.',
        bestTimeToVisit: ['Nov - Apr'],
        isPopular: true,
      ),
      DestinationModel(
        id: '3',
        name: 'Manali & Peaks',
        slug: 'himachal',
        state: 'Himachal Pradesh',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
        description: 'High-altitude Himalayan resort town known for snow peaks, Solang Valley & Rohtang Pass.',
        bestTimeToVisit: ['Oct - Jun'],
        isPopular: true,
      ),
      DestinationModel(
        id: '4',
        name: 'Goa Beaches',
        slug: 'goa',
        state: 'Goa',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
        description: 'Golden sand beaches, water sports, sunset cruises & vibrant nightlife.',
        bestTimeToVisit: ['Nov - Feb'],
        isPopular: true,
      ),
      DestinationModel(
        id: '5',
        name: 'Royal Rajasthan',
        slug: 'rajasthan',
        state: 'Rajasthan',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
        description: 'Royal palaces, Amer Fort elephant rides, desert sand dunes & cultural folk dances.',
        bestTimeToVisit: ['Oct - Mar'],
        isPopular: true,
      ),
      DestinationModel(
        id: '6',
        name: 'Magical Kashmir',
        slug: 'kashmir',
        state: 'Jammu & Kashmir',
        country: 'India',
        image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop',
        description: 'Paradise on Earth featuring Dal Lake shikaras, Gulmarg snow gondola & tulip gardens.',
        bestTimeToVisit: ['Oct - May'],
        isPopular: true,
      ),
      DestinationModel(
        id: '7',
        name: 'Bali Island',
        slug: 'bali',
        state: 'Bali',
        country: 'Indonesia',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
        description: 'Tropical island paradise known for private pool villas, Ubud rice terraces & Nusa Penida.',
        bestTimeToVisit: ['Apr - Oct'],
        isPopular: true,
      ),
      DestinationModel(
        id: '8',
        name: 'Singapore',
        slug: 'singapore',
        state: 'Marina Bay',
        country: 'Singapore',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
        description: 'Futuristic city featuring Gardens by the Bay, Universal Studios & Sentosa Island.',
        bestTimeToVisit: ['Year Round'],
        isPopular: true,
      ),
    ];
  }
}
