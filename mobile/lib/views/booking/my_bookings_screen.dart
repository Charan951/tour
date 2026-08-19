import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import 'booking_detail_screen.dart';
import '../chat/chat_bottom_sheet.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  final BookingService _bookingService = BookingService();
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
    // Auto-refresh every 10 seconds to sync admin updates in real-time
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _fetchBookings(showLoading: false);
    });
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchBookings({bool showLoading = true}) async {
    if (showLoading && _bookings.isEmpty) {
      setState(() => _isLoading = true);
    }
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final list = await _bookingService.getUserBookings(email: user?.email);
    if (mounted) {
      setState(() {
        _bookings = list;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');

    // Calculate metrics
    final totalBookings = _bookings.length;
    final advancePaidCount = _bookings.where((b) {
      return b['advancePaid'] == true || b['paymentStatus'] == 'Advance Paid' || b['paymentStatus'] == 'Full Paid';
    }).length;

    final totalRemainingDue = _bookings.fold<double>(0.0, (sum, b) {
      final isFull = b['paymentStatus'] == 'Full Paid' || b['remainingBalance'] == 0;
      if (isFull) return sum;
      final rem = b['remainingBalance'];
      if (rem != null) return sum + (rem as num).toDouble();
      return sum;
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings & Payments'),
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchBookings(showLoading: false),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Metrics Row Card
              Container(
                padding: const EdgeInsets.all(16),
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
                      color: AppTheme.primaryColor.withValues(alpha: 0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetricCol('Bookings', '$totalBookings', Colors.white),
                    Container(height: 35, width: 1, color: Colors.white24),
                    _buildMetricCol('Advance Paid', '$advancePaidCount', Colors.lightGreenAccent),
                    Container(height: 35, width: 1, color: Colors.white24),
                    _buildMetricCol('Balance Due', '₹${currencyFormatter.format(totalRemainingDue)}', Colors.amberAccent),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'My Package Orders',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Text(
                'Live status updates from admin & pay remaining balance due',
                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 12),

              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_bookings.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.shopping_bag_outlined, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text(
                        'No bookings found',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Book a package from home screen or package catalog to track it here!',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _bookings.length,
                  itemBuilder: (context, index) {
                    final booking = _bookings[index];
                    return _buildBookingCard(booking, currencyFormatter);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> b, NumberFormat formatter) {
    final bookingId = b['bookingId'] ?? 'BK-CONFIRMED';
    final status = (b['status'] ?? 'Pending').toString();
    final paymentStatus = (b['paymentStatus'] ?? 'Pending Advance').toString();
    final isFullPaid = paymentStatus == 'Full Paid';
    final isAdvPaid = b['advancePaid'] == true || paymentStatus == 'Advance Paid' || isFullPaid;
    final isApproved = status.toLowerCase() == 'confirmed' || status.toLowerCase() == 'completed' || isAdvPaid;
    final totalPrice = (b['totalPrice'] as num?)?.toDouble() ?? 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BookingDetailScreen(booking: b),
              ),
            ).then((_) => _fetchBookings());
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Booking ID & Status Pill
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      bookingId,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isFullPaid
                            ? Colors.green.shade50
                            : isAdvPaid
                                ? Colors.blue.shade50
                                : isApproved
                                    ? const Color(0xFFECFDF5)
                                    : Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isFullPaid
                            ? '🎉 Fully Paid'
                            : isAdvPaid
                                ? '🟢 Advance Paid'
                                : isApproved
                                    ? '🟢 Pay Advance'
                                    : '⏳ Pending Approval',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: isFullPaid
                              ? Colors.green.shade800
                              : isAdvPaid
                                  ? Colors.blue.shade800
                                  : isApproved
                                      ? const Color(0xFF065F46)
                                      : Colors.amber.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Package Title
                Text(
                  b['packageName'] ?? 'Tour Package',
                  style: GoogleFonts.outfit(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),

                // Sub-info Row: Date & Total Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.calendar_month_outlined, size: 13, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          b['travelDate'] != null ? b['travelDate'].toString().substring(0, 10) : 'Flexible Date',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                    Text(
                      '₹${formatter.format(totalPrice)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 8),

                // Footer View Details Link
Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    GestureDetector(
      onTap: () {
        final user = Provider.of<AuthProvider>(context, listen: false).user;
        ChatBottomSheet.show(
          context,
          topicId: bookingId,
          topicType: 'Booking',
          topicTitle: b['packageName'] ?? '',
          customerName: b['customerName'] ?? user?.fullName ?? 'Traveler',
          customerEmail: b['email'] ?? user?.email ?? 'user@holidaycity.com',
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
          'View Details',
          style: TextStyle(fontSize: 11.5, color: Color(0xFF0284C7), fontWeight: FontWeight.bold),
        ),
        SizedBox(width: 2),
        Icon(Icons.arrow_forward_ios, size: 10, color: Color(0xFF0284C7)),
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
