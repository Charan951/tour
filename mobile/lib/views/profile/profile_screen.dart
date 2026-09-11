import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/enquiry_service.dart';
import '../legal/legal_screen.dart';
import '../../services/booking_service.dart';
import '../auth/login_screen.dart';
import '../booking/my_bookings_screen.dart';
import '../enquiry/my_enquiries_screen.dart';
import '../chat/chat_bottom_sheet.dart';
import '../activities/activity_list_screen.dart';
import '../notifications/notifications_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with WidgetsBindingObserver {
  final _ipController = TextEditingController();
  final EnquiryService _enquiryService = EnquiryService();
  final BookingService _bookingService = BookingService();

  late List<EnquiryModel> _userEnquiries;
  List<Map<String, dynamic>> _userBookings = [];

  Timer? _enquiryStatusListener;
  bool _isInitialLoadComplete = false;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _userEnquiries = [];
    _userBookings = [];
    WidgetsBinding.instance.addObserver(this);
    _ipController.text = ApiConfig.customHost ?? '';

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user?.email != null) {
      _userEnquiries = EnquiryService.getCachedEnquiries(user!.email);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserData();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadUserData();
    }
  }

  void _startEnquiryStatusListener() {
    if (!_isInitialLoadComplete) return;

    _enquiryStatusListener?.cancel();
    _enquiryStatusListener = Timer.periodic(
      const Duration(seconds: 30),
      (_) async {
        if (!mounted) return;
        try {
          final authUser =
              Provider.of<AuthProvider>(context, listen: false).user;
          final enquiries = await _enquiryService.getProfileEnquiries(
            role: authUser?.role,
            email: authUser?.email,
          );
          final bookings =
              await _bookingService.getUserBookings(email: authUser?.email);
          if (mounted) {
            setState(() {
              _userEnquiries = enquiries;
              _userBookings = bookings;
            });
          }
        } catch (_) {}
      },
    );
  }

  Future<void> _loadUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final packageProvider =
        Provider.of<PackageProvider>(context, listen: false);

    unawaited(authProvider.fetchCurrentUser());
    unawaited(packageProvider.fetchPackages());

    final user = authProvider.user;
    if (mounted) {
      if (user?.email != null) {
        unawaited(
          _enquiryService
              .getProfileEnquiries(
            role: user!.role,
            email: user.email,
          )
              .then((enquiries) {
            if (mounted) {
              setState(() {
                _userEnquiries = enquiries;
                if (!_isInitialLoadComplete) {
                  _isInitialLoadComplete = true;
                  _startEnquiryStatusListener();
                }
              });
            }
          }).catchError((_) {}),
        );
      }

      unawaited(
        _bookingService.getUserBookings(email: user?.email).then((bookings) {
          if (mounted) {
            setState(() {
              _userBookings = bookings;
            });
          }
        }).catchError((_) {}),
      );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _ipController.dispose();
    _enquiryStatusListener?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _showServerConfigDialog() {
    ApiConfig.showServerConfigDialog(
      context,
      onSaved: () => setState(() {}),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (user == null) {
      return const LoginScreen();
    }

    return _buildSignedInProfile(context, authProvider, user);
  }



  /// Redesigned Signed-In Profile View matching user image layout with top modern aesthetics
  Widget _buildSignedInProfile(
      BuildContext context, AuthProvider authProvider, dynamic user) {
    void openEdit() => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
        );

    final userName = user.displayName;
    final displayPhone =
        user.mobile.isNotEmpty ? user.mobile : '9632508978';
    final displayAddress =
        user.city.isNotEmpty ? user.city : 'Add address';

    final cs = context.colors;

    return Scaffold(
      backgroundColor: cs.scaffold,
      body: RefreshIndicator(
        onRefresh: _loadUserData,
        color: AppTheme.primaryColor,
        child: SingleChildScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Vibrant Top Header with subtle ambient circles backdrop
              Stack(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 52, 20, 52),
                    decoration: const BoxDecoration(
                      gradient: AppTheme.headerGradient,
                      borderRadius: AppTheme.headerRadius,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onLongPress: _showServerConfigDialog,
                          child: Text(
                            'My Profile & Account',
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Manage your account, bookings and preferences.',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.white.withValues(alpha: 0.88),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Decorative glowing light overlay elements in header
                  Positioned(
                    top: -30,
                    right: -20,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                  ),
                ],
              ),

              // Overlapping Profile Identity Card
              Transform.translate(
                offset: const Offset(0, -28),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Column(
                    children: [
                      // User Identity Card Container
                      Container(
                        width: double.infinity,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          color: cs.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: cs.border),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0A6FB5)
                                  .withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Top vibrant ocean blue header area containing Profile Avatar, User info & Edit Profile
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 16),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFF064B88),
                                    Color(0xFF0A6FB5),
                                    Color(0xFF0284C7),
                                  ],
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Profile Initial Avatar
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white, width: 2.5),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black
                                              .withValues(alpha: 0.2),
                                          blurRadius: 10,
                                          offset: const Offset(0, 3),
                                        ),
                                      ],
                                    ),
                                    child: CircleAvatar(
                                      radius: 30,
                                      backgroundColor: Colors.white,
                                      child: Text(
                                        userName.trim().isNotEmpty
                                            ? userName.trim()[0].toUpperCase()
                                            : 'U',
                                        style: GoogleFonts.outfit(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.primaryColor,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),

                                  // Name, Email & Verified Pill
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          userName,
                                          style: GoogleFonts.outfit(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            height: 1.1,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          user.email,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: Colors.white
                                                .withValues(alpha: 0.85),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: Colors.white
                                                .withValues(alpha: 0.2),
                                            borderRadius:
                                                BorderRadius.circular(999),
                                            border: Border.all(
                                                color: Colors.white
                                                    .withValues(alpha: 0.3)),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(
                                                Icons.check_circle_rounded,
                                                size: 12,
                                                color: Color(0xFF34D399),
                                              ),
                                              const SizedBox(width: 3),
                                              Text(
                                                'VERIFIED',
                                                style: GoogleFonts.outfit(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w900,
                                                  letterSpacing: 0.5,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Edit Profile Button
                                  ElevatedButton.icon(
                                    onPressed: openEdit,
                                    icon: const Icon(
                                      Icons.edit_outlined,
                                      size: 13,
                                      color: Colors.white,
                                    ),
                                    label: const Text('Edit Profile'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white
                                          .withValues(alpha: 0.22),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 6),
                                      textStyle: GoogleFonts.outfit(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        side: BorderSide(
                                            color: Colors.white
                                                .withValues(alpha: 0.4)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Phone & Address Row Tiles
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                              child: Column(
                                children: [
                                  _detailRowTile(
                                    icon: Icons.phone_android_rounded,
                                    iconBgColor: const Color(0xFFEEF2FF),
                                    iconColor: const Color(0xFF4F46E5),
                                    label: 'Phone Number',
                                    value: displayPhone,
                                  ),
                                  Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 2),
                                    child: Divider(height: 1, color: cs.border),
                                  ),
                                  _detailRowTile(
                                    icon: Icons.location_on_rounded,
                                    iconBgColor: const Color(0xFFECFEFF),
                                    iconColor: const Color(0xFF0891B2),
                                    label: 'Address',
                                    value: displayAddress,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Compact Stat Cards Grid: ENQUIRIES & BOOKINGS
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.forum_rounded,
                              iconBgColor: const Color(0xFFE0F2FE),
                              iconColor: const Color(0xFF0284C7),
                              count: _userEnquiries.length.toString(),
                              label: 'ENQUIRIES',
                              cta: 'View',
                              ctaColor: AppTheme.primaryColor,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const MyEnquiriesScreen(),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.shopping_bag_rounded,
                              iconBgColor: const Color(0xFFEEF2FF),
                              iconColor: const Color(0xFF4F46E5),
                              count: _userBookings.length.toString(),
                              label: 'BOOKINGS',
                              cta: 'View',
                              ctaColor: const Color(0xFF4F46E5),
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const MyBookingsScreen(),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Section Header: My travel activity
                      _buildSectionHeader('My travel activity'),
                      const SizedBox(height: 8),
                      _buildGroupedCard([

                        _buildRow(
                          icon: Icons.assignment_turned_in_rounded,
                          iconBgColor: const Color(0xFFE0F2FE),
                          iconColor: const Color(0xFF0284C7),
                          title: 'My Enquiries & Custom Quotes',
                          subtitle: 'Trip quotes, responses & status',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const MyEnquiriesScreen(),
                            ),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.shopping_bag_rounded,
                          iconBgColor: const Color(0xFFEEF2FF),
                          iconColor: const Color(0xFF4F46E5),
                          title: 'My Bookings & Payments',
                          subtitle: 'Active bookings, payment status & balance',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const MyBookingsScreen(),
                            ),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.bolt_rounded,
                          iconBgColor: const Color(0xFFFFEDD5),
                          iconColor: const Color(0xFFEA580C),
                          title: 'Thrill Activities & Sports',
                          subtitle: 'Bungee jumping, rafting, diving & booking',
                          badgeText: 'HOT',
                          badgeColor: const Color(0xFFEA580C),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ActivityListScreen(),
                            ),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.notifications_active_rounded,
                          iconBgColor: const Color(0xFFF3E8FF),
                          iconColor: const Color(0xFF9333EA),
                          title: 'Notifications & Updates',
                          subtitle: 'Real-time booking and enquiry status alerts',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NotificationsScreen(),
                            ),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 20),

                      // Section Header: Account
                      _buildSectionHeader('Account'),
                      const SizedBox(height: 8),
                      _buildGroupedCard([
                        _buildThemeToggleRow(),
                        _buildRow(
                          icon: Icons.support_agent_rounded,
                          iconBgColor: const Color(0xFFDBEAFE),
                          iconColor: const Color(0xFF2563EB),
                          title: 'Customer support',
                          subtitle: '24/7 Direct Admin Chat & Support',
                          badgeText: 'LIVE 24/7',
                          badgeColor: const Color(0xFF2563EB),
                          onTap: () {
                            ChatBottomSheet.show(
                              context,
                              topicId: 'GENERAL-SUPPORT',
                              topicType: 'General',
                              topicTitle: 'Customer Support',
                              customerName: userName,
                              customerEmail: user.email,
                            );
                          },
                        ),
                        _buildRow(
                          icon: Icons.shield_outlined,
                          iconBgColor: const Color(0xFFF1F5F9),
                          iconColor: const Color(0xFF475569),
                          title: 'Privacy Policy',
                          subtitle: 'How we handle your data',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => LegalScreen.privacy(),
                            ),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.description_outlined,
                          iconBgColor: const Color(0xFFF1F5F9),
                          iconColor: const Color(0xFF475569),
                          title: 'Terms & Conditions',
                          subtitle: 'The rules for using HolidayCity',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => LegalScreen.terms(),
                            ),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.logout_rounded,
                          iconBgColor: const Color(0xFFFEE2E2),
                          iconColor: AppTheme.errorColor,
                          title: 'Log out',
                          subtitle: 'Sign out of your account on this device',
                          titleColor: AppTheme.errorColor,
                          onTap: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20)),
                                title: const Text('Log out'),
                                content: const Text(
                                    'Are you sure you want to log out?'),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(ctx, false),
                                    child: const Text('Cancel'),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.errorColor),
                                    onPressed: () => Navigator.pop(ctx, true),
                                    child: const Text('Log Out'),
                                  ),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              await authProvider.logout();
                              if (!context.mounted) return;
                              Navigator.pushAndRemoveUntil(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const LoginScreen()),
                                (route) => false,
                              );
                            }
                          },
                        ),
                        _buildRow(
                          icon: Icons.delete_forever_rounded,
                          iconBgColor: const Color(0xFFFEE2E2),
                          iconColor: AppTheme.errorColor,
                          title: 'Delete account',
                          subtitle:
                              'Permanently delete your account and personal data',
                          titleColor: AppTheme.errorColor,
                          onTap: () => _confirmDeleteAccount(context, authProvider),
                        ),
                      ]),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDeleteAccount(
      BuildContext context, AuthProvider authProvider) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete account?'),
        content: const Text(
          'This permanently deletes your HolidayCity account and personal '
          'profile data. Your existing booking and enquiry records are kept in '
          'anonymised form where the law requires it. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    final error = await authProvider.deleteAccount();
    if (!context.mounted) return;
    Navigator.pop(context); // dismiss the spinner

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.errorColor),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Your account has been deleted.')),
    );
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(
          width: 3.5,
          height: 15,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildGroupedCard(List<Widget> rows) {
    final cs = context.colors;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cs.border),
        boxShadow: [
          BoxShadow(
            color: cs.shadow,
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: cs.surface,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            for (var i = 0; i < rows.length; i++) ...[
              rows[i],
              if (i != rows.length - 1)
                Divider(height: 1, color: cs.border),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildThemeToggleRow() {
    final cs = context.colors;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isEffectivelyDark(context);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: cs.surfaceAlt,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
          color: isDark ? const Color(0xFFFACC15) : const Color(0xFFF59E0B),
          size: 18,
        ),
      ),
      title: Text(
        'Dark mode',
        style: GoogleFonts.outfit(
          fontWeight: FontWeight.bold,
          fontSize: 13.5,
          color: cs.textPrimary,
        ),
      ),
      subtitle: Text(
        isDark ? 'On' : 'Off',
        style: TextStyle(fontSize: 11, color: cs.textSecondary),
      ),
      trailing: Switch.adaptive(
        value: isDark,
        activeThumbColor: AppTheme.primaryColor,
        onChanged: (v) => themeProvider
            .setThemeMode(v ? ThemeMode.dark : ThemeMode.light),
      ),
      onTap: () => themeProvider
          .setThemeMode(isDark ? ThemeMode.light : ThemeMode.dark),
    );
  }

  Widget _buildRow({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String title,
    String? subtitle,
    Color? titleColor,
    String? badgeText,
    Color? badgeColor,
    required VoidCallback onTap,
  }) {
    final cs = context.colors;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: context.isDark
              ? Color.alphaBlend(iconColor.withValues(alpha: 0.18), cs.surface)
              : iconBgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.bold,
                fontSize: 13.5,
                color: titleColor ?? cs.textPrimary,
              ),
            ),
          ),
          if (badgeText != null) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: (badgeColor ?? AppTheme.primaryColor)
                    .withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                badgeText,
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w900,
                  color: badgeColor ?? AppTheme.primaryColor,
                ),
              ),
            ),
          ],
        ],
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: cs.textSecondary,
              ),
            )
          : null,
      trailing: Icon(
        Icons.chevron_right_rounded,
        color: cs.textSecondary,
        size: 18,
      ),
      onTap: onTap,
    );
  }

  Widget _detailRowTile({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String label,
    required String value,
    VoidCallback? onTap,
  }) {
    final cs = context.colors;
    final content = Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: context.isDark
                  ? Color.alphaBlend(
                      iconColor.withValues(alpha: 0.18), cs.surface)
                  : iconBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: cs.textFaint,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: cs.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: content,
      );
    }
    return content;
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String count,
    required String label,
    required String cta,
    required Color ctaColor,
    required VoidCallback onTap,
  }) {
    final cs = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.border),
        boxShadow: [
          BoxShadow(
            color: cs.shadow,
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 16),
              ),
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: ctaColor,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            count,
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: cs.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.6,
              color: cs.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      cta,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: ctaColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 2),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 12,
                    color: ctaColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

}
