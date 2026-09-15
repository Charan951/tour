import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/activity_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/activity_service.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/app_states.dart';
import '../../widgets/filter_sheet.dart';
import '../auth/login_screen.dart';
import 'activity_detail_screen.dart';
import 'activity_booking_bottom_sheet.dart';
import 'activity_enquiry_bottom_sheet.dart';

class ActivityListScreen extends StatefulWidget {
  const ActivityListScreen({super.key});

  @override
  State<ActivityListScreen> createState() => _ActivityListScreenState();
}

class _ActivityListScreenState extends State<ActivityListScreen> {
  final ActivityService _activityService = ActivityService();
  final TextEditingController _searchController = TextEditingController();

  List<ActivityModel> _activities = [];
  bool _isLoading = true;
  bool _loadFailed = false;
  String _selectedCategory = 'All';

  final List<Map<String, String>> _categories = const [
    {'name': 'All', 'icon': '⚡'},
    {'name': 'Adventure', 'icon': '🧗'},
    {'name': 'Water Sports', 'icon': '🤿'},
    {'name': 'Air Sports', 'icon': '🪂'},
    {'name': 'Safari', 'icon': '🦁'},
    {'name': 'Trekking', 'icon': '🥾'},
    {'name': 'Sightseeing', 'icon': '📸'},
  ];

  @override
  void initState() {
    super.initState();
    if (ActivityService.cachedActivities.isNotEmpty) {
      _activities = ActivityService.cachedActivities;
      _isLoading = false;
    }
    _loadActivities();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadActivities() async {
    if (_activities.isEmpty) {
      setState(() {
        _isLoading = true;
        _loadFailed = false;
      });
    }
    try {
      final data = await _activityService.fetchActivities(
        category: _selectedCategory,
        search: _searchController.text,
      );
      if (mounted) {
        setState(() {
          _activities = data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _loadFailed = _activities.isEmpty;
        });
      }
    }
  }

  Future<bool> _ensureLoggedIn(String action) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user != null) return true;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Please log in to $action'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
    final loggedIn = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
    return loggedIn == true && mounted;
  }

  Future<void> _openEnquire(ActivityModel act) async {
    if (!await _ensureLoggedIn('submit an activity enquiry')) return;
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ActivityEnquiryBottomSheet(activity: act),
    );
  }

  Future<void> _openBooking(ActivityModel act) async {
    if (!await _ensureLoggedIn('make an activity booking')) return;
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ActivityBookingBottomSheet(activity: act),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');
    final cs = context.colors;

    return Scaffold(
      backgroundColor: cs.scaffold,
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: AppTheme.headerGradient,
          ),
        ),
        title: Text(
          'Thrill Activities & Sports',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search & Filter Header Container
          Container(
            color: cs.surface,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                // Search Field
                Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: cs.surfaceAlt,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: cs.border),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: cs.textSecondary, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onSubmitted: (_) => _loadActivities(),
                          style: TextStyle(color: cs.textPrimary),
                          decoration: InputDecoration(
                            hintText: '',
                            hintStyle:
                                TextStyle(fontSize: 13, color: cs.textFaint),
                            border: InputBorder.none,
                            filled: false,
                            isDense: true,
                          ),
                        ),
                      ),
                      if (_searchController.text.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            _loadActivities();
                          },
                          child: const Icon(Icons.clear, color: Colors.grey, size: 18),
                        ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () async {
                          final names = _categories
                              .map((c) => c['name']!)
                              .toList();
                          final picked = await showFilterSheet(
                            context,
                            title: 'Filter activities',
                            options: names,
                            selected: _selectedCategory,
                          );
                          if (picked != null && picked != _selectedCategory) {
                            setState(() => _selectedCategory = picked);
                            _loadActivities();
                          }
                        },
                        child: Icon(
                          Icons.tune_rounded,
                          size: 20,
                          color: _selectedCategory != 'All'
                              ? AppTheme.primaryColor
                              : cs.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main Activities List
          Expanded(
            child: _isLoading
                ? const AppSkeletonList(count: 4)
                : _loadFailed
                    ? AppErrorState(onRetry: _loadActivities)
                    : _activities.isEmpty
                    ? AppEmptyState(
                        icon: Icons.bolt_outlined,
                        title: 'No activities found',
                        message:
                            'Try a different search term or category filter.',
                        actionLabel: 'Reset',
                        onAction: () {
                          _searchController.clear();
                          setState(() => _selectedCategory = 'All');
                          _loadActivities();
                        },
                      )
                    : RefreshIndicator(
                        onRefresh: _loadActivities,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _activities.length,
                          itemBuilder: (context, index) {
                            final act = _activities[index];

                            // Same card design as the home screen's activity
                            // scroller: image + category pill top-left, white
                            // body with title, location, price and Enquire/Book.
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ActivityDetailScreen(activity: act),
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 16),
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
                                            height: 150,
                                            width: double.infinity,
                                            child: AppNetworkImage(
                                              imageUrl: act.coverImage,
                                              fit: BoxFit.cover,
                                              targetWidth: 500,
                                            ),
                                          ),
                                          Positioned(
                                            top: 10,
                                            left: 10,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: AppTheme.primaryColor,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                act.category,
                                                style: GoogleFonts.outfit(
                                                  color: Colors.white,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              act.title,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                                color: cs.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              act.location.isNotEmpty ? act.location : act.destinationName,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontSize: 11, color: cs.textSecondary),
                                            ),
                                            const SizedBox(height: 10),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  '₹${currencyFormatter.format(act.price)}',
                                                  style: GoogleFonts.outfit(
                                                    fontWeight: FontWeight.w900,
                                                    fontSize: 15,
                                                    color: AppTheme.primaryColor,
                                                  ),
                                                ),
                                                Row(
                                                  children: [
                                                    GestureDetector(
                                                      onTap: () => _openEnquire(act),
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                        decoration: BoxDecoration(
                                                          color: cs.surfaceAlt,
                                                          borderRadius: BorderRadius.circular(8),
                                                          border: Border.all(color: cs.border),
                                                        ),
                                                        child: Text(
                                                          'Enquire',
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.bold,
                                                            color: cs.textPrimary,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    GestureDetector(
                                                      onTap: () => _openBooking(act),
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                                        decoration: BoxDecoration(
                                                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                                          borderRadius: BorderRadius.circular(8),
                                                        ),
                                                        child: const Text(
                                                          'Book',
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.bold,
                                                            color: AppTheme.primaryColor,
                                                          ),
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
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
