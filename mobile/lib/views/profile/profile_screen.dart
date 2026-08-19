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
import '../../services/booking_service.dart';
import '../../widgets/custom_button.dart';
import '../auth/login_screen.dart';
import '../booking/my_bookings_screen.dart';
import '../enquiry/my_enquiries_screen.dart';
import '../chat/chat_bottom_sheet.dart';

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

    // Load cached enquiries immediately for instant display
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user?.email != null) {
      _userEnquiries = EnquiryService.getCachedEnquiries(user!.email);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserData();
      // Removed automatic polling - only refresh on app resume
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadUserData();
    }
  }

  void _startEnquiryStatusListener() {
    // Only start polling after initial load is complete, and use longer interval
    if (!_isInitialLoadComplete) return;

    _enquiryStatusListener?.cancel();
    _enquiryStatusListener = Timer.periodic(
      const Duration(
          seconds: 30), // Increased from 3s to 30s to reduce server load
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
        } catch (_) {
          // Silent refresh failure is ignored so the user keeps the latest valid list.
        }
      },
    );
  }

  Future<void> _loadUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final packageProvider =
        Provider.of<PackageProvider>(context, listen: false);

    // Fire all requests in TRUE PARALLEL without awaiting
    // Cached data displays immediately while background fetches happen
    unawaited(authProvider.fetchCurrentUser());
    unawaited(packageProvider.fetchPackages());

    // Fire enquiry & booking fetch in background without blocking
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile & Account'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet),
            tooltip: 'Server Settings',
            onPressed: _showServerConfigDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadUserData,
        child: SingleChildScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 100.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Profile Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withValues(alpha: 0.85),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryColor.withValues(alpha: 0.25),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white,
                      child: Text(
                        user != null && user.firstName.isNotEmpty
                            ? user.firstName[0].toUpperCase()
                            : 'G',
                        style: GoogleFonts.outfit(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user != null ? user.fullName : 'Guest Traveler',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user != null
                          ? user.email
                          : 'Sign in to access custom tour quotes',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                    ),
                    if (user != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'ROLE: ${user.role.toUpperCase()}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Summary Stat Cards (Enquiries & Bookings)
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const MyEnquiriesScreen()),
                        );
                      },
                      child: _buildStatCard(
                        icon: Icons.assignment_turned_in,
                        count: _userEnquiries.length.toString(),
                        label: 'Enquiries',
                        color: const Color(0xFF26C6DA),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                        );
                      },
                      child: _buildStatCard(
                        icon: Icons.shopping_bag_outlined,
                        count: _userBookings.length.toString(),
                        label: 'Bookings',
                        color: const Color(0xFF10B981),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Activity & Tracking Options Section
              Text(
                'My Travel Activity',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              _buildListTile(
                icon: Icons.assignment_turned_in_outlined,
                title: 'My Enquiries & Custom Quotes',
                subtitle: 'Track custom trip quotes, responses & status',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MyEnquiriesScreen()),
                  );
                },
              ),

              _buildListTile(
                icon: Icons.shopping_bag_outlined,
                title: 'My Bookings & Payments',
                subtitle: 'Track active bookings, payment status & pay balance',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                  );
                },
              ),

              const SizedBox(height: 28),

              // Account & Preferences Menu
              Text(
                'Account Settings',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              _buildListTile(
                icon: Icons.dns_outlined,
                title: 'Server Connection',
                subtitle: 'Active: ${ApiConfig.baseUrl}',
                onTap: _showServerConfigDialog,
              ),
              _buildListTile(
                icon: Icons.support_agent,
                title: 'HolidayCity Customer Support',
                subtitle: '24/7 Direct Admin Chat & Support',
                onTap: () {
                  ChatBottomSheet.show(
                    context,
                    topicId: 'GENERAL-SUPPORT',
                    topicType: 'General',
                    topicTitle: 'Customer Support',
                    customerName: user?.fullName ?? 'Traveler',
                    customerEmail: user?.email ?? 'user@holidaycity.com',
                  );
                },
              ),

              const SizedBox(height: 28),

              if (user != null)
                CustomButton(
                  text: 'Log Out',
                  isOutlined: true,
                  backgroundColor: AppTheme.errorColor,
                  textColor: AppTheme.errorColor,
                  onPressed: () async {
                    await authProvider.logout();
                    if (!context.mounted) return;
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  },
                )
              else
                CustomButton(
                  text: 'Log In / Register',
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String count,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: ListTile(
          leading: Icon(icon, color: AppTheme.primaryColor),
          title: Text(title,
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle,
              style:
                  const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          trailing: const Icon(Icons.chevron_right, color: Colors.grey),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          onTap: onTap,
        ),
      ),
    );
  }
}
