import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/activity_model.dart';
import '../../models/enquiry_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/enquiry_service.dart';
import '../../widgets/custom_text_field.dart';
import '../auth/login_screen.dart';

class ActivityEnquiryBottomSheet extends StatefulWidget {
  final ActivityModel activity;

  const ActivityEnquiryBottomSheet({super.key, required this.activity});

  @override
  State<ActivityEnquiryBottomSheet> createState() => _ActivityEnquiryBottomSheetState();
}

class _ActivityEnquiryBottomSheetState extends State<ActivityEnquiryBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _travelDate = DateTime.now().add(const Duration(days: 3));
  int _adults = 2;
  int _children = 0;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user != null) {
      _nameController.text = user.fullName.isNotEmpty ? user.fullName : user.firstName;
      _emailController.text = user.email;
      _mobileController.text = user.mobile;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitEnquiry() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) {
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
      if (loggedIn == true && mounted) {
        final u = Provider.of<AuthProvider>(context, listen: false).user;
        if (u != null) {
          setState(() {
            _nameController.text = u.fullName.isNotEmpty ? u.fullName : u.firstName;
            _emailController.text = u.email;
            _mobileController.text = u.mobile;
          });
        }
      } else {
        return;
      }
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final enquiryService = EnquiryService();
      final enquiry = EnquiryModel(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _mobileController.text.trim(),
        destination: widget.activity.location.isNotEmpty ? widget.activity.location : widget.activity.destinationName,
        activityTitle: widget.activity.title,
        activityId: widget.activity.id,
        enquiryType: 'activity',
        travelDate: DateFormat('yyyy-MM-dd').format(_travelDate),
        adults: _adults,
        children: _children,
        message: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : 'Enquiry for activity: ${widget.activity.title} (${widget.activity.location})',
      );
      final success = await enquiryService.submitEnquiry(enquiry);

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Activity enquiry submitted successfully! Our expert will contact you shortly.'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit enquiry. Please try again.'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error submitting enquiry: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
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
                        color: AppTheme.primaryColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        'ACTIVITY ENQUIRY',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryColor,
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
                // Activity quick info box
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
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.bolt, color: AppTheme.primaryColor, size: 24),
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
                              '₹${currencyFormatter.format(widget.activity.startingPrice)}/person • ${widget.activity.location.isNotEmpty ? widget.activity.location : widget.activity.destinationName}',
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
                  controller: _mobileController,
                  label: 'Mobile Number *',
                  hint: '+91 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) => v == null || v.isEmpty ? 'Mobile required' : null,
                ),
                const SizedBox(height: 14),

                // Travel Date Picker
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _travelDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() => _travelDate = date);
                    }
                  },
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
                                  'Activity Date: ${DateFormat('EEE, dd MMM yyyy').format(_travelDate)}',
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

                // Participants Selector (Adults & Children - Overflow Free)
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
                                  Text('Age 12+', style: TextStyle(fontSize: 10, color: context.colors.textSecondary)),
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
                                  Text('Age 5-11', style: TextStyle(fontSize: 10, color: context.colors.textSecondary)),
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

                CustomTextField(
                  controller: _notesController,
                  label: 'Questions / Special Notes (Optional)',
                  hint: 'e.g. Pickup location, timing preference...',
                  prefixIcon: Icons.notes_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submitEnquiry,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                    label: Text(
                      _isSubmitting ? 'Submitting...' : 'Submit Activity Enquiry',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
