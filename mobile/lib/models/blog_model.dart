class BlogModel {
  final String id;
  final String title;
  final String slug;
  final String content;
  final String author;
  final String coverImage;
  final DateTime createdAt;

  BlogModel({
    required this.id,
    required this.title,
    required this.slug,
    required this.content,
    required this.author,
    required this.coverImage,
    required this.createdAt,
  });

  factory BlogModel.fromJson(Map<String, dynamic> json) {
    return BlogModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      content: json['content'] ?? '',
      author: json['author'] ?? 'HolidayCity Travel Team',
      coverImage: json['banner'] ??
          json['coverImage'] ??
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
