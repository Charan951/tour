import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/destination_model.dart';
import '../../models/package_model.dart';
import '../../models/theme_model.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../services/package_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/package_card.dart';
import '../enquiry/enquiry_bottom_sheet.dart';
import '../packages/package_detail_screen.dart';

class DestinationDetailScreen extends StatefulWidget {
  final DestinationModel destination;

  const DestinationDetailScreen({super.key, required this.destination});

  @override
  State<DestinationDetailScreen> createState() =>
      _DestinationDetailScreenState();
}

class _DestinationDetailScreenState extends State<DestinationDetailScreen> {
  List<PackageModel> _allDestinationPackages = [];
  List<PackageModel> _displayedPackages = [];
  List<ThemeModel> _availableThemes = [];
  String _selectedTheme = 'All Packages';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDestinationData();
    });
  }

  Future<void> _loadDestinationData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final provider = Provider.of<PackageProvider>(context, listen: false);
    final providerPackages = provider.allPackages;
    final themeProvider =
        Provider.of<SpecializationThemeProvider>(context, listen: false);

    try {
      final service = PackageService();
      // Fetch packages for this destination from API
      final apiPackages =
          await service.getPackages(destination: widget.destination.name);

      if (!mounted) return;

      final localMatched = _filterPackagesForDestination(
          providerPackages, widget.destination.name);

      // Merge results by package ID
      final Map<String, PackageModel> packageMap = {};
      for (final p in apiPackages) {
        packageMap[p.id] = p;
      }
      for (final p in localMatched) {
        packageMap.putIfAbsent(p.id, () => p);
      }

      final combinedPackages = packageMap.values.toList();

      if (mounted) {
        setState(() {
          _allDestinationPackages = combinedPackages;
          _availableThemes =
              _buildAllThemeCards(themeProvider.themes, combinedPackages);
          _isLoading = false;
        });
        _applyThemeFilter();
      }
    } catch (_) {
      if (mounted) {
        final localMatched = _filterPackagesForDestination(
            providerPackages, widget.destination.name);

        setState(() {
          _allDestinationPackages = localMatched;
          _availableThemes =
              _buildAllThemeCards(themeProvider.themes, localMatched);
          _isLoading = false;
        });
        _applyThemeFilter();
      }
    }
  }

  List<PackageModel> _filterPackagesForDestination(
      List<PackageModel> packages, String destinationName) {
    final cleanDest = destinationName.split(',')[0].toLowerCase().trim();
    return packages.where((pkg) {
      final destMatch = pkg.destination.toLowerCase().contains(cleanDest);
      final titleMatch = pkg.title.toLowerCase().contains(cleanDest);
      final overviewMatch = pkg.overview.toLowerCase().contains(cleanDest);
      return destMatch || titleMatch || overviewMatch;
    }).toList();
  }

  List<ThemeModel> _buildAllThemeCards(
      List<ThemeModel> globalThemes, List<PackageModel> destinationPackages) {
    final List<ThemeModel> themeCards = [
      ThemeModel(
        id: 'all',
        name: 'All Packages',
        imageUrl: widget.destination.image,
      ),
    ];

    if (globalThemes.isNotEmpty) {
      themeCards.addAll(globalThemes);
    }

    return themeCards;
  }

  void _applyThemeFilter() {
    if (_selectedTheme == 'All Packages') {
      setState(() {
        _displayedPackages = List.from(_allDestinationPackages);
      });
      return;
    }

    final cleanSelected =
        _selectedTheme.toLowerCase().replaceAll('tour', '').trim();
    final keywords =
        cleanSelected.split(RegExp(r'\s+')).where((k) => k.length > 2).toList();

    final filtered = _allDestinationPackages.where((pkg) {
      // 1. Direct themeName match
      if (pkg.themeName != null &&
          pkg.themeName!.toLowerCase().contains(cleanSelected)) {
        return true;
      }
      // 2. Category match
      if (pkg.category.toLowerCase().contains(cleanSelected)) {
        return true;
      }
      // 3. Keyword matching across title, overview, highlights
      if (pkg.title.toLowerCase().contains(cleanSelected)) return true;
      if (pkg.overview.toLowerCase().contains(cleanSelected)) return true;
      if (pkg.highlights.any((h) => h.toLowerCase().contains(cleanSelected))) {
        return true;
      }
      for (final kw in keywords) {
        if (pkg.title.toLowerCase().contains(kw)) return true;
        if (pkg.overview.toLowerCase().contains(kw)) return true;
        if (pkg.highlights.any((h) => h.toLowerCase().contains(kw))) return true;
      }
      return false;
    }).toList();

    setState(() {
      _displayedPackages = filtered;
    });
  }

  @override
  Widget build(BuildContext context) {
    final destNameShort = widget.destination.name.split(',')[0];

    return Scaffold(
      backgroundColor: const Color(0xFFF3F3F3),
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadDestinationData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Back Button & Top Bar
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

                    // Destination Image & Description Card
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
                              imageUrl: ApiConfig.formatImageUrl(
                                  widget.destination.image),
                              height: 240,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                height: 240,
                                color: Colors.grey[200],
                              ),
                              errorWidget: (context, url, error) =>
                                  Image.network(
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(18.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.public,
                                        color: AppTheme.primaryColor, size: 20),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        '${widget.destination.state}, ${widget.destination.country}',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  widget.destination.name,
                                  style: GoogleFonts.outfit(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textPrimary,
                                    height: 1.1,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Text(
                                  'About Destination',
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  widget.destination.description,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: AppTheme.textSecondary,
                                    height: 1.6,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_month_outlined,
                                        color: AppTheme.accentColor, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Best Time: ',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    Expanded(
                                      child: Text(
                                        widget.destination.bestTimeToVisit
                                            .join(', '),
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.primaryColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Travel Themes Section with All Theme Cards
                    if (_availableThemes.isNotEmpty) ...[
                      Text(
                        'Travel Themes in $destNameShort',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 110,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _availableThemes.length,
                          itemBuilder: (context, index) {
                            final themeItem = _availableThemes[index];
                            final isSelected =
                                _selectedTheme == themeItem.name;
                            final imageUrl = ApiConfig.formatImageUrl(
                                themeItem.imageUrl);

                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedTheme = themeItem.name;
                                });
                                _applyThemeFilter();
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 130,
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppTheme.primaryColor
                                        : Colors.transparent,
                                    width: 2.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: isSelected
                                          ? AppTheme.primaryColor
                                              .withValues(alpha: 0.3)
                                          : Colors.black
                                              .withValues(alpha: 0.08),
                                      blurRadius: isSelected ? 10 : 6,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: Stack(
                                    children: [
                                      Positioned.fill(
                                        child: CachedNetworkImage(
                                          imageUrl: imageUrl,
                                          fit: BoxFit.cover,
                                          placeholder: (context, url) =>
                                              Container(
                                                  color: Colors.grey[300]),
                                          errorWidget:
                                              (context, url, error) =>
                                                  Image.network(
                                            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop',
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                      Positioned.fill(
                                        child: Container(
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              begin: Alignment.topCenter,
                                              end: Alignment.bottomCenter,
                                              colors: [
                                                Colors.transparent,
                                                Colors.black
                                                    .withValues(alpha: 0.8),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 10,
                                        left: 10,
                                        right: 10,
                                        child: Text(
                                          themeItem.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            height: 1.1,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 22),
                    ],

                    // Packages Section Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _selectedTheme == 'All Packages'
                                ? 'Tour Packages in $destNameShort'
                                : '$_selectedTheme Packages',
                            style: GoogleFonts.outfit(
                              fontSize: 19,
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
                              color:
                                  AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_displayedPackages.length} ${_displayedPackages.length == 1 ? 'Package' : 'Packages'}',
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

                    // Packages List
                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_displayedPackages.isEmpty)
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
                              'No packages available for $_selectedTheme at $destNameShort right now.',
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
                        itemCount: _displayedPackages.length,
                        itemBuilder: (context, index) {
                          final pkg = _displayedPackages[index];
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
              child: CustomButton(
                text: 'Enquire for ${widget.destination.name} Tour',
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => EnquiryBottomSheet(
                      defaultDestination: widget.destination.name,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
