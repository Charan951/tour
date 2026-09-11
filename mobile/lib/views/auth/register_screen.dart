import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../legal/legal_screen.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/destination_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../home/home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  // Single "Full name" field, matching the web mobile redesign — split
  // client-side into firstName/lastName the same way UserDashboardPage.tsx
  // does: first word -> firstName, remainder (may be empty) -> lastName.
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showServerIpDialog() {
    ApiConfig.showServerConfigDialog(
      context,
      onSaved: () => setState(() {}),
    );
  }

  void _handleRegister() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final parts = _fullNameController.text.trim().split(RegExp(r'\s+'))
        ..removeWhere((p) => p.isEmpty);
      final firstName = parts.isNotEmpty ? parts.first : '';
      final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : firstName;
      final success = await authProvider.register(
        firstName: firstName,
        lastName: lastName,
        email: _emailController.text.trim(),
        mobile: _mobileController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (success) {
        await Future.wait([
          Provider.of<PackageProvider>(context, listen: false).fetchPackages(),
          Provider.of<DestinationProvider>(context, listen: false).fetchDestinations(),
          Provider.of<BannerProvider>(context, listen: false).fetchBanners(),
          Provider.of<SpecializationThemeProvider>(context, listen: false).fetchThemes(),
        ]);

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Account created successfully! Welcome to HolidayCity.'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'Registration failed'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Widget _agreementLine(BuildContext context) {
    final base = TextStyle(fontSize: 11.5, color: context.colors.textSecondary, height: 1.4);
    final link = base.copyWith(
        color: AppTheme.primaryColor, fontWeight: FontWeight.w700);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Text.rich(
        TextSpan(
          style: base,
          children: [
            const TextSpan(text: 'By creating an account you agree to our '),
            TextSpan(
              text: 'Terms',
              style: link,
              recognizer: TapGestureRecognizer()
                ..onTap = () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => LegalScreen.terms())),
            ),
            const TextSpan(text: ' and '),
            TextSpan(
              text: 'Privacy Policy',
              style: link,
              recognizer: TapGestureRecognizer()
                ..onTap = () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => LegalScreen.privacy())),
            ),
            const TextSpan(text: '.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Join HolidayCity',
                  style: GoogleFonts.outfit(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: context.colors.textPrimary,
                  ),
                ),
                Text(
                  'Create an account to start booking customized tours',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: context.colors.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),

                CustomTextField(
                  controller: _fullNameController,
                  label: 'Full Name',
                  hint: '',
                  prefixIcon: Icons.person_outline,
                  validator: (value) =>
                      value == null || value.trim().isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: '',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Email required';
                    if (!value.contains('@')) return 'Enter valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _mobileController,
                  label: 'Mobile Number',
                  hint: '',
                  prefixIcon: Icons.phone_android_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (value) => value == null || value.isEmpty
                      ? 'Mobile number required'
                      : null,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: '',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    tooltip:
                        _obscurePassword ? 'Show password' : 'Hide password',
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: context.colors.textSecondary,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Password required';
                    if (value.length < 6) return 'At least 6 characters required';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hint: '',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscureConfirmPassword,
                  suffixIcon: IconButton(
                    tooltip: _obscureConfirmPassword
                        ? 'Show password'
                        : 'Hide password',
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: context.colors.textSecondary,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                  ),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                CustomButton(
                  text: 'Create Account',
                  isLoading: authProvider.isLoading,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 12),
                _agreementLine(context),
                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: TextStyle(color: context.colors.textSecondary),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Text(
                        'Log In',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton.icon(
                    onPressed: _showServerIpDialog,
                    icon: Icon(Icons.wifi_tethering, size: 14, color: context.colors.textSecondary),
                    label: Text(
                      'Server: ${ApiConfig.baseUrl}',
                      style: TextStyle(fontSize: 11, color: context.colors.textSecondary),
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
