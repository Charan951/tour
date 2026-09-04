class ActivityModel {
  final String id;
  final String activityCode;
  final String title;
  final String slug;
  final String destinationId;
  final String destinationName;
  final String category;
  final String duration;
  final double price;
  final double discountPrice;
  final String coverImage;
  final List<String> gallery;
  final double rating;
  final String overview;
  final List<String> highlights;
  final List<String> inclusions;
  final List<String> exclusions;
  final String location;
  final bool isFeatured;

  ActivityModel({
    required this.id,
    required this.activityCode,
    required this.title,
    required this.slug,
    required this.destinationId,
    required this.destinationName,
    required this.category,
    required this.duration,
    required this.price,
    required this.discountPrice,
    required this.coverImage,
    required this.gallery,
    required this.rating,
    required this.overview,
    required this.highlights,
    required this.inclusions,
    required this.exclusions,
    required this.location,
    required this.isFeatured,
  });

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    String idVal = json['_id'] ?? json['id'] ?? '';
    String titleVal = json['title'] ?? '';
    String codeVal = json['activityCode'] ?? 'ACT-HC';
    String slugVal = json['slug'] ?? '';
    String destId = '';
    String destName = json['destinationName'] ?? '';
    if (json['destination'] != null) {
      if (json['destination'] is Map) {
        destId = json['destination']['_id'] ?? json['destination']['id'] ?? '';
        if (destName.isEmpty) {
          destName = json['destination']['name'] ?? '';
        }
      } else {
        destId = json['destination'].toString();
      }
    }

    double priceVal = 0.0;
    if (json['startingPrice'] != null) {
      priceVal = (json['startingPrice'] as num).toDouble();
    } else if (json['price'] != null) {
      priceVal = (json['price'] as num).toDouble();
    }

    double discountVal = 0.0;
    if (json['discountPrice'] != null) {
      discountVal = (json['discountPrice'] as num).toDouble();
    }

    double ratingVal = 4.8;
    if (json['rating'] != null) {
      ratingVal = (json['rating'] as num).toDouble();
    }

    List<String> parseList(dynamic val) {
      if (val is List) return val.map((e) => e.toString()).toList();
      if (val is String && val.isNotEmpty) {
        return val.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
      return [];
    }

    return ActivityModel(
      id: idVal,
      activityCode: codeVal,
      title: titleVal,
      slug: slugVal,
      destinationId: destId,
      destinationName: destName,
      category: json['category'] ?? 'Adventure',
      duration: json['duration'] ?? '2 Hours',
      price: priceVal > 0 ? priceVal : 1500.0,
      discountPrice: discountVal,
      coverImage: json['coverImage'] ?? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
      gallery: parseList(json['gallery']),
      rating: ratingVal,
      overview: json['overview'] ?? '',
      highlights: parseList(json['highlights']),
      inclusions: parseList(json['inclusions']),
      exclusions: parseList(json['exclusions']),
      location: json['location'] ?? destName,
      isFeatured: json['featured'] == true || json['isFeatured'] == true,
    );
  }
}
