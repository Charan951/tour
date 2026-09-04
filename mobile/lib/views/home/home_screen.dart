import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/banner_model.dart';
import '../../models/destination_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/destination_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../widgets/destination_card.dart';
import '../../widgets/package_card.dart';
import '../../widgets/section_header.dart';
import '../destinations/destination_detail_screen.dart';
import '../packages/package_detail_screen.dart';
import '../packages/package_list_screen.dart';
import '../profile/profile_screen.dart';
import '../themes/theme_screen.dart';
import '../themes/theme_detail_screen.dart';
import '../offers/offer_packages_screen.dart';

class _BottomNavItem {
  final IconData icon;
  final String label;
  final bool selected;

  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.selected,
  });
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  int _currentBannerIndex = 0;
  late PageController _bannerPageController;
  Timer? _bannerTimer;
  final TextEditingController _searchController = TextEditingController();

  Timer? _autoSyncTimer;

  @override
  void initState() {
    super.initState();
    _bannerPageController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchAllData();
    });
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    _bannerTimer?.cancel();
    _bannerPageController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllData() async {
    final bannerProvider = Provider.of<BannerProvider>(context, listen: false);
    final themeProvider =
        Provider.of<SpecializationThemeProvider>(context, listen: false);
    final destProvider =
        Provider.of<DestinationProvider>(context, listen: false);
    final pkgProvider = Provider.of<PackageProvider>(context, listen: false);

    unawaited(bannerProvider.fetchBanners());
    unawaited(themeProvider.fetchThemes());
    unawaited(destProvider.fetchDestinations());
    unawaited(pkgProvider.fetchPackages());

    if (mounted && bannerProvider.banners.isNotEmpty) {
      _startBannerAutoScroll();
    }

    if (mounted) {
      _preCacheAllImages();
    }
  }

  void _preCacheAllImages() {
    final bannerProvider = Provider.of<BannerProvider>(context, listen: false);
    if (bannerProvider.banners.isEmpty) return;

    Future.microtask(() {
      if (!mounted) return;
      final currentIndex = _currentBannerIndex;
      final nextIndex = (currentIndex + 1) % bannerProvider.banners.length;

      for (final index in [currentIndex, nextIndex]) {
        if (index < bannerProvider.banners.length) {
          final imageUrl = ApiConfig.formatImageUrl(
            bannerProvider.banners[index].imageUrl,
          );
          precacheImage(CachedNetworkImageProvider(imageUrl), context);
        }
      }
    });
  }

  void _startBannerAutoScroll() {
    _bannerTimer?.cancel();
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      final bannerProvider =
          Provider.of<BannerProvider>(context, listen: false);
      if (bannerProvider.banners.isNotEmpty &&
          _bannerPageController.hasClients) {
        final nextIndex =
            (_currentBannerIndex + 1) % bannerProvider.banners.length;
        _bannerPageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildHomeContent(),
      _buildDestinationsGridTab(),
      const ThemeScreen(),
      const PackageListScreen(),
      const ProfileScreen(),
    ];

    final navItems = const [
      _BottomNavItem(icon: Icons.home_filled, label: 'Home', selected: false),
      _BottomNavItem(
          icon: Icons.explore, label: 'Destinations', selected: false),
      _BottomNavItem(
          icon: Icons.palette_outlined, label: 'Themes', selected: false),
      _BottomNavItem(
          icon: Icons.card_travel, label: 'Packages', selected: false),
      _BottomNavItem(icon: Icons.person, label: 'Profile', selected: false),
    ];

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: pages[_currentIndex],
        bottomNavigationBar: SafeArea(
          top: false,
          left: true,
          right: true,
          bottom: true,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
            child: Container(
              height: 72,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: AppTheme.borderLight.withValues(alpha: 0.9),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    offset: const Offset(0, -2),
                    blurRadius: 16,
                  ),
                ],
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final selectedWidth = constraints.maxWidth * 0.34;
                  final otherWidth = (constraints.maxWidth - selectedWidth) /
                      (navItems.length - 1);

                  return Row(
                    children: List.generate(navItems.length, (index) {
                      final item = navItems[index];
                      final isSelected = index == _currentIndex;

                      return SizedBox(
                        width: isSelected ? selectedWidth : otherWidth,
                        child: Semantics(
                          button: true,
                          selected: isSelected,
                          label: '${item.label} tab',
                          child: GestureDetector(
                          onTap: () => setState(() => _currentIndex = index),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            curve: Curves.easeInOut,
                            height: 56,
                            margin: const EdgeInsets.fromLTRB(4, 6, 4, 6),
                            padding: EdgeInsets.symmetric(
                              horizontal: isSelected ? 10 : 6,
                              vertical: 6,
                            ),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppTheme.primaryColor
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: AppTheme.primaryColor
                                            .withValues(alpha: 0.22),
                                        offset: const Offset(0, 4),
                                        blurRadius: 10,
                                      ),
                                    ]
                                  : [],
                            ),
                            child: isSelected
                                ? Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Icon(item.icon,
                                          color: Colors.white, size: 22),
                                      const SizedBox(width: 6),
                                      Flexible(
                                        child: Text(
                                          item.label,
                                          maxLines: 1,
                                          softWrap: false,
                                          overflow: TextOverflow.clip,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 8.5,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  )
                                : Center(
                                    child: Icon(
                                      item.icon,
                                      color: AppTheme.textSecondary,
                                      size: 24,
                                    ),
                                  ),
                          ),
                        ),
                        ),
                      );
                    }),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeGradientHeader() {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final double topPadding = MediaQuery.of(context).padding.top;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(16, topPadding + 14, 16, 20),
      decoration: const BoxDecoration(
        gradient: AppTheme.headerGradient,
        borderRadius: AppTheme.headerRadius,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: 'Holiday',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  TextSpan(
                    text: 'City',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF26C6DA),
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            (user != null && user.firstName.trim().isNotEmpty)
                ? 'Hello, ${user.firstName.trim()} 👋'
                : 'Welcome to HolidayCity 👋',
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Plan your next trip with a real consultant',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.75),
            ),
          ),
          const SizedBox(height: 22),
          Container(
            height: 52,
            padding: const EdgeInsets.only(left: 18, right: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF063B6D).withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => setState(() => _currentIndex = 3),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary,
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      filled: false,
                      fillColor: Colors.transparent,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      hintText: 'Where do you want to go?',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => setState(() => _currentIndex = 3),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.search, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDestinationScroller(
    String title,
    String eyebrow,
    List<DestinationModel> list,
  ) {
    if (list.isEmpty) return const SizedBox.shrink();
    final items = list.length > 8 ? list.sublist(0, 8) : list;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: title,
          eyebrow: eyebrow,
          onSeeAll: () => setState(() => _currentIndex = 1),
        ),
        SizedBox(
          height: 210,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final dest = items[index];
              final formattedUrl = ApiConfig.formatImageUrl(dest.image);

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
                  width: 155,
                  margin: const EdgeInsets.only(right: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: CachedNetworkImage(
                            imageUrl: formattedUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) =>
                                Container(color: Colors.grey[300]),
                            errorWidget: (context, url, error) => Image.network(
                              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop',
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
                                  Colors.black.withValues(alpha: 0.2),
                                  Colors.black.withValues(alpha: 0.8),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 12,
                          left: 12,
                          right: 12,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${dest.state}, ${dest.country}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                dest.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  height: 1.15,
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
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildHomeContent() {
    final bannerProvider = Provider.of<BannerProvider>(context);
    final themeProvider = Provider.of<SpecializationThemeProvider>(context);
    final packageProvider = Provider.of<PackageProvider>(context);
    final destinationProvider = Provider.of<DestinationProvider>(context);

    return RefreshIndicator(
      onRefresh: _fetchAllData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHomeGradientHeader(),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Banner Slider
            if (bannerProvider.banners.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: SizedBox(
                  height: 240,
                  child: PageView.builder(
                    controller: _bannerPageController,
                    onPageChanged: (idx) =>
                        setState(() => _currentBannerIndex = idx),
                    itemCount: bannerProvider.banners.length,
                    itemBuilder: (context, index) {
                      final banner = bannerProvider.banners[index];
                      return GestureDetector(
                        onTap: () => _handleBannerTap(banner),
                        child: _buildHeroBannerCard(banner),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  bannerProvider.banners.length,
                  (idx) => Container(
                    width: _currentBannerIndex == idx ? 18 : 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: _currentBannerIndex == idx
                          ? AppTheme.primaryColor
                          : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // India & International destination rows (split by country).
            if (destinationProvider.isLoading)
              const Padding(
                padding: EdgeInsets.all(32.0),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (destinationProvider.destinations.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32.0),
                child: Center(
                  child: Text(
                    'No destinations available.',
                    style:
                        TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                ),
              )
            else ...[
              _buildDestinationScroller(
                'India Tours',
                'Top Destination',
                destinationProvider.destinations
                    .where((d) => d.country.trim().toLowerCase() == 'india')
                    .toList(),
              ),
              _buildDestinationScroller(
                'International Tours',
                'Top Destination',
                destinationProvider.destinations
                    .where((d) => d.country.trim().toLowerCase() != 'india')
                    .toList(),
              ),
            ],
            const SizedBox(height: 24),

            // Specialization Themes Horizontal Scroller
            if (themeProvider.themes.isNotEmpty) ...[
              SectionHeader(
                title: 'Specialization Themes',
                subtitle: 'Find tours tailored to your travel style',
                onSeeAll: () => setState(() => _currentIndex = 2),
              ),
              SizedBox(
                height: 210,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: themeProvider.themes.length > 6
                      ? 6
                      : themeProvider.themes.length,
                  itemBuilder: (context, index) {
                    final theme = themeProvider.themes[index];
                    final formattedUrl =
                        ApiConfig.formatImageUrl(theme.imageUrl);

                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ThemeDetailScreen(theme: theme),
                          ),
                        );
                      },
                      child: Container(
                        width: 155,
                        margin: const EdgeInsets.only(right: 14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: Stack(
                            children: [
                              Positioned.fill(
                                child: CachedNetworkImage(
                                  imageUrl: formattedUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) =>
                                      Container(color: Colors.grey[300]),
                                  errorWidget: (context, url, error) =>
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
                                        Colors.black.withValues(alpha: 0.25),
                                        Colors.black.withValues(alpha: 0.85),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 12,
                                left: 12,
                                right: 12,
                                child: Text(
                                  theme.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    height: 1.15,
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
              const SizedBox(height: 24),
            ],

            // Trending Tour Packages
            SectionHeader(
              title: 'Trending Tour Packages',
              subtitle: 'Exclusive deals curated for you',
              onSeeAll: () => setState(() => _currentIndex = 3),
            ),
            if (packageProvider.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (packageProvider.packages.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32.0),
                child: Center(
                  child: Text('No packages found matching your criteria.'),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: packageProvider.packages.length,
                itemBuilder: (context, index) {
                  final pkg = packageProvider.packages[index];
                  return PackageCard(
                    package: pkg,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PackageDetailScreen(package: pkg),
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ],
    ),
  ),
);
  }

  void _handleBannerTap(BannerModel banner) {
    final destinationProvider =
        Provider.of<DestinationProvider>(context, listen: false);
    final themeProvider =
        Provider.of<SpecializationThemeProvider>(context, listen: false);

    final titleLower = banner.title.toLowerCase();
    final subLower = (banner.subtitle ?? '').toLowerCase();
    final destNameLower = (banner.destinationName ?? '').toLowerCase();
    final destSlugLower = (banner.destinationSlug ?? '').toLowerCase();
    final destIdLower = (banner.destinationId ?? '').toLowerCase();

    // 1. Try finding matching destination by ID, Slug, or Name
    DestinationModel? matchedDest;

    if (destIdLower.isNotEmpty ||
        destSlugLower.isNotEmpty ||
        destNameLower.isNotEmpty) {
      matchedDest = destinationProvider.destinations.where((d) {
        final dId = d.id.toLowerCase();
        final dSlug = d.slug.toLowerCase();
        final dName = d.name.toLowerCase();
        return (destIdLower.isNotEmpty && dId == destIdLower) ||
            (destSlugLower.isNotEmpty && dSlug == destSlugLower) ||
            (destNameLower.isNotEmpty &&
                (dName.contains(destNameLower) ||
                    destNameLower.contains(dName)));
      }).firstOrNull;
    }

    // 2. If not matched yet, search for destination substring in banner title or subtitle
    matchedDest ??= destinationProvider.destinations.where((d) {
      final dName = d.name.toLowerCase().split(',')[0].trim();
      final dSlug = d.slug.toLowerCase().split('-')[0].trim();
      return titleLower.contains(dName) ||
          titleLower.contains(dSlug) ||
          subLower.contains(dName) ||
          subLower.contains(dSlug);
    }).firstOrNull;

    // If destination is matched, open DestinationDetailScreen!
    if (matchedDest != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DestinationDetailScreen(destination: matchedDest!),
        ),
      );
      return;
    }

    // 3. Try matching with themes
    final matchedTheme = themeProvider.themes.where((t) {
      final tName = t.name.toLowerCase().replaceAll('tour', '').trim();
      return titleLower.contains(tName) || subLower.contains(tName);
    }).firstOrNull;

    if (matchedTheme != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ThemeDetailScreen(theme: matchedTheme),
        ),
      );
      return;
    }

    // 4. Fallback: Open OfferPackagesScreen showing related offer packages for this banner
    final tag = banner.destinationName ?? banner.title;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OfferPackagesScreen(
          offerTitle: banner.title,
          filterTag: tag,
        ),
      ),
    );
  }

  Widget _buildHeroBannerCard(BannerModel banner) {
    final formattedUrl = ApiConfig.formatImageUrl(banner.imageUrl);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox.expand(
          child: CachedNetworkImage(
            imageUrl: formattedUrl,
            fit: BoxFit.cover,
            placeholder: (context, url) =>
                Container(color: Colors.grey.shade200),
            errorWidget: (context, url, error) => Image.network(
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop',
              fit: BoxFit.cover,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDestinationsGridTab() {
    final destinationProvider = Provider.of<DestinationProvider>(context);

    return Scaffold(
      appBar: AppTheme.gradientAppBar(title: 'All Destinations'),
      body: destinationProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : GridView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.85,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: destinationProvider.destinations.length,
              itemBuilder: (context, index) {
                final dest = destinationProvider.destinations[index];
                return DestinationCard(
                  destination: dest,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            DestinationDetailScreen(destination: dest),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
