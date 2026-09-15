import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../services/connectivity.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/app_states.dart';
import '../../widgets/filter_sheet.dart';
import 'theme_detail_screen.dart';

class ThemeScreen extends StatefulWidget {
  const ThemeScreen({super.key});

  @override
  State<ThemeScreen> createState() => _ThemeScreenState();
}

class _ThemeScreenState extends State<ThemeScreen> {
  SpecializationThemeProvider? _themeProvider;
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All Themes';

  final List<String> _filters = const [
    'All Themes',
    'Top Pick',
    'Trending',
    'Popular',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _themeProvider = context.read<SpecializationThemeProvider>();
      _themeProvider?.fetchThemes();
      _themeProvider?.startRealtimeUpdates();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _themeProvider?.stopRealtimeUpdates();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SpecializationThemeProvider>(
      builder: (context, provider, child) {
        final allThemes = provider.themes;
        final query = _searchController.text.trim().toLowerCase();

        final filteredThemes = allThemes.where((theme) {
          final matchesSearch = query.isEmpty ||
              theme.name.toLowerCase().contains(query) ||
              theme.description.toLowerCase().contains(query) ||
              (theme.rating != null &&
                  theme.rating!.toLowerCase().contains(query));

          bool matchesFilter = true;
          final ratingStr = (theme.rating ?? '').toLowerCase();
          if (_selectedFilter == 'Top Pick') {
            matchesFilter = ratingStr.contains('top') || ratingStr.contains('pick');
          } else if (_selectedFilter == 'Trending') {
            matchesFilter = ratingStr.contains('trend') ||
                ratingStr.contains('star') ||
                ratingStr.contains('popular');
          } else if (_selectedFilter == 'Popular') {
            matchesFilter = ratingStr.contains('popular') ||
                ratingStr.contains('top') ||
                ratingStr.contains('star');
          }

          return matchesSearch && matchesFilter;
        }).toList();

        return Scaffold(
          appBar: AppTheme.gradientAppBar(context: context, title: 'Travel Themes'),
          body: RefreshIndicator(
            onRefresh: provider.fetchThemes,
            child: ListView(
              padding: const EdgeInsets.only(bottom: 90),
              children: [
                // Blue Header Container extending up to the search bar & filter
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
                  decoration: const BoxDecoration(
                    gradient: AppTheme.headerGradient,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(28),
                      bottomRight: Radius.circular(28),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const SizedBox(width: 14),
                              const Icon(Icons.search_rounded,
                                  size: 20, color: Color(0xFF64748B)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextField(
                                  controller: _searchController,
                                  textInputAction: TextInputAction.search,
                                  textAlignVertical: TextAlignVertical.center,
                                  onChanged: (_) => setState(() {}),
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF0F172A),
                                  ),
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                    filled: false,
                                    isCollapsed: true,
                                    hintText: 'Search themes...',
                                    hintStyle: GoogleFonts.inter(
                                      fontSize: 13.5,
                                      color: const Color(0xFFADB5BD),
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                              if (_searchController.text.isNotEmpty)
                                GestureDetector(
                                  onTap: () {
                                    _searchController.clear();
                                    setState(() {});
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10),
                                    child: Icon(Icons.close_rounded,
                                        size: 18, color: Color(0xFF64748B)),
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
                        active: _selectedFilter != _filters.first,
                        onTap: () async {
                          final picked = await showFilterSheet(
                            context,
                            title: 'Filter themes',
                            options: _filters,
                            selected: _selectedFilter,
                          );
                          if (picked != null) {
                            setState(() => _selectedFilter = picked);
                          }
                        },
                      ),
                    ],
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Column(
                    children: [
                      // Live status indicator row
                      Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.successColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  color: AppTheme.successColor,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              const Text(
                                'Live',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.successColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      if (provider.isLoading && allThemes.isEmpty)
                        const AppSkeletonList(count: 4)
                      else if (allThemes.isEmpty && !ConnectivityStatus.instance.online)
                        AppErrorState(onRetry: () => provider.fetchThemes())
                      else if (filteredThemes.isEmpty)
                        const AppEmptyState(
                          icon: Icons.category_outlined,
                          title: 'No themes found',
                          message: 'Try adjusting your search query or filter options.',
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: filteredThemes.length,
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 14,
                            childAspectRatio: 0.75,
                          ),
                          itemBuilder: (context, index) {
                            final theme = filteredThemes[index];

                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ThemeDetailScreen(theme: theme),
                                  ),
                                );
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(18),
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      AppNetworkImage(
                                        imageUrl: theme.imageUrl,
                                        fit: BoxFit.cover,
                                        targetWidth: 400,
                                      ),
                                      const DecoratedBox(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [
                                              Colors.transparent,
                                              Color(0x40000000),
                                              Color(0xD9000000),
                                            ],
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 12,
                                        left: 12,
                                        right: 12,
                                        child: Text(
                                          theme.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            height: 1.15,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
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
