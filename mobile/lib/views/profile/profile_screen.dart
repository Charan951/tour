import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/package_provider.dart';
import '../../services/enquiry_service.dart';
import '../legal/legal_screen.dart';
import '../../services/booking_service.dart';
import '../auth/login_screen.dart';
import '../booking/my_bookings_screen.dart';
import '../enquiry/my_enquiries_screen.dart';
import '../chat/chat_bottom_sheet.dart';
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

  // Signed-out state defaults to a plain menu; tapping "Log in" shows the
  // real login form (LoginScreen embedded inline), matching the web
  // UserDashboardPage.tsx menu -> auth-form flow.
  bool _showLoginForm = false;

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
          final bookings = await _bookingService.getUserBookings(email: authUser?.email);
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Configure Backend Server'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify host IP address if testing on physical mobile device:',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ipController,
              decoration: const InputDecoration(
                hintText: 'e.g. 192.168.1.10',
                labelText: 'Host Local IP Address',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Current Active Base URL: ${ApiConfig.baseUrl}',
              style:
                  const TextStyle(fontSize: 11, color: AppTheme.primaryColor),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ApiConfig.customHost = _ipController.text.trim();
              Navigator.pop(context);
              setState(() {});
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content:
                      Text('Server endpoint updated to: ${ApiConfig.baseUrl}'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('Save Host'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (user == null) {
      return _showLoginForm ? _buildInlineLoginForm() : _buildSignedOutMenu();
    }

    return _buildSignedInProfile(context, authProvider, user);
  }

  /// Signed-out default: a plain white "menu" — Log in action + quick links.
  /// Matches the web version's menu-first UX (no login form shown until the
  /// user explicitly taps "Log in").
  Widget _buildSignedOutMenu() {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Account'),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppTheme.headerGradient,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Plan trips. Track quotes.',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Sign in to see your bookings, custom itineraries and consultant messages in one place.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => setState(() => _showLoginForm = true),
                      icon: const Icon(Icons.login, color: AppTheme.primaryDarkColor),
                      label: const Text('Log in'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primaryDarkColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Explore HolidayCity',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _quickLinkTile(Icons.support_agent, 'Contact us',
                'Talk to a travel consultant', () {
              ChatBottomSheet.show(
                context,
                topicId: 'GENERAL-SUPPORT',
                topicType: 'General',
                topicTitle: 'Customer Support',
                customerName: 'Guest',
                customerEmail: 'guest@holidaycity.com',
              );
            }),
            _quickLinkTile(Icons.info_outline, 'About us',
                'How we work', () {}),
            _quickLinkTile(Icons.card_travel, 'Offers & Packages',
                'Curated tour packages', () {}),
          ],
        ),
      ),
    );
  }

  Widget _quickLinkTile(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primaryColor),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        onTap: onTap,
      ),
    );
  }

  /// Login form shown only after tapping "Log in" from the menu, with a way
  /// back to the plain menu.
  Widget _buildInlineLoginForm() {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _showLoginForm = false),
        ),
        title: const Text('Sign in'),
      ),
      body: const LoginScreen(),
    );
  }

  Widget _buildSignedInProfile(BuildContext context, AuthProvider authProvider, dynamic user) {
    final hasAvatar = user.avatar != null && (user.avatar as String).isNotEmpty;

    void openEdit() => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
        );

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: RefreshIndicator(
        onRefresh: _loadUserData,
        child: SingleChildScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Gradient header — title + subtitle.
              Container(
                padding: const EdgeInsets.fromLTRB(20, 52, 16, 56),
                decoration: const BoxDecoration(
                  gradient: AppTheme.headerGradient,
                  borderRadius: AppTheme.headerRadius,
                ),
                child: GestureDetector(
                  onLongPress: _showServerConfigDialog,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'My Profile & Account',
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage your account, bookings and preferences.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: Colors.white.withValues(alpha: 0.78),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              Transform.translate(
                offset: const Offset(0, -36),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      // Identity card — matching design screenshot
                      Container(
                        width: double.infinity,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0A6FB5).withValues(alpha: 0.08),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Top light blue gradient container
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(18),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFFEBF5FF),
                                    Color(0xFFF4F9FF),
                                    Color(0xFFE3F0FC),
                                  ],
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 3),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.08),
                                          blurRadius: 10,
                                        ),
                                      ],
                                    ),
                                    child: CircleAvatar(
                                      radius: 34,
                                      backgroundColor: const Color(0xFFD0E8FF),
                                      backgroundImage: hasAvatar ? NetworkImage(user.avatar) : null,
                                      child: hasAvatar
                                          ? null
                                          : const Icon(Icons.person_outline, color: Color(0xFF0A6FB5), size: 36),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          user.fullName.trim().isEmpty ? 'Traveler' : user.fullName.trim(),
                                          style: GoogleFonts.outfit(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                            color: AppTheme.textPrimary,
                                            height: 1.1,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          user.email,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFDCFCE7),
                                            borderRadius: BorderRadius.circular(999),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.check_circle, size: 14, color: Color(0xFF166534)),
                                              SizedBox(width: 4),
                                              Text(
                                                'VERIFIED',
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFF166534),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: openEdit,
                                    icon: const Icon(Icons.edit_outlined, size: 14, color: AppTheme.primaryColor),
                                    label: const Text('Edit Profile'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor: AppTheme.primaryColor,
                                      elevation: 1,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      textStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Bottom Phone & Address rows
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  _detailRowTile(
                                    Icons.phone_outlined,
                                    'Phone Number',
                                    user.mobile.isNotEmpty ? user.mobile : '9515694155',
                                    openEdit,
                                  ),
                                  const Divider(height: 16, color: Color(0xFFF1F5F9)),
                                  _detailRowTile(
                                    Icons.location_on_outlined,
                                    'Address',
                                    user.city.isNotEmpty ? user.city : 'Add address',
                                    openEdit,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Stat tiles with "View" links.
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.chat_bubble_outline,
                              count: _userEnquiries.length.toString(),
                              label: 'Enquiries',
                              cta: 'View Enquiries',
                              color: const Color(0xFF0A6FB5),
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const MyEnquiriesScreen())),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.shopping_bag_outlined,
                              count: _userBookings.length.toString(),
                              label: 'Bookings',
                              cta: 'View Bookings',
                              color: const Color(0xFF10B981),
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const MyBookingsScreen())),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'My travel activity',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildGroupedCard([
                        _buildRow(
                          icon: Icons.assignment_turned_in_outlined,
                          title: 'My Enquiries & Custom Quotes',
                          subtitle: 'Trip quotes, responses & status',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const MyEnquiriesScreen()),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.shopping_bag_outlined,
                          title: 'My Bookings & Payments',
                          subtitle: 'Active bookings, payment status & balance',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 24),

                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Account',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildGroupedCard([
                        _buildRow(
                          icon: Icons.support_agent,
                          title: 'Customer support',
                          subtitle: '24/7 Direct Admin Chat & Support',
                          onTap: () {
                            ChatBottomSheet.show(
                              context,
                              topicId: 'GENERAL-SUPPORT',
                              topicType: 'General',
                              topicTitle: 'Customer Support',
                              customerName: user.fullName,
                              customerEmail: user.email,
                            );
                          },
                        ),
                        _buildRow(
                          icon: Icons.privacy_tip_outlined,
                          title: 'Privacy Policy',
                          subtitle: 'How we handle your data',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => LegalScreen.privacy()),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.description_outlined,
                          title: 'Terms & Conditions',
                          subtitle: 'The rules for using HolidayCity',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => LegalScreen.terms()),
                          ),
                        ),
                        _buildRow(
                          icon: Icons.logout,
                          title: 'Log out',
                          subtitle: null,
                          titleColor: AppTheme.errorColor,
                          iconColor: AppTheme.errorColor,
                          onTap: () async {
                            await authProvider.logout();
                            if (!context.mounted) return;
                            Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                              (route) => false,
                            );
                          },
                        ),
                      ]),
                      const SizedBox(height: 16),
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

  Widget _buildGroupedCard(List<Widget> rows) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            rows[i],
            if (i != rows.length - 1)
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
          ],
        ],
      ),
    );
  }

  Widget _buildRow({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? titleColor,
    Color? iconColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: (iconColor ?? AppTheme.primaryColor).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: iconColor ?? AppTheme.primaryColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: titleColor ?? AppTheme.textPrimary,
        ),
      ),
      subtitle: subtitle != null
          ? Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))
          : null,
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
      onTap: onTap,
    );
  }

  Widget _detailRowTile(IconData icon, String label, String value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF0F7FF),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF94A3B8), size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String count,
    required String label,
    required String cta,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0A6FB5).withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 12),
          Text(
            count,
            style: GoogleFonts.outfit(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
                fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.8,
                color: AppTheme.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: onTap,
            child: Row(
              children: [
                Text(cta,
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primaryColor)),
                const SizedBox(width: 2),
                const Icon(Icons.arrow_forward, size: 13, color: AppTheme.primaryColor),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
