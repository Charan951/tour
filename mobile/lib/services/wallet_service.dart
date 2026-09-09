import 'dart:async';
import 'api_service.dart';
import 'auth_service.dart';

class WalletService {
  Future<Map<String, dynamic>> getUserWallet({String? email}) async {
    try {
      String? resolvedEmail = email?.trim();
      if (resolvedEmail == null || resolvedEmail.isEmpty) {
        final user = await AuthService().getSavedUser();
        resolvedEmail = user?.email.trim();
      }

      if (resolvedEmail == null || resolvedEmail.isEmpty) {
        return {
          'success': false,
          'balance': 0.0,
          'transactions': [],
          'message': 'No user email found',
        };
      }

      final response = await ApiService.get('/wallet/my?email=${Uri.encodeComponent(resolvedEmail)}');
      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        final num balNum = data['balance'] ?? 0;
        final List txList = (data['transactions'] as List?) ?? [];
        return {
          'success': true,
          'balance': balNum.toDouble(),
          'transactions': txList.cast<Map<String, dynamic>>(),
        };
      }

      return {
        'success': false,
        'balance': 0.0,
        'transactions': [],
        'message': response['message'] ?? 'Failed to load wallet',
      };
    } catch (e) {
      return {
        'success': false,
        'balance': 0.0,
        'transactions': [],
        'message': e.toString(),
      };
    }
  }

  Future<Map<String, dynamic>> requestWithdrawal({
    required String email,
    required double amount,
    String? upiId,
    String? bankName,
    String? accountNumber,
    String? ifscCode,
    String? holderName,
  }) async {
    try {
      final response = await ApiService.post('/wallet/withdraw', {
        'email': email.trim(),
        'amount': amount,
        'upiId': upiId?.trim() ?? '',
        'bankName': bankName?.trim() ?? '',
        'accountNumber': accountNumber?.trim() ?? '',
        'ifscCode': ifscCode?.trim() ?? '',
        'holderName': holderName?.trim() ?? '',
      });

      if (response['success'] == true) {
        return {
          'success': true,
          'message': response['message'] ?? 'Withdrawal request submitted successfully!',
        };
      }
      return {
        'success': false,
        'message': response['message'] ?? 'Withdrawal request failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  Future<Map<String, dynamic>> applyWalletPayment({
    required String bookingId,
    required double amountToUse,
    required String email,
    required bool isAdvancePayment,
  }) async {
    try {
      final response = await ApiService.post('/wallet/apply', {
        'bookingId': bookingId,
        'amountToUse': amountToUse,
        'email': email.trim(),
        'isAdvancePayment': isAdvancePayment,
      });

      if (response['success'] == true) {
        return {
          'success': true,
          'message': response['message'] ?? 'Wallet payment applied successfully!',
        };
      }
      return {
        'success': false,
        'message': response['message'] ?? 'Wallet payment failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }
}
