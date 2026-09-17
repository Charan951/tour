import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../widgets/app_network_image.dart';
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
import '../../widgets/filter_sheet.dart';
import '../destinations/destination_detail_screen.dart';
import '../packages/package_detail_screen.dart';
import '../packages/package_list_screen.dart';
import '../profile/profile_screen.dart';
import '../auth/login_screen.dart';
import '../themes/theme_screen.dart';
import '../themes/theme_detail_screen.dart';
import 'banner_detail_screen.dart';
import '../activities/activity_list_screen.dart';
import '../activities/activity_detail_screen.dart';
import '../../models/activity_model.dart';
import '../../services/activity_service.dart';
import '../../providers/notification_provider.dart';
import '../notifications/notifications_screen.dart';
import '../../widgets/skeleton_loader.dart';

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
  final TextEditingController _destSearchController = TextEditingController();
  String _selectedDestFilter = 'All';

  List<ActivityModel> _homeActivities = [];
  final ActivityService _activityService = ActivityService();
  Timer? _autoSyncTimer;
  bool _isInitialLoading = true;

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
    _destSearchController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllData() async {
    final bannerProvider = Provider.of<BannerProvider>(context, listen: false);
    final themeProvider =
        Provider.of<SpecializationThemeProvider>(context, listen: false);
    final destProvider =
        Provider.of<DestinationProvider>(context, listen: false);
    final pkgProvider = Provider.of<PackageProvider>(context, listen: false);

    final results = await Future.wait([
      bannerProvider.fetchBanners(),
      themeProvider.fetchThemes(),
      destProvider.fetchDestinations(),
      pkgProvider.fetchPackages(),
      _activityService.fetchActivities(),
    ]);

    bannerProvider.startRealtimeUpdates();
    themeProvider.startRealtimeUpdates();
    destProvider.startRealtimeUpdates();
    pkgProvider.startRealtimeUpdates();

    if (mounted) {
      setState(() {
        _homeActivities = results[4] as List<ActivityModel>;
        _isInitialLoading = false;
      });

      // Set the logged-in user's email on NotificationProvider
      // so it can fetch user-specific notifications from the server
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
      final userEmail = authProvider.user?.email;
      notifProvider.setUserEmail(userEmail);
    }

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
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            try {
              precacheImage(NetworkImage(imageUrl), context);
            } catch (_) {}
          }
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
    final authProvider = Provider.of<AuthProvider>(context);
    final isGuest = authProvider.user == null;
    final hideBottomBar = isGuest && _currentIndex == 4;

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

    final cs = context.colors;

    return PopScope(
      // On the Home tab, let the back gesture close the app. On any other tab,
      // intercept it and jump back to the Home tab instead.
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _currentIndex != 0) {
          setState(() => _currentIndex = 0);
        }
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
            context.isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness:
            context.isDark ? Brightness.dark : Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: cs.scaffold,
        body: pages[_currentIndex],
        bottomNavigationBar: hideBottomBar
            ? null
            : SafeArea(
          top: false,
          left: true,
          right: true,
          bottom: true,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
            child: Container(
              height: 64,
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: cs.border.withValues(alpha: 0.9),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: cs.shadow,
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
                          onTap: () {
                            if (index == 4 && isGuest) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const LoginScreen()),
                              );
                            } else {
                              setState(() => _currentIndex = index);
                            }
                          },
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
                                      color: cs.textSecondary,
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
      ),
    );
  }

  Widget _buildHomeGradientHeader() {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final double topPadding = MediaQuery.of(context).padding.top;
    final String greetingName = (user != null && user.firstName.trim().isNotEmpty)
        ? user.firstName.trim()
        : 'Explorer';

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(16, topPadding + 12, 16, 20),
      decoration: BoxDecoration(
        gradient: AppTheme.headerGradient,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withValues(alpha: 0.15),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0A6FB5).withValues(alpha: 0.25),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Nav Row: Logo & Notifications
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'Holiday',
                      style: GoogleFonts.outfit(
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    TextSpan(
                      text: 'City',
                      style: GoogleFonts.outfit(
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF38BDF8),
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),

              Consumer<NotificationProvider>(
                builder: (context, notifProvider, child) {
                  final unread = notifProvider.unreadCount;
                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const NotificationsScreen(),
                        ),
                      );
                    },
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.35),
                              width: 1,
                            ),
                          ),
                          child: const Icon(
                            Icons.notifications_outlined,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        if (unread > 0)
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppTheme.primaryDarkColor,
                                  width: 1.5,
                                ),
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 18,
                                minHeight: 18,
                              ),
                              child: Text(
                                unread > 9 ? '9+' : '$unread',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  height: 1.0,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Greeting
          Text(
            'Hello, $greetingName 👋',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(
              fontSize: 23,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.4,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            'Where do you want to travel next?',
            style: GoogleFonts.inter(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: 16),

          // Search bar
          Container(
            height: 46,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.4),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const SizedBox(width: 14),
                const Icon(Icons.search_rounded,
                    size: 20,
                    color: AppTheme.primaryColor),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    textAlignVertical: TextAlignVertical.center,
                    onChanged: (val) {
                      Provider.of<PackageProvider>(context, listen: false)
                          .setSearchQuery(val);
                    },
                    onSubmitted: (val) {
                      Provider.of<PackageProvider>(context, listen: false)
                          .setSearchQuery(val);
                      setState(() => _currentIndex = 3);
                    },
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      filled: false,
                      isCollapsed: true,
                      hintText:
                          'Search packages, destinations, activities...',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      _searchController.clear();
                      Provider.of<PackageProvider>(context, listen: false)
                          .setSearchQuery('');
                      setState(() {});
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: const Icon(Icons.close_rounded,
                          size: 18, color: Color(0xFF64748B)),
                    ),
                  )
                else
                  const SizedBox(width: 14),
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
          height: 195,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final dest = items[index];

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
                  width: 142,
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
                          child: AppNetworkImage(
                            imageUrl: dest.image,
                            fit: BoxFit.cover,
                            targetWidth: 400,
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

    if (_isInitialLoading && packageProvider.packages.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchAllData,
        child: const HomeScreenSkeleton(),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchAllData,
      // CustomScrollView so the Trending Packages list builds its cards
      // lazily as they scroll into view (the horizontal rails above are
      // already lazy ListView.builders).
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
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
                const SectionHeader(
                  title: 'Exclusive Offers',
                  eyebrow: 'Exclusive Offers',
                  subtitle: 'Limited-time deals on top tours',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: SizedBox(
                    height: 148,
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
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    bannerProvider.banners.length,
                    (idx) => AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: _currentBannerIndex == idx ? 22 : 6,
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
              Padding(
                padding: const EdgeInsets.all(32.0),
                child: Center(
                  child: Text(
                    'No destinations available.',
                    style:
                        TextStyle(color: context.colors.textSecondary, fontSize: 13),
                  ),
                ),
              )
            else ...[
              _buildDestinationScroller(
                'India Tours',
                'Domestic Destinations',
                destinationProvider.destinations
                    .where((d) => d.country.trim().toLowerCase() == 'india')
                    .toList(),
              ),
              _buildDestinationScroller(
                'International Tours',
                'International Destinations',
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
                eyebrow: 'Specialization Themes',
                subtitle: 'Find tours tailored to your travel style',
                onSeeAll: () => setState(() => _currentIndex = 2),
              ),
              SizedBox(
                height: 195,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: themeProvider.themes.length > 6
                      ? 6
                      : themeProvider.themes.length,
                  itemBuilder: (context, index) {
                    final theme = themeProvider.themes[index];

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
                        width: 142,
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
                                child: AppNetworkImage(
                                  imageUrl: theme.imageUrl,
                                  fit: BoxFit.cover,
                                  targetWidth: 400,
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

            if (_homeActivities.isNotEmpty) ...[
              SectionHeader(
                title: 'Adventure Activities',
                eyebrow: 'Adventure Activities',
                subtitle: 'Bungee jumping, scuba diving, rafting & safari',
                onSeeAll: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ActivityListScreen()),
                  );
                },
              ),
              SizedBox(
                height: 182,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: _homeActivities.length,
                  itemBuilder: (context, idx) {
                    final act = _homeActivities[idx];
                    return _buildActivityQuickCard(
                      title: act.title,
                      location: act.destinationName.isNotEmpty ? act.destinationName : act.location,
                      priceText: '₹${act.price.toInt()}',
                      badge: act.category,
                      imageUrl: ApiConfig.formatImageUrl(act.coverImage),
                      color: AppTheme.primaryColor,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ActivityDetailScreen(activity: act),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Trending Tour Packages
            SectionHeader(
              title: 'Trending Packages',
              eyebrow: 'Trending Packages',
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
              ),
            ],
          ),
        ),
      ],
    ),
  ),
          if (!packageProvider.isLoading && packageProvider.packages.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList.builder(
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
            ),
          SliverToBoxAdapter(
            child: _buildHowToBookSection(),
          ),
        ],
      ),
    );
  }

  Widget _buildHowToBookSection() {
    final cs = context.colors;
    final isDark = context.isDark;

    final steps = [
      {
        'num': '01',
        'title': 'Explore & Select',
        'desc': 'Browse top tours, themes & thrill activities.',
        'icon': Icons.travel_explore_rounded,
        'color': const Color(0xFF0284C7),
        'bg': const Color(0xFFE0F2FE),
      },
      {
        'num': '02',
        'title': 'Customize Trip',
        'desc': 'Request custom dates, quotes or itineraries.',
        'icon': Icons.edit_calendar_rounded,
        'color': const Color(0xFF4F46E5),
        'bg': const Color(0xFFEEF2FF),
      },
      {
        'num': '03',
        'title': 'Confirm & Pay',
        'desc': 'Instant booking confirmation & secure balance.',
        'icon': Icons.verified_user_rounded,
        'color': const Color(0xFF059669),
        'bg': const Color(0xFFD1FAE5),
      },
      {
        'num': '04',
        'title': 'Travel & Enjoy',
        'desc': '24/7 direct admin chat support during your trip.',
        'icon': Icons.flight_takeoff_rounded,
        'color': const Color(0xFFEA580C),
        'bg': const Color(0xFFFFEDD5),
      },
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(
            title: 'How to Book in 4 Easy Steps',
            eyebrow: 'Simple Booking Process',
            subtitle: 'Book your dream trip hassle-free in minutes',
          ),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: steps.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.25,
            ),
            itemBuilder: (context, index) {
              final step = steps[index];
              final stepColor = step['color'] as Color;
              final stepBg = step['bg'] as Color;
              final stepIcon = step['icon'] as IconData;

              return Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: cs.border),
                  boxShadow: [
                    BoxShadow(
                      color: cs.shadow,
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark
                                ? Color.alphaBlend(
                                    stepColor.withValues(alpha: 0.2), cs.surface)
                                : stepBg,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Icon(stepIcon, color: stepColor, size: 16),
                        ),
                        Text(
                          step['num'] as String,
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: stepColor,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['title'] as String,
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: cs.textPrimary,
                            height: 1.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          step['desc'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: cs.textSecondary,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _handleBannerTap(BannerModel banner) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BannerDetailScreen(banner: banner),
      ),
    );
  }

  Widget _buildHeroBannerCard(BannerModel banner) {

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: AppNetworkImage(
          imageUrl: banner.imageUrl,
          fit: BoxFit.cover,
          targetWidth: 600,
        ),
      ),
    );
  }

  Widget _buildDestinationsGridTab() {
    final destinationProvider = Provider.of<DestinationProvider>(context);
    final allDestinations = destinationProvider.destinations;
    final query = _destSearchController.text.trim().toLowerCase();

    final filteredDestinations = allDestinations.where((dest) {
      final matchesSearch = query.isEmpty ||
          dest.name.toLowerCase().contains(query) ||
          dest.state.toLowerCase().contains(query) ||
          dest.country.toLowerCase().contains(query) ||
          dest.description.toLowerCase().contains(query);

      bool matchesCategory = true;
      if (_selectedDestFilter == 'Popular') {
        matchesCategory = dest.isPopular;
      } else if (_selectedDestFilter == 'Domestic') {
        matchesCategory = dest.country.toLowerCase() == 'india';
      } else if (_selectedDestFilter == 'International') {
        matchesCategory = dest.country.toLowerCase() != 'india';
      }

      return matchesSearch && matchesCategory;
    }).toList();

    final filterOptions = const ['All', 'Popular', 'Domestic', 'International'];
    final cs = context.colors;

    return Scaffold(
      appBar: AppTheme.gradientAppBar(context: context, title: 'All Destinations'),
      body: destinationProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: 100),
              children: [
                // Blue Header Container extending up to the search bar & filter
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
                  decoration: const BoxDecoration(
                    gradient: AppTheme.headerGradient,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(28),
                      bottomRight: Radius.circular(28),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const SizedBox(width: 14),
                              const Icon(Icons.search_rounded,
                                  size: 20, color: Color(0xFF64748B)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextField(
                                  controller: _destSearchController,
                                  textInputAction: TextInputAction.search,
                                  textAlignVertical: TextAlignVertical.center,
                                  onChanged: (_) => setState(() {}),
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF0F172A),
                                  ),
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                    filled: false,
                                    isCollapsed: true,
                                    hintText: 'Search destinations...',
                                    hintStyle: GoogleFonts.inter(
                                      fontSize: 13.5,
                                      color: const Color(0xFFADB5BD),
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                              if (_destSearchController.text.isNotEmpty)
                                GestureDetector(
                                  onTap: () {
                                    _destSearchController.clear();
                                    setState(() {});
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10),
                                    child: Icon(Icons.close_rounded,
                                        size: 18, color: Color(0xFF64748B)),
                                  ),
                                )
                              else
                                const SizedBox(width: 14),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilterIconButton(
                        active: _selectedDestFilter != 'All',
                        onTap: () async {
                          final picked = await showFilterSheet(
                            context,
                            title: 'Filter destinations',
                            options: filterOptions,
                            selected: _selectedDestFilter,
                          );
                          if (picked != null) {
                            setState(() => _selectedDestFilter = picked);
                          }
                        },
                      ),
                    ],
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Column(
                    children: [
                      if (filteredDestinations.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.location_off_outlined,
                                  size: 48,
                                  color: Colors.grey.shade400,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No destinations found',
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: cs.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Try searching with a different term or filter',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: cs.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.85,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: filteredDestinations.length,
                          itemBuilder: (context, index) {
                            final dest = filteredDestinations[index];
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
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildActivityQuickCard({
    required String title,
    required String location,
    required String priceText,
    required String badge,
    required String imageUrl,
    required Color color,
    VoidCallback? onTap,
  }) {
    final cs = context.colors;
    return GestureDetector(
      onTap: onTap ??
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ActivityListScreen()),
            );
          },
      child: Container(
        width: 170,
        margin: const EdgeInsets.only(right: 14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: cs.border),
          boxShadow: [
            BoxShadow(
              color: cs.shadow,
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  SizedBox(
                    height: 92,
                    width: double.infinity,
                    child: AppNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      targetWidth: 300,
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badge,
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: cs.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        color: cs.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          priceText,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const ActivityListScreen()),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
                                ),
                                child: const Text(
                                  'Enquire',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Book',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
