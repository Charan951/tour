import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  UserModel? _user;
  bool _isGuest = false;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _errorMessage;
  bool _disposed = false;
  bool _notifyQueued = false;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isLoggedIn => _user != null;
  bool get isGuest => _isGuest;
  bool get canAccessApp => isLoggedIn || _isGuest;
  String? get errorMessage => _errorMessage;

  void continueAsGuest() {
    _isGuest = true;
    _safeNotifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _notifyQueued = false;
    super.dispose();
  }

  void _safeNotifyListeners() {
    if (_disposed || !hasListeners) {
      return;
    }

    if (_notifyQueued) {
      return;
    }

    _notifyQueued = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifyQueued = false;
      if (!_disposed && hasListeners) {
        notifyListeners();
      }
    });
  }

  Future<void> initAuth() async {
    _isLoading = true;
    _safeNotifyListeners();

    try {
      final savedUser = await _authService.fetchCurrentUser();
      if (savedUser != null) {
        _user = savedUser;
      }
    } catch (_) {
      _user = null;
    } finally {
      _isLoading = false;
      _isInitialized = true;
      _safeNotifyListeners();
    }
  }

  Future<void> fetchCurrentUser() async {
    try {
      final updatedUser = await _authService.fetchCurrentUser();
      if (updatedUser != null) {
        _user = updatedUser;
        _safeNotifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();

    try {
      _user = await _authService.login(email, password);
      _isLoading = false;
      _safeNotifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _safeNotifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String mobile,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();

    try {
      _user = await _authService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        mobile: mobile,
        password: password,
      );
      _isLoading = false;
      _safeNotifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _safeNotifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();

    try {
      final success = await _authService.forgotPassword(email);
      _isLoading = false;
      _safeNotifyListeners();
      return success;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _safeNotifyListeners();
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> changes) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();
    try {
      _user = await _authService.updateProfile(changes);
      _isLoading = false;
      _safeNotifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _safeNotifyListeners();
      return false;
    }
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();
    try {
      final ok = await _authService.changePassword(currentPassword, newPassword);
      _isLoading = false;
      _safeNotifyListeners();
      return ok;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _safeNotifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _safeNotifyListeners();
  }
}
