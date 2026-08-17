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
  final String? destinationSlug;
  final String? destinationId;

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
    this.destinationSlug,
    this.destinationId,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    final destinationObj = json['destination'];
    String? destName;
    String? destSlug;
    String? destId;

    if (destinationObj is Map) {
      destName = destinationObj['name']?.toString();
      destSlug = destinationObj['slug']?.toString();
      destId = (destinationObj['_id'] ?? destinationObj['id'])?.toString();
    } else if (destinationObj != null) {
      destId = destinationObj.toString();
      destName = destinationObj.toString();
    }

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
      destinationName: destName != null && destName.isNotEmpty ? destName : null,
      destinationSlug: destSlug != null && destSlug.isNotEmpty ? destSlug : null,
      destinationId: destId != null && destId.isNotEmpty ? destId : null,
    );
  }
}
