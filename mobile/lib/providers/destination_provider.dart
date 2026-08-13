import 'package:flutter/material.dart';
import '../models/destination_model.dart';
import '../services/destination_service.dart';

class DestinationProvider extends ChangeNotifier {
  final DestinationService _destinationService = DestinationService();

  List<DestinationModel> _destinations = [];
  bool _isLoading = false;
  String? _errorMessage;

  DestinationProvider() {
    _destinations = _destinationService.getDestinationsSync();
  }

  List<DestinationModel> get destinations => _destinations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<DestinationModel> get popularDestinations =>
      _destinations.where((d) => d.isPopular).toList();

  Future<void> fetchDestinations() async {
    if (_destinations.isEmpty) {
      _isLoading = true;
      notifyListeners();
    }
    _errorMessage = null;

    try {
      final fetched = await _destinationService.getDestinations();
      _destinations = fetched;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
