class ThemeModel {
  final String id;
  final String name;
  final String? rating;
  final String imageUrl;

  ThemeModel({
    required this.id,
    required this.name,
    this.rating,
    required this.imageUrl,
  });

  factory ThemeModel.fromJson(Map<String, dynamic> json) {
    return ThemeModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? json['title'] ?? 'Theme',
      rating: json['rating'] ?? json['tag'],
      imageUrl: json['imageUrl'] ?? json['bannerUrl'] ?? json['image'] ?? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
    );
  }
}
