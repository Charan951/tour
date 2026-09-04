import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../models/activity_model.dart';
import '../../services/activity_service.dart';
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
    _loadActivities();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadActivities() async {
    setState(() => _isLoading = true);
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
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
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
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                // Search Field
                Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Colors.grey, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onSubmitted: (_) => _loadActivities(),
                          decoration: const InputDecoration(
                            hintText: 'Search activities, location, sports...',
                            hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                            border: InputBorder.none,
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
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Category Filter Pills
                SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory == cat['name'];
                      return GestureDetector(
                        onTap: () {
                          setState(() => _selectedCategory = cat['name']!);
                          _loadActivities();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryColor : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(cat['icon']!, style: const TextStyle(fontSize: 12)),
                              const SizedBox(width: 6),
                              Text(
                                cat['name']!,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Main Activities List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _activities.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.bolt, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            Text(
                              'No activities found',
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 6),
                            ElevatedButton(
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _selectedCategory = 'All');
                                _loadActivities();
                              },
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                              child: const Text('Reset Search', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadActivities,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _activities.length,
                          itemBuilder: (context, index) {
                            final act = _activities[index];
                            final formattedImage = ApiConfig.formatImageUrl(act.coverImage);

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
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: Colors.grey.shade200),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Image Header
                                      Stack(
                                        children: [
                                          SizedBox(
                                            height: 160,
                                            width: double.infinity,
                                            child: CachedNetworkImage(
                                              imageUrl: formattedImage,
                                              fit: BoxFit.cover,
                                              placeholder: (context, url) => Container(color: Colors.grey[300]),
                                              errorWidget: (context, url, error) => Image.network(
                                                'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            top: 12,
                                            left: 12,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withValues(alpha: 0.9),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.bolt, color: Colors.amber, size: 14),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    act.category,
                                                    style: GoogleFonts.outfit(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11,
                                                      color: AppTheme.primaryColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            top: 12,
                                            right: 12,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withValues(alpha: 0.7),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.star, color: Colors.amber, size: 12),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '${act.rating}',
                                                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),

                                      // Content Details
                                      Padding(
                                        padding: const EdgeInsets.all(14.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              act.title,
                                              style: GoogleFonts.outfit(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: AppTheme.textPrimary,
                                              ),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 6),

                                            Row(
                                              children: [
                                                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.primaryColor),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    act.location.isNotEmpty ? act.location : act.destinationName,
                                                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                const Icon(Icons.access_time, size: 14, color: Colors.amber),
                                                const SizedBox(width: 4),
                                                Text(
                                                  act.duration,
                                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 12),

                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    const Text('Starting From', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                                    Text(
                                                      '₹${currencyFormatter.format(act.price)}',
                                                      style: GoogleFonts.outfit(
                                                        fontSize: 18,
                                                        fontWeight: FontWeight.bold,
                                                        color: AppTheme.primaryColor,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                Row(
                                                  children: [
                                                    OutlinedButton(
                                                      onPressed: () {
                                                        showModalBottomSheet(
                                                          context: context,
                                                          isScrollControlled: true,
                                                          backgroundColor: Colors.transparent,
                                                          builder: (_) => ActivityEnquiryBottomSheet(activity: act),
                                                        );
                                                      },
                                                      style: OutlinedButton.styleFrom(
                                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                                        side: const BorderSide(color: AppTheme.primaryColor),
                                                      ),
                                                      child: const Text(
                                                        'Enquire',
                                                        style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 11),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    ElevatedButton(
                                                      onPressed: () {
                                                        showModalBottomSheet(
                                                          context: context,
                                                          isScrollControlled: true,
                                                          backgroundColor: Colors.transparent,
                                                          builder: (_) => ActivityBookingBottomSheet(activity: act),
                                                        );
                                                      },
                                                      style: ElevatedButton.styleFrom(
                                                        backgroundColor: AppTheme.primaryColor,
                                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                                        elevation: 0,
                                                      ),
                                                      child: const Text(
                                                        'Book Now',
                                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
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
