import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../home/home_screen.dart';
import '../onboarding/onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _floatAnimation;
  late Animation<double> _dotPulseAnimation;
  Timer? _initialTimer;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: ConstantTween(0.0), weight: 20),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 60,
      ),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 20),
    ]).animate(_controller);

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween<double>(begin: 0.9, end: 1.0)
              .chain(CurveTween(curve: Curves.easeOutBack)),
          weight: 75),
      TweenSequenceItem(
        tween: ConstantTween(1.0),
        weight: 25,
      ),
    ]).animate(_controller);

    _floatAnimation = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween<double>(begin: 0.0, end: -6.0)
              .chain(CurveTween(curve: Curves.easeInOutCubic)),
          weight: 50),
      TweenSequenceItem(
          tween: Tween<double>(begin: -6.0, end: 0.0)
              .chain(CurveTween(curve: Curves.easeInOutCubic)),
          weight: 50),
    ]).animate(_controller);

    _dotPulseAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: ConstantTween(0.7), weight: 25),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.7, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 50,
      ),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 25),
    ]).animate(_controller);

    _controller.forward();
    _checkInitialState();
  }

  Future<void> _checkInitialState() async {
    final startTime = DateTime.now();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    // Local-only: reads the saved session from storage, never hits the network,
    // so the splash can't hang on a slow connection when the app is reopened.
    await authProvider.initAuth();

    // Keep the splash just long enough for the logo animation to land.
    final elapsed = DateTime.now().difference(startTime).inMilliseconds;
    const minSplashDuration = 1100;
    if (elapsed < minSplashDuration) {
      await Future.delayed(Duration(milliseconds: minSplashDuration - elapsed));
    }

    if (!mounted) return;
    _navigateNext();
  }

  void _navigateNext() {
    if (_navigated || !mounted) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isInitialized) {
      return;
    }

    _navigated = true;
    _initialTimer?.cancel();

    if (authProvider.canAccessApp) {
      // Signed-in (or guest) users go straight to Home; the server profile
      // refreshes quietly behind the already-visible UI.
      authProvider.refreshCurrentUserInBackground();
      Navigator.pushReplacement(context, _logoTransitionTo(const HomeScreen()));
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const OnboardingScreen()),
      );
    }
  }

  /// Fade + gentle scale so the splash logo appears to settle into the
  /// home screen rather than a hard cut.
  PageRouteBuilder _logoTransitionTo(Widget page) {
    return PageRouteBuilder(
      transitionDuration: const Duration(milliseconds: 550),
      reverseTransitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        );
        return FadeTransition(
          opacity: curved,
          child: ScaleTransition(
            scale: Tween<double>(begin: 1.06, end: 1.0).animate(curved),
            child: child,
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _initialTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return GestureDetector(
          onTap: _navigateNext,
          behavior: HitTestBehavior.opaque,
          child: Scaffold(
            body: Stack(
            children: [
              // Background Gradient Layer
              Container(
                width: double.infinity,
                height: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xFF022B58),
                      Color(0xFF064B88),
                      Color(0xFF0A6FB5),
                    ],
                  ),
                ),
              ),

              // Custom Background Flight Trails & Dotted World Map Painter
              Positioned.fill(
                child: CustomPaint(
                  painter: SplashBackgroundPainter(),
                ),
              ),

              // Main Foreground Content Layout
              SafeArea(
                child: Column(
                  children: [
                    const Spacer(flex: 3),

                    // Animated Logo and Branding Block
                    Opacity(
                      opacity: _fadeAnimation.value,
                      child: Transform.translate(
                        offset: Offset(0, _floatAnimation.value),
                        child: Transform.scale(
                          scale: _scaleAnimation.value,
                          child: Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 24.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    SizedBox(
                                      width: 72,
                                      height: 72,
                                      child: CustomPaint(
                                        painter: HolidayCityLogoPainter(),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        RichText(
                                          text: TextSpan(
                                            children: [
                                              TextSpan(
                                                text: 'Holiday',
                                                style: GoogleFonts.outfit(
                                                  fontSize: 34,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.white,
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                              TextSpan(
                                                text: 'City',
                                                style: GoogleFonts.outfit(
                                                  fontSize: 34,
                                                  fontWeight: FontWeight.w800,
                                                  color:
                                                      const Color(0xFF26C6DA),
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          'Pvt. Ltd.',
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.white
                                                .withValues(alpha: 0.9),
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),

                    const Spacer(flex: 3),

                    Padding(
                      padding: const EdgeInsets.only(bottom: 24.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Transform.scale(
                            scale: _dotPulseAnimation.value,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.white.withValues(alpha: 0.8),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Transform.scale(
                            scale:
                                0.8 + ((1 - _dotPulseAnimation.value) * 0.15),
                            child: Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.6),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Transform.scale(
                            scale: 0.7 + ((1 - _dotPulseAnimation.value) * 0.1),
                            child: Container(
                              width: 5,
                              height: 5,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.35),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
  }
}

/// CustomPainter for Splash Screen background flight paths and world map mesh pins
class SplashBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintLine = Paint()
      ..color = Colors.white.withValues(alpha: 0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    // Flight Path 1: Top Right Arc
    final path1 = Path();
    path1.moveTo(-30, size.height * 0.38);
    path1.quadraticBezierTo(size.width * 0.45, size.height * 0.22,
        size.width + 40, size.height * 0.1);
    _drawDashedPath(canvas, path1, paintLine, [6, 8]);
    _drawAirplaneSilhouette(
        canvas, Offset(size.width * 0.82, size.height * 0.15), -15);

    // Flight Path 2: Middle Left Arc
    final path2 = Path();
    path2.moveTo(-20, size.height * 0.65);
    path2.quadraticBezierTo(size.width * 0.25, size.height * 0.52,
        size.width * 0.65, size.height * 0.42);
    _drawDashedPath(canvas, path2, paintLine, [5, 7]);
    _drawAirplaneSilhouette(
        canvas, Offset(size.width * 0.12, size.height * 0.6), -35);

    // Detailed Continental Dotted World Map Mesh at bottom
    final dotPaint = Paint()
      ..color = const Color(0xFF26C6DA).withValues(alpha: 0.32)
      ..style = PaintingStyle.fill;

    final bottomY = size.height * 0.78;
    final w = size.width;

    // Grid coordinates simulating North America, South America, Europe, Africa, Asia, Australia
    final mapDots = [
      // North America
      Offset(w * 0.12, bottomY - 30), Offset(w * 0.16, bottomY - 35),
      Offset(w * 0.20, bottomY - 32),
      Offset(w * 0.14, bottomY - 22), Offset(w * 0.18, bottomY - 24),
      Offset(w * 0.22, bottomY - 20),
      // South America
      Offset(w * 0.24, bottomY - 5), Offset(w * 0.26, bottomY + 10),
      Offset(w * 0.28, bottomY + 22),
      // Europe & Africa
      Offset(w * 0.44, bottomY - 35), Offset(w * 0.48, bottomY - 32),
      Offset(w * 0.52, bottomY - 38),
      Offset(w * 0.46, bottomY - 18), Offset(w * 0.50, bottomY - 12),
      Offset(w * 0.48, bottomY + 5),
      // Asia
      Offset(w * 0.64, bottomY - 40), Offset(w * 0.68, bottomY - 45),
      Offset(w * 0.74, bottomY - 42),
      Offset(w * 0.78, bottomY - 38), Offset(w * 0.82, bottomY - 35),
      Offset(w * 0.86, bottomY - 30),
      Offset(w * 0.66, bottomY - 25), Offset(w * 0.72, bottomY - 22),
      Offset(w * 0.76, bottomY - 20),
      // Australia
      Offset(w * 0.80, bottomY + 10), Offset(w * 0.84, bottomY + 12),
      Offset(w * 0.88, bottomY + 8),
    ];

    for (final dot in mapDots) {
      canvas.drawCircle(dot, 2.0, dotPaint);
    }

    // Arc connecting location pins across the map
    final pinArcPaint = Paint()
      ..color = const Color(0xFF26C6DA).withValues(alpha: 0.65)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    final pin1 = Offset(w * 0.18, bottomY - 24);
    final pin2 = Offset(w * 0.74, bottomY - 38);

    final mapArcPath = Path();
    mapArcPath.moveTo(pin1.dx, pin1.dy);
    mapArcPath.quadraticBezierTo(w * 0.45, bottomY - 70, pin2.dx, pin2.dy);
    _drawDashedPath(canvas, mapArcPath, pinArcPaint, [4, 4]);

    // Draw Location Pins on Map
    _drawLocationPin(canvas, pin1);
    _drawLocationPin(canvas, pin2);
  }

  void _drawDashedPath(
      Canvas canvas, Path path, Paint paint, List<double> dashArray) {
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double distance = 0.0;
      bool draw = true;
      int dashIndex = 0;
      while (distance < metric.length) {
        final len = dashArray[dashIndex % dashArray.length];
        if (draw) {
          canvas.drawPath(metric.extractPath(distance, distance + len), paint);
        }
        distance += len;
        draw = !draw;
        dashIndex++;
      }
    }
  }

  void _drawAirplaneSilhouette(
      Canvas canvas, Offset position, double angleDegrees) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.25)
      ..style = PaintingStyle.fill;

    canvas.save();
    canvas.translate(position.dx, position.dy);
    canvas.rotate(angleDegrees * math.pi / 180);
    final path = Path()
      ..moveTo(0, -8)
      ..lineTo(6, 7)
      ..lineTo(0, 4)
      ..lineTo(-6, 7)
      ..close();
    canvas.drawPath(path, paint);
    canvas.restore();
  }

  void _drawLocationPin(Canvas canvas, Offset center) {
    // Glow paint
    final glowPaint = Paint()
      ..color = const Color(0xFF26C6DA).withValues(alpha: 0.35)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawCircle(Offset(center.dx, center.dy - 6), 10, glowPaint);

    final pinPaint = Paint()
      ..color = const Color(0xFF26C6DA)
      ..style = PaintingStyle.fill;

    final path = Path();
    const pinSize = 14.0;
    final topCenter = Offset(center.dx, center.dy - pinSize);

    path.moveTo(center.dx, center.dy);
    path.cubicTo(
      center.dx - pinSize / 2,
      center.dy - pinSize / 3,
      center.dx - pinSize / 2,
      topCenter.dy - pinSize / 3,
      center.dx,
      topCenter.dy - pinSize / 2,
    );
    path.cubicTo(
      center.dx + pinSize / 2,
      topCenter.dy - pinSize / 2,
      center.dx + pinSize / 2,
      center.dy - pinSize / 3,
      center.dx,
      center.dy,
    );
    canvas.drawPath(path, pinPaint);
    canvas.drawCircle(Offset(center.dx, center.dy - pinSize * 0.9), 2.5,
        Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// CustomPainter to draw the accurate 3D-styled H logo with Cyan Swoosh & Airplane
class HolidayCityLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 3D Cyan Swoosh Gradient Ribbon
    final swooshPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF00E5FF), Color(0xFF00BCD4), Color(0xFF00838F)],
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
      ).createShader(Rect.fromLTWH(0, 0, w, h))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..strokeCap = StrokeCap.round;

    final swooshPath = Path();
    swooshPath.moveTo(w * 0.08, h * 0.68);
    swooshPath.cubicTo(
      w * 0.15,
      h * 0.94,
      w * 0.62,
      h * 0.95,
      w * 0.84,
      h * 0.42,
    );
    swooshPath.lineTo(w * 0.92, h * 0.22);

    canvas.drawPath(swooshPath, swooshPaint);

    // Integrated White Block "H" Letter
    final hPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    // Shadow for 3D depth on H
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.15)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

    final stemWidth = w * 0.15;
    final stemHeight = h * 0.62;
    final topY = h * 0.19;

    // Draw Shadow under H
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.24 + 1, topY + 2, stemWidth, stemHeight),
        const Radius.circular(3),
      ),
      shadowPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.60 + 1, topY + 2, stemWidth, stemHeight),
        const Radius.circular(3),
      ),
      shadowPaint,
    );

    // Left stem of H
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.24, topY, stemWidth, stemHeight),
        const Radius.circular(3),
      ),
      hPaint,
    );

    // Right stem of H
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.60, topY, stemWidth, stemHeight),
        const Radius.circular(3),
      ),
      hPaint,
    );

    // Crossbar of H
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.24, h * 0.45, w * 0.51, h * 0.12),
        const Radius.circular(2),
      ),
      hPaint,
    );

    // Airplane flying off upper right tip of swoosh
    final planePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.save();
    canvas.translate(w * 0.92, h * 0.18);
    canvas.rotate(38 * math.pi / 180);
    final planePath = Path()
      ..moveTo(0, -9)
      ..lineTo(6, 8)
      ..lineTo(0, 5)
      ..lineTo(-6, 8)
      ..close();
    canvas.drawPath(planePath, planePaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
