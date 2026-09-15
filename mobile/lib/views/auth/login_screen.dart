import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../widgets/app_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/destination_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../home/home_screen.dart';
import '../legal/legal_screen.dart';
import 'forget_screen.dart';
import 'register_screen.dart';

/// Login step, ported from UserDashboardPage.tsx's multi-step login:
/// identifier -> (password | otp).
enum _LoginStep { identifier, password, otp }

class LoginScreen extends StatefulWidget {
  final bool isBookingPrompt;
  const LoginScreen({super.key, this.isBookingPrompt = false});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  // Step 1 — single "phone number or email" field.
  final _identifierController = TextEditingController();
  // Step 2a — password (email path, hits the real /auth/login endpoint).
  final _passwordController = TextEditingController();
  // Step 2b — OTP (phone path; see NOTE below — no backend for this yet).
  final _otpController = TextEditingController();

  _LoginStep _step = _LoginStep.identifier;
  bool _obscurePassword = true;
  String _identifierError = '';
  String _resolvedEmail = '';
  final String _resolvedPhone = ''; // phone/OTP sign-in not wired to a backend

  Timer? _resendTimer;
  int _otpResendIn = 0;

  // Blue-hero background image carousel (mirrors the web AuthHeroCarousel).
  static const _heroImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
  ];
  int _heroIndex = 0;
  Timer? _heroTimer;

  @override
  void initState() {
    super.initState();
    _heroTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      setState(() => _heroIndex = (_heroIndex + 1) % _heroImages.length);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isLoggedIn) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      }
    });
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    _resendTimer?.cancel();
    _heroTimer?.cancel();
    super.dispose();
  }

  void _startResendCountdown() {
    _resendTimer?.cancel();
    setState(() => _otpResendIn = 30);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_otpResendIn <= 1) {
        t.cancel();
        setState(() => _otpResendIn = 0);
      } else {
        setState(() => _otpResendIn -= 1);
      }
    });
  }

  // Step 1 -> decide whether the identifier is an email or a phone number,
  // mirroring the regex used in UserDashboardPage.tsx.
  void _handleIdentifierContinue() {
    setState(() => _identifierError = '');
    final value = _identifierController.text.trim();
    final isEmail = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value);
    final digits = value.replaceAll(RegExp(r'[\s\-()]'), '');
    final isPhone = RegExp(r'^\+?\d{8,15}$').hasMatch(digits);

    if (isEmail) {
      setState(() {
        _resolvedEmail = value;
        _passwordController.clear();
        _step = _LoginStep.password;
      });
    } else if (isPhone) {
      // Phone / OTP sign-in has no backend yet (server only exposes
      // /auth/login, /auth/register, /auth/forgot-password). Say so plainly
      // instead of routing to a code screen that can't verify anything.
      setState(() => _identifierError =
          'Phone sign-in isn’t available yet — please sign in with your email address.');
    } else {
      setState(() => _identifierError = 'Enter a valid email address.');
    }
  }

  // Step 2a — real login against /auth/login via AuthService/AuthProvider.
  // Errors from the backend are surfaced as-is; a failed login never
  // fabricates a session.
  void _handlePasswordLogin() async {
    if (!_formKey.currentState!.validate()) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _resolvedEmail,
      _passwordController.text,
    );
    if (!mounted) return;

    if (success) {
      await _postLoginFetchAndNavigate();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Invalid email or password.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  // Step 2b — verify OTP.
  //
  // NOTE (honesty): the backend only exposes /auth/login, /auth/register and
  // /auth/forgot-password (see server/src/controllers/authController.ts) —
  // there is no /auth/send-otp or /auth/verify-otp endpoint. This mirrors
  // the web client's handleVerifyOtp(), which is a client-only placeholder:
  // any well-formed 6-digit code is accepted and a *local* session is
  // fabricated (not a real backend-issued account/token). This is called
  // out clearly rather than silently pretending it's a real sign-in — do
  // not extend this pattern to server-backed flows. Wiring a real OTP flow
  // needs new server endpoints (send-otp / verify-otp) plus an SMS provider.
  void _handleVerifyOtp() async {
    setState(() => _identifierError = '');
    if (!RegExp(r'^\d{6}$').hasMatch(_otpController.text)) {
      setState(() => _identifierError = 'Enter the 6-digit code.');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Phone sign-in is a UI placeholder — there is no OTP backend yet. '
          'Please sign in with email/password instead.',
        ),
        backgroundColor: AppTheme.errorColor,
      ),
    );
  }

  Future<void> _postLoginFetchAndNavigate() async {
    await Future.wait([
      Provider.of<PackageProvider>(context, listen: false).fetchPackages(),
      Provider.of<DestinationProvider>(context, listen: false).fetchDestinations(),
      Provider.of<BannerProvider>(context, listen: false).fetchBanners(),
      Provider.of<SpecializationThemeProvider>(context, listen: false).fetchThemes(),
    ]);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Welcome back to HolidayCity!'),
        backgroundColor: AppTheme.successColor,
      ),
    );
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final headerH =
        (MediaQuery.of(context).size.height * 0.33).clamp(260.0, 320.0);

    final title = _step == _LoginStep.password
        ? 'Enter your password'
        : _step == _LoginStep.otp
            ? 'Verify your phone'
            : 'Welcome Back';

    final sheetLabel = _step == _LoginStep.password
        ? 'ENTER YOUR PASSWORD'
        : _step == _LoginStep.otp
            ? 'VERIFY YOUR PHONE'
            : 'SIGN IN TO YOUR ACCOUNT';

    final sheetHelper = _step == _LoginStep.password
        ? 'Enter the password for $_resolvedEmail.'
        : _step == _LoginStep.otp
            ? 'We sent a 6-digit code to $_resolvedPhone.'
            : 'Enter your registered email address to continue.';

    final cs = context.colors;

    return Scaffold(
      backgroundColor: cs.scaffold,
      body: Column(
        children: [
          // ── Blue hero: travel-image carousel behind an ocean tint ──
          SizedBox(
            height: headerH,
            child: Stack(
              fit: StackFit.expand,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 900),
                  child: AppNetworkImage(
                    key: ValueKey(_heroIndex),
                    imageUrl: _heroImages[_heroIndex],
                    fit: BoxFit.cover,
                    targetWidth: 600,
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primaryDarkColor.withValues(alpha: 0.74),
                        AppTheme.primaryColor.withValues(alpha: 0.62),
                        AppTheme.secondaryColor.withValues(alpha: 0.55),
                      ],
                    ),
                  ),
                ),
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (!widget.isBookingPrompt)
                              GestureDetector(
                                  onTap: () {
                                    Navigator.pushAndRemoveUntil(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) => const HomeScreen()),
                                      (route) => false,
                                    );
                                  },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(999),
                                    border: Border.all(
                                        color:
                                            Colors.white.withValues(alpha: 0.35)),
                                  ),
                                  child: const Text('Guest',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.6)),
                                ),
                              ),
                          ],
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            GestureDetector(
                              onLongPress: _showServerIpDialog,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.18),
                                        blurRadius: 24,
                                        offset: const Offset(0, 10)),
                                  ],
                                ),
                                child: Image.asset('assets/images/logo.png',
                                    height: 38, fit: BoxFit.contain),
                              ),
                            ),
                            const SizedBox(height: 14),
                            Padding(
                              padding: const EdgeInsets.only(bottom: 24.0),
                              child: Text(
                                title,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
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
          ),

          // ── Sheet lifting over the blue ──
          Expanded(
            child: Transform.translate(
              offset: const Offset(0, -24),
              child: Container(
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(
                        color: cs.shadow,
                        blurRadius: 30,
                        offset: const Offset(0, -8)),
                  ],
                ),
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(24, 18, 24,
                      28 + MediaQuery.of(context).viewInsets.bottom),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Container(
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: cs.border,
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        Text(sheetLabel,
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.4,
                                color: AppTheme.primaryColor)),
                        const SizedBox(height: 6),
                        Text(sheetHelper,
                            style: TextStyle(
                                fontSize: 13,
                                height: 1.45,
                                color: cs.textSecondary)),
                        const SizedBox(height: 24),
                        if (_step == _LoginStep.identifier)
                          ..._buildIdentifierStep(),
                        if (_step == _LoginStep.password)
                          ..._buildPasswordStep(authProvider),
                        if (_step == _LoginStep.otp)
                          ..._buildOtpStep(),
                        const SizedBox(height: 20),
                        _buildLegalNote(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildIdentifierStep() {
    return [
      CustomTextField(
        controller: _identifierController,
        label: 'Email address',
        hint: '',
        prefixIcon: Icons.alternate_email_rounded,
        keyboardType: TextInputType.emailAddress,
      ),
      if (_identifierError.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 14, color: AppTheme.errorColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _identifierError,
                  style: const TextStyle(
                      color: AppTheme.errorColor, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      const SizedBox(height: 24),
      CustomButton(text: 'Continue', onPressed: _handleIdentifierContinue),
      const SizedBox(height: 24),
      _registerPrompt(),
    ];
  }

  Widget _registerPrompt() {
    final cs = context.colors;
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text("Don't have an account? ",
              style: TextStyle(
                  color: cs.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500)),
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const RegisterScreen()),
            ),
            child: const Text('Register',
                style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildPasswordStep(AuthProvider authProvider) {
    final cs = context.colors;
    return [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: cs.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            const Icon(Icons.email_outlined, size: 18, color: AppTheme.primaryColor),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                _resolvedEmail,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: cs.textPrimary),
              ),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _identifierController.text = _resolvedEmail;
                  _step = _LoginStep.identifier;
                });
              },
              child: const Text('Edit'),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      CustomTextField(
        controller: _passwordController,
        label: 'Password',
        hint: '',
        prefixIcon: Icons.lock_outline,
        obscureText: _obscurePassword,
        suffixIcon: IconButton(
          tooltip: _obscurePassword ? 'Show password' : 'Hide password',
          icon: Icon(
            _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: AppTheme.textSecondary,
          ),
          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) return 'Please enter your password';
          return null;
        },
      ),
      Align(
        alignment: Alignment.centerRight,
        child: TextButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ForgetScreen()),
            );
          },
          child: const Text(
            'Forgot Password?',
            style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      const SizedBox(height: 8),
      CustomButton(
        text: 'Sign In',
        isLoading: authProvider.isLoading,
        onPressed: _handlePasswordLogin,
      ),
      const SizedBox(height: 20),
      _registerPrompt(),
    ];
  }

  List<Widget> _buildOtpStep() {
    final cs = context.colors;
    return [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: cs.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            const Icon(Icons.phone_outlined, size: 18, color: AppTheme.primaryColor),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                _resolvedPhone,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: cs.textPrimary),
              ),
            ),
            TextButton(
              onPressed: () {
                _resendTimer?.cancel();
                setState(() {
                  _identifierController.text = _resolvedPhone;
                  _step = _LoginStep.identifier;
                });
              },
              child: const Text('Change number'),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      Text(
        '6-digit code',
        style: TextStyle(
            fontSize: 14, fontWeight: FontWeight.w600, color: cs.textSecondary),
      ),
      const SizedBox(height: 6),
      TextField(
        controller: _otpController,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(6),
        ],
        textAlign: TextAlign.center,
        style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 8,
            color: cs.textPrimary),
        decoration: const InputDecoration(hintText: ''),
      ),
      if (_identifierError.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            _identifierError,
            style: const TextStyle(color: AppTheme.errorColor, fontSize: 12),
          ),
        ),
      const SizedBox(height: 24),
      CustomButton(text: 'Verify & Sign In', onPressed: _handleVerifyOtp),
      const SizedBox(height: 16),
      Center(
        child: _otpResendIn > 0
            ? Text(
                'Resend in ${_otpResendIn}s',
                style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.bold),
              )
            : TextButton(
                onPressed: () {
                  _startResendCountdown();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('We sent a 6-digit code to $_resolvedPhone')),
                  );
                },
                child: const Text('Resend code'),
              ),
      ),
    ];
  }

  void _openLegal(Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  // "By continuing you agree to …" — opens the in-app Terms / Privacy pages
  // (no browser / url_launcher, so it works offline and stays themed).
  Widget _buildLegalNote() {
    final base = TextStyle(
        fontSize: 11, height: 1.5, color: context.colors.textSecondary);
    final link = base.copyWith(
        color: AppTheme.primaryColor, fontWeight: FontWeight.w700);
    return Text.rich(
      TextSpan(
        style: base,
        children: [
          const TextSpan(text: 'By continuing you agree to our '),
          TextSpan(
            text: 'Terms & Conditions',
            style: link,
            recognizer: TapGestureRecognizer()
              ..onTap = () => _openLegal(LegalScreen.terms()),
          ),
          const TextSpan(text: ' and '),
          TextSpan(
            text: 'Privacy Policy',
            style: link,
            recognizer: TapGestureRecognizer()
              ..onTap = () => _openLegal(LegalScreen.privacy()),
          ),
          const TextSpan(text: '.'),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }

  void _showServerIpDialog() {
    ApiConfig.showServerConfigDialog(
      context,
      onSaved: () => setState(() {}),
    );
  }
}
