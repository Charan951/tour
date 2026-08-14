import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/theme_model.dart';
import '../enquiry/enquiry_bottom_sheet.dart';

class ThemeDetailScreen extends StatelessWidget {
  final ThemeModel theme;

  const ThemeDetailScreen({super.key, required this.theme});

  @override
  Widget build(BuildContext context) {
    final description = (theme.description.isNotEmpty)
        ? theme.description
        : _buildThemeDescription(theme.name);
    final highlights = _buildHighlights(theme.name);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F3F3),
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.topLeft,
                    child: Container(
                      height: 42,
                      width: 42,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded,
                            color: AppTheme.textPrimary),
                        splashRadius: 20,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(24),
                          ),
                          child: CachedNetworkImage(
                            imageUrl: ApiConfig.formatImageUrl(theme.imageUrl),
                            height: 260,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              height: 260,
                              color: Colors.grey[200],
                            ),
                            errorWidget: (context, url, error) => Image.network(
                              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Theme',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.3,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      theme.name,
                                      style: GoogleFonts.outfit(
                                        fontSize: 30,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textPrimary,
                                        height: 1.1,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded,
                                      color: AppTheme.accentColor, size: 18),
                                  const SizedBox(width: 6),
                                  Text(
                                    theme.rating ?? 'Top pick',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 18),
                              Text(
                                description,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: AppTheme.textSecondary,
                                  height: 1.7,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Highlights',
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: highlights.map((tag) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryColor
                                          .withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      tag,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 18,
              right: 18,
              bottom: 18,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF6A35A),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.orange.withValues(alpha: 0.25),
                      blurRadius: 18,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => EnquiryBottomSheet(
                          defaultDestination: theme.name,
                        ),
                      );
                    },
                    child: Container(
                      height: 64,
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.headset_mic_outlined,
                              color: Colors.white, size: 28),
                          const SizedBox(width: 12),
                          Text(
                            'Enquire Now',
                            style: GoogleFonts.outfit(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _buildThemeDescription(String themeName) {
    final map = {
      'Honeymoon Tour':
          'Romantic escapes crafted with candlelight dinners, private transfers, luxury stays, and sunset moments made for couples who want timeless memories.',
      'Leisure':
          'Relaxed journeys designed for easygoing exploration, scenic comforts, spa moments, and memorable stays without the rush.',
      'Hill Station':
          'Experience cool weather, panoramic views, cozy stays, and peaceful nature-filled itineraries surrounded by hilltop charm.',
      'Trekking':
          'Adventure-driven holiday plans built around mountain trails, guided treks, camp nights, and unforgettable natural viewpoints.',
      'Adventure':
          'High-energy experiences featuring rafting, ziplining, off-road drives, and thrilling activities across scenic landscapes.',
      'Religious':
          'Spiritual journeys that blend temple visits, guided rituals, calm stays, and meaningful travel for inner peace and reflection.',
      'Family Tour':
          'Family-friendly trips with comfortable stays, kid-approved activities, easy sightseeing, and plenty of shared memories.',
      'Wildlife Safari':
          'Wild encounters, jungle drives, nature lodges, and scenic adventure that bring the thrill of the wilderness closer to home.',
    };

    return map[themeName] ??
        'A thoughtfully planned travel experience tailored for comfort, discovery, and memorable moments across your favorite destination.';
  }

  static List<String> _buildHighlights(String themeName) {
    final map = {
      'Honeymoon Tour': [
        'Couple stay',
        'Private cab',
        'Sunset dinner',
        'Luxury room'
      ],
      'Leisure': ['Scenic stay', 'Sightseeing', 'Spa time', 'Relaxed pace'],
      'Hill Station': [
        'Mountain views',
        'Nature trails',
        'Tea gardens',
        'Cool weather'
      ],
      'Trekking': ['Guided hikes', 'Camp nights', 'Adventure', 'Trail views'],
      'Adventure': ['Zipline', 'Rafting', 'Off-road', 'Thrills'],
      'Religious': [
        'Temple visits',
        'Spiritual stay',
        'Guided tours',
        'Peaceful retreats'
      ],
      'Family Tour': [
        'Family rooms',
        'Kid-friendly',
        'Heritage spots',
        'Fun activities'
      ],
      'Wildlife Safari': [
        'Safari drive',
        'Nature lodge',
        'Birding',
        'Forest stay'
      ],
    };

    return map[themeName] ??
        ['Flexible plans', 'Custom itinerary', 'Expert guidance'];
  }
}
