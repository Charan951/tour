import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Semantic, theme-aware color set. Read it in widgets via `context.colors`
/// so every surface follows the active light / dark theme instead of a
/// hardcoded literal.
class AppColors {
  final Color scaffold;
  final Color surface;
  final Color surfaceAlt; // header strips, chip / field fills, subtle panels
  final Color textPrimary;
  final Color textSecondary;
  final Color textFaint;
  final Color border;
  final Color primary;
  final Color shadow;

  const AppColors({
    required this.scaffold,
    required this.surface,
    required this.surfaceAlt,
    required this.textPrimary,
    required this.textSecondary,
    required this.textFaint,
    required this.border,
    required this.primary,
    required this.shadow,
  });

  static const light = AppColors(
    scaffold: Color(0xFFF8FAFC),
    surface: Colors.white,
    surfaceAlt: Color(0xFFF1F5F9),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF64748B),
    textFaint: Color(0xFFADB5BD),
    border: Color(0xFFE2E8F0),
    primary: Color(0xFF0A6FB5),
    shadow: Color(0x14000000),
  );

  static const dark = AppColors(
    scaffold: Color(0xFF0B1120),
    surface: Color(0xFF161F2E),
    surfaceAlt: Color(0xFF1E293B),
    textPrimary: Color(0xFFF1F5F9),
    textSecondary: Color(0xFF94A3B8),
    textFaint: Color(0xFF64748B),
    border: Color(0xFF2A3648),
    primary: Color(0xFF38BDF8),
    shadow: Color(0x33000000),
  );
}

extension AppColorsX on BuildContext {
  AppColors get colors => Theme.of(this).brightness == Brightness.dark
      ? AppColors.dark
      : AppColors.light;

  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}

class AppTheme {
  static const Color primaryColor = Color(0xFF0A6FB5);
  static const Color primaryDarkColor = Color(0xFF08568D);
  static const Color secondaryColor = Color(0xFF00B4D8);
  static const Color accentColor = Color(0xFFFF6B35);
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color surfaceColor = Colors.white;
  static const Color textPrimary = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color successColor = Color(0xFF10B981);
  static const Color errorColor = Color(0xFFEF4444);

  /// Shared header gradient (primaryDark -> primary -> secondary) used on
  /// Home / Profile / Destinations / Themes / Packages headers, ported from
  /// the web mobile redesign's `from-ocean-800 via-ocean-700 to-cyan-700`.
  static const LinearGradient headerGradient = LinearGradient(
    colors: [primaryDarkColor, primaryColor, secondaryColor],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const BorderRadius headerRadius = BorderRadius.only(
    bottomLeft: Radius.circular(32),
    bottomRight: Radius.circular(32),
  );

  /// A themed AppBar for list/tab screens. In light mode it shows the brand
  /// gradient band with white text; in dark mode it becomes a flat dark
  /// surface with themed text so it matches the rest of the app.
  static PreferredSizeWidget gradientAppBar({
    required BuildContext context,
    required String title,
    List<Widget>? actions,
    Widget? leading,
  }) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final c = dark ? AppColors.dark : AppColors.light;
    final fg = dark ? c.textPrimary : Colors.white;

    return PreferredSize(
      preferredSize: const Size.fromHeight(kToolbarHeight),
      child: ClipRRect(
        borderRadius: headerRadius,
        child: AppBar(
          title: Text(
            title,
            style: TextStyle(color: fg, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          backgroundColor: dark ? c.surface : Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: fg),
          leading: leading,
          actions: actions,
          flexibleSpace: dark
              ? null
              : Container(
                  decoration: const BoxDecoration(gradient: headerGradient),
                ),
        ),
      ),
    );
  }

  static ThemeData get lightTheme => _build(AppColors.light, Brightness.light);
  static ThemeData get darkTheme => _build(AppColors.dark, Brightness.dark);

  static ThemeData _build(AppColors c, Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final baseText = GoogleFonts.interTextTheme(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: c.scaffold,
      dividerColor: c.border,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: brightness,
        primary: isDark ? c.primary : primaryColor,
        secondary: accentColor,
        surface: c.surface,
        error: errorColor,
      ).copyWith(
        onSurface: c.textPrimary,
        surfaceContainerHighest: c.surfaceAlt,
        outline: c.border,
      ),
      textTheme: baseText.copyWith(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: c.textPrimary,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: c.textPrimary,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
        ),
        bodyLarge: GoogleFonts.inter(fontSize: 16, color: c.textPrimary),
        bodyMedium: GoogleFonts.inter(fontSize: 14, color: c.textSecondary),
      ),
      iconTheme: IconThemeData(color: c.textSecondary),
      appBarTheme: AppBarTheme(
        backgroundColor: c.surface,
        foregroundColor: c.textPrimary,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: c.textPrimary),
        titleTextStyle: GoogleFonts.outfit(
          color: c.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        elevation: 2,
        shadowColor: c.shadow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: c.surface,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
      ),
      popupMenuTheme: PopupMenuThemeData(color: c.surface),
      dividerTheme: DividerThemeData(color: c.border, thickness: 1),
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceAlt,
        side: BorderSide(color: c.border),
        labelStyle: GoogleFonts.outfit(color: c.textPrimary, fontSize: 12),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceAlt,
        hintStyle: GoogleFonts.inter(color: c.textFaint),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: c.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: c.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: errorColor, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
