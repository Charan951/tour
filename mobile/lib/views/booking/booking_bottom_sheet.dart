import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../models/activity_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../services/activity_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class BookingBottomSheet extends StatefulWidget {
  final PackageModel package;

  const BookingBottomSheet({super.key, required this.package});

  @override
  State<BookingBottomSheet> createState() => _BookingBottomSheetState();
}

class _BookingBottomSheetState extends State<BookingBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _specialController = TextEditingController();

  // Address Controller
  final _streetController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));
  int _adults = 2;
  int _children = 0;
  String _selectedTier = 'Standard';

  // Location Activity Add-Ons
  List<ActivityModel> _availableAddOns = [];
  final Set<String> _selectedAddOnIds = {};
  bool _isLoadingAddOns = true;

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
    _loadDestinationAddOns();
  }

  Future<void> _loadDestinationAddOns() async {
    try {
      final service = ActivityService();
      final acts = await service.fetchActivities(destination: widget.package.destination);
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
    _specialController.dispose();
    _streetController.dispose();
    super.dispose();
  }

  double get _unitPrice {
    if (widget.package.pricingTiers.isNotEmpty) {
      final tier = widget.package.pricingTiers.firstWhere(
        (t) => t.category.toLowerCase() == _selectedTier.toLowerCase(),
        orElse: () => widget.package.pricingTiers.first,
      );
      return tier.price;
    }
    return widget.package.price;
  }

  double get _addOnsTotal {
    final selectedActs = _availableAddOns.where((a) => _selectedAddOnIds.contains(a.id));
    return selectedActs.fold(0.0, (sum, a) => sum + (a.startingPrice * _adults));
  }

  double get _totalPrice => (_unitPrice * _adults) + (_unitPrice * 0.5 * _children) + _addOnsTotal;

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
    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

      final selectedAddOnModels = _availableAddOns.where((a) => _selectedAddOnIds.contains(a.id)).toList();
      final addOnNotes = selectedAddOnModels.isNotEmpty
          ? '\nAdd-ons Selected: ${selectedAddOnModels.map((a) => "${a.title} (+₹${NumberFormat('#,##,###').format(a.startingPrice)}/person)").join(', ')}'
          : '';

      final fullSpecialRequests = '${_specialController.text.trim()}$addOnNotes'.trim();

      final bookingData = {
        'package': widget.package.id,
        'packageName': widget.package.title,
        'packageCode': widget.package.packageCode,
        'destinationName': widget.package.destination,
        'customerName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'mobile': _phoneController.text.trim(),
        'address': {
          'street': _streetController.text.trim(),
          'fullAddress': _streetController.text.trim(),
        },
        'travelDate': _selectedDate.toIso8601String(),
        'adults': _adults,
        'children': _children,
        'pricingTier': _selectedTier,
        'selectedAddOns': selectedAddOnModels.map((a) => {
          'id': a.id,
          'title': a.title,
          'price': a.startingPrice,
        }).toList(),
        'totalPrice': _totalPrice,
        'advanceAmount': 0,
        'advancePaid': false,
        'paymentStatus': 'Pending Advance',
        'status': 'Pending',
        'specialRequests': fullSpecialRequests,
      };

      try {
        final service = BookingService();
        final result = await service.createBooking(bookingData);

        if (!mounted) return;

        if (result['success'] == true) {
          final bookingInfo = result['data'] ?? {};
          final bookingId = bookingInfo['bookingId'] ?? 'BK-TOUR';

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
                      'Request Submitted!',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
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
                  Text('Package: ${widget.package.title}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
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
                            const Text('Estimated Price:'),
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
                    'Our trip specialist will review your request and set the advance payment details. Check Profile -> My Bookings screen for updates!',
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
      backgroundColor: const Color(0xFFF8FAFC),
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
                        'BOOK PACKAGE REQUEST',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      clipBehavior: Clip.antiAlias,
                      child: IconButton(
                        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close_rounded, color: AppTheme.textPrimary, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.explore_outlined, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.package.title,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Destination: ${widget.package.destination} • Code: ${widget.package.packageCode.isNotEmpty ? widget.package.packageCode : 'HC-TOUR'}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
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

                // Customer Info
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
                const SizedBox(height: 12),

                // Billing Address
                CustomTextField(
                  controller: _streetController,
                  label: 'Billing / House Address (Optional)',
                  hint: 'e.g. 123 Beach Road, City & Pincode',
                  prefixIcon: Icons.home_outlined,
                ),
                const SizedBox(height: 14),

                // Date Picker Button
                InkWell(
                  onTap: _pickTravelDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                    decoration: BoxDecoration(
                      color: Colors.white,
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
                                  'Travel Date: ${DateFormat('EEE, dd MMM yyyy').format(_selectedDate)}',
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
                          color: Colors.white,
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
                                  Text('Adults', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary)),
                                  const Text('Age 12+', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
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
                          color: Colors.white,
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
                                  Text('Children', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary)),
                                  const Text('Age 2-11', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
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

                // Pricing Tier Selector
                if (widget.package.pricingTiers.isNotEmpty) ...[
                  const Text('Select Tier / Class:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: widget.package.pricingTiers.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final tier = entry.value;
                      final isLast = idx == widget.package.pricingTiers.length - 1;
                      final isSelected = _selectedTier.toLowerCase() == tier.category.toLowerCase();
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTier = tier.category),
                          child: Container(
                            margin: EdgeInsets.only(right: isLast ? 0 : 6),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primaryColor : Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  tier.category,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: isSelected ? Colors.white : Colors.black87,
                                  ),
                                ),
                                Text(
                                  '₹${currencyFormatter.format(tier.price)}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isSelected ? Colors.white.withValues(alpha: 0.9) : Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                ],

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
                                  const Icon(Icons.local_activity_outlined, color: AppTheme.primaryColor, size: 18),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Location Activity Add-Ons',
                                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'OPTIONAL',
                                style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        if (_isLoadingAddOns)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8.0),
                            child: Text('Loading location activities...', style: TextStyle(fontSize: 12, color: Colors.grey)),
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
                                  padding: const EdgeInsets.all(10),
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
                                        size: 20,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              act.title,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, height: 1.3),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              act.duration.isNotEmpty ? act.duration : act.category,
                                              style: const TextStyle(color: Colors.grey, fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            '+₹${currencyFormatter.format(act.startingPrice)}',
                                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primaryColor),
                                          ),
                                          const Text('/person', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                        ],
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

                CustomTextField(
                  controller: _specialController,
                  label: 'Special Requests / Notes (Optional)',
                  hint: 'e.g. Flight timing, vegetarian food...',
                  prefixIcon: Icons.notes_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                CustomButton(
                  text: 'Submit Tour Booking Request',
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
