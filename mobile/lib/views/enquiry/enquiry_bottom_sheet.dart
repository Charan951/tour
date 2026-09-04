import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../services/connectivity.dart';
import '../../services/enquiry_service.dart';
import '../../services/offline_queue.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class EnquiryBottomSheet extends StatefulWidget {
  final String? defaultDestination;

  const EnquiryBottomSheet({super.key, this.defaultDestination});

  @override
  State<EnquiryBottomSheet> createState() => _EnquiryBottomSheetState();
}

class _EnquiryBottomSheetState extends State<EnquiryBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _destinationController = TextEditingController();
  final _messageController = TextEditingController();
  int _travelers = 2;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.defaultDestination != null) {
      _destinationController.text = widget.defaultDestination!;
    }
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
    _destinationController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _submitEnquiry() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

      try {
        final enquiry = EnquiryModel(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          destination: _destinationController.text.trim(),
          travelers: _travelers,
          travelDate: DateTime.now().add(const Duration(days: 14)).toIso8601String().split('T')[0],
          message: _messageController.text.trim(),
        );

        // Offline → save to the outbox and tell the truth about it.
        if (!ConnectivityStatus.instance.online) {
          await OfflineQueue.instance
              .enqueue(ApiConfig.enquiries, enquiry.toJson());
          if (!mounted) return;
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Saved. We’ll send this enquiry automatically once you’re back online.'),
              backgroundColor: Color(0xFF334155),
            ),
          );
          return;
        }

        final service = EnquiryService();
        bool success;
        try {
          success = await service.submitEnquiry(enquiry);
        } catch (_) {
          // Went offline mid-request — queue it rather than losing it.
          await OfflineQueue.instance
              .enqueue(ApiConfig.enquiries, enquiry.toJson());
          success = false;
          if (mounted) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                    'Saved. We’ll send this enquiry once your connection is back.'),
                backgroundColor: Color(0xFF334155),
              ),
            );
          }
          return;
        }

        if (!mounted) return;

        if (success) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Enquiry submitted successfully! Our travel expert will call you back shortly.'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
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
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Plan Your Trip With Us',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const Text(
                  'Fill in details to get custom quote & best pricing',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 20),

                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'John Doe',
                  prefixIcon: Icons.person_outline,
                  validator: (v) => v == null || v.isEmpty ? 'Name required' : null,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: 'name@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hint: '+91 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) => v == null || v.isEmpty ? 'Phone required' : null,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _destinationController,
                  label: 'Destination',
                  hint: 'e.g. Bali, Kashmir, Kerala',
                  prefixIcon: Icons.place_outlined,
                  validator: (v) => v == null || v.isEmpty ? 'Destination required' : null,
                ),
                const SizedBox(height: 14),

                // Number of Travelers selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Number of Travelers', style: TextStyle(fontWeight: FontWeight.w600)),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Fewer travellers',
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: _travelers > 1 ? () => setState(() => _travelers--) : null,
                        ),
                        Text('$_travelers', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        IconButton(
                          tooltip: 'More travellers',
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: () => setState(() => _travelers++),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _messageController,
                  label: 'Additional Preferences (Optional)',
                  hint: 'e.g. 4-star hotel, veg meal preference...',
                  prefixIcon: Icons.notes_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                CustomButton(
                  text: 'Submit Enquiry',
                  isLoading: _isSubmitting,
                  onPressed: _submitEnquiry,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
