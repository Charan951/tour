import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/api_config.dart';

/// High-performance network image widget.
/// On Web targets (`kIsWeb`), uses browser native HTML <img> via [Image.network]
/// for instant loading, native browser caching, and zero CORS cache manager issues.
/// On Native targets (Android/iOS), uses [CachedNetworkImage] for disk caching.
class AppNetworkImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final int targetWidth;
  final String? fallbackUrl;

  const AppNetworkImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.targetWidth = 500,
    this.fallbackUrl,
  });

  static const String defaultFallback =
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=70&auto=format&fit=crop';

  @override
  Widget build(BuildContext context) {
    final formattedUrl = ApiConfig.formatImageUrl(
      imageUrl,
      width: targetWidth,
    );
    final fallback = ApiConfig.formatImageUrl(
      fallbackUrl ?? defaultFallback,
      width: targetWidth,
    );

    if (kIsWeb) {
      return Image.network(
        formattedUrl,
        width: width,
        height: height,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: width,
            height: height,
            color: const Color(0xFFE2E8F0),
            child: const Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return Image.network(
            fallback,
            width: width,
            height: height,
            fit: fit,
            errorBuilder: (ctx, err, st) => Container(
              width: width,
              height: height,
              color: const Color(0xFFCBD5E1),
              child: const Icon(
                Icons.image_not_supported_outlined,
                color: Color(0xFF64748B),
                size: 24,
              ),
            ),
          );
        },
      );
    }

    return CachedNetworkImage(
      imageUrl: formattedUrl,
      width: width,
      height: height,
      fit: fit,
      memCacheWidth: targetWidth,
      fadeInDuration: const Duration(milliseconds: 150),
      placeholder: (context, url) => Container(
        width: width,
        height: height,
        color: const Color(0xFFE2E8F0),
      ),
      errorWidget: (context, url, error) => CachedNetworkImage(
        imageUrl: fallback,
        width: width,
        height: height,
        fit: fit,
        memCacheWidth: targetWidth,
        errorWidget: (ctx, u, err) => Container(
          width: width,
          height: height,
          color: const Color(0xFFCBD5E1),
          child: const Icon(
            Icons.image_not_supported_outlined,
            color: Color(0xFF64748B),
            size: 24,
          ),
        ),
      ),
    );
  }
}
