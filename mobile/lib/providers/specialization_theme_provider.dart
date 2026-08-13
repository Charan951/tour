import 'dart:async';
import 'package:flutter/material.dart';
import '../models/theme_model.dart';
import '../services/theme_service.dart';

class SpecializationThemeProvider extends ChangeNotifier {
  final ThemeService _themeService = ThemeService();
  List<ThemeModel> _themes = [];
  bool _isLoading = false;
  Timer? _realtimeTimer;

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
      _themes = fetched;
    } catch (_) {
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void startRealtimeUpdates() {
    _realtimeTimer?.cancel();
    _realtimeTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      fetchThemes();
    });
  }

  void stopRealtimeUpdates() {
    _realtimeTimer?.cancel();
    _realtimeTimer = null;
  }

  @override
  void dispose() {
    stopRealtimeUpdates();
    super.dispose();
  }
}
