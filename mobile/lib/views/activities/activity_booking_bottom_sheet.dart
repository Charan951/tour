import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/activity_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../auth/login_screen.dart';

class ActivityBookingBottomSheet extends StatefulWidget {
  final ActivityModel activity;

  const ActivityBookingBottomSheet({super.key, required this.activity});

  @override
  State<ActivityBookingBottomSheet> createState() => _ActivityBookingBottomSheetState();
}

class _ActivityBookingBottomSheetState extends State<ActivityBookingBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _specialController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 3));
  int _adults = 2;
  int _children = 0;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user != null) {
      _nameController.text = user.fullName;
      _emailController.text = user.email;
      _phoneController.text = user.mobile;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _specialController.dispose();
    super.dispose();
  }

  double get _unitPrice => widget.activity.price;
  double get _totalPrice => (_unitPrice * _adults) + (_unitPrice * 0.5 * _children);

  Future<void> _pickTravelDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  void _submitBooking() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to submit an activity booking'),
          backgroundColor: AppTheme.primaryColor,
        ),
      );
      final loggedIn = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen(isBookingPrompt: true)),
      );
      if (loggedIn == true && mounted) {
        final u = Provider.of<AuthProvider>(context, listen: false).user;
        if (u != null) {
          setState(() {
            _nameController.text = u.fullName;
            _emailController.text = u.email;
            _phoneController.text = u.mobile;
          });
        }
      } else {
        return;
      }
    }

    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

      final bookingData = {
        'bookingType': 'activity',
        'activity': widget.activity.id,
        'activityName': widget.activity.title,
        'activityCode': widget.activity.activityCode,
        'destinationName': widget.activity.location.isNotEmpty ? widget.activity.location : widget.activity.destinationName,
        'customerName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'mobile': _phoneController.text.trim(),
        'travelDate': _selectedDate.toIso8601String(),
        'adults': _adults,
        'children': _children,
        'totalPrice': _totalPrice,
        'advanceAmount': 0,
        'advancePaid': false,
        'paymentStatus': 'Pending Advance',
        'status': 'Pending',
        'specialRequests': _specialController.text.trim(),
      };

      try {
        final service = BookingService();
        final result = await service.createBooking(bookingData);

        if (!mounted) return;

        if (result['success'] == true) {
          final bookingInfo = result['data'] ?? {};
          final bookingId = bookingInfo['bookingId'] ?? 'BK-ACT';

          Navigator.pop(context);

          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.successColor, size: 28),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Activity Booking Submitted!',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Booking ID: $bookingId', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryColor)),
                  const SizedBox(height: 8),
                  Text('Activity: ${widget.activity.title}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Estimated Total:'),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                '₹${NumberFormat('#,##,###').format(_totalPrice)}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Status:'),
                            SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                '⏳ Pending Admin Approval',
                                style: TextStyle(color: Colors.brown, fontWeight: FontWeight.bold, fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Our activity specialist will review your booking and contact you via phone/WhatsApp with confirmation. Check Profile -> My Bookings for updates!',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Booking failed'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      } finally {
        if (mounted) setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');

    return Scaffold(
      backgroundColor: context.colors.scaffold,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Inline Header (No Navbar)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEA580C).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFEA580C).withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        'BOOK ACTIVITY REQUEST',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFFEA580C),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    Material(
                      color: context.colors.surface,
                      shape: const CircleBorder(),
                      clipBehavior: Clip.antiAlias,
                      child: IconButton(
                        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                        padding: EdgeInsets.zero,
                        icon: Icon(Icons.close_rounded, color: context.colors.textPrimary, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Activity Banner Box
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.colors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEA580C).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.bolt, color: Color(0xFFEA580C), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.activity.title,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: context.colors.textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Location: ${widget.activity.location.isNotEmpty ? widget.activity.location : widget.activity.destinationName} • Duration: ${widget.activity.duration}',
                              style: TextStyle(fontSize: 11, color: context.colors.textSecondary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name *',
                  hint: 'John Doe',
                  prefixIcon: Icons.person_outline,
                  validator: (v) => v == null || v.isEmpty ? 'Name required' : null,
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _emailController,
                  label: 'Email Address *',
                  hint: 'name@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Mobile Number *',
                  hint: '+91 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) => v == null || v.isEmpty ? 'Mobile required' : null,
                ),
                const SizedBox(height: 14),

                // Date Picker Button
                InkWell(
                  onTap: _pickTravelDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today, color: AppTheme.primaryColor, size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'Activity Date: ${DateFormat('EEE, dd MMM yyyy').format(_selectedDate)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.edit, size: 16, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // Guests Selector (Adults & Children - Overflow Free)
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.colors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('Adults', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: context.colors.textPrimary)),
                                  Text('₹${currencyFormatter.format(widget.activity.startingPrice)}/ea', style: TextStyle(fontSize: 10, color: context.colors.textSecondary)),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: _adults > 1 ? () => setState(() => _adults--) : null,
                                  borderRadius: BorderRadius.circular(6),
                                  child: Padding(
                                    padding: const EdgeInsets.all(4.0),
                                    child: Icon(Icons.remove_circle_outline, size: 20, color: _adults > 1 ? AppTheme.primaryColor : Colors.grey.shade400),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6.0),
                                  child: Text('$_adults', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                                InkWell(
                                  onTap: () => setState(() => _adults++),
                                  borderRadius: BorderRadius.circular(6),
                                  child: const Padding(
                                    padding: EdgeInsets.all(4.0),
                                    child: Icon(Icons.add_circle_outline, size: 20, color: AppTheme.primaryColor),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.colors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('Children', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: context.colors.textPrimary)),
                                  Text('₹${currencyFormatter.format(widget.activity.startingPrice * 0.5)}/ea', style: TextStyle(fontSize: 10, color: context.colors.textSecondary)),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: _children > 0 ? () => setState(() => _children--) : null,
                                  borderRadius: BorderRadius.circular(6),
                                  child: Padding(
                                    padding: const EdgeInsets.all(4.0),
                                    child: Icon(Icons.remove_circle_outline, size: 20, color: _children > 0 ? AppTheme.primaryColor : Colors.grey.shade400),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6.0),
                                  child: Text('$_children', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                                InkWell(
                                  onTap: () => setState(() => _children++),
                                  borderRadius: BorderRadius.circular(6),
                                  child: const Padding(
                                    padding: EdgeInsets.all(4.0),
                                    child: Icon(Icons.add_circle_outline, size: 20, color: AppTheme.primaryColor),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Estimated Price Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Estimated Total Price:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              '₹${currencyFormatter.format(_totalPrice)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryColor),
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.right,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Row(
                        children: [
                          Icon(Icons.shield_outlined, size: 14, color: Colors.blue),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Includes safety gear & certified instructor briefing.',
                              style: TextStyle(fontSize: 11, color: Colors.blue, fontWeight: FontWeight.w500),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _specialController,
                  label: 'Special Requests / Slot Preference (Optional)',
                  hint: 'e.g. Morning 9 AM slot, group seating...',
                  prefixIcon: Icons.notes_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                CustomButton(
                  text: 'Submit Activity Booking Request',
                  isLoading: _isSubmitting,
                  onPressed: _submitBooking,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
