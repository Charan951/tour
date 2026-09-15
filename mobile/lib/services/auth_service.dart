import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

import 'push_notification_service.dart';

class AuthService {
  static const String tokenKey = 'hc_access_token';
  static const String userKey = 'hc_user_data';

  Future<UserModel> login(String email, String password) async {
    final response = await ApiService.post(ApiConfig.login, {
      'email': email,
      'password': password,
    });

    if (response['success'] == true && response['data'] != null) {
      final token = response['data']['accessToken'] ?? response['data']['token'] ?? '';
      final userData = response['data']['user'] ?? response['data'];

      final user = UserModel.fromJson(userData);
      await saveSession(token, user);
      return user;
    } else {
      throw Exception(response['message'] ?? 'Login failed');
    }
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String mobile,
    required String password,
  }) async {
    final response = await ApiService.post(ApiConfig.register, {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'mobile': mobile,
      'password': password,
    });

    if (response['success'] == true && response['data'] != null) {
      final token = response['data']['accessToken'] ?? response['data']['token'] ?? '';
      final userData = response['data']['user'] ?? response['data'];

      final user = UserModel.fromJson(userData);
      await saveSession(token, user);
      return user;
    } else {
      throw Exception(response['message'] ?? 'Registration failed');
    }
  }

  /// POST /auth/forgot-password — send 6-digit OTP to email.
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await ApiService.post(ApiConfig.forgotPassword, {
      'email': email,
    });
    if (response['success'] == true) {
      final otp = response['data']?['otp']?.toString();
      return {'success': true, 'otp': otp};
    }
    throw Exception(response['message'] ?? 'Could not send OTP to email');
  }

  /// POST /auth/reset-password — set a new password using email, 6-digit OTP, and new password.
  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await ApiService.post(
      ApiConfig.resetPassword,
      {
        'email': email,
        'otp': otp,
        'password': newPassword,
      },
    );
    if (response['success'] == true) return true;
    throw Exception(response['message'] ?? 'Could not reset password');
  }

  /// PATCH /auth/me — update the signed-in user's own profile.
  Future<UserModel> updateProfile(Map<String, dynamic> changes) async {
    final response = await ApiService.patch(ApiConfig.updateProfile, changes);
    if (response['success'] == true && response['data'] != null) {
      final rawData = response['data'];
      final userData = (rawData is Map && rawData.containsKey('user')) ? rawData['user'] : rawData;
      final user = UserModel.fromJson(userData);
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(tokenKey) ?? '';
      await saveSession(token, user);
      return user;
    }
    throw Exception(response['message'] ?? 'Could not update profile');
  }

  /// POST /auth/change-password
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    final response = await ApiService.post(ApiConfig.changePassword, {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    if (response['success'] == true) return true;
    throw Exception(response['message'] ?? 'Could not change password');
  }

  Future<UserModel?> fetchCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(tokenKey);
    if (token == null || token.isEmpty) {
      return null;
    }
    ApiService.setToken(token);
    try {
      final response = await ApiService.get(ApiConfig.me);
      if (response['success'] == true && response['data'] != null) {
        // /admin/auth/me returns data as the user object directly (not data.user)
        final rawData = response['data'];
        final userData = rawData is Map && rawData.containsKey('firstName')
            ? rawData
            : (rawData['user'] ?? rawData);
        final user = UserModel.fromJson(userData);
        await saveSession(token, user);
        return user;
      }
    } catch (_) {}
    return getSavedUser();
  }

  Future<void> saveSession(String token, UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
    await prefs.setString(userKey, jsonEncode(user.toJson()));
    ApiService.setToken(token);
    PushNotificationService.instance.syncTokenWithBackend();
  }

  Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(tokenKey);
    if (token == null || token.isEmpty) {
      return null;
    }
    final userStr = prefs.getString(userKey);
    if (userStr != null) {
      try {
        return UserModel.fromJson(jsonDecode(userStr));
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(tokenKey) && prefs.getString(tokenKey)!.isNotEmpty;
  }

  /// DELETE /auth/me — permanently delete the signed-in user's account, then
  /// clear the local session. Throws with the server message on failure.
  Future<void> deleteAccount() async {
    final response = await ApiService.delete(ApiConfig.deleteAccount);
    if (response is Map && response['success'] == true) {
      await PushNotificationService.instance.removeTokenFromBackend();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(tokenKey);
      await prefs.remove(userKey);
      ApiService.setToken(null);
      return;
    }
    throw Exception(
      (response is Map ? response['message'] : null) ?? 'Could not delete your account',
    );
  }

  Future<void> logout() async {
    await PushNotificationService.instance.removeTokenFromBackend();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
    ApiService.setToken(null);
  }
}
