import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Animated Shimmer Widget for Flutter loading states
class ShimmerBox extends StatefulWidget {
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final ShapeBorder? shapeBorder;

  const ShimmerBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.shapeBorder,
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    _animation = Tween<double>(begin: -1.5, end: 1.5).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: ShapeDecoration(
            shape: widget.shapeBorder ??
                RoundedRectangleBorder(
                  borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                ),
            gradient: LinearGradient(
              begin: Alignment(_animation.value - 1.0, 0),
              end: Alignment(_animation.value + 1.0, 0),
              colors: context.isDark
                  ? const [
                      Color(0xFF1E293B),
                      Color(0xFF273449),
                      Color(0xFF1E293B),
                    ]
                  : const [
                      Color(0xFFE2E8F0),
                      Color(0xFFF8FAFC),
                      Color(0xFFE2E8F0),
                    ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }
}

/// Skeleton placeholder matching HomeScreen layout
class HomeScreenSkeleton extends StatelessWidget {
  const HomeScreenSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Skeleton
          Container(
            padding: const EdgeInsets.fromLTRB(16, 52, 16, 20),
            decoration: BoxDecoration(
              color: context.colors.surfaceAlt,
              borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(28)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 140, height: 28),
                    ShimmerBox(width: 42, height: 42, shapeBorder: CircleBorder()),
                  ],
                ),
                SizedBox(height: 20),
                Row(
                  children: [
                    ShimmerBox(width: 44, height: 44, shapeBorder: CircleBorder()),
                    SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerBox(width: 120, height: 20),
                        SizedBox(height: 6),
                        ShimmerBox(width: 180, height: 14),
                      ],
                    ),
                  ],
                ),
                SizedBox(height: 20),
                ShimmerBox(width: double.infinity, height: 54),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Banner Slider Skeleton
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerBox(
              width: double.infinity,
              height: 165,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          const SizedBox(height: 24),

          // Domestic Tours Horizontal Skeleton
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerBox(width: 150, height: 20),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 210,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 4,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: ShimmerBox(
                    width: 155,
                    height: 210,
                    borderRadius: BorderRadius.circular(18),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),

          // Trending Packages Stack Skeleton
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerBox(width: 180, height: 20),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ShimmerBox(
              width: double.infinity,
              height: 220,
              borderRadius: BorderRadius.circular(24),
            ),
          ),
        ],
      ),
    );
  }
}

/// Package Card Skeleton placeholder
class PackageCardSkeleton extends StatelessWidget {
  const PackageCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.colors.border),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: double.infinity,
            height: 160,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          Padding(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(width: 180, height: 18),
                SizedBox(height: 8),
                ShimmerBox(width: 120, height: 14),
                SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 80, height: 22),
                    ShimmerBox(width: 100, height: 36),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
