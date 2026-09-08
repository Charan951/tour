import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../providers/specialization_theme_provider.dart';
import '../../services/connectivity.dart';
import '../../widgets/app_states.dart';
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
          appBar: AppTheme.gradientAppBar(title: 'Travel Themes'),
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
                            const SizedBox(width: 16),
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
                                  isCollapsed: true,
                                  hintText: 'Search travel themes...',
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
                                  child: Icon(Icons.close_rounded, size: 18, color: Color(0xFF94A3B8)),
                                ),
                              )
                            else
                              const SizedBox(width: 12),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Search button — outside the bar
                    GestureDetector(
                      onTap: () => setState(() {}),
                      child: Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0EA5E9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.search_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Filter Option Chips Row
                SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: _filters.length,
                    itemBuilder: (context, idx) {
                      final f = _filters[idx];
                      final isSelected = _selectedFilter == f;

                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(f),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedFilter = f);
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

                // Live status indicator row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${filteredThemes.length} ${filteredThemes.length == 1 ? 'Theme' : 'Themes'} Available',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF64748B),
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
                      childAspectRatio: 0.82,
                    ),
                    itemBuilder: (context, index) {
                      final theme = filteredThemes[index];

                      return SizedBox(
                        height: 240,
                        child: Material(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          elevation: 2,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ThemeDetailScreen(theme: theme),
                                ),
                              );
                            },
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(18)),
                                  child: AspectRatio(
                                    aspectRatio: 1.6,
                                    child: CachedNetworkImage(
                                      imageUrl: ApiConfig.formatImageUrl(theme.imageUrl, width: 400),
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      memCacheWidth: 400,
                                      fadeInDuration: const Duration(milliseconds: 150),
                                      placeholder: (context, url) => Container(
                                        color: const Color(0xFFF1F5F9),
                                      ),
                                      errorWidget: (context, url, error) =>
                                          Container(
                                        color: const Color(0xFFF1F5F9),
                                        child: const Icon(
                                            Icons.image_not_supported_outlined,
                                            color: AppTheme.textSecondary),
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        theme.name,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.outfit(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.star_rounded,
                                              size: 14,
                                              color: AppTheme.accentColor),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              theme.rating ?? 'Top pick',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                color: AppTheme.textSecondary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
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
