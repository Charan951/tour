import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';

/// A compact "three-line" filter trigger that sits to the right of a search
/// field. Shows a dot when a non-default filter is active.
class FilterIconButton extends StatelessWidget {
  final bool active;
  final VoidCallback onTap;
  final double size;

  const FilterIconButton({
    super.key,
    required this.active,
    required this.onTap,
    this.size = 52,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Filter',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: active ? AppTheme.primaryColor : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: active ? AppTheme.primaryColor : const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, 3)),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.tune_rounded,
                size: 22,
                color: active ? Colors.white : const Color(0xFF64748B),
              ),
              if (active)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primaryColor, width: 1),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Single-select filter bottom sheet. Returns the chosen option, or null if
/// dismissed without a change.
Future<String?> showFilterSheet(
  BuildContext context, {
  required String title,
  required List<String> options,
  required String selected,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final cs = sheetContext.colors;
      final maxH = MediaQuery.of(sheetContext).size.height * 0.65;
      return Container(
        constraints: BoxConstraints(maxHeight: maxH),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Icon(Icons.tune_rounded, size: 18, color: cs.textSecondary),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: cs.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Flexible(
                child: Material(
                  color: Colors.transparent,
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: options.map((opt) {
                        final isSel = opt == selected;
                        return ListTile(
                          onTap: () => Navigator.pop(sheetContext, opt),
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
                          title: Text(
                            opt,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                              color: isSel ? AppTheme.primaryColor : cs.textPrimary,
                            ),
                          ),
                          trailing: isSel
                              ? const Icon(Icons.check_rounded,
                                  color: AppTheme.primaryColor, size: 20)
                              : null,
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      );
    },
  );
}
