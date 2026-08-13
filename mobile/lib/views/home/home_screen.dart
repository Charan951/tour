import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/banner_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/destination_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../widgets/destination_card.dart';
import '../../widgets/package_card.dart';
import '../../widgets/section_header.dart';
import '../destinations/destination_detail_screen.dart';
import '../enquiry/enquiry_bottom_sheet.dart';
import '../packages/package_detail_screen.dart';
import '../packages/package_list_screen.dart';
import '../profile/profile_screen.dart';
import '../themes/theme_screen.dart';

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

  final List<String> _categories = [
    'All',
    'Honeymoon',
    'Family',
    'Adventure',
    'Wildlife',
    'Beach',
    'Heritage'
  ];

  Timer? _autoSyncTimer;

  @override
  void initState() {
    super.initState();
    _bannerPageController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchAllData();
      _autoSyncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
        if (mounted) {
          _fetchAllData();
        }
      });
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
    await Future.wait([
      Provider.of<BannerProvider>(context, listen: false).fetchBanners(),
      Provider.of<SpecializationThemeProvider>(context, listen: false)
          .fetchThemes(),
      Provider.of<DestinationProvider>(context, listen: false)
          .fetchDestinations(),
      Provider.of<PackageProvider>(context, listen: false).fetchPackages(),
    ]);
    _startBannerAutoScroll();
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

  void _openEnquirySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const EnquiryBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildHomeContent(),
      const PackageListScreen(),
      const ThemeScreen(),
      _buildDestinationsGridTab(),
      const ProfileScreen(),
    ];

    final navItems = const [
      _BottomNavItem(icon: Icons.home_filled, label: 'Home', selected: false),
      _BottomNavItem(
          icon: Icons.card_travel, label: 'Packages', selected: false),
      _BottomNavItem(
          icon: Icons.palette_outlined, label: 'Themes', selected: false),
      _BottomNavItem(
          icon: Icons.explore, label: 'Destinations', selected: false),
      _BottomNavItem(icon: Icons.person, label: 'Profile', selected: false),
    ];

    final selectedNavItems = navItems.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      return _BottomNavItem(
        icon: item.icon,
        label: item.label,
        selected: _currentIndex == index,
      );
    }).toList();

    return Scaffold(
      body: SafeArea(child: pages[_currentIndex]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openEnquirySheet,
        backgroundColor: AppTheme.accentColor,
        icon: const Icon(Icons.headset_mic_outlined, color: Colors.white),
        label: const Text('Enquire Now',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
          child: Container(
            height: 78,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                  color: AppTheme.borderLight.withValues(alpha: 0.9), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  offset: const Offset(0, -2),
                  blurRadius: 16,
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(selectedNavItems.length, (index) {
                final item = selectedNavItems[index];
                final isSelected = item.selected;

                return Expanded(
                  child: Semantics(
                    label: item.label,
                    button: true,
                    selected: isSelected,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setState(() => _currentIndex = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeInOut,
                        height: 52,
                        margin: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 4),
                        padding: EdgeInsets.symmetric(
                          horizontal: isSelected ? 8 : 0,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppTheme.primaryColor.withValues(alpha: 0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: isSelected
                              ? Column(
                                  key: const ValueKey('selected'),
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Icon(
                                      item.icon,
                                      size: 20,
                                      color: AppTheme.primaryColor,
                                    ),
                                    const SizedBox(height: 2),
                                    ConstrainedBox(
                                      constraints: const BoxConstraints(
                                        maxWidth: 56,
                                      ),
                                      child: Text(
                                        item.label,
                                        textAlign: TextAlign.center,
                                        softWrap: true,
                                        maxLines: 2,
                                        overflow: TextOverflow.visible,
                                        style: const TextStyle(
                                          fontSize: 8.5,
                                          height: 1.1,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.primaryColor,
                                          letterSpacing: 0.1,
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              : Icon(
                                  key: const ValueKey('unselected'),
                                  item.icon,
                                  size: 24,
                                  color: AppTheme.textSecondary,
                                ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeContent() {
    final authProvider = Provider.of<AuthProvider>(context);
    final bannerProvider = Provider.of<BannerProvider>(context);
    final themeProvider = Provider.of<SpecializationThemeProvider>(context);
    final packageProvider = Provider.of<PackageProvider>(context);
    final destinationProvider = Provider.of<DestinationProvider>(context);

    final user = authProvider.user;

    return RefreshIndicator(
      onRefresh: _fetchAllData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset(
                      'assets/images/logo.png',
                      height: 55,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor
                                    .withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.flight_takeoff_rounded,
                                color: Color(0xFF26C6DA),
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 8),
                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Holiday',
                                    style: GoogleFonts.outfit(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.primaryColor,
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'City',
                                    style: GoogleFonts.outfit(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF26C6DA),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user != null
                          ? 'Hello, ${user.firstName} 👋'
                          : 'Welcome to HolidayCity 👋',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => setState(() => _currentIndex = 3),
                  child: CircleAvatar(
                    backgroundColor:
                        AppTheme.primaryColor.withValues(alpha: 0.1),
                    child:
                        const Icon(Icons.person, color: AppTheme.primaryColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Hero Banner Slider
            if (bannerProvider.banners.isNotEmpty) ...[
              SizedBox(
                height: 170,
                child: PageView.builder(
                  controller: _bannerPageController,
                  onPageChanged: (idx) =>
                      setState(() => _currentBannerIndex = idx),
                  itemCount: bannerProvider.banners.length,
                  itemBuilder: (context, index) {
                    final banner = bannerProvider.banners[index];
                    return _buildHeroBannerCard(banner);
                  },
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

            // Specialization Themes Section
            if (themeProvider.themes.isNotEmpty) ...[
              SectionHeader(
                title: 'Specialization Themes',
                subtitle: 'Find tours tailored to your travel style',
                onSeeAll: () => setState(() => _currentIndex = 1),
              ),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: themeProvider.themes.length,
                  itemBuilder: (context, index) {
                    final theme = themeProvider.themes[index];
                    final formattedUrl =
                        ApiConfig.formatImageUrl(theme.imageUrl);
                    return Container(
                      width: 140,
                      margin: const EdgeInsets.only(right: 12),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Stack(
                          children: [
                            CachedNetworkImage(
                              imageUrl: formattedUrl,
                              width: 140,
                              height: 110,
                              fit: BoxFit.cover,
                              placeholder: (context, url) =>
                                  Container(color: Colors.grey.shade200),
                              errorWidget: (context, url, error) =>
                                  Image.network(
                                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop',
                                fit: BoxFit.cover,
                              ),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.black.withValues(alpha: 0.6),
                                    Colors.transparent,
                                  ],
                                  begin: Alignment.bottomCenter,
                                  end: Alignment.topCenter,
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 8,
                              left: 8,
                              right: 8,
                              child: Text(
                                theme.name,
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Category Filter Chips
            SizedBox(
              height: 38,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = packageProvider.selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text(cat),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.textPrimary,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                      selectedColor: AppTheme.primaryColor,
                      backgroundColor: const Color(0xFFF1F5F9),
                      onSelected: (_) => packageProvider.setCategory(cat),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Popular Destinations Horizontal Scroll
            SectionHeader(
              title: 'Popular Destinations',
              subtitle: 'Top places travelers are loving',
              onSeeAll: () => setState(() => _currentIndex = 2),
            ),
            SizedBox(
              height: 200,
              child: destinationProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : destinationProvider.destinations.isEmpty
                      ? const Center(
                          child: Text(
                            'No destinations available.',
                            style: TextStyle(
                                color: AppTheme.textSecondary, fontSize: 13),
                          ),
                        )
                      : ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: destinationProvider.destinations.length,
                          itemBuilder: (context, index) {
                            final dest =
                                destinationProvider.destinations[index];
                            return DestinationCard(
                              destination: dest,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => DestinationDetailScreen(
                                        destination: dest),
                                  ),
                                );
                              },
                            );
                          },
                        ),
            ),
            const SizedBox(height: 24),

            // Trending Tour Packages
            SectionHeader(
              title: 'Trending Tour Packages',
              subtitle: 'Exclusive deals curated for you',
              onSeeAll: () => setState(() => _currentIndex = 1),
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
    );
  }

  Widget _buildHeroBannerCard(BannerModel banner) {
    final formattedUrl = ApiConfig.formatImageUrl(banner.imageUrl);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Positioned.fill(
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
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.7),
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.4),
                    ],
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.accentColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'FEATURED DEAL',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    banner.title,
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (banner.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      banner.subtitle!,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.white70,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDestinationsGridTab() {
    final destinationProvider = Provider.of<DestinationProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('All Destinations')),
      body: destinationProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.8,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
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
