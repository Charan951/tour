import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../providers/package_provider.dart';
import '../../services/package_service.dart';
import '../../widgets/package_card.dart';
import '../packages/package_detail_screen.dart';

class OfferPackagesScreen extends StatefulWidget {
  final String offerTitle;
  final String? filterTag;

  const OfferPackagesScreen({
    super.key,
    required this.offerTitle,
    this.filterTag,
  });

  @override
  State<OfferPackagesScreen> createState() => _OfferPackagesScreenState();
}

class _OfferPackagesScreenState extends State<OfferPackagesScreen> {
  List<PackageModel> _offeredPackages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOfferPackages();
    });
  }

  Future<void> _loadOfferPackages() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final provider = Provider.of<PackageProvider>(context, listen: false);
    final allPackages = provider.allPackages;

    try {
      final service = PackageService();
      final apiPackages = await service.getPackages();

      if (!mounted) return;

      final Map<String, PackageModel> packageMap = {};
      for (final p in apiPackages) {
        packageMap[p.id] = p;
      }
      for (final p in allPackages) {
        packageMap.putIfAbsent(p.id, () => p);
      }

      final combined = packageMap.values.toList();
      final filteredOffers = _filterOfferedPackages(combined);

      if (mounted) {
        setState(() {
          _offeredPackages = filteredOffers;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        final filteredOffers = _filterOfferedPackages(allPackages);
        setState(() {
          _offeredPackages = filteredOffers;
          _isLoading = false;
        });
      }
    }
  }

  List<PackageModel> _filterOfferedPackages(List<PackageModel> packages) {
    if (widget.filterTag == null ||
        widget.filterTag!.isEmpty ||
        widget.filterTag == 'All Special Offers') {
      final offerOnly = packages.where((p) {
        if (p.originalPrice != null && p.originalPrice! > p.price) {
          return true;
        }
        if (p.pricingTiers.any((t) => t.discount > 0)) {
          return true;
        }
        if (p.isFeatured) {
          return true;
        }
        return false;
      }).toList();
      return offerOnly.isNotEmpty ? offerOnly : packages;
    }

    final rawTag = widget.filterTag!.toLowerCase();
    final words = rawTag
        .replaceAll(RegExp(r'[^a-zA-Z0-9\s]'), '')
        .split(RegExp(r'\s+'))
        .where((w) =>
            w.length > 2 &&
            w != 'offer' &&
            w != 'deals' &&
            w != 'package' &&
            w != 'packages' &&
            w != 'special' &&
            w != 'tour' &&
            w != 'tours' &&
            w != 'offered')
        .toList();

    if (words.isEmpty) return packages;

    final matched = packages.where((p) {
      final title = p.title.toLowerCase();
      final cat = p.category.toLowerCase();
      final dest = p.destination.toLowerCase();
      final theme = (p.themeName ?? '').toLowerCase();
      final overview = p.overview.toLowerCase();

      return words.any((w) =>
          title.contains(w) ||
          cat.contains(w) ||
          dest.contains(w) ||
          theme.contains(w) ||
          overview.contains(w));
    }).toList();

    return matched.isNotEmpty ? matched : packages;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.scaffold,
      appBar: AppBar(
        title: Text(
          widget.offerTitle,
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        backgroundColor: context.colors.surface,
        elevation: 0,
        iconTheme: IconThemeData(color: context.colors.textPrimary),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _offeredPackages.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Text(
                      'No offer packages available for ${widget.offerTitle} right now.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(color: context.colors.textSecondary),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _offeredPackages.length,
                  itemBuilder: (context, index) {
                    final pkg = _offeredPackages[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: PackageCard(
                        package: pkg,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PackageDetailScreen(package: pkg),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
