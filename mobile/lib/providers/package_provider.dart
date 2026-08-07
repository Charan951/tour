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

  List<PackageModel> get packages => _packages;
  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  String? get errorMessage => _errorMessage;

  List<PackageModel> get featuredPackages =>
      _packages.where((p) => p.isFeatured).toList();

  Future<void> fetchPackages() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _packages = await _packageService.getPackages(
        category: _selectedCategory,
        search: _searchQuery,
      );
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
      fetchPackages();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchPackages();
  }
}
