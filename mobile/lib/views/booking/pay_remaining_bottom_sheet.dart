import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class PayRemainingBottomSheet extends StatefulWidget {
  final Map<String, dynamic> booking;

  const PayRemainingBottomSheet({super.key, required this.booking});

  @override
  State<PayRemainingBottomSheet> createState() => _PayRemainingBottomSheetState();
}

class _PayRemainingBottomSheetState extends State<PayRemainingBottomSheet> {
  final _txIdController = TextEditingController();
  final _upiIdController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _cardExpiryController = TextEditingController();
  final _cvvController = TextEditingController();

  String _paymentMethod = 'UPI / Online';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _txIdController.dispose();
    _upiIdController.dispose();
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _cardExpiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  bool get _isAdvancePayment {
    final paymentStatus = (widget.booking['paymentStatus'] ?? '').toString();
    final isAdvPaid = widget.booking['advancePaid'] == true || paymentStatus == 'Advance Paid' || paymentStatus == 'Full Paid';
    return !isAdvPaid;
  }

  double get _paymentAmount {
    if (_isAdvancePayment) {
      final adv = (widget.booking['advanceAmount'] as num?)?.toDouble() ?? 0.0;
      if (adv > 0) return adv;
      final total = (widget.booking['totalPrice'] as num?)?.toDouble() ?? 0.0;
      return (total * 0.25).roundToDouble();
    }
    final rem = widget.booking['remainingBalance'];
    if (rem != null) return (rem as num).toDouble();
    final total = (widget.booking['totalPrice'] as num?)?.toDouble() ?? 0.0;
    final advance = (widget.booking['advanceAmount'] as num?)?.toDouble() ?? 0.0;
    return (total - advance).clamp(0, double.infinity);
  }

  Future<void> _submitRemainingPayment() async {
    final rawId = widget.booking['_id'] ?? widget.booking['id'] ?? widget.booking['bookingId'];
    final bookingIdStr = rawId?.toString();
    if (bookingIdStr == null || bookingIdStr.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid booking ID'), backgroundColor: AppTheme.errorColor),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final payload = {
      'isAdvancePayment': _isAdvancePayment,
      'paymentMethod': _paymentMethod,
      'transactionId': _txIdController.text.trim(),
      'paymentDetails': {
        'upiId': _upiIdController.text.trim(),
        'cardNumber': _cardNumberController.text.trim(),
        'cardHolder': _cardHolderController.text.trim(),
        'cardExpiry': _cardExpiryController.text.trim(),
      }
    };

    try {
      final url = '${ApiConfig.baseUrl}/bookings/$bookingIdStr/pay-remaining';
      dynamic response;
      try {
        response = await ApiService.patch(url, payload);
      } catch (_) {
        response = await ApiService.post(url, payload);
      }

      if (!mounted) return;

      if (response['success'] == true) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isAdvancePayment
                ? 'Advance payment submitted successfully! Tour booking confirmed.'
                : 'Remaining balance payment submitted successfully! Order fully paid.'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message'] ?? 'Payment update failed'),
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

  Widget _buildDemoPaymentBox() {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final suffix = timestamp.length > 6 ? timestamp.substring(timestamp.length - 6) : '8899';
    final demoTxnId = 'REM-PAY-$suffix';

    if (_paymentMethod == 'UPI / Online') {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Demo UPI ID: holidaycity@ybl', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.green)),
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _txIdController.text = demoTxnId;
                    if (_upiIdController.text.isEmpty) _upiIdController.text = 'holidaycity@ybl';
                  });
                },
                icon: const Icon(Icons.flash_on, size: 14, color: Colors.green),
                label: Text('Autofill Demo UPI TXN ($demoTxnId)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.green), padding: const EdgeInsets.symmetric(vertical: 4)),
              ),
            ),
          ],
        ),
      );
    } else if (_paymentMethod == 'Card') {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Demo Visa Card: 4111 •••• •••• 4444', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blue)),
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _txIdController.text = demoTxnId;
                    if (_cardNumberController.text.isEmpty) _cardNumberController.text = '4111 2222 3333 4444';
                    if (_cardHolderController.text.isEmpty) _cardHolderController.text = 'DEMO TRAVELER';
                    if (_cardExpiryController.text.isEmpty) _cardExpiryController.text = '12/28';
                  });
                },
                icon: const Icon(Icons.flash_on, size: 14, color: Colors.blue),
                label: Text('Autofill Demo Card TXN ($demoTxnId)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.blue), padding: const EdgeInsets.symmetric(vertical: 4)),
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Demo Bank / Cash Transfer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.brown)),
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() => _txIdController.text = demoTxnId);
                },
                icon: const Icon(Icons.flash_on, size: 14, color: Colors.brown),
                label: Text('Autofill Demo Ref ($demoTxnId)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.brown)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.brown), padding: const EdgeInsets.symmetric(vertical: 4)),
              ),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                _isAdvancePayment ? 'Pay Advance Amount' : 'Pay Remaining Balance',
                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              Text('Booking ID: ${widget.booking['bookingId'] ?? 'BK-TOUR'} • ${widget.booking['packageName'] ?? 'Package'}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _isAdvancePayment ? const Color(0xFFECFDF5) : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _isAdvancePayment ? const Color(0xFFA7F3D0) : Colors.amber.shade200),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _isAdvancePayment ? 'Advance Payment Due:' : 'Remaining Due Amount:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: _isAdvancePayment ? const Color(0xFF065F46) : Colors.amber.shade800),
                    ),
                    Text(
                      '₹${currencyFormatter.format(_paymentAmount)}',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: _isAdvancePayment ? const Color(0xFF065F46) : Colors.amber.shade800),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                initialValue: _paymentMethod,
                decoration: InputDecoration(
                  labelText: 'Payment Method',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: ['UPI / Online', 'Card', 'Bank Transfer', 'Cash']
                    .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _paymentMethod = val);
                },
              ),

              if (_paymentMethod == 'UPI / Online') ...[
                const SizedBox(height: 10),
                CustomTextField(
                  controller: _upiIdController,
                  label: 'Your UPI VPA ID',
                  hint: 'e.g. user@okicici',
                  prefixIcon: Icons.alternate_email,
                ),
              ],

              if (_paymentMethod == 'Card') ...[
                const SizedBox(height: 10),
                CustomTextField(
                  controller: _cardHolderController,
                  label: 'Cardholder Name',
                  hint: 'e.g. NAVEEN KUMAR',
                  prefixIcon: Icons.person_outline,
                ),
                const SizedBox(height: 8),
                CustomTextField(
                  controller: _cardNumberController,
                  label: 'Card Number',
                  hint: '4111 2222 3333 4444',
                  prefixIcon: Icons.credit_card_outlined,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _cardExpiryController,
                        label: 'Expiry (MM/YY)',
                        hint: '12/28',
                        prefixIcon: Icons.calendar_month_outlined,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: CustomTextField(
                        controller: _cvvController,
                        label: 'CVV',
                        hint: '123',
                        prefixIcon: Icons.lock_outline,
                        obscureText: true,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ],

              _buildDemoPaymentBox(),

              CustomTextField(
                controller: _txIdController,
                label: 'Payment Ref / Transaction ID (Optional)',
                hint: 'e.g. REM-PAY-98124',
                prefixIcon: Icons.receipt_long_outlined,
              ),
              const SizedBox(height: 20),

              CustomButton(
                text: _isAdvancePayment
                    ? 'Confirm Advance Payment ₹${currencyFormatter.format(_paymentAmount)}'
                    : 'Confirm Remaining Payment ₹${currencyFormatter.format(_paymentAmount)}',
                isLoading: _isSubmitting,
                onPressed: _submitRemainingPayment,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
