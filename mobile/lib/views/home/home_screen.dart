import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
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

  @override
  void initState() {
    super.initState();
    _bannerPageController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchAllData();
    });
  }

  Future<void> _fetchAllData() async {
    await Future.wait([
      Provider.of<BannerProvider>(context, listen: false).fetchBanners(),
      Provider.of<SpecializationThemeProvider>(context, listen: false).fetchThemes(),
      Provider.of<DestinationProvider>(context, listen: false).fetchDestinations(),
      Provider.of<PackageProvider>(context, listen: false).fetchPackages(),
    ]);
    _startBannerAutoScroll();
  }

  void _startBannerAutoScroll() {
    _bannerTimer?.cancel();
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      final bannerProvider = Provider.of<BannerProvider>(context, listen: false);
      if (bannerProvider.banners.isNotEmpty && _bannerPageController.hasClients) {
        final nextIndex = (_currentBannerIndex + 1) % bannerProvider.banners.length;
        _bannerPageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerPageController.dispose();
    _searchController.dispose();
    super.dispose();
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
      _buildDestinationsGridTab(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: SafeArea(child: pages[_currentIndex]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openEnquirySheet,
        backgroundColor: AppTheme.accentColor,
        icon: const Icon(Icons.headset_mic_outlined, color: Colors.white),
        label: const Text('Enquire Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondary,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.card_travel), label: 'Packages'),
          BottomNavigationBarItem(icon: Icon(Icons.explore), label: 'Destinations'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
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
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
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
                      user != null ? 'Hello, ${user.firstName} 👋' : 'Welcome to HolidayCity 👋',
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
                    backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                    child: const Icon(Icons.person, color: AppTheme.primaryColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Search Bar
            TextField(
              controller: _searchController,
              onChanged: (val) => packageProvider.setSearchQuery(val),
              decoration: InputDecoration(
                hintText: 'Search destinations, packages...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          packageProvider.setSearchQuery('');
                        },
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 18),

            // Hero Banner Slider
            if (bannerProvider.banners.isNotEmpty) ...[
              SizedBox(
                height: 170,
                child: PageView.builder(
                  controller: _bannerPageController,
                  onPageChanged: (idx) => setState(() => _currentBannerIndex = idx),
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
                    return Container(
                      width: 140,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: DecorationImage(
                          image: NetworkImage(theme.imageUrl),
                          fit: BoxFit.cover,
                          colorFilter: ColorFilter.mode(
                            Colors.black.withValues(alpha: 0.35),
                            BlendMode.darken,
                          ),
                        ),
                      ),
                      child: InkWell(
                        onTap: () => packageProvider.setCategory(theme.name),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(10.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                theme.name,
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (theme.rating != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  theme.rating!,
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: Colors.amberAccent,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
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
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: destinationProvider.destinations.length,
                      itemBuilder: (context, index) {
                        final dest = destinationProvider.destinations[index];
                        return DestinationCard(
                          destination: dest,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DestinationDetailScreen(destination: dest),
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
              const Center(child: Padding(
                padding: EdgeInsets.all(32.0),
                child: CircularProgressIndicator(),
              ))
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
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        image: DecorationImage(
          image: NetworkImage(banner.imageUrl),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.35),
            BlendMode.darken,
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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
                        builder: (_) => DestinationDetailScreen(destination: dest),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
