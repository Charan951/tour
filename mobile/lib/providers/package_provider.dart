import 'package:flutter/material.dart';
import '../models/package_model.dart';
import '../services/package_service.dart';

class PackageProvider extends ChangeNotifier {
  final PackageService _packageService = PackageService();

  List<PackageModel> _packages = [];
  bool _isLoading = false;
  String _selectedCategory = 'All';
  String _searchQuery = '';
  String? _errorMessage;

  PackageProvider() {
    // Populate instant fallback packages immediately so UI renders with zero lag
    _packages = _packageService.getPackagesSync();
  }

  List<PackageModel> get packages {
    List<PackageModel> list = _packages;

    // Filter by selected category or theme
    if (_selectedCategory != 'All' && _selectedCategory.trim().isNotEmpty) {
      final cat = _selectedCategory.toLowerCase().replaceAll('tour', '').trim();
      list = list.where((p) {
        final categoryMatch = p.category.toLowerCase().contains(cat);
        final titleMatch = p.title.toLowerCase().contains(cat);
        final overviewMatch = p.overview.toLowerCase().contains(cat);
        final highlightMatch = p.highlights.any((h) => h.toLowerCase().contains(cat));
        return categoryMatch || titleMatch || overviewMatch || highlightMatch;
      }).toList();
    }

    // Filter by search query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      list = list.where((p) {
        final titleMatch = p.title.toLowerCase().contains(q);
        final destMatch = p.destination.toLowerCase().contains(q);
        final catMatch = p.category.toLowerCase().contains(q);
        return titleMatch || destMatch || catMatch;
      }).toList();
    }

    return list;
  }

  List<PackageModel> get allPackages => _packages;

  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  String? get errorMessage => _errorMessage;

  List<PackageModel> get featuredPackages =>
      _packages.where((p) => p.isFeatured).toList();

  Future<void> fetchPackages() async {
    if (_packages.isEmpty) {
      _isLoading = true;
      notifyListeners();
    }
    _errorMessage = null;

    try {
      final fetched = await _packageService.getPackages(
        category: _selectedCategory,
        search: _searchQuery,
      );
      _packages = fetched;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCategory(String category) {
    if (_selectedCategory != category) {
      _selectedCategory = category;
      notifyListeners();
      fetchPackages();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
    fetchPackages();
  }
}
