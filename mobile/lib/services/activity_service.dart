import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/activity_model.dart';

class ActivityService {
  static final List<ActivityModel> _fallbackActivities = [
    // Adventure (2)
    ActivityModel.fromJson({
      '_id': 'act1',
      'activityCode': 'ACT-HC-101',
      'title': 'Bungee Jumping & Flying Fox Extreme',
      'slug': 'bungee-jumping-rishikesh',
      'destinationName': 'Rishikesh, Uttarakhand',
      'category': 'Adventure',
      'duration': '3 Hours',
      'startingPrice': 3500,
      'discountPrice': 4200,
      'coverImage': 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.95,
      'overview': 'Experience India’s highest 83-meter fixed platform Bungee Jump over the stunning Mohan Chatti valley in Rishikesh with certified safety experts.',
      'highlights': ['83m Fixed Cantilever Platform', 'Safety Gear & Jump Certificate', 'HD Video Footage Included'],
      'inclusions': ['Jump Entry Pass', 'Safety Harness', 'Briefing Session'],
      'exclusions': ['Transport to Jump Zone'],
      'location': 'Mohan Chatti, Rishikesh',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act11',
      'activityCode': 'ACT-HC-111',
      'title': 'Zipline Canopy & Aerial Obstacle Adventure',
      'slug': 'flying-fox-zipline-tour',
      'destinationName': 'Neemrana / Rishikesh',
      'category': 'Adventure',
      'duration': '2 Hours',
      'startingPrice': 1800,
      'discountPrice': 2300,
      'coverImage': 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.88,
      'overview': 'Fly across 5 zip wire lines suspended 200 feet over ancient fort walls and deep river gorges.',
      'highlights': ['5 Zip Wire Circuit Lines', 'Dual Safety Line System', 'Certified Safety Instructors'],
      'inclusions': ['Full Safety Harness', 'Helmet & Gloves', 'Guide Instructor'],
      'exclusions': ['Locker Rental'],
      'location': 'Neemrana Fort Hills',
      'featured': true,
    }),

    // Water Sports (2)
    ActivityModel.fromJson({
      '_id': 'act2',
      'activityCode': 'ACT-HC-102',
      'title': 'Ganges River Rafting 16KM & Cliff Jump',
      'slug': 'river-rafting-rishikesh',
      'destinationName': 'Rishikesh, Uttarakhand',
      'category': 'Water Sports',
      'duration': 'Half Day (4 Hours)',
      'startingPrice': 1200,
      'discountPrice': 1600,
      'coverImage': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.88,
      'overview': 'Conquer Grade III & IV Ganges rapids from Shivpuri to Rishikesh with experienced river guides and optional cliff jumping.',
      'highlights': ['16 KM White Water Rafting', 'Grade III+ Rapids', 'Cliff Jumping & Body Surfing'],
      'inclusions': ['Rafting Equipment', 'Life Jacket & Helmet'],
      'exclusions': ['Personal Transport'],
      'location': 'Shivpuri to Laxman Jhula, Rishikesh',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act3',
      'activityCode': 'ACT-HC-103',
      'title': 'Scuba Diving & Grand Island Boat Cruise',
      'slug': 'scuba-diving-goa',
      'destinationName': 'Goa',
      'category': 'Water Sports',
      'duration': 'Full Day (6 Hours)',
      'startingPrice': 2499,
      'discountPrice': 3500,
      'coverImage': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.90,
      'overview': 'Explore underwater coral reefs and marine life off Grand Island in Goa with PADI certified instructors, lunch, and underwater photos.',
      'highlights': ['Underwater Photo & Video Drive', '20-Min Guided Scuba Dive', 'Grand Island Boat Safari'],
      'inclusions': ['Scuba Gear & Breathing Tank', 'Instructor Guide', 'Buffet Lunch'],
      'exclusions': ['Hotel Pick-up outside Baga'],
      'location': 'Grand Island, North Goa',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act3_2',
      'activityCode': 'ACT-HC-103B',
      'title': 'Baga Beach Parasailing & Water Sports Combo',
      'slug': 'baga-beach-water-sports-goa',
      'destinationName': 'Goa',
      'category': 'Water Sports',
      'duration': '3 Hours',
      'startingPrice': 1999,
      'discountPrice': 2700,
      'coverImage': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.88,
      'overview': 'Thrill combo of Parasailing over Baga beach, Jet Ski ride, Banana Boat ride and Bumper ride with safety gear.',
      'highlights': ['High Sky Parasailing with Dip', 'Speed Jet Ski Ride', 'Banana Ride & Bumper Tube', 'Safety Life Jackets'],
      'inclusions': ['All 5 Water Sports Rides', 'Life Jacket & Safety Crew', 'Photo & Video Option'],
      'exclusions': ['Beach Locker Rental'],
      'location': 'Baga Beach, North Goa',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act3_3',
      'activityCode': 'ACT-HC-103C',
      'title': 'Mandovi River Sunset Cruise & Live DJ Dinner Party',
      'slug': 'mandovi-river-sunset-cruise-goa',
      'destinationName': 'Goa',
      'category': 'Sightseeing',
      'duration': '2 Hours',
      'startingPrice': 999,
      'discountPrice': 1400,
      'coverImage': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.92,
      'overview': 'Enjoy a 2-hour luxury double-decker boat cruise along Mandovi River with traditional Goan folk dance, live DJ music, and drinks.',
      'highlights': ['2-Hour Mandovi River Cruise', 'Goan Fugdi & Dekhnni Folk Dance', 'Live DJ Dance Floor', 'Panaji Skyline Sunset Views'],
      'inclusions': ['Cruise Entry Pass', 'Welcome Drink & Snacks', 'Live Folk Performances'],
      'exclusions': ['Hard Drinks / Spirits'],
      'location': 'Panaji Jetty, Mandovi River, Goa',
      'featured': true,
    }),

    // Air Sports (2)
    ActivityModel.fromJson({
      '_id': 'act5',
      'activityCode': 'ACT-HC-105',
      'title': 'Solang Valley Paragliding Tandem Flight',
      'slug': 'paragliding-manali',
      'destinationName': 'Manali, Himachal Pradesh',
      'category': 'Air Sports',
      'duration': '1 Hour (15-min flight)',
      'startingPrice': 2800,
      'discountPrice': 3500,
      'coverImage': 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.89,
      'overview': 'Soar like a bird high above Solang Valley and snow-capped Himalayan peaks with a licensed tandem pilot.',
      'highlights': ['Tandem Flight with Master Pilot', 'High-altitude Takeoff', 'Panoramic Himalayan Views'],
      'inclusions': ['Flight Equipment & Helmet', 'Tandem Pilot'],
      'exclusions': ['GoPro Video Footage'],
      'location': 'Solang Valley, Manali',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act6',
      'activityCode': 'ACT-HC-106',
      'title': 'Jaipur Forts Sunrise Hot Air Balloon Ride',
      'slug': 'hot-air-balloon-jaipur',
      'destinationName': 'Jaipur, Rajasthan',
      'category': 'Air Sports',
      'duration': '3 Hours (1-hour flight)',
      'startingPrice': 8900,
      'discountPrice': 11000,
      'coverImage': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.94,
      'overview': 'Float peacefully over Amer Fort, royal palaces, and Rajasthan countryside during a sunrise hot air balloon flight.',
      'highlights': ['1-Hour Flight at Sunrise', 'Overfly Amer Fort & Palaces', 'Signed Flight Certificate'],
      'inclusions': ['1-Hour Balloon Flight', 'Hotel Pick-up & Drop', 'Flight Certificate'],
      'exclusions': ['Personal Souvenirs'],
      'location': 'Amer Fort Flight Zone, Jaipur',
      'featured': true,
    }),

    // Safari (2)
    ActivityModel.fromJson({
      '_id': 'act4',
      'activityCode': 'ACT-HC-104',
      'title': 'Dubai Red Dune Desert Safari & BBQ Dinner',
      'slug': 'desert-safari-dubai',
      'destinationName': 'Dubai, UAE',
      'category': 'Safari',
      'duration': '6 Hours (Evening)',
      'startingPrice': 3800,
      'discountPrice': 4800,
      'coverImage': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.97,
      'overview': 'Adrenaline 4x4 dune bashing in Lahbab desert followed by camel riding, sandboarding, belly dance, and lavish desert camp BBQ dinner.',
      'highlights': ['4x4 Land Cruiser Dune Bashing', 'Sunset Sandboarding & Camel Ride', '5-Star Buffet BBQ Dinner'],
      'inclusions': ['Hotel Pick up & Drop in 4x4', 'Dune Bashing', 'Buffet BBQ Dinner'],
      'exclusions': ['Quad Bike ATV'],
      'location': 'Lahbab Red Dunes, Dubai',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act9',
      'activityCode': 'ACT-HC-109',
      'title': 'Jim Corbett National Park Tiger Jeep Safari',
      'slug': 'jim-corbett-jeep-safari',
      'destinationName': 'Jim Corbett, Uttarakhand',
      'category': 'Safari',
      'duration': '3.5 Hours',
      'startingPrice': 4500,
      'discountPrice': 5200,
      'coverImage': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.87,
      'overview': 'Exclusive 4x4 open Gypsy jungle safari through Bijrani/Dhikala zone in search of Royal Bengal Tigers and wild elephants.',
      'highlights': ['Private 4x4 Open Maruti Gypsy', 'Official Forest Naturalist Guide', 'Tiger & Wildlife Tracking'],
      'inclusions': ['Gypsy Rental & Fuel', 'Forest Permit & Naturalist', 'Resort Pick-up'],
      'exclusions': ['Camera Permit Fees'],
      'location': 'Bijrani / Jhirna Zone, Corbett',
      'featured': true,
    }),

    // Trekking (2)
    ActivityModel.fromJson({
      '_id': 'act13',
      'activityCode': 'ACT-HC-113',
      'title': 'Triund Peak Day Trek & Cloud Line View',
      'slug': 'triund-day-trek-dharamshala',
      'destinationName': 'McLeod Ganj, Dharamshala',
      'category': 'Trekking',
      'duration': '1 Day (7 Hours)',
      'startingPrice': 1500,
      'discountPrice': 2000,
      'coverImage': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.92,
      'overview': 'Popular Himalayan day trek through oak and rhododendron forests leading to scenic views of the snow-covered Dhauladhar range.',
      'highlights': ['Oak & Rhododendron Forest Trail', 'Triund Ridge Sunset & Cloud Line', 'Dhauladhar Snow Peaks View'],
      'inclusions': ['Certified Trek Guide', 'Packed Lunch Box', 'First Aid Kit'],
      'exclusions': ['Overnight Tent Stay'],
      'location': 'Gallu Devi Temple to Triund Top',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act14',
      'activityCode': 'ACT-HC-114',
      'title': 'Kedarkantha Winter Snow Summit Trek',
      'slug': 'kedarkantha-snow-summit-trek',
      'destinationName': 'Sankri, Uttarakhand',
      'category': 'Trekking',
      'duration': '4 Days / 3 Nights',
      'startingPrice': 5900,
      'discountPrice': 7200,
      'coverImage': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.96,
      'overview': 'Climb 12,500 feet Kedarkantha Peak with 360-degree views of Swargarohini, Bandarpoonch, and Black Peak Himalayan ranges.',
      'highlights': ['12,500 Feet Summit Push', 'Juda Ka Talab Frozen Lake Campsite', 'Stargazing Snow Tents'],
      'inclusions': ['All Meals & Tea', 'High Altitude Tents & Sleeping Bags', 'Experienced Trek Leaders'],
      'exclusions': ['Offloading Personal Backpack'],
      'location': 'Sankri Base Camp, Garhwal',
      'featured': true,
    }),

    // Sightseeing (2)
    ActivityModel.fromJson({
      '_id': 'act16',
      'activityCode': 'ACT-HC-116',
      'title': 'Burj Khalifa 124th Floor & Dubai Fountain Pass',
      'slug': 'burj-khalifa-observation-deck',
      'destinationName': 'Dubai, UAE',
      'category': 'Sightseeing',
      'duration': '2 Hours',
      'startingPrice': 3950,
      'discountPrice': 4600,
      'coverImage': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.95,
      'overview': 'Ride the world’s fastest double-deck elevator to Level 124 & 125 of Burj Khalifa for 360-degree views over Dubai skyline.',
      'highlights': ['World’s Tallest Building Access', 'Level 124 & 125 Observation Decks', 'High-powered Telescope View'],
      'inclusions': ['Skip-the-line E-Ticket', 'Level 124 & 125 Entry'],
      'exclusions': ['Level 148 Sky VIP Lounge'],
      'location': 'Downtown Dubai',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act17',
      'activityCode': 'ACT-HC-117',
      'title': 'Marina Bay Sands SkyPark & Gardens by the Bay',
      'slug': 'marina-bay-sands-skypark-singapore',
      'destinationName': 'Singapore',
      'category': 'Sightseeing',
      'duration': '3 Hours',
      'startingPrice': 2400,
      'discountPrice': 2900,
      'coverImage': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.91,
      'overview': 'Visit the 57th-floor Sands SkyPark Deck overlooking Marina Bay plus access to Flower Dome & Cloud Forest Supertrees.',
      'highlights': ['57th Floor Observation Deck', 'Gardens by the Bay Flower Dome', 'Cloud Forest Indoor Waterfall'],
      'inclusions': ['SkyPark Ticket', 'Double Conservatory Ticket'],
      'exclusions:': ['OCBC Skyway Aerial Walk Ticket'],
      'location': 'Marina Bay Sands, Singapore',
      'featured': true,
    }),

    // Theme Park (2)
    ActivityModel.fromJson({
      '_id': 'act12',
      'activityCode': 'ACT-HC-112',
      'title': 'Water Kingdom & Aqua Slide Super Pass',
      'slug': 'water-kingdom-aqua-pass',
      'destinationName': 'Mumbai / Pattaya',
      'category': 'Theme Park',
      'duration': 'Full Day Pass',
      'startingPrice': 1450,
      'discountPrice': 1850,
      'coverImage': 'https://images.unsplash.com/photo-1582650625119-3a31f8418b0d?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.84,
      'overview': 'Asia’s largest water theme park featuring high-speed wave pools, vertical drop water slides, and lazy river rides.',
      'highlights': ['Unlimited Access to All Slides', 'Giant Wave Pool & DJ Zone', 'Kids Splash Lagoon'],
      'inclusions': ['Full Day Park Entry', 'Locker & Shower Access'],
      'exclusions': ['Costumes & Swimwear Rental'],
      'location': 'Gorai Water Kingdom, Mumbai',
      'featured': true,
    }),
    ActivityModel.fromJson({
      '_id': 'act20',
      'activityCode': 'ACT-HC-120',
      'title': 'Universal Studios Singapore One-Day Express Pass',
      'slug': 'universal-studios-singapore-pass',
      'destinationName': 'Singapore',
      'category': 'Theme Park',
      'duration': 'Full Day Pass',
      'startingPrice': 5800,
      'discountPrice': 6500,
      'coverImage': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      'rating': 4.96,
      'overview': 'Experience cutting-edge rides, shows, and attractions based on blockbuster movies at Universal Studios Sentosa Island.',
      'highlights': ['Transformers 3D Thrill Ride', 'Battlestar Galactica Roller Coaster', 'Mummy Revenge Indoor Ride'],
      'inclusions': ['One-Day Park E-Ticket', 'Sentosa Island Entry'],
      'exclusions': ['VIP Express Queue Pass'],
      'location': 'Resorts World Sentosa, Singapore',
      'featured': true,
    })
  ];

  Future<List<ActivityModel>> fetchActivities({String? category, String? destination, String? search}) async {
    List<ActivityModel> result = [];
    try {
      final Map<String, String> queryParams = {'limit': '100'};
      if (destination != null && destination.isNotEmpty) {
        queryParams['destination'] = destination;
      }
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final uri = Uri.parse(ApiConfig.activities).replace(queryParameters: queryParams);

      final response = await http.get(uri).timeout(const Duration(seconds: 6));
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        if (body['data'] is List) {
          final List list = body['data'];
          final apiList = list.map((item) => ActivityModel.fromJson(item)).toList();
          result = _mergeWithFallback(apiList);
        } else {
          result = _fallbackActivities;
        }
      } else {
        result = _fallbackActivities;
      }
    } catch (e) {
      result = _fallbackActivities;
    }
    return _filterList(result, category: category, destination: destination, search: search);
  }

  List<ActivityModel> _mergeWithFallback(List<ActivityModel> apiList) {
    final map = <String, ActivityModel>{};
    for (var act in apiList) {
      map[act.id.isNotEmpty ? act.id : act.activityCode] = act;
    }
    for (var fb in _fallbackActivities) {
      if (!map.containsKey(fb.id) && !map.containsKey(fb.activityCode)) {
        map[fb.id] = fb;
      }
    }
    return map.values.toList();
  }

  List<ActivityModel> _filterList(List<ActivityModel> list, {String? category, String? destination, String? search}) {
    return list.where((a) {
      if (category != null && category.trim().isNotEmpty && category != 'All') {
        final actCat = a.category.trim().toLowerCase();
        final selCat = category.trim().toLowerCase();
        if (actCat != selCat && !actCat.contains(selCat) && !selCat.contains(actCat)) {
          return false;
        }
      }
      if (destination != null && destination.trim().isNotEmpty) {
        final cleanDest = destination.split(',')[0].trim().toLowerCase().replaceAll('beaches', '').trim();
        final tokens = cleanDest.split(RegExp(r'[\s&]+')).where((t) => t.length >= 3).toList();

        final destMatch = a.destinationId == destination ||
            a.destinationName.toLowerCase().contains(cleanDest) ||
            cleanDest.contains(a.destinationName.toLowerCase()) ||
            a.location.toLowerCase().contains(cleanDest) ||
            a.title.toLowerCase().contains(cleanDest) ||
            (tokens.isNotEmpty && tokens.any((tok) =>
                a.destinationName.toLowerCase().contains(tok) ||
                a.location.toLowerCase().contains(tok) ||
                a.title.toLowerCase().contains(tok)));

        if (!destMatch) return false;
      }
      if (search != null && search.trim().isNotEmpty) {
        final q = search.trim().toLowerCase();
        final matches = a.title.toLowerCase().contains(q) ||
            a.location.toLowerCase().contains(q) ||
            a.destinationName.toLowerCase().contains(q) ||
            a.overview.toLowerCase().contains(q);
        if (!matches) return false;
      }
      return true;
    }).toList();
  }
}
