import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/push_notification_service.dart';

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

  /// Fast, offline-only startup used by the splash screen.
  ///
  /// Reads the persisted session from local storage only — no network call —
  /// so the splash never blocks on a slow/absent connection. The server-side
  /// profile is refreshed afterwards via [refreshCurrentUserInBackground].
  Future<void> initAuth() async {
    _isLoading = true;
    _safeNotifyListeners();

    try {
      final savedUser = await _authService.getSavedUser();
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

  /// Fire-and-forget refresh of the signed-in user from the server. Safe to
  /// call after the app is already showing the home screen; updates the UI
  /// only if something actually changed.
  void refreshCurrentUserInBackground() {
    if (_user == null) return;
    _authService.fetchCurrentUser().then((updatedUser) {
      if (updatedUser != null) {
        _user = updatedUser;
        PushNotificationService.instance.syncTokenWithBackend();
        _safeNotifyListeners();
      }
    }).catchError((_) {});
  }

  Future<void> fetchCurrentUser() async {
    try {
      final updatedUser = await _authService.fetchCurrentUser();
      if (updatedUser != null) {
        _user = updatedUser;
        PushNotificationService.instance.syncTokenWithBackend();
        _safeNotifyListeners();
      }
    } catch (_) {}
  }

  String _cleanError(dynamic e) {
    final str = e.toString().replaceAll('Exception: ', '').trim();
    if (str.toLowerCase().contains('too many') || str.toLowerCase().contains('rate limit')) {
      return 'Please tap Sign In again to retry.';
    }
    return str;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();

    try {
      _user = await _authService.login(email, password);
      PushNotificationService.instance.syncTokenWithBackend();
      _isLoading = false;
      _safeNotifyListeners();
      return true;
    } catch (e) {
      _errorMessage = _cleanError(e);
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
      PushNotificationService.instance.syncTokenWithBackend();
      _isLoading = false;
      _safeNotifyListeners();
      return true;
    } catch (e) {
      _errorMessage = _cleanError(e);
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
      await _authService.forgotPassword(email);
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

  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _safeNotifyListeners();

    try {
      final ok = await _authService.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPassword,
      );
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

  /// Permanently deletes the account server-side, then clears local state.
  /// Returns null on success or an error message on failure.
  Future<String?> deleteAccount() async {
    try {
      await _authService.deleteAccount();
      _user = null;
      _safeNotifyListeners();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }
}
