import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:async';

import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/enquiry_service.dart';
import 'enquiry_detail_screen.dart';

class MyEnquiriesScreen extends StatefulWidget {
  const MyEnquiriesScreen({super.key});

  @override
  State<MyEnquiriesScreen> createState() => _MyEnquiriesScreenState();
}

class _MyEnquiriesScreenState extends State<MyEnquiriesScreen> {
  final EnquiryService _enquiryService = EnquiryService();
  List<EnquiryModel> _enquiries = [];
  bool _isLoading = true;
  String _activeFilter = 'All';

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
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'My Enquiries & Quotes',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textPrimary, fontSize: 18),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Filter Tabs (All, Pending, Responded)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                _buildFilterChip('All', _enquiries.length),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'Pending',
                  _enquiries.where((e) => e.status.toLowerCase() == 'pending' || e.status.toLowerCase() == 'new').length,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'Responded',
                  _enquiries.where((e) {
                    final s = e.status.toLowerCase();
                    return s == 'responded' || s == 'quoted' || s == 'replied' || s == 'confirmed';
                  }).length,
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Main Enquiries List View
          Expanded(
            child: _isLoading && _enquiries.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadEnquiries,
                    child: _filteredEnquiries.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                              Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF1F5F9),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.chat_bubble_outline_rounded,
                                        size: 48,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No Enquiries Found',
                                      style: GoogleFonts.outfit(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 32.0),
                                      child: Text(
                                        'Tap "Enquire Now" on any package to submit a request to our travel specialists.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                                      ),
                                    ),
                                  ],
                                ),
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
                // Destination / Subject & Status Header
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        enquiry.destination.isNotEmpty ? enquiry.destination : 'Tour Enquiry',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
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
                      '${enquiry.travelers} Travelers',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
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

                const SizedBox(height: 12),

                // Action Footer Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Enquiry ID: #${(enquiry.id ?? '').length > 8 ? (enquiry.id ?? '').substring((enquiry.id ?? '').length - 6).toUpperCase() : (enquiry.id ?? 'ENQ')}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    const Row(
                      children: [
                        Text(
                          'View Quote Details',
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
