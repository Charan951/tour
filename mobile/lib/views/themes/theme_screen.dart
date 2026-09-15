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

        final cs = context.colors;

        return Scaffold(
          appBar: AppTheme.gradientAppBar(context: context, title: 'Travel Themes'),
          body: RefreshIndicator(
            onRefresh: provider.fetchThemes,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
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
                                onChanged: (_) => setState(() {}),
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
                                  setState(() {});
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

                const SizedBox(height: 16),

                // Live status indicator row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${filteredThemes.length} ${filteredThemes.length == 1 ? 'Theme' : 'Themes'} Available',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: cs.textSecondary,
                      ),
                    ),
                    Container(
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
                  ],
                ),

                const SizedBox(height: 14),

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

                      // Same card design as the home screen's "Specialization
                      // Themes" scroller: full-bleed image, bottom gradient,
                      // bold white title on the image.
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
        );
      },
    );
  }
}
