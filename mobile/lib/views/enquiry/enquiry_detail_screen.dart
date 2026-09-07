import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../chat/chat_bottom_sheet.dart';

class EnquiryDetailScreen extends StatelessWidget {
  final EnquiryModel enquiry;

  const EnquiryDetailScreen({
    super.key,
    required this.enquiry,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'contacted':
      case 'qualified':
      case 'followuppending':
        return const Color(0xFF0284C7);
      case 'quotationsent':
      case 'confirmed':
      case 'completed':
        return AppTheme.successColor;
      case 'closed lost':
      case 'lost':
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.accentColor;
    }
  }

  String _getStatusDescription(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return 'Your enquiry has been received and is being reviewed by our team.';
      case 'contacted':
        return 'We have reviewed your enquiry and will contact you shortly with options.';
      case 'qualified':
        return 'Your enquiry meets our requirements and is being processed.';
      case 'followuppending':
        return 'Awaiting your response on the quotation or travel details.';
      case 'quotationsent':
        return 'A customized quotation has been sent to your email.';
      case 'confirmed':
        return 'Your booking has been confirmed. Check your email for details.';
      case 'completed':
        return 'Your travel is complete! We hope you had an amazing experience.';
      case 'lost':
      case 'closed lost':
        return 'Unfortunately, this enquiry could not be processed.';
      case 'cancelled':
        return 'This enquiry has been cancelled.';
      default:
        return 'Status: $status';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(enquiry.status);
    final displayStatus = enquiry.status.isNotEmpty ? enquiry.status : 'New';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8FC),
      appBar: AppBar(
        title: const Text(
          'Enquiry Details',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 26,
          ),
        ),
        centerTitle: false,
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.09),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: statusColor.withValues(alpha: 0.25),
                  width: 1.5,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      _getStatusIcon(enquiry.status),
                      color: Colors.white,
                      size: 30,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Current Status',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          displayStatus,
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                        if (enquiry.formattedCreatedDateTime.isNotEmpty && enquiry.formattedCreatedDateTime != 'N/A') ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time, size: 12, color: AppTheme.textSecondary),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  enquiry.formattedCreatedDateTime,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: AppTheme.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text(
              _getStatusDescription(enquiry.status),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 16),

            // Direct Chat CTA Banner Button
            GestureDetector(
              onTap: () {
                ChatBottomSheet.show(
                  context,
                  topicId: (enquiry.id ?? '').isNotEmpty ? enquiry.id! : 'HC-ENQUIRY',
                  topicType: 'Enquiry',
                  topicTitle: enquiry.destination,
                  customerName: enquiry.name.isNotEmpty ? enquiry.name : 'Traveler',
                  customerEmail: enquiry.email.isNotEmpty ? enquiry.email : 'user@holidaycity.com',
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
            const SizedBox(height: 24),

            // Destination Section
            Text(
              'Destination',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.location_on_outlined,
                      color: Color(0xFF0284C7),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      enquiry.destination,
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Travel Details Section
            Row(
              children: [
                Expanded(
                  child: _buildDetailCard(
                    icon: Icons.calendar_today_outlined,
                    label: 'Travel Date',
                    value: enquiry.travelDate,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildDetailCard(
                    icon: Icons.people_outline,
                    label: 'Travelers',
                    value: '${enquiry.travelers}',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Message Section
            if (enquiry.message.isNotEmpty) ...[
              Text(
                'Your Message',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  enquiry.message,
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    color: AppTheme.textPrimary,
                    height: 1.7,
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Enquiry Info Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF3F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFDDEAF4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow(
                    label: 'Enquiry ID',
                    value: (enquiry.id ?? 'N/A').substring(0, 8).toUpperCase(),
                  ),
                  const SizedBox(height: 10),
                  _buildInfoRow(
                    label: 'Submitted On',
                    value: enquiry.formattedCreatedDateTime.isNotEmpty ? enquiry.formattedCreatedDateTime : (enquiry.createdAt.isNotEmpty ? enquiry.createdAt : 'N/A'),
                  ),
                  const SizedBox(height: 10),
                  _buildInfoRow(
                    label: 'Email',
                    value: enquiry.email,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Next Steps Info Box
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppTheme.successColor.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppTheme.successColor.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.info_outline,
                      color: Color(0xFF10B981),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'What happens next?',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.successColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Our team will review your enquiry and contact you soon with personalized travel options and pricing.',
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            color: AppTheme.textSecondary,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 16,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return Icons.mail_outline;
      case 'contacted':
        return Icons.call_made;
      case 'qualified':
        return Icons.check_circle_outline;
      case 'followuppending':
        return Icons.schedule;
      case 'quotationsent':
        return Icons.receipt_long;
      case 'confirmed':
        return Icons.verified;
      case 'completed':
        return Icons.done_all;
      case 'lost':
      case 'closed lost':
        return Icons.close;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.info_outline;
    }
  }
}
