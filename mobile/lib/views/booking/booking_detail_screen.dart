import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';

import '../../config/theme.dart';
import '../../widgets/custom_button.dart';
import 'pay_remaining_bottom_sheet.dart';
import '../chat/chat_bottom_sheet.dart';

class BookingDetailScreen extends StatefulWidget {
  final Map<String, dynamic> booking;

  const BookingDetailScreen({super.key, required this.booking});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  late Map<String, dynamic> _bookingData;

  @override
  void initState() {
    super.initState();
    _bookingData = Map<String, dynamic>.from(widget.booking);
  }

  void _openPaySheet() async {
    final updated = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PayRemainingBottomSheet(booking: _bookingData),
    );

    if (updated == true && mounted) {
      setState(() {
        final paymentStatus = (_bookingData['paymentStatus'] ?? '').toString();
        final isAdvPaid = _bookingData['advancePaid'] == true || paymentStatus == 'Advance Paid' || paymentStatus == 'Full Paid';
        if (!isAdvPaid) {
          _bookingData['advancePaid'] = true;
          _bookingData['paymentStatus'] = 'Advance Paid';
          final total = (_bookingData['totalPrice'] as num?)?.toDouble() ?? 0.0;
          final adv = (_bookingData['advanceAmount'] as num?)?.toDouble() ?? 0.0;
          _bookingData['remainingBalance'] = (total - adv).clamp(0, double.infinity);
        } else {
          _bookingData['paymentStatus'] = 'Full Paid';
          _bookingData['remainingBalance'] = 0;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat('#,##,###');
    final b = _bookingData;

    final bookingId = b['bookingId'] ?? 'BK-TOUR';
    final status = (b['status'] ?? 'Pending').toString();
    final paymentStatus = (b['paymentStatus'] ?? 'Pending Advance').toString();
    final isFullPaid = paymentStatus == 'Full Paid';
    final isAdvPaid = b['advancePaid'] == true || paymentStatus == 'Advance Paid' || isFullPaid;
    final isApproved = status.toLowerCase() == 'confirmed' || status.toLowerCase() == 'completed' || isAdvPaid;

    final totalPrice = (b['totalPrice'] as num?)?.toDouble() ?? 0.0;
    final advanceAmount = (b['advanceAmount'] as num?)?.toDouble() ?? 0.0;
    final remainingBalance = isFullPaid
        ? 0.0
        : ((b['remainingBalance'] as num?)?.toDouble() ?? (totalPrice - (isAdvPaid ? advanceAmount : 0)).clamp(0, double.infinity));

    Color statusColor;
    switch (status.toLowerCase()) {
      case 'confirmed':
        statusColor = const Color(0xFF10B981);
        break;
      case 'completed':
        statusColor = Colors.blue;
        break;
      case 'cancelled':
        statusColor = const Color(0xFFEF4444);
        break;
      default:
        statusColor = Colors.amber.shade700;
    }

    final targetAdv = advanceAmount > 0 ? advanceAmount : (totalPrice * 0.25).roundToDouble();
    final pct = totalPrice > 0 ? (targetAdv / totalPrice * 100).round() : 25;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Booking Details',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textPrimary, fontSize: 18),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header ID & Status Card
            Container(
              padding: const EdgeInsets.all(16),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                bookingId,
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                              const SizedBox(width: 6),
                              IconButton(
                                tooltip: 'Copy booking ID',
                                icon: const Icon(Icons.copy, size: 16, color: Colors.grey),
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: bookingId));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Booking ID copied to clipboard!')),
                                  );
                                },
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                          if (b['createdAt'] != null)
                            Text(
                              'Booked on ${b['createdAt'].toString().substring(0, 10)}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          !isApproved ? 'PENDING APPROVAL' : status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Direct Chat CTA Banner Button
            GestureDetector(
              onTap: () {
                ChatBottomSheet.show(
                  context,
                  topicId: bookingId,
                  topicType: 'Booking',
                  topicTitle: b['packageName'] ?? '',
                  customerName: b['customerName'] ?? 'Traveler',
                  customerEmail: b['email'] ?? 'user@holidaycity.com',
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0A6FB5), Color(0xFF57D0C9)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0A6FB5).withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.chat_bubble_outline_rounded, color: Colors.white, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Chat Direct with Admin Support',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Package & Destination Details Card
            _buildSectionCard(
              title: 'Package Details',
              icon: Icons.tour_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    b['packageName'] ?? 'Tour Package',
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          b['destinationName'] ?? b['destination']?['name'] ?? 'Destination',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.calendar_month_outlined, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'Travel Date: ${b['travelDate'] != null ? b['travelDate'].toString().substring(0, 10) : "TBD"}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Travelers & Tier Card
            _buildSectionCard(
              title: 'Travelers & Tier',
              icon: Icons.people_outline,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildDetailPill('Adults', '${b['adults'] ?? 1}'),
                  _buildDetailPill('Children', '${b['children'] ?? 0}'),
                  _buildDetailPill('Pricing Tier', b['pricingTier'] ?? 'Standard'),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Customer Contact & Address Card
            _buildSectionCard(
              title: 'Customer Contact Info',
              icon: Icons.person_outline,
              child: Column(
                children: [
                  _buildLabelValueRow('Full Name:', b['customerName'] ?? 'Traveler'),
                  const SizedBox(height: 6),
                  _buildLabelValueRow('Email Address:', b['email'] ?? 'N/A'),
                  const SizedBox(height: 6),
                  _buildLabelValueRow('Mobile Number:', b['mobile'] ?? 'N/A'),
                  if (b['address'] != null && (b['address']['fullAddress'] ?? '').toString().isNotEmpty) ...[
                    const Divider(height: 16),
                    _buildLabelValueRow('Billing Address:', b['address']['fullAddress'] ?? ''),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Financial Breakdown Card
            _buildSectionCard(
              title: 'Financial Breakdown',
              icon: Icons.account_balance_wallet_outlined,
              child: Column(
                children: [
                  _buildLabelValueRow('Total Package Price:', '₹${formatter.format(totalPrice)}', isBold: true),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Advance Amount:', style: TextStyle(fontSize: 12)),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          '₹${formatter.format(advanceAmount)} (${isAdvPaid ? "🟢 Paid" : isApproved ? "🟡 Pending" : "⏳ Awaiting Approval"})',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: isAdvPaid ? Colors.green : isApproved ? Colors.amber.shade800 : Colors.orange.shade700,
                          ),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Remaining Balance Due:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          '₹${formatter.format(remainingBalance)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: remainingBalance > 0 ? Colors.orange.shade800 : Colors.green,
                          ),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Payment Details & Method Card (if available)
            if (b['paymentMethod'] != null || b['transactionId'] != null) ...[
              _buildSectionCard(
                title: 'Payment Information',
                icon: Icons.receipt_long_outlined,
                child: Column(
                  children: [
                    _buildLabelValueRow('Payment Method:', b['paymentMethod'] ?? 'Online'),
                    if ((b['transactionId'] ?? '').toString().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      _buildLabelValueRow('Transaction / Ref ID:', b['transactionId'] ?? ''),
                    ],
                    if (b['paymentDetails'] != null) ...[
                      if ((b['paymentDetails']['upiId'] ?? '').toString().isNotEmpty) ...[
                        const SizedBox(height: 6),
                        _buildLabelValueRow('UPI VPA ID:', b['paymentDetails']['upiId'] ?? ''),
                      ],
                      if ((b['paymentDetails']['cardLast4'] ?? '').toString().isNotEmpty) ...[
                        const SizedBox(height: 6),
                        _buildLabelValueRow('Card Last 4 Digits:', '•••• ${b['paymentDetails']['cardLast4']}'),
                      ],
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Special Requests Card (if available)
            if ((b['specialRequests'] ?? '').toString().isNotEmpty) ...[
              _buildSectionCard(
                title: 'Special Requests / Notes',
                icon: Icons.notes_outlined,
                child: Text(
                  '"${b['specialRequests']}"',
                  style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppTheme.textSecondary),
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Admin Approval Alert & Action Button Section
            if (!isApproved) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.hourglass_top_rounded, color: Colors.amber, size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Awaiting Admin Approval. Once approved by HolidayCity, advance payment option will be unlocked!',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.brown),
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (!isAdvPaid) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        targetAdv >= totalPrice
                            ? '🎉 Booking Approved by Admin! Admin requested full payment of ₹${formatter.format(targetAdv)} to confirm your tour.'
                            : '🎉 Booking Approved by Admin! Admin requested advance payment of ₹${formatter.format(targetAdv)} ($pct% of ₹${formatter.format(totalPrice)}) to confirm your tour.',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF064E3B)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: targetAdv >= totalPrice
                    ? 'Pay Full Amount ₹${formatter.format(targetAdv)}'
                    : 'Pay Advance Amount ₹${formatter.format(targetAdv)} ($pct%)',
                backgroundColor: AppTheme.primaryColor,
                onPressed: _openPaySheet,
              ),
            ] else if (remainingBalance > 0 && !isFullPaid) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active_outlined, color: Colors.amber, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Admin requested remaining balance payment of ₹${formatter.format(remainingBalance)}.',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.brown),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Pay Remaining Balance ₹${formatter.format(remainingBalance)}',
                backgroundColor: AppTheme.accentColor,
                onPressed: _openPaySheet,
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 22),
                    SizedBox(width: 8),
                    Text('Order Fully Paid & Confirmed', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
            ],
          ),
          const Divider(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildLabelValueRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: AppTheme.textPrimary),
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        ],
      ),
    );
  }
}
