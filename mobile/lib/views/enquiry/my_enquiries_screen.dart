import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:async';

import '../../config/theme.dart';
import '../../services/connectivity.dart';
import '../../widgets/app_states.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/enquiry_service.dart';
import 'enquiry_detail_screen.dart';
import '../chat/chat_bottom_sheet.dart';

class MyEnquiriesScreen extends StatefulWidget {
  const MyEnquiriesScreen({super.key});

  @override
  State<MyEnquiriesScreen> createState() => _MyEnquiriesScreenState();
}

class _MyEnquiriesScreenState extends State<MyEnquiriesScreen> {
  final EnquiryService _enquiryService = EnquiryService();
  List<EnquiryModel> _enquiries = [];
  bool _isLoading = true;
  String _activeFilter = 'Pending';
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _loadEnquiries();
  }

  Future<void> _loadEnquiries() async {
    setState(() => _isLoading = true);
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user?.email != null) {
      // First load cached data immediately for zero latency
      final cached = EnquiryService.getCachedEnquiries(user!.email);
      if (cached.isNotEmpty) {
        setState(() {
          _enquiries = cached;
          _isLoading = false;
        });
      }
    }

    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      final enquiries = await _enquiryService.getProfileEnquiries(
        role: user?.role,
        email: user?.email,
      );
      if (mounted) {
        setState(() {
          _enquiries = enquiries;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<EnquiryModel> get _filteredEnquiries {
    if (_activeFilter == 'All') return _enquiries;
    if (_activeFilter == 'Responded') {
      return _enquiries.where((e) {
        final s = e.status.toLowerCase();
        return s == 'responded' || s == 'quoted' || s == 'replied' || s == 'confirmed';
      }).toList();
    }
    if (_activeFilter == 'Pending') {
      return _enquiries.where((e) => e.status.toLowerCase() == 'pending' || e.status.toLowerCase() == 'new').toList();
    }
    return _enquiries;
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'responded':
      case 'quoted':
      case 'replied':
        return const Color(0xFF0284C7); // Sky blue
      case 'confirmed':
      case 'completed':
        return const Color(0xFF10B981); // Emerald
      case 'cancelled':
      case 'closed':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFFD97706); // Amber
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'responded':
      case 'quoted':
      case 'replied':
        return '🟢 Responded';
      case 'confirmed':
        return '🎉 Confirmed';
      case 'closed':
        return '🔴 Closed';
      default:
        return '🟡 Pending Response';
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _enquiries.where((e) => e.status.toLowerCase() == 'pending' || e.status.toLowerCase() == 'new').length;
    final respondedCount = _enquiries.where((e) {
      final s = e.status.toLowerCase();
      return s == 'responded' || s == 'quoted' || s == 'replied' || s == 'confirmed';
    }).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'My Enquiries & Quotes',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textPrimary, fontSize: 18),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Filter control bar — sits directly below the AppBar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: Row(
              children: [
                // Active filter pill (left)
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.tune_rounded, size: 13, color: AppTheme.primaryColor),
                            const SizedBox(width: 5),
                            Text(
                              _activeFilter,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_filteredEnquiries.length} result${_filteredEnquiries.length == 1 ? '' : 's'}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                // Filter toggle button (right side, below navbar)
                GestureDetector(
                  onTap: () => setState(() => _showFilters = !_showFilters),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: _showFilters
                          ? AppTheme.primaryColor
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _showFilters
                            ? AppTheme.primaryColor
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.tune_rounded,
                          size: 14,
                          color: _showFilters ? Colors.white : AppTheme.textSecondary,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Filters',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _showFilters ? Colors.white : AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Collapsible Filter Chips — visible only when _showFilters is true
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            child: _showFilters
                ? Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Row(
                      children: [
                        _buildFilterChip('All', _enquiries.length),
                        const SizedBox(width: 8),
                        _buildFilterChip('Pending', pendingCount),
                        const SizedBox(width: 8),
                        _buildFilterChip('Responded', respondedCount),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Main Enquiries List View
          Expanded(
            child: _isLoading && _enquiries.isEmpty
                ? const AppSkeletonList(count: 4)
                : RefreshIndicator(
                    onRefresh: _loadEnquiries,
                    child: _filteredEnquiries.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.12),
                              if (_enquiries.isEmpty &&
                                  !ConnectivityStatus.instance.online)
                                AppErrorState(onRetry: _loadEnquiries)
                              else
                                AppEmptyState(
                                  icon: Icons.chat_bubble_outline_rounded,
                                  title: _activeFilter == 'Pending'
                                      ? 'No pending enquiries'
                                      : _activeFilter == 'Responded'
                                          ? 'No responded enquiries'
                                          : 'No enquiries yet',
                                  message: _activeFilter == 'All'
                                      ? 'Tap "Enquire Now" on any package to send a request to our travel specialists.'
                                      : 'No enquiries matching the "$_activeFilter" filter.',
                                ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredEnquiries.length,
                            itemBuilder: (context, index) {
                              final enquiry = _filteredEnquiries[index];
                              return _buildEnquiryCard(enquiry);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterName, int count) {
    final isSelected = _activeFilter == filterName;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = filterName),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          children: [
            Text(
              filterName,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.25) : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnquiryCard(EnquiryModel enquiry) {
    final statusColor = _getStatusColor(enquiry.status);
    final statusLabel = _formatStatusLabel(enquiry.status);

    final bool isActivityEnquiry = enquiry.enquiryType == 'activity' || (enquiry.activityTitle != null && enquiry.activityTitle!.isNotEmpty);
    final bool isPkgEnquiry = enquiry.packageTitle != null && enquiry.packageTitle!.isNotEmpty;
    final String title = isActivityEnquiry
        ? enquiry.activityTitle!
        : (isPkgEnquiry
            ? enquiry.packageTitle!
            : (enquiry.destination.isNotEmpty
                ? 'Custom Trip Request (${enquiry.destination})'
                : 'General Custom Trip Enquiry'));

    final String badgeText = isActivityEnquiry
        ? '⚡ Activity Enquiry'
        : (isPkgEnquiry ? '📦 Package Enquiry' : '🌐 General Trip Enquiry');
    final Color badgeBg = isActivityEnquiry
        ? const Color(0xFFFEF3C7)
        : (isPkgEnquiry ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5));
    final Color badgeTextCol = isActivityEnquiry
        ? const Color(0xFFD97706)
        : (isPkgEnquiry ? const Color(0xFF0284C7) : const Color(0xFF059669));

    final String travelersText = '${enquiry.adults} Adults, ${enquiry.children} Kids';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => EnquiryDetailScreen(enquiry: enquiry),
              ),
            ).then((_) => _loadEnquiries());
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type Badge & Submission Time Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: badgeTextCol.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        badgeText,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: badgeTextCol,
                        ),
                      ),
                    ),
                    if (enquiry.formattedCreatedDateTime.isNotEmpty && enquiry.formattedCreatedDateTime != 'N/A')
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(
                          enquiry.formattedCreatedDateTime,
                          style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.w500),
                        ),
                      ),
                  ],
                ),

                // Destination / Subject & Status Header
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Info Pills (Date & Travelers)
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 14, color: AppTheme.primaryColor),
                    const SizedBox(width: 4),
                    Text(
                      enquiry.travelDate.isNotEmpty ? enquiry.travelDate : 'Flexible Date',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.people_outline_rounded, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      travelersText,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),

                if (enquiry.message.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      '"${enquiry.message}"',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontStyle: FontStyle.italic,
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],

                if (enquiry.adminResponse != null && enquiry.adminResponse!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ADMIN RESPONSE / QUOTE:',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF0284C7)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          enquiry.adminResponse!,
                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF1E3A8A)),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 12),

                // Action Footer Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () {
                        final user = Provider.of<AuthProvider>(context, listen: false).user;
                        ChatBottomSheet.show(
                          context,
                          topicId: (enquiry.id ?? '').isNotEmpty ? enquiry.id! : 'HC-ENQUIRY',
                          topicType: 'Enquiry',
                          topicTitle: enquiry.destination,
                          customerName: enquiry.name.isNotEmpty ? enquiry.name : user?.fullName ?? 'Traveler',
                          customerEmail: enquiry.email.isNotEmpty ? enquiry.email : user?.email ?? 'user@holidaycity.com',
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 12, color: Color(0xFF0284C7)),
                            SizedBox(width: 4),
                            Text(
                              'Chat Admin',
                              style: TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Row(
                      children: [
                        Text(
                          'View Quote',
                          style: TextStyle(fontSize: 12, color: Color(0xFF0284C7), fontWeight: FontWeight.bold),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF0284C7)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
