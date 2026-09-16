import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String email;

  const ResetPasswordScreen({
    super.key,
    required this.email,
  });

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isSuccess = false;

  int _resendSeconds = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  void _startResendTimer() {
    setState(() => _resendSeconds = 30);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _handleResendOtp() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final ok = await authProvider.forgotPassword(widget.email);
    if (!mounted) return;

    if (ok) {
      _startResendTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A new 6-digit OTP code has been sent to your email. Check Inbox & Spam folder.'),
          backgroundColor: AppTheme.successColor,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      final err = authProvider.errorMessage ?? 'Could not resend OTP.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(err),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _handleReset() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final ok = await authProvider.resetPassword(
      email: widget.email,
      otp: _otpController.text.trim(),
      newPassword: _passwordController.text.trim(),
    );

    if (!mounted) return;

    if (ok) {
      setState(() => _isSuccess = true);
    } else {
      final err = authProvider.errorMessage ?? 'Invalid or expired OTP code. Please check the code or request a new one.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(err),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify OTP & Reset'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: _isSuccess ? _buildSuccessView() : _buildFormView(authProvider),
        ),
      ),
    );
  }

  Widget _buildFormView(AuthProvider authProvider) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.password_rounded,
              size: 40,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Enter Mail OTP',
            style: GoogleFonts.outfit(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'We sent a 6-digit verification code to your email. If you don\'t see it in your inbox, please check your Spam / Junk folder.',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: context.colors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          // Email badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.email_outlined, size: 16, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                Text(
                  widget.email,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          CustomTextField(
            controller: _otpController,
            label: '6-Digit Mail OTP Code',
            hint: '123456',
            prefixIcon: Icons.pin_outlined,
            keyboardType: TextInputType.number,
            maxLength: 6,
            validator: (value) {
              if (value == null || value.trim().isEmpty) return 'OTP code required';
              if (value.trim().length != 6) return 'Enter full 6-digit OTP code';
              return null;
            },
          ),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _passwordController,
            label: 'New Password',
            hint: 'At least 6 characters',
            prefixIcon: Icons.lock_outline,
            obscureText: _obscurePassword,
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: AppTheme.textSecondary,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'New password required';
              if (value.length < 6) return 'At least 6 characters required';
              return null;
            },
          ),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _confirmController,
            label: 'Confirm New Password',
            hint: 'Re-enter your new password',
            prefixIcon: Icons.lock_outline,
            obscureText: _obscureConfirm,
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: AppTheme.textSecondary,
              ),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'Please confirm your password';
              if (value != _passwordController.text) return 'Passwords do not match';
              return null;
            },
          ),
          const SizedBox(height: 28),
          CustomButton(
            text: 'Reset Password',
            isLoading: authProvider.isLoading,
            onPressed: _handleReset,
          ),
          const SizedBox(height: 20),
          Center(
            child: TextButton(
              onPressed: _resendSeconds > 0 || authProvider.isLoading ? null : _handleResendOtp,
              child: Text(
                _resendSeconds > 0
                    ? 'Resend OTP in ${_resendSeconds}s'
                    : 'Didn\'t receive OTP? Resend Code',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _resendSeconds > 0 ? context.colors.textSecondary : AppTheme.primaryColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Color(0xFFD1FAE5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_outline_rounded,
            size: 56,
            color: AppTheme.successColor,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Password Reset!',
          style: GoogleFonts.outfit(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Your password has been updated successfully.\nYou can now sign in with your new password.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: context.colors.textSecondary,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 36),
        CustomButton(
          text: 'Sign In',
          onPressed: () {
            Navigator.of(context).popUntil((route) => route.isFirst);
          },
        ),
      ],
    );
  }
}
