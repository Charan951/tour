import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/enquiry_model.dart';
import '../../models/activity_model.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../services/connectivity.dart';
import '../../services/enquiry_service.dart';
import '../../services/activity_service.dart';
import '../../services/offline_queue.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../auth/login_screen.dart';

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

  // Location Activity Add-Ons
  List<ActivityModel> _availableAddOns = [];
  final Set<String> _selectedAddOnIds = {};
  bool _isLoadingAddOns = false;

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
    if (_destinationController.text.isNotEmpty) {
      _loadDestinationAddOns(_destinationController.text);
    }
  }

  Future<void> _loadDestinationAddOns(String dest) async {
    if (dest.trim().isEmpty) return;
    setState(() => _isLoadingAddOns = true);
    try {
      final service = ActivityService();
      final acts = await service.fetchActivities(destination: dest);
      if (mounted) {
        setState(() {
          _availableAddOns = acts;
          _isLoadingAddOns = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingAddOns = false);
      }
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
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to submit an enquiry'),
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

      final selectedAddOnModels = _availableAddOns.where((a) => _selectedAddOnIds.contains(a.id)).toList();
      final addOnNotes = selectedAddOnModels.isNotEmpty
          ? '\nAdd-ons Selected: ${selectedAddOnModels.map((a) => "${a.title} (+₹${NumberFormat('#,##,###').format(a.startingPrice)}/person)").join(', ')}'
          : '';
      final finalMessage = '${_messageController.text.trim()}$addOnNotes'.trim();

      try {
        final enquiry = EnquiryModel(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          destination: _destinationController.text.trim(),
          travelers: _travelers,
          travelDate: DateTime.now().add(const Duration(days: 14)).toIso8601String().split('T')[0],
          message: finalMessage,
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
                        color: const Color(0xFF0284C7).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF0284C7).withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        'PLAN YOUR TRIP ENQUIRY',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0284C7),
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
                  label: 'Mobile Number',
                  hint: '+91 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) => v == null || v.isEmpty ? 'Mobile required' : null,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _destinationController,
                  label: 'Destination / Package Preference',
                  hint: 'e.g. Goa, Kerala, Manali',
                  prefixIcon: Icons.location_on_outlined,
                  onChanged: (val) {
                    if (val.trim().length >= 3) {
                      _loadDestinationAddOns(val.trim());
                    }
                  },
                  validator: (v) => v == null || v.isEmpty ? 'Destination required' : null,
                ),
                const SizedBox(height: 14),

                // Location Activity Add-Ons Section
                if (_isLoadingAddOns || _availableAddOns.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.15)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  const Icon(Icons.local_activity_outlined, color: AppTheme.primaryColor, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Location Activity Add-Ons',
                                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: context.colors.textPrimary),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'OPTIONAL',
                                style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_isLoadingAddOns)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 6.0),
                            child: Text('Loading activities...', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          )
                        else
                          Column(
                            children: _availableAddOns.map((act) {
                              final isSelected = _selectedAddOnIds.contains(act.id);
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    if (isSelected) {
                                      _selectedAddOnIds.remove(act.id);
                                    } else {
                                      _selectedAddOnIds.add(act.id);
                                    }
                                  });
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? Colors.white : Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                                        color: isSelected ? AppTheme.primaryColor : Colors.grey,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          act.title,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, height: 1.3),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '+₹${NumberFormat('#,##,###').format(act.startingPrice)}',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.primaryColor),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // Number of Travelers selector

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
