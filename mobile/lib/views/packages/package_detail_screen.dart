import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/custom_button.dart';
import '../auth/login_screen.dart';
import '../enquiry/enquiry_bottom_sheet.dart';
import '../booking/booking_bottom_sheet.dart';

class PackageDetailScreen extends StatefulWidget {
  final PackageModel package;

  const PackageDetailScreen({super.key, required this.package});

  @override
  State<PackageDetailScreen> createState() => _PackageDetailScreenState();
}

class _PackageDetailScreenState extends State<PackageDetailScreen> {
  int _selectedTierIndex = 0;
  int _expandedDayIndex = 0;
  bool _showInclusions = true;

  /// Cover image + gallery, de-duplicated. Falls back to a single image.
  List<String> get _galleryImages {
    final bannerImg = widget.package.mainImage.trim().toLowerCase();
    final seen = <String>{};
    final list = <String>[];
    for (final u in widget.package.images) {
      final t = u.trim();
      if (t.isEmpty) continue;
      if (t.toLowerCase() == bannerImg) continue;
      if (!seen.add(t)) continue;
      list.add(t);
    }
    return list;
  }

  void _openFullScreenGallery(int initialIndex) {
    final images = _galleryImages;
    int currentIndex = initialIndex;

    showDialog(
      context: context,
      useSafeArea: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final pageController = PageController(initialPage: initialIndex);
            return Scaffold(
              backgroundColor: Colors.black,
              body: Stack(
                children: [
                  // Full Screen Interactive Image PageView (Pinch-to-zoom & Swipe)
                  PageView.builder(
                    controller: pageController,
                    itemCount: images.length,
                    onPageChanged: (idx) {
                      setDialogState(() => currentIndex = idx);
                    },
                    itemBuilder: (context, i) {
                      return InteractiveViewer(
                        minScale: 0.8,
                        maxScale: 4.0,
                        child: Center(
                          child: AppNetworkImage(
                            imageUrl: images[i],
                            fit: BoxFit.contain,
                            targetWidth: 1200,
                          ),
                        ),
                      );
                    },
                  ),

                  // Top Header Bar with Close Button & Photo Counter
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: SafeArea(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.black87, Colors.transparent],
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28),
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                            Text(
                              '${currentIndex + 1} / ${images.length}',
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 48),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Bottom Thumbnail Selector Strip
                  if (images.length > 1)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: SafeArea(
                        child: Container(
                          height: 90,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [Colors.black.withValues(alpha: 0.9), Colors.transparent],
                            ),
                          ),
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: images.length,
                            itemBuilder: (context, thumbIdx) {
                              final isSelected = thumbIdx == currentIndex;
                              return GestureDetector(
                                onTap: () {
                                  pageController.animateToPage(
                                    thumbIdx,
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeInOut,
                                  );
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.only(right: 10),
                                  width: isSelected ? 72 : 56,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: isSelected ? AppTheme.primaryColor : Colors.white30,
                                      width: isSelected ? 2.5 : 1,
                                    ),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: AppNetworkImage(
                                      imageUrl: images[thumbIdx],
                                      fit: BoxFit.cover,
                                      targetWidth: 200,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
  void _openSingleImageFullScreen(String imageUrl) {
    showDialog(
      context: context,
      useSafeArea: false,
      builder: (ctx) {
        return Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            children: [
              InteractiveViewer(
                minScale: 0.8,
                maxScale: 4.0,
                child: Center(
                  child: AppNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    targetWidth: 1200,
                  ),
                ),
              ),
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                        Text(
                          'Banner Photo',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 48),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openEnquirySheet() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to submit an enquiry'),
          backgroundColor: AppTheme.primaryColor,
        ),
      );
      final loggedIn = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen(isBookingPrompt: true)),
      );
      if (loggedIn != true || !mounted) return;
    }

    final selectedTier = widget.package.pricingTiers.isNotEmpty &&
            _selectedTierIndex < widget.package.pricingTiers.length
        ? widget.package.pricingTiers[_selectedTierIndex]
        : null;

    final note = selectedTier != null
        ? 'Selected Plan: ${selectedTier.category} Tier (₹${selectedTier.price.toInt()})'
        : '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EnquiryBottomSheet(
        defaultDestination:
            '${widget.package.title} ${note.isNotEmpty ? "[$note]" : ""}',
      ),
    );
  }

  Future<void> _openBookPackageSheet() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to make a booking'),
          backgroundColor: AppTheme.primaryColor,
        ),
      );
      final loggedIn = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen(isBookingPrompt: true)),
      );
      if (loggedIn != true || !mounted) return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BookingBottomSheet(package: widget.package),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter =
        NumberFormat.currency(symbol: '₹', decimalDigits: 0);
    final package = widget.package;
    final images = _galleryImages;
    final tiers = package.pricingTiers;
    final activeTier = tiers.isNotEmpty && _selectedTierIndex < tiers.length
        ? tiers[_selectedTierIndex]
        : null;

    return Scaffold(
      backgroundColor: context.colors.scaffold,
      body: CustomScrollView(
        slivers: [
          // Sliver App Bar — swipeable image carousel
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  GestureDetector(
                    onTap: () => _openSingleImageFullScreen(package.mainImage),
                    child: AppNetworkImage(
                      imageUrl: package.mainImage,
                      fit: BoxFit.cover,
                      targetWidth: 800,
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.75),
                        ],
                      ),
                    ),
                  ),
                  if (package.packageCode.isNotEmpty)
                    Positioned(
                      bottom: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          'CODE: ${package.packageCode}',
                          style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Package Details Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges Row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          package.category,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 18),
                          const SizedBox(width: 4),
                          Text(
                            '${package.rating} Rating',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    package.title,
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: context.colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),

                  Row(
                    children: [
                      const Icon(Icons.location_on,
                          size: 18, color: AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          package.destination,
                          style: TextStyle(
                              color: context.colors.textSecondary, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.access_time,
                          size: 18, color: context.colors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        package.duration,
                        style: TextStyle(
                            color: context.colors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                  const Divider(height: 28),

                  // -------------------------------------------------------------
                  // PHOTO GALLERY SECTION
                  // -------------------------------------------------------------
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.photo_library_rounded,
                              size: 20, color: AppTheme.primaryColor),
                          const SizedBox(width: 8),
                          Text(
                            'Photo Gallery',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: context.colors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '${images.length} Photos',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  SizedBox(
                    height: 105,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: images.length,
                      itemBuilder: (context, idx) {
                        return GestureDetector(
                          onTap: () => _openFullScreenGallery(idx),
                          child: Container(
                            margin: const EdgeInsets.only(right: 12),
                            width: 140,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: context.colors.border,
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: AppNetworkImage(
                                    imageUrl: images[idx],
                                    fit: BoxFit.cover,
                                    targetWidth: 400,
                                  ),
                                ),
                                Positioned(
                                  right: 6,
                                  bottom: 6,
                                  child: Container(
                                    padding: const EdgeInsets.all(5),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.65),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.fullscreen_rounded,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const Divider(height: 32),

                  // -------------------------------------------------------------
                  // 1. TOUR PRICING TIERS / PLANS SELECTOR (Standard, Deluxe, Luxury)
                  // -------------------------------------------------------------
                  Text(
                    'Choose Your Travel Plan',
                    style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: context.colors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Select package tier based on hotel style & comfort',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: context.colors.textSecondary),
                  ),
                  const SizedBox(height: 12),

                  if (tiers.isNotEmpty) ...[
                    Row(
                      children: List.generate(tiers.length, (index) {
                        final tier = tiers[index];
                        final isSelected = _selectedTierIndex == index;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () =>
                                setState(() => _selectedTierIndex = index),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: EdgeInsets.only(
                                  right: index == tiers.length - 1 ? 0 : 8),
                              padding: const EdgeInsets.symmetric(
                                  vertical: 12, horizontal: 4),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppTheme.primaryColor
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? AppTheme.primaryColor
                                      : const Color(0xFFE2E8F0),
                                  width: 1.5,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                            color: AppTheme.primaryColor
                                                .withValues(alpha: 0.3),
                                            blurRadius: 8,
                                            offset: const Offset(0, 4))
                                      ]
                                    : [],
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    tier.category,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isSelected
                                          ? Colors.white
                                          : context.colors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    currencyFormatter.format(tier.price),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isSelected
                                          ? Colors.white
                                          : AppTheme.primaryColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 12),

                    // Active Selected Plan Card Details
                    if (activeTier != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: context.colors.surfaceAlt,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: context.colors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${activeTier.category} Plan Inclusions',
                                  style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: context.colors.textPrimary),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.successColor
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text('Available',
                                      style: TextStyle(
                                          color: AppTheme.successColor,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(Icons.hotel_outlined,
                                    size: 16, color: AppTheme.primaryColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text('Stay: ${activeTier.hotel}',
                                      style: TextStyle(
                                          fontSize: 13,
                                          color: context.colors.textPrimary,
                                          fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.restaurant_outlined,
                                    size: 16, color: Colors.orange),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text('Meals: ${activeTier.meal}',
                                      style: TextStyle(
                                          fontSize: 13,
                                          color: context.colors.textPrimary,
                                          fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.directions_car_outlined,
                                    size: 16, color: Colors.teal),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                      'Transfer: ${activeTier.transport}',
                                      style: TextStyle(
                                          fontSize: 13,
                                          color: context.colors.textPrimary,
                                          fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                  ],

                  const Divider(height: 32),

                  // -------------------------------------------------------------
                  // 2. OVERVIEW & HIGHLIGHTS
                  // -------------------------------------------------------------
                  Text(
                    'Package Overview',
                    style: GoogleFonts.outfit(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    package.overview.isNotEmpty
                        ? package.overview
                        : 'Embark on an unforgettable vacation tailored with premium stays, guided sightseeing tours, and seamless local transport.',
                    style: GoogleFonts.inter(
                        fontSize: 13,
                        color: context.colors.textSecondary,
                        height: 1.6),
                  ),
                  const SizedBox(height: 20),

                  if (package.highlights.isNotEmpty) ...[
                    Text(
                      'Highlights',
                      style: GoogleFonts.outfit(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...package.highlights.map(
                      (h) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle,
                                color: AppTheme.successColor, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                                child: Text(h,
                                    style: TextStyle(
                                        fontSize: 13,
                                        color: context.colors.textPrimary))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // -------------------------------------------------------------
                  // 3. DAY-BY-DAY ITINERARY ACCORDION
                  // -------------------------------------------------------------
                  if (package.itinerary.isNotEmpty) ...[
                    Text(
                      'Day-by-Day Itinerary',
                      style: GoogleFonts.outfit(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(package.itinerary.length, (index) {
                      final dayData = package.itinerary[index];
                      final isExpanded = _expandedDayIndex == index;
                      final dayNumber = dayData['day'] ?? (index + 1);
                      final dayTitle =
                          dayData['title'] ?? 'Sightseeing & Excursion';
                      final dayDesc = dayData['description'] ??
                          'Guided local sightseeing, meals, and overnight stay at resort.';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.colors.border),
                        ),
                        child: Material(
                          color: context.colors.surface,
                          borderRadius: BorderRadius.circular(12),
                          clipBehavior: Clip.antiAlias,
                          child: ExpansionTile(
                          initiallyExpanded: isExpanded,
                          onExpansionChanged: (expanded) {
                            if (expanded) {
                              setState(() => _expandedDayIndex = index);
                            }
                          },
                          leading: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Day $dayNumber',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                          title: Text(
                            dayTitle,
                            style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: context.colors.textPrimary),
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              child: Text(
                                dayDesc,
                                style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: context.colors.textSecondary,
                                    height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                    }),
                    const SizedBox(height: 24),
                  ],

                  // -------------------------------------------------------------
                  // 4. INCLUSIONS & EXCLUSIONS TABS
                  // -------------------------------------------------------------
                  Text(
                    'Tour Details',
                    style: GoogleFonts.outfit(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () =>
                              setState(() => _showInclusions = true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _showInclusions
                                ? AppTheme.successColor
                                : Colors.grey[200],
                            foregroundColor:
                                _showInclusions ? Colors.white : Colors.black87,
                            elevation: _showInclusions ? 2 : 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Inclusions',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () =>
                              setState(() => _showInclusions = false),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: !_showInclusions
                                ? Colors.redAccent
                                : Colors.grey[200],
                            foregroundColor: !_showInclusions
                                ? Colors.white
                                : Colors.black87,
                            elevation: !_showInclusions ? 2 : 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Exclusions',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: context.colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _showInclusions
                          ? (package.inclusions.isNotEmpty
                              ? package.inclusions
                                  .map((inc) => Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 8),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.check_circle,
                                                color: AppTheme.successColor,
                                                size: 18),
                                            const SizedBox(width: 8),
                                            Expanded(
                                                child: Text(inc,
                                                    style: const TextStyle(
                                                        fontSize: 13))),
                                          ],
                                        ),
                                      ))
                                  .toList()
                              : [
                                  const Text(
                                      'Daily breakfast, hotel stay, private car transfer.')
                                ])
                          : (package.exclusions.isNotEmpty
                              ? package.exclusions
                                  .map((exc) => Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 8),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.cancel,
                                                color: Colors.redAccent,
                                                size: 18),
                                            const SizedBox(width: 8),
                                            Expanded(
                                                child: Text(exc,
                                                    style: const TextStyle(
                                                        fontSize: 13))),
                                          ],
                                        ),
                                      ))
                                  .toList()
                              : [
                                  const Text(
                                      'Personal shopping, airfare, entrance tickets.')
                                ]),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Bar with Dynamic Price & Book CTA
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.surface,
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, -4)),
          ],
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activeTier != null
                      ? '${activeTier.category} Plan'
                      : 'Starting Price',
                  style: TextStyle(
                      color: context.colors.textSecondary, fontSize: 11),
                ),
                Text(
                  currencyFormatter.format(
                      activeTier != null ? activeTier.price : package.price),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: CustomButton(
                text: 'Enquire',
                isOutlined: true,
                onPressed: _openEnquirySheet,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: CustomButton(
                text: 'Book Package Now',
                backgroundColor: AppTheme.primaryColor,
                onPressed: _openBookPackageSheet,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
