import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/activity_model.dart';
import '../../widgets/app_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../services/activity_service.dart';
import '../auth/login_screen.dart';
import 'activity_booking_bottom_sheet.dart';
import 'activity_enquiry_bottom_sheet.dart';

class ActivityDetailScreen extends StatefulWidget {
  final ActivityModel activity;

  const ActivityDetailScreen({super.key, required this.activity});

  @override
  State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  final ActivityService _activityService = ActivityService();
  List<ActivityModel> _relatedActivities = [];
  bool _isLoadingRelated = true;

  @override
  void initState() {
    super.initState();
    _loadRelatedActivities();
  }

  Future<void> _loadRelatedActivities() async {
    try {
      final all = await _activityService.fetchActivities();
      final filtered = all.where((a) => a.id != widget.activity.id).toList();
      if (mounted) {
        setState(() {
          _relatedActivities = filtered;
          _isLoadingRelated = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingRelated = false);
      }
    }
  }

  Future<void> _openEnquirySheet() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to submit an activity enquiry'),
          backgroundColor: AppTheme.primaryColor,
        ),
      );
      final loggedIn = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen(isBookingPrompt: true)),
      );
      if (loggedIn != true || !mounted) return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ActivityEnquiryBottomSheet(activity: widget.activity),
    );
  }

  Future<void> _openBookingSheet() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to make an activity booking'),
          backgroundColor: AppTheme.primaryColor,
        ),
      );
      final loggedIn = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen(isBookingPrompt: true)),
      );
      if (loggedIn != true || !mounted) return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ActivityBookingBottomSheet(activity: widget.activity),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;
    final currencyFormatter = NumberFormat('#,##,###');

    return Scaffold(
      backgroundColor: context.colors.scaffold,
      body: CustomScrollView(
        slivers: [
          // Sliver AppBar with Image Header
          SliverAppBar(
            expandedHeight: 280.0,
            pinned: true,
            leading: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.arrow_back, color: context.colors.textPrimary, size: 20),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  AppNetworkImage(
                    imageUrl: activity.coverImage,
                    fit: BoxFit.cover,
                    targetWidth: 800,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.8),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.amber,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.bolt, color: Colors.black, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    activity.category,
                                    style: GoogleFonts.outfit(
                                      color: Colors.black,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star, color: Colors.amber, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${activity.rating}',
                                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          activity.title,
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Body Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Info Cards Row
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on_outlined, color: AppTheme.primaryColor, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Location', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                    Text(
                                      activity.location.isNotEmpty ? activity.location : activity.destinationName,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time, color: Colors.amber, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Duration', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                    Text(
                                      activity.duration,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Overview
                  if (activity.overview.isNotEmpty) ...[
                    Text(
                      'Overview',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: context.colors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      activity.overview,
                      style: TextStyle(fontSize: 13, color: context.colors.textSecondary, height: 1.5),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Highlights
                  if (activity.highlights.isNotEmpty) ...[
                    Text(
                      'Activity Highlights',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: context.colors.textPrimary),
                    ),
                    const SizedBox(height: 10),
                    Column(
                      children: activity.highlights.map((hl) => Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Color(0xFFECFDF5),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, color: Color(0xFF10B981), size: 14),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                hl,
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.colors.textPrimary),
                              ),
                            ),
                          ],
                        ),
                      )).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Inclusions & Exclusions Grid
                  if (activity.inclusions.isNotEmpty || activity.exclusions.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (activity.inclusions.isNotEmpty)
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5).withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Inclusions',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF065F46), fontSize: 14),
                                  ),
                                  const SizedBox(height: 8),
                                  ...activity.inclusions.map((inc) => Padding(
                                    padding: const EdgeInsets.only(bottom: 4.0),
                                    child: Text('• $inc', style: const TextStyle(fontSize: 11, color: Colors.black87)),
                                  )),
                                ],
                              ),
                            ),
                          ),
                        if (activity.inclusions.isNotEmpty && activity.exclusions.isNotEmpty)
                          const SizedBox(width: 10),
                        if (activity.exclusions.isNotEmpty)
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF1F2).withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFFECDD3)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Exclusions',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF9F1239), fontSize: 14),
                                  ),
                                  const SizedBox(height: 8),
                                  ...activity.exclusions.map((exc) => Padding(
                                    padding: const EdgeInsets.only(bottom: 4.0),
                                    child: Text('• $exc', style: const TextStyle(fontSize: 11, color: Colors.black87)),
                                  )),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Safety Note
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.shield_outlined, color: AppTheme.primaryColor, size: 24),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Certified Safety Standards',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'All activities include professional guides, briefing, and international grade safety gear.',
                                style: TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── MORE ACTIVITIES & EXPERIENCES SECTION ──
                  if (!_isLoadingRelated && _relatedActivities.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    Text(
                      'More Activities & Experiences',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 195,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _relatedActivities.length,
                        itemBuilder: (context, idx) {
                          final relAct = _relatedActivities[idx];
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ActivityDetailScreen(activity: relAct),
                                ),
                              );
                            },
                            child: Container(
                              width: 165,
                              margin: const EdgeInsets.only(right: 12),
                              decoration: BoxDecoration(
                                color: context.colors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade200),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    SizedBox(
                                      height: 95,
                                      width: double.infinity,
                                      child: AppNetworkImage(
                                        imageUrl: relAct.coverImage,
                                        fit: BoxFit.cover,
                                        targetWidth: 400,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            relAct.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.outfit(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: context.colors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            relAct.category,
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: AppTheme.primaryColor,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '₹${relAct.price.toInt()} onwards',
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF047857),
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
                  ],

                  const SizedBox(height: 80), // Extra space for bottom bar
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Sticky Booking Bar
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: context.colors.surface,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              offset: const Offset(0, -4),
              blurRadius: 10,
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Starting Price', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Row(
                        children: [
                          Text(
                            '₹${currencyFormatter.format(activity.price)}',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          const Text(' / person', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  OutlinedButton(
                    onPressed: _openEnquirySheet,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      side: const BorderSide(color: AppTheme.primaryColor),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.chat_bubble_outline, size: 14, color: AppTheme.primaryColor),
                        const SizedBox(width: 4),
                        Text(
                          'Enquire',
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: _openBookingSheet,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 2,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.bolt, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          'Book',
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
