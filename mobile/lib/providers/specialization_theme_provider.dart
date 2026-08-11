import 'package:flutter/material.dart';
import '../models/theme_model.dart';
import '../services/theme_service.dart';

class SpecializationThemeProvider extends ChangeNotifier {
  final ThemeService _themeService = ThemeService();
  List<ThemeModel> _themes = [];
  bool _isLoading = false;

  SpecializationThemeProvider() {
    _themes = _themeService.getThemesSync();
  }

  List<ThemeModel> get themes => _themes;
  bool get isLoading => _isLoading;

  Future<void> fetchThemes() async {
    if (_themes.isEmpty) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final fetched = await _themeService.getThemes();
      if (fetched.isNotEmpty) {
        _themes = fetched;
      }
    } catch (_) {
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
