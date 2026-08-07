class BannerModel {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? linkUrl;
  final String targetSection;

  BannerModel({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.linkUrl,
    this.targetSection = 'HeroBanner',
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Special Offer',
      subtitle: json['subtitle'] ?? json['description'],
      imageUrl: json['imageUrl'] ?? json['image'] ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      linkUrl: json['linkUrl'] ?? json['link'],
      targetSection: json['targetSection'] ?? 'HeroBanner',
    );
  }
}
