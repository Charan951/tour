class ThemeModel {
  final String id;
  final String name;
  final String? rating;
  final String imageUrl;
  final String description;

  ThemeModel({
    required this.id,
    required this.name,
    this.rating,
    required this.imageUrl,
    this.description = '',
  });

  factory ThemeModel.fromJson(Map<String, dynamic> json) {
    final rawName = json['themeName'] ??
        json['name'] ??
        json['title'] ??
        json['theme'] ??
        json['label'] ??
        'Theme';

    final rawRating = json['rating'] ??
        json['tag'] ??
        json['ratingLabel'] ??
        json['badge'] ??
        'Top pick';

    return ThemeModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: rawName.toString(),
      rating: rawRating.toString(),
      imageUrl: json['imageUrl'] ??
          json['bannerUrl'] ??
          json['image'] ??
          json['coverImage'] ??
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
      description: json['description']?.toString() ?? '',
    );
  }
}
