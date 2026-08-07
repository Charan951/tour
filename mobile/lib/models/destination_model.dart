class DestinationModel {
  final String id;
  final String name;
  final String slug;
  final String state;
  final String country;
  final String image;
  final String description;
  final List<String> bestTimeToVisit;
  final bool isPopular;

  DestinationModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.state,
    required this.country,
    required this.image,
    required this.description,
    required this.bestTimeToVisit,
    this.isPopular = false,
  });

  factory DestinationModel.fromJson(Map<String, dynamic> json) {
    // Safely parse state name from populated state Map or string
    String resolvedState = '';
    if (json['state'] is Map) {
      resolvedState = json['state']['name']?.toString() ?? '';
    } else if (json['state'] != null) {
      resolvedState = json['state'].toString();
    }

    // Safely parse country name from populated country Map or string
    String resolvedCountry = 'India';
    if (json['country'] is Map) {
      resolvedCountry = json['country']['name']?.toString() ?? 'India';
    } else if (json['country'] != null) {
      resolvedCountry = json['country'].toString();
    }

    // Map bestTime from string to list of strings
    List<String> resolvedBestTime = ['October - March'];
    if (json['bestTime'] != null && json['bestTime'].toString().trim().isNotEmpty) {
      resolvedBestTime = [json['bestTime'].toString().trim()];
    } else if (json['bestTimeToVisit'] is List) {
      resolvedBestTime = (json['bestTimeToVisit'] as List).map((e) => e.toString()).toList();
    }

    return DestinationModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      state: resolvedState,
      country: resolvedCountry,
      image: json['banner'] ??
          json['image'] ??
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      description: json['shortDescription'] ?? json['description'] ?? '',
      bestTimeToVisit: resolvedBestTime,
      isPopular: json['featured'] ?? json['isPopular'] ?? false,
    );
  }
}
