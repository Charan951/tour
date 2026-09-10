import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../payment/payment_result_view.dart';

import '../../widgets/custom_button.dart';

/// Which screen the sheet is showing. `form` is the input form; the rest are
/// the Razorpay result screens rendered by [PaymentResultView].
///
/// Razorpay is the only payment path: a booking is marked paid only after the
/// server verifies the signature and confirms capture with Razorpay. There is
/// no manual "record a transaction id" path — that let a booking be marked
/// paid without any money moving.
enum _Phase { form, processing, success, failed, timeout, cancelled }

class PayRemainingBottomSheet extends StatefulWidget {
  final Map<String, dynamic> booking;

  const PayRemainingBottomSheet({super.key, required this.booking});

  @override
  State<PayRemainingBottomSheet> createState() => _PayRemainingBottomSheetState();
}

class _PayRemainingBottomSheetState extends State<PayRemainingBottomSheet> {
  bool _isSubmitting = false;
  late Razorpay _razorpay;

  // Razorpay result-screen state.
  _Phase _phase = _Phase.form;
  String _resultMsg = '';
  String? _resultCode;
  Timer? _timeoutTimer;
  bool _gatewayResolved = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleRazorpaySuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleRazorpayError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    _razorpay.clear();
    super.dispose();
  }

  void _handleRazorpaySuccess(PaymentSuccessResponse response) async {
    _timeoutTimer?.cancel();
    if (_gatewayResolved) return;
    _gatewayResolved = true;
    if (mounted) setState(() => _phase = _Phase.processing);

    final rawId = widget.booking['_id'] ?? widget.booking['id'] ?? widget.booking['bookingId'];
    final bookingIdStr = rawId?.toString() ?? '';

    try {
      final res = await ApiService.post('${ApiConfig.baseUrl}/payments/verify', {
        'razorpay_order_id': response.orderId ?? '',
        'razorpay_payment_id': response.paymentId ?? '',
        'razorpay_signature': response.signature ?? '',
        'bookingId': bookingIdStr,
        'isAdvancePayment': _isAdvancePayment,
      });
      if (!mounted) return;

      if (res['success'] == true) {
        setState(() => _phase = _Phase.success);
      } else {
        setState(() {
          _phase = _Phase.failed;
          _resultMsg = (res['message'] ?? 'We could not verify this payment.').toString();
          _resultCode = res['code']?.toString();
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.failed;
        _resultMsg =
            'Your payment may have been charged but we could not verify it. Do NOT pay again — contact support with your booking ID.';
        _resultCode = 'VERIFY_NETWORK';
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _handleRazorpayError(PaymentFailureResponse response) {
    _timeoutTimer?.cancel();
    if (_gatewayResolved || !mounted) return;
    _gatewayResolved = true;

    final cancelled = response.code == Razorpay.PAYMENT_CANCELLED;
    setState(() {
      _isSubmitting = false;
      _phase = cancelled ? _Phase.cancelled : _Phase.failed;
      _resultMsg = cancelled
          ? 'You closed the payment before it finished. No money was charged.'
          : ((response.message?.isNotEmpty ?? false)
              ? response.message!
              : 'The payment could not be completed. No money was charged.');
      _resultCode = cancelled ? null : response.code?.toString();
    });
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // The real outcome still arrives via the success / error handlers.
    if (mounted) setState(() => _phase = _Phase.processing);
  }

  void _handleGatewayTimeout() {
    if (_gatewayResolved || !mounted) return;
    _gatewayResolved = true;
    setState(() {
      _isSubmitting = false;
      _phase = _Phase.timeout;
      _resultMsg =
          'The payment window timed out. If any amount was deducted, Razorpay refunds it automatically within a few days.';
    });
  }

  Future<void> _startRazorpayPayment() async {
    final rawId = widget.booking['_id'] ?? widget.booking['id'] ?? widget.booking['bookingId'];
    final bookingIdStr = rawId?.toString() ?? '';

    _gatewayResolved = false;
    setState(() {
      _isSubmitting = true;
      _phase = _Phase.processing;
      _resultMsg = '';
      _resultCode = null;
    });

    Map<String, dynamic> orderData;
    try {
      final orderRes = await ApiService.post('${ApiConfig.baseUrl}/payments/create-order', {
        'amount': _paymentAmount,
        'currency': 'INR',
        'bookingId': bookingIdStr,
        'notes': {
          'customerName': widget.booking['customerName'] ?? '',
          'email': widget.booking['email'] ?? '',
          'mobile': widget.booking['mobile'] ?? '',
        }
      });

      if (orderRes['success'] != true ||
          orderRes['data'] == null ||
          orderRes['data']['key'] == null) {
        if (!mounted) return;
        setState(() {
          _isSubmitting = false;
          _phase = _Phase.failed;
          _resultMsg =
              (orderRes['message'] ?? 'Could not start the payment. Please try again.').toString();
          _resultCode = orderRes['code']?.toString();
        });
        return;
      }
      orderData = Map<String, dynamic>.from(orderRes['data'] as Map);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _phase = _Phase.failed;
        _resultMsg = 'Could not reach the payment server. Check your connection and try again.';
        _resultCode = 'NETWORK';
      });
      return;
    }

    final options = {
      'key': orderData['key'],
      'amount': orderData['amount'],
      'currency': orderData['currency'] ?? 'INR',
      'name': 'HolidayCity Tours',
      'description':
          '${_isAdvancePayment ? "Advance payment" : "Remaining balance"} - #${widget.booking['bookingId'] ?? 'BK-TOUR'}',
      'order_id': orderData['id'],
      'timeout': 300,
      'prefill': {
        'contact': widget.booking['mobile'] ?? '',
        'email': widget.booking['email'] ?? '',
        'name': widget.booking['customerName'] ?? '',
      },
      'theme': {'color': '#0A6FB5'},
    };

    try {
      _razorpay.open(options);
      _timeoutTimer?.cancel();
      _timeoutTimer = Timer(const Duration(seconds: 330), _handleGatewayTimeout);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _phase = _Phase.failed;
        _resultMsg = 'Could not open the payment window. Please try again.';
      });
    }
  }

  void _retryPayment() {
    setState(() {
      _phase = _Phase.form;
      _isSubmitting = false;
      _gatewayResolved = false;
      _resultMsg = '';
      _resultCode = null;
    });
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

  Widget _buildSecuredByRazorpayBox(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF93C5FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock_rounded, color: AppTheme.primaryColor, size: 18),
              const SizedBox(width: 8),
              Text(
                'Secured by Razorpay',
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Pay with UPI (GPay, PhonePe, Paytm), credit/debit cards or net banking. '
            'Your booking is marked paid only after the payment is confirmed.',
            style: TextStyle(fontSize: 11, color: context.colors.textSecondary, height: 1.3),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');
    final cs = context.colors;

    if (_phase != _Phase.form) {
      final kind = switch (_phase) {
        _Phase.success => PaymentResultKind.success,
        _Phase.failed => PaymentResultKind.failed,
        _Phase.timeout => PaymentResultKind.timeout,
        _Phase.cancelled => PaymentResultKind.cancelled,
        _ => PaymentResultKind.processing,
      };
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            top: false,
            child: PaymentResultView(
              kind: kind,
              amountLabel: '₹${currencyFormatter.format(_paymentAmount)}',
              message: _resultMsg.isEmpty ? null : _resultMsg,
              code: _resultCode,
              onDone: () => Navigator.pop(context, true),
              onRetry: _retryPayment,
              onClose: () => Navigator.pop(context, false),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
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

              _buildSecuredByRazorpayBox(context),

              CustomButton(
                text: 'Pay ₹${currencyFormatter.format(_paymentAmount)} via Razorpay',
                isLoading: _isSubmitting,
                onPressed: _startRazorpayPayment,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
