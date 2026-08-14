class BannerModel {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? linkUrl;
  final String targetSection;
  final String? offerText;
  final String? priceText;
  final String? durationText;
  final String? destinationName;

  BannerModel({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.linkUrl,
    this.targetSection = 'HeroBanner',
    this.offerText,
    this.priceText,
    this.durationText,
    this.destinationName,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    final destinationObj = json['destination'];
    final destinationName = destinationObj is Map
        ? (destinationObj['name'] ?? '').toString()
        : (destinationObj ?? '').toString();

    return BannerModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Special Offer',
      subtitle: json['subtitle'] ?? json['description'] ?? json['offerText'],
      imageUrl: json['imageUrl'] ??
          json['image'] ??
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      linkUrl: json['linkUrl'] ?? json['link'],
      targetSection: json['targetSection'] ?? 'HeroBanner',
      offerText: json['offerText']?.toString() ?? 'Limited Offer',
      priceText: json['priceText']?.toString() ?? '₹8,500 Per Person',
      durationText: json['durationText']?.toString() ?? '03 Night / 04 Days',
      destinationName: destinationName.isNotEmpty ? destinationName : null,
    );
  }
}
