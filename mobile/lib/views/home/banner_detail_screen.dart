import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/banner_model.dart';
import '../../models/package_model.dart';
import '../../models/destination_model.dart';
import '../../models/activity_model.dart';
import '../../providers/package_provider.dart';
import '../../providers/destination_provider.dart';
import '../../services/package_service.dart';
import '../../services/destination_service.dart';
import '../../services/activity_service.dart';
import '../../widgets/package_card.dart';
import '../packages/package_detail_screen.dart';
import '../destinations/destination_detail_screen.dart';
import '../activities/activity_detail_screen.dart';
import '../enquiry/enquiry_bottom_sheet.dart';

class BannerDetailScreen extends StatefulWidget {
  final BannerModel banner;

  const BannerDetailScreen({
    super.key,
    required this.banner,
  });

  @override
  State<BannerDetailScreen> createState() => _BannerDetailScreenState();
}

class _BannerDetailScreenState extends State<BannerDetailScreen> {
  List<PackageModel> _offeredPackages = [];
  List<DestinationModel> _relatedDestinations = [];
  List<ActivityModel> _offeredActivities = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadBannerContent();
      }
    });
  }

  Future<void> _loadBannerContent() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final banner = widget.banner;
      final titleLower = banner.title.toLowerCase();
      final subLower = (banner.subtitle ?? '').toLowerCase();
      final destNameLower = (banner.destinationName ?? '').toLowerCase();
      final destSlugLower = (banner.destinationSlug ?? '').toLowerCase();

      // 1. Load Packages
      List<PackageModel> allPackages = [];
      final pkgProvider = Provider.of<PackageProvider>(context, listen: false);
      if (pkgProvider.allPackages.isNotEmpty) {
        allPackages = pkgProvider.allPackages;
      } else {
        try {
          allPackages = await PackageService().getPackages();
        } catch (_) {}
      }

      // Filter packages
      List<PackageModel> matchedPkgs = allPackages.where((p) {
        final pTitle = p.title.toLowerCase();
        final pDest = p.destination.toLowerCase();
        final pCat = p.category.toLowerCase();
        final pTheme = (p.themeName ?? '').toLowerCase();

        bool match = false;
        if (destSlugLower.isNotEmpty && (pDest.contains(destSlugLower) || pTitle.contains(destSlugLower))) match = true;
        if (destNameLower.isNotEmpty && (pDest.contains(destNameLower) || pTitle.contains(destNameLower))) match = true;

        final words = titleLower.split(RegExp(r'\s+')).where((w) => w.length > 3 && !['special', 'offer', 'deal', 'tour', 'tours', 'best'].contains(w));
        for (final word in words) {
          if (pTitle.contains(word) || pDest.contains(word) || pCat.contains(word) || pTheme.contains(word)) {
            match = true;
            break;
          }
        }
        return match;
      }).toList();

      if (matchedPkgs.isEmpty) {
        matchedPkgs = allPackages.take(6).toList();
      }

      // 2. Load Destinations
      if (!mounted) return;
      List<DestinationModel> allDests = [];
      final destProvider = Provider.of<DestinationProvider>(context, listen: false);
      if (destProvider.destinations.isNotEmpty) {
        allDests = destProvider.destinations;
      } else {
        try {
          allDests = await DestinationService().getDestinations();
        } catch (_) {}
      }

      List<DestinationModel> matchedDests = allDests.where((d) {
        final dName = d.name.toLowerCase();
        final dSlug = d.slug.toLowerCase();
        return (destNameLower.isNotEmpty && dName.contains(destNameLower)) ||
               (destSlugLower.isNotEmpty && dSlug.contains(destSlugLower)) ||
               titleLower.contains(dName.split(',')[0]) ||
               subLower.contains(dName.split(',')[0]);
      }).toList();

      if (matchedDests.isEmpty) {
        matchedDests = allDests.take(6).toList();
      }

      // 3. Load Activities
      List<ActivityModel> allActivities = [];
      try {
        allActivities = await ActivityService().fetchActivities();
      } catch (_) {}

      List<ActivityModel> matchedActs = allActivities.where((a) {
        final aTitle = a.title.toLowerCase();
        final aDest = a.destinationName.toLowerCase();
        final aCat = a.category.toLowerCase();

        return (destNameLower.isNotEmpty && aDest.contains(destNameLower)) ||
               titleLower.contains(aCat) ||
               titleLower.contains(aTitle.split(' ')[0]) ||
               subLower.contains(aCat);
      }).toList();

      if (matchedActs.isEmpty) {
        matchedActs = allActivities.take(6).toList();
      }

      if (mounted) {
        setState(() {
          _offeredPackages = matchedPkgs;
          _relatedDestinations = matchedDests;
          _offeredActivities = matchedActs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _openEnquirySheet(BuildContext context, {String? customTitle}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EnquiryBottomSheet(
        defaultDestination: customTitle ?? widget.banner.title,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final banner = widget.banner;
    final formattedUrl = ApiConfig.formatImageUrl(banner.imageUrl);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // App Bar Header with Banner Image
          SliverAppBar(
            expandedHeight: 260.0,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.black.withValues(alpha: 0.4),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: formattedUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: Colors.grey.shade200),
                    errorWidget: (context, url, error) => Image.network(
                      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop',
                      fit: BoxFit.cover,
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.7),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentColor,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            banner.offerText ?? 'FEATURED SPECIAL OFFER',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          banner.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                        if ((banner.subtitle ?? '').isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            banner.subtitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Main Body Content
          SliverToBoxAdapter(
            child: _isLoading
                ? const Padding(
                    padding: EdgeInsets.all(40.0),
                    child: Center(child: CircularProgressIndicator()),
                  )
                : Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Deal Highlights Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade200),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.local_offer, color: AppTheme.primaryColor, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Offer Overview',
                                    style: GoogleFonts.outfit(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildBadgeItem(
                                      icon: Icons.currency_rupee,
                                      label: 'Price',
                                      value: banner.priceText ?? 'Best Deals',
                                    ),
                                  ),
                                  Expanded(
                                    child: _buildBadgeItem(
                                      icon: Icons.access_time,
                                      label: 'Duration',
                                      value: banner.durationText ?? 'Flexi Days',
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── SECTION 1: OFFERED TOUR PACKAGES ──
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Offered Tour Packages',
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${_offeredPackages.length} Available',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (_offeredPackages.isEmpty)
                          const Text('No packages available right now.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _offeredPackages.length,
                            itemBuilder: (context, idx) {
                              final pkg = _offeredPackages[idx];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: PackageCard(
                                  package: pkg,
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => PackageDetailScreen(package: pkg),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 24),

                        // ── SECTION 2: RELATED DESTINATIONS ──
                        if (_relatedDestinations.isNotEmpty) ...[
                          Text(
                            'Related Destinations',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _relatedDestinations.length,
                              itemBuilder: (context, idx) {
                                final dest = _relatedDestinations[idx];
                                final destImg = ApiConfig.formatImageUrl(dest.image);
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => DestinationDetailScreen(destination: dest),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    width: 140,
                                    margin: const EdgeInsets.only(right: 12),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.08),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(16),
                                      child: Stack(
                                        fit: StackFit.expand,
                                        children: [
                                          CachedNetworkImage(
                                            imageUrl: destImg,
                                            fit: BoxFit.cover,
                                            errorWidget: (context, url, err) => Container(color: Colors.grey.shade300),
                                          ),
                                          Container(
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
                                                colors: [
                                                  Colors.transparent,
                                                  Colors.black.withValues(alpha: 0.8),
                                                ],
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 10,
                                            left: 10,
                                            right: 10,
                                            child: Text(
                                              dest.name,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.outfit(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
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
                          const SizedBox(height: 28),
                        ],

                        // ── SECTION 3: OFFERED ACTIVITIES ──
                        if (_offeredActivities.isNotEmpty) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Offered Activities & Experiences',
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 190,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _offeredActivities.length,
                              itemBuilder: (context, idx) {
                                final act = _offeredActivities[idx];
                                final actImg = ApiConfig.formatImageUrl(act.coverImage);
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => ActivityDetailScreen(activity: act),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    width: 160,
                                    margin: const EdgeInsets.only(right: 12),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.grey.shade200),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.05),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          SizedBox(
                                            height: 95,
                                            width: double.infinity,
                                            child: CachedNetworkImage(
                                              imageUrl: actImg,
                                              fit: BoxFit.cover,
                                              errorWidget: (context, url, err) => Container(color: Colors.grey.shade300),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.all(8.0),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  act.title,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.bold,
                                                    color: AppTheme.textPrimary,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  act.category,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 11,
                                                    color: AppTheme.primaryColor,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  '₹${act.price.toInt()} onwards',
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: const Color(0xFF047857),
                                                  ),
                                                ),
                                              ],
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
                        ],
                      ],
                    ),
                  ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: ElevatedButton.icon(
            onPressed: () => _openEnquirySheet(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: const Icon(Icons.send, color: Colors.white),
            label: Text(
              'Enquire for ${banner.title}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBadgeItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: AppTheme.primaryColor),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade600),
              ),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
