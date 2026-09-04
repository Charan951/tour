import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/package_provider.dart';
import '../../widgets/package_card.dart';
import '../../widgets/app_states.dart';
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

    return Scaffold(
      appBar: AppTheme.gradientAppBar(title: 'Explore Packages'),
      body: RefreshIndicator(
        onRefresh: () => packageProvider.fetchPackages(),
        child: packageProvider.isLoading && packageProvider.allPackages.isEmpty
            ? const AppSkeletonList(count: 5)
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
                children: [
                  // Top Search Bar Widget (Matching Themes & Destinations Screens)
                  Container(
                    height: 52,
                    padding: const EdgeInsets.fromLTRB(14, 4, 6, 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            textInputAction: TextInputAction.search,
                            onChanged: packageProvider.setSearchQuery,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0F172A),
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              filled: false,
                              fillColor: Colors.transparent,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                              hintText: 'Search packages by destination, title...',
                              hintStyle: GoogleFonts.inter(
                                fontSize: 13,
                                color: const Color(0xFF94A3B8),
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ),
                        ),
                        if (_searchController.text.isNotEmpty)
                          IconButton(
                            icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                            onPressed: () {
                              _searchController.clear();
                              packageProvider.setSearchQuery('');
                            },
                          ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () {
                            packageProvider.setSearchQuery(_searchController.text);
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0EA5E9),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF0EA5E9).withValues(alpha: 0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.search_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Horizontal Category Filter Option Chips
                  SizedBox(
                    height: 38,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      itemCount: _categories.length,
                      itemBuilder: (context, idx) {
                        final cat = _categories[idx];
                        final isSelected = selectedCategory == cat;

                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                packageProvider.setCategory(cat);
                              }
                            },
                            labelStyle: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                              color: isSelected ? Colors.white : const Color(0xFF475569),
                            ),
                            selectedColor: const Color(0xFF0EA5E9),
                            backgroundColor: Colors.white,
                            elevation: isSelected ? 3 : 0,
                            pressElevation: 1,
                            side: BorderSide(
                              color: isSelected
                                  ? const Color(0xFF0EA5E9)
                                  : const Color(0xFFE2E8F0),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            showCheckmark: false,
                          ),
                        );
                      },
                    ),
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
                          color: const Color(0xFF64748B),
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
