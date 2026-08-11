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
        if (list.isNotEmpty) {
          return list.map((json) => PackageModel.fromJson(json)).toList();
        }
      }
      return _getFallbackPackages();
    } catch (_) {
      return _getFallbackPackages();
    }
  }

  Future<PackageModel?> getPackageBySlug(String slug) async {
    try {
      final response = await ApiService.get(ApiConfig.packageBySlug(slug));
      if (response['success'] == true && response['data'] != null) {
        return PackageModel.fromJson(response['data']);
      }
      final fallbacks = _getFallbackPackages();
      return fallbacks.firstWhere((p) => p.slug == slug, orElse: () => fallbacks.first);
    } catch (_) {
      final fallbacks = _getFallbackPackages();
      return fallbacks.firstWhere((p) => p.slug == slug, orElse: () => fallbacks.first);
    }
  }

  List<PackageModel> getPackagesSync() {
    return _getFallbackPackages();
  }

  List<PackageModel> _getFallbackPackages() {
    return [
      PackageModel(
        id: '1',
        packageCode: 'PKG-GOA-001',
        title: 'Vibrant Goa Beach & Water Sports Getaway',
        slug: 'vibrant-goa-beach-getaway-4-days',
        destination: 'Goa, India',
        duration: '4 Days / 3 Nights',
        price: 12900,
        originalPrice: 15900,
        category: 'Domestic',
        images: [
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
        ],
        overview: 'Experience North and South Goa beach hopping, Mandovi river sunset cruise, and thrill water sports in Calangute.',
        highlights: ['4-Star Beach Resort Stay', 'Mandovi River Sunset Cruise', 'Parasailing & Jet Skiing Combo', 'Old Goa Churches'],
        itinerary: [
          {'day': 1, 'title': 'Arrival & Beach Chill', 'description': 'Airport transfer, check-in to resort, and evening stroll at Baga beach.'},
          {'day': 2, 'title': 'North Goa & Water Sports', 'description': 'Parasailing, jet skiing, banana ride, and Fort Aguada photoshoot.'},
          {'day': 3, 'title': 'South Goa & Sunset Cruise', 'description': 'Visit Basilica of Bom Jesus, Mangueshi Temple, and Mandovi river cruise.'},
          {'day': 4, 'title': 'Departure', 'description': 'Breakfast & souvenir shopping before airport drop.'},
        ],
        inclusions: ['4-Star Resort Stay', 'Daily Buffet Breakfast', 'Private AC Sedan Airport Transfer', 'Water Sports Combo'],
        exclusions: ['Flight Airfare', 'Personal Expenses'],
        pricingTiers: [
          PricingTierModel(category: 'Standard', price: 12900, hotel: '3 Star Beachside Hotel', meal: 'Daily Breakfast', transport: 'Shared AC Coach'),
          PricingTierModel(category: 'Deluxe', price: 15900, hotel: '4 Star Luxury Resort', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan'),
          PricingTierModel(category: 'Luxury', price: 24900, hotel: '5 Star Taj / Marriott Beach Resort', meal: 'All Meals Included', transport: 'Private SUV'),
        ],
        isFeatured: true,
        rating: 4.88,
      ),
      PackageModel(
        id: '2',
        packageCode: 'PKG-HIM-001',
        title: 'Scenic Manali & Solang Snow Adventure',
        slug: 'scenic-manali-solang-snow-adventure-5-days',
        destination: 'Himachal Pradesh, India',
        duration: '5 Days / 4 Nights',
        price: 16500,
        originalPrice: 19500,
        category: 'Domestic',
        images: [
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
        ],
        overview: 'Explore Hadimba Temple, Mall Road shopping, Solang Valley ATV rides & Rohtang snow point.',
        highlights: ['Solang Valley Snow Sports', 'Rohtang Pass Day Trip', 'Private Mountain View Resort'],
        itinerary: [
          {'day': 1, 'title': 'Arrival in Manali', 'description': 'Check-in to mountain resort and rest.'},
          {'day': 2, 'title': 'Local Sightseeing', 'description': 'Hadimba Temple, Vashisht Hot Springs, and Mall Road.'},
          {'day': 3, 'title': 'Solang Valley Adventure', 'description': 'Paragliding, ropeway, and snow sports.'},
          {'day': 4, 'title': 'Atal Tunnel & Sissu', 'description': 'Excursion to Lahaul valley via Atal Tunnel.'},
          {'day': 5, 'title': 'Departure', 'description': 'Breakfast & Volvo bus drop.'},
        ],
        inclusions: ['Mountain View Resort Stay', 'Breakfast & Dinner', 'Private Cab Sightseeing'],
        exclusions: ['Heater Charges', 'Personal Shopping'],
        pricingTiers: [
          PricingTierModel(category: 'Standard', price: 16500, hotel: '3 Star Mountain View Hotel', meal: 'Breakfast & Dinner', transport: 'Private Alto/Dzire'),
          PricingTierModel(category: 'Deluxe', price: 21900, hotel: '4 Star Luxury Cottage Resort', meal: 'Breakfast & Dinner', transport: 'Private Etios/Sedan'),
          PricingTierModel(category: 'Luxury', price: 32000, hotel: '5 Star Span Resort & Spa', meal: 'All Meals Included', transport: 'Private Innova Crysta'),
        ],
        isFeatured: true,
        rating: 4.92,
      ),
      PackageModel(
        id: '3',
        packageCode: 'PKG-MAL-001',
        title: 'Maldives Private Water Villa & Snorkeling Paradise',
        slug: 'maldives-water-villa-honeymoon-5-days',
        destination: 'Maldives',
        duration: '5 Days / 4 Nights',
        price: 59000,
        originalPrice: 68000,
        category: 'International',
        images: [
          'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop',
        ],
        overview: '5-star private island resort with glass floor water bungalow, speedboat transfer & all meals.',
        highlights: ['Overwater Bungalow with Ocean Access', 'Speedboat Airport Transfer', 'Sunset Dolphin Cruise'],
        itinerary: [
          {'day': 1, 'title': 'Speedboat Welcome to Resort', 'description': 'Speedboat transfer to island resort & overwater bungalow check-in.'},
          {'day': 2, 'title': 'Snorkeling & House Reef Exploration', 'description': 'Guided snorkeling session among coral reefs & sea turtles.'},
          {'day': 3, 'title': 'Sunset Dolphin Cruise', 'description': 'Romantic boat cruise with champagne & dolphin sightings.'},
          {'day': 4, 'title': 'Island Spa & Leisure', 'description': 'Relaxing couples massage and beachside dinner.'},
          {'day': 5, 'title': 'Departure', 'description': 'Breakfast & Speedboat transfer back to Male airport.'},
        ],
        inclusions: ['Overwater Villa Stay', 'All-Inclusive Meals & Premium Drinks', 'Speedboat Airport Transfers', 'Snorkeling Equipment'],
        exclusions: ['International Flights'],
        pricingTiers: [
          PricingTierModel(category: 'Standard', price: 59000, hotel: 'Beach Villa with Lagoon View', meal: 'Full Board (All Meals)', transport: 'Shared Speedboat'),
          PricingTierModel(category: 'Deluxe', price: 72000, hotel: 'Private Overwater Bungalow', meal: 'All-Inclusive Drinks & Dining', transport: 'Speedboat Transfer'),
          PricingTierModel(category: 'Luxury', price: 98000, hotel: 'Sunset Ocean Pool Villa', meal: 'Ultra All-Inclusive Dine Around', transport: 'Seaplane Flight Transfer'),
        ],
        isFeatured: true,
        rating: 4.99,
      ),
      PackageModel(
        id: '4',
        packageCode: 'PKG-RAJ-001',
        title: 'Royal Rajasthan Jaipur & Udaipur Palace Tour',
        slug: 'royal-rajasthan-palace-tour-6-days',
        destination: 'Rajasthan, India',
        duration: '6 Days / 5 Nights',
        price: 26500,
        originalPrice: 31000,
        category: 'Domestic',
        images: [
          'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
        ],
        overview: 'Amer Fort elephant rides, Hawa Mahal photoshoot, Lake Pichola boat ride in Udaipur.',
        highlights: ['Jaipur Forts & Palaces', 'Udaipur Lake Pichola Boat Cruise', 'Heritage Hotel Stay'],
        itinerary: [
          {'day': 1, 'title': 'Arrival in Pink City Jaipur', 'description': 'Check-in to heritage hotel and evening visit to Chokhi Dhani village.'},
          {'day': 2, 'title': 'Jaipur Forts & Palaces', 'description': 'Explore Amer Fort, Jal Mahal, City Palace, and Hawa Mahal.'},
          {'day': 3, 'title': 'Drive to Udaipur', 'description': 'Scenic highway drive via Chittorgarh Fort.'},
          {'day': 4, 'title': 'Udaipur City of Lakes', 'description': 'Jagdish Temple, City Palace Udaipur, and Lake Pichola boat cruise.'},
          {'day': 5, 'title': 'Saheliyon Ki Bari & Crafts', 'description': 'Visit Saheliyon ki Bari gardens and local handicrafts market.'},
          {'day': 6, 'title': 'Departure', 'description': 'Breakfast & airport/railway station drop.'},
        ],
        inclusions: ['Heritage Hotel Stay', 'Breakfast & Dinner', 'Private AC Car Transfers'],
        exclusions: ['Monument Entrance Tickets'],
        pricingTiers: [
          PricingTierModel(category: 'Standard', price: 26500, hotel: '3 Star Heritage Haveli', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan'),
          PricingTierModel(category: 'Deluxe', price: 34000, hotel: '4 Star Palace Resort', meal: 'Breakfast & Royal Dinner', transport: 'Private AC SUV'),
          PricingTierModel(category: 'Luxury', price: 54000, hotel: '5 Star Taj Lake Palace / Leela', meal: 'All Meals Included', transport: 'Luxury SUV'),
        ],
        isFeatured: true,
        rating: 4.96,
      ),
      PackageModel(
        id: '5',
        packageCode: 'PKG-SIN-001',
        title: 'Singapore City & Sentosa Universal Studios Extravaganza',
        slug: 'singapore-sentosa-universal-studios-5-days',
        destination: 'Singapore',
        duration: '5 Days / 4 Nights',
        price: 48500,
        originalPrice: 55000,
        category: 'International',
        images: [
          'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
        ],
        overview: 'Gardens by the Bay light show, Sentosa cable car, Universal Studios full day pass, and Marina Bay Sands observation deck.',
        highlights: ['Full Day Universal Studios Pass', 'Gardens by the Bay Supertree Light Show', 'Sentosa Cable Car & Wings of Time'],
        itinerary: [
          {'day': 1, 'title': 'Arrival in Singapore & Night Safari', 'description': 'Airport transfer, hotel check-in, and world-famous Night Safari.'},
          {'day': 2, 'title': 'City Tour & Gardens by the Bay', 'description': 'Merlion Park, Chinatown, Cloud Forest, and Supertree light show.'},
          {'day': 3, 'title': 'Full Day Universal Studios', 'description': 'Thrill rides, Transformers 3D, and Jurassic Park adventure.'},
          {'day': 4, 'title': 'Sentosa Island Exploration', 'description': 'Cable car ride, S.E.A. Aquarium, and Wings of Time laser show.'},
          {'day': 5, 'title': 'Departure', 'description': 'Jewel Changi airport tour & flight drop.'},
        ],
        inclusions: ['4-Star City Hotel Stay', 'Daily Buffet Breakfast', 'Universal Studios Express Pass', 'Private Airport Transfers'],
        exclusions: ['Visa Fees', 'Flight Airfare'],
        pricingTiers: [
          PricingTierModel(category: 'Standard', price: 48500, hotel: '3 Star City Hotel', meal: 'Daily Breakfast', transport: 'Shared Tourist Coach'),
          PricingTierModel(category: 'Deluxe', price: 58000, hotel: '4 Star Orchard Road Hotel', meal: 'Daily Breakfast & Lunch', transport: 'Private Sedan'),
          PricingTierModel(category: 'Luxury', price: 85000, hotel: '5 Star Marina Bay Sands', meal: 'All Inclusive Dining', transport: 'Private Executive Van'),
        ],
        isFeatured: true,
        rating: 4.91,
      ),
    ];
  }
}
