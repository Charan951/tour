class PricingTierModel {
  final String category;
  final double price;
  final double discount;
  final String hotel;
  final String meal;
  final String transport;
  final bool availability;

  PricingTierModel({
    required this.category,
    required this.price,
    this.discount = 0.0,
    this.hotel = '',
    this.meal = 'Breakfast Included',
    this.transport = 'Private Transfer',
    this.availability = true,
  });

  factory PricingTierModel.fromJson(Map<String, dynamic> json) {
    return PricingTierModel(
      category: json['category']?.toString() ?? 'Standard',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      hotel: json['hotel']?.toString() ?? '',
      meal: json['meal']?.toString() ?? 'Breakfast Included',
      transport: json['transport']?.toString() ?? 'Private Transfer',
      availability: json['availability'] as bool? ?? true,
    );
  }
}

class PackageModel {
  final String id;
  final String packageCode;
  final String title;
  final String slug;
  final String destination;
  final String duration;
  final double price;
  final double? originalPrice;
  final String category;
  final List<String> images;
  final String overview;
  final List<String> highlights;
  final List<Map<String, dynamic>> itinerary;
  final List<String> inclusions;
  final List<String> exclusions;
  final List<PricingTierModel> pricingTiers;
  final bool isFeatured;
  final double rating;

  PackageModel({
    required this.id,
    this.packageCode = '',
    required this.title,
    required this.slug,
    required this.destination,
    required this.duration,
    required this.price,
    this.originalPrice,
    required this.category,
    required this.images,
    required this.overview,
    required this.highlights,
    required this.itinerary,
    required this.inclusions,
    required this.exclusions,
    this.pricingTiers = const [],
    this.isFeatured = false,
    this.rating = 4.8,
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    // Determine the duration string from the raw nights/days Map if present
    String resolvedDuration = '3 Days / 2 Nights';
    if (json['duration'] is Map) {
      final days = json['duration']['days'];
      final nights = json['duration']['nights'];
      if (days != null && nights != null) {
        resolvedDuration = '$days Days / $nights Nights';
      }
    } else if (json['duration'] != null) {
      resolvedDuration = json['duration'].toString();
    }

    // Determine the main category name from populated list/array if present
    String resolvedCategory = 'General';
    if (json['category'] is List && (json['category'] as List).isNotEmpty) {
      final firstCat = json['category'][0];
      if (firstCat is Map) {
        resolvedCategory = firstCat['name']?.toString() ?? 'General';
      } else {
        resolvedCategory = firstCat.toString();
      }
    } else if (json['category'] is String) {
      resolvedCategory = json['category'];
    }

    // Merge coverImage and gallery/images
    final List<String> resolvedImages = [];
    if (json['coverImage'] != null) {
      resolvedImages.add(json['coverImage'].toString());
    }
    if (json['gallery'] is List) {
      resolvedImages.addAll((json['gallery'] as List).map((e) => e.toString()));
    }
    if (json['images'] is List) {
      resolvedImages.addAll((json['images'] as List).map((e) => e.toString()));
    }

    final double basePrice = (json['startingPrice'] ?? json['price'] ?? 0.0) is num
        ? (json['startingPrice'] ?? json['price'] ?? 0.0).toDouble()
        : 0.0;

    // Parse pricing tiers or construct defaults matching frontend tiers
    List<PricingTierModel> tiers = [];
    if (json['pricingTiers'] is List && (json['pricingTiers'] as List).isNotEmpty) {
      tiers = (json['pricingTiers'] as List)
          .map((e) => PricingTierModel.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } else {
      tiers = [
        PricingTierModel(
          category: 'Standard',
          price: basePrice > 0 ? basePrice : 14999,
          hotel: '3 Star Deluxe Hotel',
          meal: 'Daily Breakfast',
          transport: 'AC Car Transfers',
        ),
        PricingTierModel(
          category: 'Deluxe',
          price: basePrice > 0 ? basePrice * 1.25 : 18999,
          hotel: '4 Star Luxury Resort',
          meal: 'Breakfast & Dinner',
          transport: 'Private Sedan Cab',
        ),
        PricingTierModel(
          category: 'Luxury',
          price: basePrice > 0 ? basePrice * 1.6 : 24999,
          hotel: '5 Star Heritage Villa / Pool Villa',
          meal: 'All Meals Included',
          transport: 'Premium Private SUV',
        ),
      ];
    }

    return PackageModel(
      id: json['_id'] ?? json['id'] ?? '',
      packageCode: json['packageCode']?.toString() ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      destination: json['destination'] is Map
          ? json['destination']['name'] ?? ''
          : (json['destination'] ?? ''),
      duration: resolvedDuration,
      price: basePrice,
      originalPrice: (json['discountPrice'] ?? json['originalPrice']) is num
          ? (json['discountPrice'] ?? json['originalPrice']).toDouble()
          : null,
      category: resolvedCategory,
      images: resolvedImages,
      overview: json['overview'] ?? '',
      highlights: (json['highlights'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      itinerary: (json['itinerary'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      inclusions: (json['inclusions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      exclusions: (json['exclusions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      pricingTiers: tiers,
      isFeatured: json['featured'] ?? json['isFeatured'] ?? false,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
    );
  }

  String get mainImage => images.isNotEmpty
      ? images.first
      : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';
}
