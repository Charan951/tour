import 'package:flutter/material.dart';
import '../models/banner_model.dart';
import '../services/banner_service.dart';

class BannerProvider extends ChangeNotifier {
  final BannerService _bannerService = BannerService();
  List<BannerModel> _banners = [];
  bool _isLoading = false;

  BannerProvider() {
    _banners = _bannerService.getBannersSync();
  }

  List<BannerModel> get banners => _banners;
  bool get isLoading => _isLoading;

  Future<void> fetchBanners() async {
    if (_banners.isEmpty) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final fetched = await _bannerService.getBanners();
      _banners = fetched;
    } catch (_) {
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
