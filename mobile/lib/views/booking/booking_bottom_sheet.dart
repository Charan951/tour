import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
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

  // Address Controllers
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));
  int _adults = 2;
  int _children = 0;
  String _selectedTier = 'Standard';

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
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
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
    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

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
          'city': _cityController.text.trim(),
          'state': _stateController.text.trim(),
          'pincode': _pincodeController.text.trim(),
          'fullAddress': [
            _streetController.text.trim(),
            _cityController.text.trim(),
            _stateController.text.trim(),
            _pincodeController.text.trim()
          ].where((e) => e.isNotEmpty).join(', '),
        },
        'travelDate': _selectedDate.toIso8601String(),
        'adults': _adults,
        'children': _children,
        'pricingTier': _selectedTier,
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

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
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
                  'Book ${widget.package.title}',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Destination: ${widget.package.destination} • Code: ${widget.package.packageCode.isNotEmpty ? widget.package.packageCode : 'HC-TOUR'}',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 20),

                // Customer Info
                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name *',
                  hint: 'John Doe',
                  prefixIcon: Icons.person_outline,
                  validator: (v) => v == null || v.isEmpty ? 'Name required' : null,
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _emailController,
                        label: 'Email Address *',
                        hint: 'name@example.com',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: CustomTextField(
                        controller: _phoneController,
                        label: 'Mobile Number *',
                        hint: '+91 9876543210',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        validator: (v) => v == null || v.isEmpty ? 'Mobile required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Billing Address Section
                CustomTextField(
                  controller: _streetController,
                  label: 'Billing / House Address (Optional)',
                  hint: 'e.g. 123 Beach Road, Flat 402',
                  prefixIcon: Icons.home_outlined,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _cityController,
                        label: 'City',
                        hint: 'e.g. Mumbai',
                        prefixIcon: Icons.location_city_outlined,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: CustomTextField(
                        controller: _stateController,
                        label: 'State',
                        hint: 'e.g. Maharashtra',
                        prefixIcon: Icons.map_outlined,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: CustomTextField(
                        controller: _pincodeController,
                        label: 'Pincode',
                        hint: '400001',
                        prefixIcon: Icons.pin_drop_outlined,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Date Picker Button
                InkWell(
                  onTap: _pickTravelDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today, color: AppTheme.primaryColor, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              'Travel Date: ${DateFormat('EEE, dd MMM yyyy').format(_selectedDate)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        const Icon(Icons.edit, size: 16, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Pricing Tier Selector (if tiers exist)
                if (widget.package.pricingTiers.isNotEmpty) ...[
                  const Text('Select Tier / Class:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: widget.package.pricingTiers.map((tier) {
                      final isSelected = _selectedTier.toLowerCase() == tier.category.toLowerCase();
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTier = tier.category),
                          child: Container(
                            margin: const EdgeInsets.only(right: 6),
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
                  const SizedBox(height: 16),
                ],

                // Number of Adults & Children
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Adults (12+ yrs)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        Text('Full Fare', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Remove adult',
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: _adults > 1 ? () => setState(() => _adults--) : null,
                        ),
                        Text('$_adults', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        IconButton(
                          tooltip: 'Add adult',
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: () => setState(() => _adults++),
                        ),
                      ],
                    ),
                  ],
                ),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Children (5-11 yrs)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        Text('50% Fare', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Remove child',
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: _children > 0 ? () => setState(() => _children--) : null,
                        ),
                        Text('$_children', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        IconButton(
                          tooltip: 'Add child',
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: () => setState(() => _children++),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Estimated Package Price Card
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
                          const Text('Estimated Package Price:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
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
                          Icon(Icons.info_outline, size: 14, color: Colors.blue),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'No payment required now. Submit request & await admin approval.',
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
