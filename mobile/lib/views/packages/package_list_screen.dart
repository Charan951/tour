import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/package_provider.dart';
import '../../widgets/package_card.dart';
import '../../widgets/app_states.dart';
import '../../widgets/filter_sheet.dart';
import 'package_detail_screen.dart';

class PackageListScreen extends StatefulWidget {
  const PackageListScreen({super.key});

  @override
  State<PackageListScreen> createState() => _PackageListScreenState();
}

class _PackageListScreenState extends State<PackageListScreen> {
  late final TextEditingController _searchController;

  final List<String> _categories = const [
    'All',
    'Domestic',
    'International',
    'Honeymoon',
    'Family',
    'Adventure',
    'Hill Station',
    'Wildlife',
    'Beach',
    'Heritage',
  ];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final packageProvider = Provider.of<PackageProvider>(context);
    final selectedCategory = packageProvider.selectedCategory;

    if (_searchController.text != packageProvider.searchQuery) {
      _searchController.text = packageProvider.searchQuery;
      _searchController.selection = TextSelection.fromPosition(
        TextPosition(offset: _searchController.text.length),
      );
    }

    final packages = packageProvider.packages;
    final cs = context.colors;

    return Scaffold(
      appBar: AppTheme.gradientAppBar(context: context, title: 'Explore Packages'),
      body: RefreshIndicator(
        onRefresh: () => packageProvider.fetchPackages(),
        child: packageProvider.isLoading && packageProvider.allPackages.isEmpty
            ? const AppSkeletonList(count: 5)
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
                children: [
                  // Search Bar — icon outside the container (matches Home screen)
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: cs.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: cs.border),
                            boxShadow: [
                              BoxShadow(
                                color: cs.shadow,
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const SizedBox(width: 14),
                              Icon(Icons.search_rounded,
                                  size: 20, color: cs.textSecondary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextField(
                                  controller: _searchController,
                                  textInputAction: TextInputAction.search,
                                  textAlignVertical: TextAlignVertical.center,
                                  onChanged: packageProvider.setSearchQuery,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: cs.textPrimary,
                                  ),
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                    filled: false,
                                    isCollapsed: true,
                                    hintText: '',
                                    hintStyle: GoogleFonts.inter(
                                      fontSize: 13.5,
                                      color: cs.textFaint,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                              if (_searchController.text.isNotEmpty)
                                GestureDetector(
                                  onTap: () {
                                    _searchController.clear();
                                    packageProvider.setSearchQuery('');
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10),
                                    child: Icon(Icons.close_rounded,
                                        size: 18, color: cs.textSecondary),
                                  ),
                                )
                              else
                                const SizedBox(width: 14),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilterIconButton(
                        active: selectedCategory != 'All',
                        onTap: () async {
                          final picked = await showFilterSheet(
                            context,
                            title: 'Filter packages',
                            options: _categories,
                            selected: selectedCategory,
                          );
                          if (picked != null) {
                            packageProvider.setCategory(picked);
                          }
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Results Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${packages.length} ${packages.length == 1 ? 'Package' : 'Packages'} Available',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: cs.textSecondary,
                        ),
                      ),
                      if (selectedCategory != 'All' || packageProvider.searchQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            packageProvider.setSearchQuery('');
                            packageProvider.setCategory('All');
                          },
                          child: Text(
                            'Reset Filters',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF0EA5E9),
                            ),
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  if (packages.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 24),
                      child: AppEmptyState(
                        icon: Icons.travel_explore_outlined,
                        title: (packageProvider.searchQuery.isNotEmpty ||
                                selectedCategory != 'All')
                            ? 'No packages match your search'
                            : 'No packages available',
                        message: (packageProvider.searchQuery.isNotEmpty ||
                                selectedCategory != 'All')
                            ? 'Try searching with another keyword or category.'
                            : 'Pull down to refresh or check back later.',
                        actionLabel: (packageProvider.searchQuery.isNotEmpty ||
                                selectedCategory != 'All')
                            ? 'Clear all filters'
                            : null,
                        onAction: () {
                          _searchController.clear();
                          packageProvider.setSearchQuery('');
                          packageProvider.setCategory('All');
                        },
                      ),
                    )
                  else ...[
                    for (final pkg in packages)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: PackageCard(
                          package: pkg,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    PackageDetailScreen(package: pkg),
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                ],
              ),
      ),
    );
  }
}
