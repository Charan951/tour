import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../widgets/custom_button.dart';
import '../enquiry/enquiry_bottom_sheet.dart';

class PackageDetailScreen extends StatelessWidget {
  final PackageModel package;

  const PackageDetailScreen({super.key, required this.package});

  void _openBookingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EnquiryBottomSheet(defaultDestination: package.title),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: '₹', decimalDigits: 0);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Silver App Bar with Image Carousel / Main Image
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: package.mainImage,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: Colors.grey[300]),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.7),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Package Details Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          package.category,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 18),
                          const SizedBox(width: 4),
                          Text(
                            '${package.rating} Rating',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    package.title,
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),

                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 18, color: AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Text(package.destination, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                      const SizedBox(width: 16),
                      const Icon(Icons.access_time, size: 18, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(package.duration, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                    ],
                  ),
                  const Divider(height: 32),

                  // Price Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Special Price', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                          Text(
                            currencyFormatter.format(package.price),
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ],
                      ),
                      CustomButton(
                        text: 'Book / Enquire',
                        onPressed: () => _openBookingSheet(context),
                      ),
                    ],
                  ),
                  const Divider(height: 32),

                  // Overview
                  Text(
                    'Overview',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    package.overview.isNotEmpty
                        ? package.overview
                        : 'Embark on an unforgettable vacation tailored with premium stays, guided sightseeing tours, and seamless local transport.',
                    style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary, height: 1.6),
                  ),
                  const SizedBox(height: 24),

                  // Highlights
                  if (package.highlights.isNotEmpty) ...[
                    Text(
                      'Highlights',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...package.highlights.map(
                      (h) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: AppTheme.successColor, size: 18),
                            const SizedBox(width: 8),
                            Expanded(child: Text(h, style: const TextStyle(fontSize: 14))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Inclusions & Exclusions
                  Text(
                    'Package Inclusions',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...package.inclusions.map(
                    (inc) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          const Icon(Icons.add_task, color: AppTheme.primaryColor, size: 18),
                          const SizedBox(width: 8),
                          Text(inc, style: const TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, -4)),
          ],
        ),
        child: CustomButton(
          text: 'Request Instant Callback',
          backgroundColor: AppTheme.accentColor,
          onPressed: () => _openBookingSheet(context),
        ),
      ),
    );
  }
}
