import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static const String tokenKey = 'hc_access_token';
  static const String userKey = 'hc_user_data';

  Future<UserModel> login(String email, String password) async {
    final response = await ApiService.post(ApiConfig.login, {
      'email': email,
      'password': password,
    });

    if (response['success'] == true && response['data'] != null) {
      final token = response['data']['accessToken'];
      final userData = response['data']['user'];

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
      final token = response['data']['accessToken'];
      final userData = response['data']['user'];

      final user = UserModel.fromJson(userData);
      await saveSession(token, user);
      return user;
    } else {
      throw Exception(response['message'] ?? 'Registration failed');
    }
  }

  Future<bool> forgotPassword(String email) async {
    final response = await ApiService.post(ApiConfig.forgotPassword, {
      'email': email,
    });
    return response['success'] == true;
  }

  Future<UserModel?> fetchCurrentUser() async {
    try {
      final response = await ApiService.get(ApiConfig.me);
      if (response['success'] == true && response['data'] != null) {
        // /admin/auth/me returns data as the user object directly (not data.user)
        final rawData = response['data'];
        final userData = rawData is Map && rawData.containsKey('firstName')
            ? rawData
            : (rawData['user'] ?? rawData);
        final user = UserModel.fromJson(userData);
        // Preserve existing token — getMe does not return a new accessToken
        final prefs = await SharedPreferences.getInstance();
        final existingToken = prefs.getString(tokenKey) ?? '';
        await saveSession(existingToken, user);
        return user;
      }
    } catch (_) {}
    return getSavedUser();
  }

  Future<void> saveSession(String token, UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
    await prefs.setString(userKey, jsonEncode(user.toJson()));
  }

  Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
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

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
  }
}
