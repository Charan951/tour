import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/package_provider.dart';
import '../../widgets/package_card.dart';
import 'package_detail_screen.dart';

class PackageListScreen extends StatefulWidget {
  const PackageListScreen({super.key});

  @override
  State<PackageListScreen> createState() => _PackageListScreenState();
}

class _PackageListScreenState extends State<PackageListScreen> {
  late final TextEditingController _searchController;

  final List<String> _categories = [
    'All',
    'Honeymoon',
    'Family',
    'Adventure',
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
    _searchController.text = packageProvider.searchQuery;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: _searchController.text.length),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore Packages'),
      ),
      body: RefreshIndicator(
        onRefresh: () => packageProvider.fetchPackages(),
        child: packageProvider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: packageProvider.setSearchQuery,
                          decoration: InputDecoration(
                            hintText: 'Search packages...',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      _searchController.clear();
                                      packageProvider.setSearchQuery('');
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: Colors.grey.shade100,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: IconButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Filter options coming soon'),
                              ),
                            );
                          },
                          icon: const Icon(Icons.filter_list_rounded,
                              color: AppTheme.primaryColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      itemBuilder: (context, index) {
                        final category = _categories[index];
                        final isSelected =
                            packageProvider.selectedCategory == category;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            selected: isSelected,
                            label: Text(category),
                            labelStyle: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : AppTheme.textPrimary,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              fontSize: 12,
                            ),
                            selectedColor: AppTheme.primaryColor,
                            backgroundColor: const Color(0xFFF1F5F9),
                            onSelected: (_) =>
                                packageProvider.setCategory(category),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (packageProvider.packages.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Text('No holiday packages available.'),
                      ),
                    )
                  else ...[
                    for (final pkg in packageProvider.packages)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
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
