import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';

/// Shared result screens for the Razorpay payment flow:
/// processing / success / failed / timeout / cancelled.
///
/// Rendered inside the payment bottom sheet (so it stays a self-contained
/// flow) but written as a plain widget so it can be reused elsewhere.
enum PaymentResultKind { processing, success, failed, timeout, cancelled }

class PaymentResultView extends StatelessWidget {
  final PaymentResultKind kind;

  /// Amount in rupees, shown on the processing / success screens.
  final String? amountLabel;

  /// Extra line under the title (error description, etc.).
  final String? message;

  /// Razorpay / server error code, shown small + monospace when present.
  final String? code;

  final VoidCallback? onRetry;
  final VoidCallback? onDone;
  final VoidCallback? onClose;

  const PaymentResultView({
    super.key,
    required this.kind,
    this.amountLabel,
    this.message,
    this.code,
    this.onRetry,
    this.onDone,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final cs = context.colors;

    final (IconData icon, Color tint, String title) = switch (kind) {
      PaymentResultKind.processing => (
          Icons.hourglass_top_rounded,
          AppTheme.primaryColor,
          'Processing payment',
        ),
      PaymentResultKind.success => (
          Icons.check_circle_rounded,
          AppTheme.successColor,
          'Payment successful',
        ),
      PaymentResultKind.failed => (
          Icons.error_rounded,
          AppTheme.errorColor,
          'Payment not completed',
        ),
      PaymentResultKind.timeout => (
          Icons.timer_off_rounded,
          Colors.orange,
          'Payment timed out',
        ),
      PaymentResultKind.cancelled => (
          Icons.cancel_rounded,
          cs.textSecondary,
          'Payment cancelled',
        ),
    };

    final isProcessing = kind == PaymentResultKind.processing;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 72,
            height: 72,
            child: isProcessing
                ? CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation(tint),
                  )
                : Icon(icon, size: 64, color: tint),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: cs.textPrimary,
            ),
          ),
          if (amountLabel != null && (isProcessing || kind == PaymentResultKind.success)) ...[
            const SizedBox(height: 6),
            Text(
              amountLabel!,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: cs.textPrimary,
              ),
            ),
          ],
          if (message != null && message!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, height: 1.45, color: cs.textSecondary),
            ),
          ],
          if (code != null && code!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              code!,
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.5,
                fontFamily: 'monospace',
                color: cs.textFaint,
              ),
            ),
          ],
          const SizedBox(height: 24),
          if (isProcessing)
            Text(
              'Please don’t close this screen.',
              style: TextStyle(fontSize: 12, color: cs.textFaint),
            )
          else if (kind == PaymentResultKind.success)
            _PrimaryButton(label: 'Done', color: AppTheme.successColor, onTap: onDone)
          else ...[
            _PrimaryButton(label: 'Try again', color: AppTheme.primaryColor, onTap: onRetry),
            const SizedBox(height: 10),
            TextButton(
              onPressed: onClose,
              child: Text('Close', style: TextStyle(color: cs.textSecondary, fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback? onTap;
  const _PrimaryButton({required this.label, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
        ),
      ),
    );
  }
}
