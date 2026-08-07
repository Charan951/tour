import 'package:flutter/material.dart';
import '../models/theme_model.dart';
import '../services/theme_service.dart';

class SpecializationThemeProvider extends ChangeNotifier {
  final ThemeService _themeService = ThemeService();
  List<ThemeModel> _themes = [];
  bool _isLoading = false;

  List<ThemeModel> get themes => _themes;
  bool get isLoading => _isLoading;

  Future<void> fetchThemes() async {
    _isLoading = true;
    notifyListeners();

    try {
      _themes = await _themeService.getThemes();
    } catch (_) {
      _themes = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
