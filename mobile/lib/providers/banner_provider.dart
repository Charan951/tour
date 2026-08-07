import 'package:flutter/material.dart';
import '../models/banner_model.dart';
import '../services/banner_service.dart';

class BannerProvider extends ChangeNotifier {
  final BannerService _bannerService = BannerService();
  List<BannerModel> _banners = [];
  bool _isLoading = false;

  List<BannerModel> get banners => _banners;
  bool get isLoading => _isLoading;

  Future<void> fetchBanners() async {
    _isLoading = true;
    notifyListeners();

    try {
      _banners = await _bannerService.getBanners();
    } catch (_) {
      _banners = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
