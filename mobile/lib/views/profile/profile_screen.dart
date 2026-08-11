import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/package_provider.dart';
import '../../services/enquiry_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/package_card.dart';
import '../auth/login_screen.dart';
import '../packages/package_detail_screen.dart';
import '../packages/package_list_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _ipController = TextEditingController();
  final EnquiryService _enquiryService = EnquiryService();

  List<EnquiryModel> _userEnquiries = [];
  bool _isLoadingEnquiries = false;

  @override
  void initState() {
    super.initState();
    _ipController.text = ApiConfig.customHost ?? '';
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserData();
    });
  }

  Future<void> _loadUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final packageProvider = Provider.of<PackageProvider>(context, listen: false);
    
    await Future.wait([
      authProvider.fetchCurrentUser(),
      packageProvider.fetchPackages(),
    ]);

    if (!mounted) return;
    setState(() => _isLoadingEnquiries = true);
    try {
      final enquiries = await _enquiryService.getUserEnquiries();
      if (mounted) {
        setState(() {
          _userEnquiries = enquiries;
          _isLoadingEnquiries = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingEnquiries = false);
    }
  }

  @override
  void dispose() {
    _ipController.dispose();
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
              style: const TextStyle(fontSize: 11, color: AppTheme.primaryColor),
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
                  content: Text('Server endpoint updated to: ${ApiConfig.baseUrl}'),
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
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Profile Data',
            onPressed: _loadUserData,
          ),
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
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
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
                      user != null ? user.email : 'Sign in to access custom tour quotes',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                    ),
                    if (user != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
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

              // Summary Stat Cards
              Consumer<PackageProvider>(
                builder: (context, packageProvider, child) {
                  return Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.assignment_turned_in,
                          count: _userEnquiries.length.toString(),
                          label: 'Enquiries',
                          color: const Color(0xFF26C6DA),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.card_travel_outlined,
                          count: packageProvider.packages.length.toString(),
                          label: 'Tour Plans',
                          color: AppTheme.accentColor,
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 28),

              // My Enquiries & Quotes History Section
              Text(
                'My Enquiries & Custom Quotes',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Track responses from HolidayCity travel experts',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 12),

              if (_isLoadingEnquiries)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_userEnquiries.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  child: const Center(
                    child: Text(
                      'No enquiries submitted yet. Tap "Enquire Now" on any package to request a custom quote!',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _userEnquiries.length,
                  itemBuilder: (context, index) {
                    final enquiry = _userEnquiries[index];
                    return _buildEnquiryCard(enquiry);
                  },
                ),

              const SizedBox(height: 28),

              // Available Holiday Travel Plans Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'All Holiday Travel Plans',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Explore all active package itineraries & pricing tiers',
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
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const PackageListScreen()),
                      );
                    },
                    child: const Text('View All', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Consumer<PackageProvider>(
                builder: (context, packageProvider, child) {
                  if (packageProvider.isLoading) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }
                  if (packageProvider.packages.isEmpty) {
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                      ),
                      child: const Center(
                        child: Text(
                          'No active travel plans found.',
                          style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                        ),
                      ),
                    );
                  }
                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: packageProvider.packages.length > 3 ? 3 : packageProvider.packages.length,
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
                subtitle: '24/7 Helpline & WhatsApp assistance',
                onTap: () {},
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

  Widget _buildEnquiryCard(EnquiryModel enquiry) {
    Color statusColor;
    switch (enquiry.status.toLowerCase()) {
      case 'in contact':
      case 'contacted':
        statusColor = const Color(0xFF0284C7);
        break;
      case 'quote sent':
      case 'confirmed':
        statusColor = AppTheme.successColor;
        break;
      default:
        statusColor = AppTheme.accentColor;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  enquiry.destination,
                  style: GoogleFonts.outfit(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  enquiry.status.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.textSecondary),
              const SizedBox(width: 4),
              Text(
                'Travel Date: ${enquiry.travelDate}',
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.people_outline, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: 4),
              Text(
                '${enquiry.travelers} Travelers',
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
              ),
            ],
          ),
          if (enquiry.message.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              '"${enquiry.message}"',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontStyle: FontStyle.italic,
                color: Colors.grey.shade700,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
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
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          trailing: const Icon(Icons.chevron_right, color: Colors.grey),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          onTap: onTap,
        ),
      ),
    );
  }
}
