import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/destination_provider.dart';
import '../../providers/package_provider.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../home/home_screen.dart';
import 'forget_screen.dart';
import 'register_screen.dart';

/// Login step, ported from UserDashboardPage.tsx's multi-step login:
/// identifier -> (password | otp).
enum _LoginStep { identifier, password, otp }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

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
  String _resolvedPhone = '';

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
      setState(() {
        _resolvedPhone = digits;
        _otpController.clear();
        _step = _LoginStep.otp;
      });
      _startResendCountdown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('We sent a 6-digit code to $_resolvedPhone')),
      );
    } else {
      setState(() => _identifierError = 'Enter a valid email address or phone number.');
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
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final headerH =
        (MediaQuery.of(context).size.height * 0.30).clamp(230.0, 300.0);

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
            : 'Enter your registered phone number or email to continue.';

    return Scaffold(
      backgroundColor: Colors.white,
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
                  child: CachedNetworkImage(
                    key: ValueKey(_heroIndex),
                    imageUrl: _heroImages[_heroIndex],
                    fit: BoxFit.cover,
                    fadeInDuration: const Duration(milliseconds: 300),
                    placeholder: (_, __) =>
                        Container(color: AppTheme.primaryDarkColor),
                    errorWidget: (_, __, ___) =>
                        Container(color: AppTheme.primaryDarkColor),
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
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton.icon(
                              onPressed: () {
                                if (_step != _LoginStep.identifier) {
                                  setState(() {
                                    _step = _LoginStep.identifier;
                                    _identifierError = '';
                                    _otpController.clear();
                                  });
                                  _resendTimer?.cancel();
                                } else {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => const HomeScreen()),
                                  );
                                }
                              },
                              icon: const Icon(Icons.arrow_back,
                                  size: 16, color: Colors.white),
                              label: const Text('Back',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5)),
                              style:
                                  TextButton.styleFrom(padding: EdgeInsets.zero),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const HomeScreen()),
                              ),
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
                        const Spacer(),
                        GestureDetector(
                          onLongPress: _showServerIpDialog,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 12),
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
                                height: 40, fit: BoxFit.contain),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(title,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── White sheet lifting over the blue ──
          Expanded(
            child: Transform.translate(
              offset: const Offset(0, -24),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(
                        color: Color(0x22063B6D),
                        blurRadius: 30,
                        offset: Offset(0, -8)),
                  ],
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return SingleChildScrollView(
                      padding: EdgeInsets.fromLTRB(24, 14, 24,
                          20 + MediaQuery.of(context).viewInsets.bottom),
                      child: ConstrainedBox(
                        constraints:
                            BoxConstraints(minHeight: constraints.maxHeight),
                        child: IntrinsicHeight(
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
                                      color: const Color(0xFFE2E8F0),
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
                                const SizedBox(height: 8),
                                Text(sheetHelper,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        height: 1.45,
                                        color: AppTheme.textSecondary)),
                                const SizedBox(height: 26),
                                if (_step == _LoginStep.identifier)
                                  ..._buildIdentifierStep(),
                                if (_step == _LoginStep.password)
                                  ..._buildPasswordStep(authProvider),
                                if (_step == _LoginStep.otp)
                                  ..._buildOtpStep(),
                                // One flexible gap absorbs the rest so the
                                // sign-up prompt sits at the bottom with a
                                // single, deliberate space above it.
                                const Spacer(),
                                if (_step == _LoginStep.identifier)
                                  Center(
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text("Don't have an account? ",
                                            style: TextStyle(
                                                color:
                                                    AppTheme.textSecondary)),
                                        GestureDetector(
                                          onTap: () => Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                                builder: (_) =>
                                                    const RegisterScreen()),
                                          ),
                                          child: const Text('Register',
                                              style: TextStyle(
                                                  color: AppTheme.primaryColor,
                                                  fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
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
        label: 'Phone number or email',
        hint: 'name@example.com  ·  98765 43210',
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
      const SizedBox(height: 22),
      CustomButton(text: 'Continue', onPressed: _handleIdentifierContinue),
    ];
  }

  List<Widget> _buildPasswordStep(AuthProvider authProvider) {
    return [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
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
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
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
        hint: '••••••••',
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
    ];
  }

  List<Widget> _buildOtpStep() {
    return [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
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
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
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
      const Text(
        '6-digit code',
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
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
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
        decoration: const InputDecoration(hintText: '••••••'),
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

  void _showServerIpDialog() {
    final controller = TextEditingController(text: ApiConfig.customHost ?? '');
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Configure Backend Server IP'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your laptop IPv4 address (e.g. 192.168.1.15) if testing over Wi-Fi, or leave empty for default:',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: '192.168.x.x',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.dns),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                ApiConfig.customHost =
                    controller.text.trim().isEmpty ? null : controller.text.trim();
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Server URL set to: ${ApiConfig.baseUrl}')),
              );
            },
            child: const Text('Save Host'),
          ),
        ],
      ),
    );
  }
}
