import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../models/theme_model.dart';
import '../../providers/package_provider.dart';
import '../../services/package_service.dart';
import '../../widgets/package_card.dart';
import '../enquiry/enquiry_bottom_sheet.dart';
import '../packages/package_detail_screen.dart';

class ThemeDetailScreen extends StatefulWidget {
  final ThemeModel theme;

  const ThemeDetailScreen({super.key, required this.theme});

  @override
  State<ThemeDetailScreen> createState() => _ThemeDetailScreenState();
}

class _ThemeDetailScreenState extends State<ThemeDetailScreen> {
  List<PackageModel> _themePackages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadThemePackages();
    });
  }

  Future<void> _loadThemePackages() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final provider = Provider.of<PackageProvider>(context, listen: false);
    final providerPackages = provider.allPackages;

    try {
      final service = PackageService();
      // 1. Query backend specifically for this theme name
      final apiPackages = await service.getPackages(theme: widget.theme.name);

      if (!mounted) return;

      // 2. Also check loaded provider/fallback packages
      final localMatched = _filterPackagesForTheme(providerPackages, widget.theme.name);

      // Merge results avoiding duplicate package IDs
      final Map<String, PackageModel> packageMap = {};
      for (final p in apiPackages) {
        packageMap[p.id] = p;
      }
      for (final p in localMatched) {
        packageMap.putIfAbsent(p.id, () => p);
      }

      final List<PackageModel> resultList = packageMap.values.toList();

      if (mounted) {
        setState(() {
          _themePackages = resultList;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        final localMatched = _filterPackagesForTheme(providerPackages, widget.theme.name);

        setState(() {
          _themePackages = localMatched;
          _isLoading = false;
        });
      }
    }
  }

  List<PackageModel> _filterPackagesForTheme(List<PackageModel> packages, String themeName) {
    final cleanTheme = themeName.toLowerCase().replaceAll('tour', '').trim();
    final keywords = cleanTheme.split(RegExp(r'\s+')).where((k) => k.length > 2).toList();

    return packages.where((pkg) {
      if (pkg.themeName != null &&
          pkg.themeName!.toLowerCase().contains(cleanTheme)) {
        return true;
      }
      if (pkg.category.toLowerCase().contains(cleanTheme)) {
        return true;
      }
      if (keywords.isNotEmpty) {
        for (final kw in keywords) {
          if (pkg.title.toLowerCase().contains(kw)) return true;
          if (pkg.overview.toLowerCase().contains(kw)) return true;
          if (pkg.highlights.any((h) => h.toLowerCase().contains(kw))) return true;
          if (pkg.destination.toLowerCase().contains(kw)) return true;
        }
      }
      return false;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final description = (widget.theme.description.isNotEmpty)
        ? widget.theme.description
        : _buildThemeDescription(widget.theme.name);
    final highlights = _buildHighlights(widget.theme.name);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F3F3),
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadThemePackages,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
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
                          tooltip: 'Back',
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
                              imageUrl: ApiConfig.formatImageUrl(widget.theme.imageUrl),
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
                            padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
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
                                        widget.theme.name,
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
                                      widget.theme.rating ?? 'Top pick',
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
                    const SizedBox(height: 24),

                    // Theme Packages Header Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${widget.theme.name} Packages',
                            style: GoogleFonts.outfit(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (!_isLoading)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_themePackages.length} ${_themePackages.length == 1 ? 'Package' : 'Packages'}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_themePackages.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.card_travel,
                                size: 40, color: AppTheme.textSecondary),
                            const SizedBox(height: 10),
                            Text(
                              'No packages available for this theme right now.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _themePackages.length,
                        itemBuilder: (context, index) {
                          final pkg = _themePackages[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: PackageCard(
                              package: pkg,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        PackageDetailScreen(package: pkg),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
                  ],
                ),
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
                          defaultDestination: widget.theme.name,
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
