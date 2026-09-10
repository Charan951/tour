import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/wallet_service.dart';
import '../../services/realtime_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final WalletService _walletService = WalletService();
  double _balance = 0.0;
  List<Map<String, dynamic>> _transactions = [];
  bool _isLoading = true;
  Timer? _autoRefreshTimer;
  StreamSubscription? _socketSub;

  @override
  void initState() {
    super.initState();
    _fetchWalletData();
    _connectRealtimeListener();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _fetchWalletData(showLoading: false);
    });
  }

  void _connectRealtimeListener() {
    _socketSub = RealtimeService.instance.eventStream.listen((event) {
      if (!mounted) return;
      final eventName = event['event'] as String? ?? '';
      if (eventName.contains('wallet') || eventName.contains('data_updated') || eventName.contains('booking')) {
        _fetchWalletData(showLoading: false);
      }
    });
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    _socketSub?.cancel();
    super.dispose();
  }

  Future<void> _fetchWalletData({bool showLoading = true}) async {
    if (showLoading && _transactions.isEmpty) {
      setState(() => _isLoading = true);
    }
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final res = await _walletService.getUserWallet(email: user?.email);
    if (mounted) {
      setState(() {
        _balance = (res['balance'] as num?)?.toDouble() ?? 0.0;
        _transactions = (res['transactions'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        _isLoading = false;
      });
    }
  }

  void _showWithdrawDialog() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final amountCtrl = TextEditingController(text: _balance > 0 ? _balance.toStringAsFixed(0) : '');
    final upiCtrl = TextEditingController();
    final holderCtrl = TextEditingController(text: user?.fullName ?? '');
    final bankCtrl = TextEditingController();
    final accCtrl = TextEditingController();
    final ifscCtrl = TextEditingController();

    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (bottomSheetContext, setModalState) {
            final currencyFormatter = NumberFormat('#,##,###');
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(bottomSheetContext).size.height * 0.85,
              ),
              decoration: BoxDecoration(
                color: bottomSheetContext.colors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFCFFAFE),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.account_balance_wallet, color: Color(0xFF0369A1), size: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Withdraw Wallet Funds',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: bottomSheetContext.colors.textPrimary,
                                ),
                              ),
                              Text(
                                'Available Balance: ₹${currencyFormatter.format(_balance)}',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0369A1),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.grey),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    if (_balance <= 0)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Your wallet balance is ₹0. Admin refunds or booking balance credits will appear here for withdrawal.',
                                style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.amber.shade900),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFEFF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFA5F3FC)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_outline, color: Color(0xFF0891B2), size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Available for withdrawal: ₹${currencyFormatter.format(_balance)}',
                                style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      'AMOUNT TO WITHDRAW (₹)',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: amountCtrl,
                      keyboardType: TextInputType.number,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                      decoration: InputDecoration(
                        hintText: 'Enter amount',
                        prefixText: '₹ ',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'OPTION 1: INSTANT UPI PAYOUT',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: upiCtrl,
                      style: GoogleFonts.poppins(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'e.g. 9515694155@upi or user@okicici',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            'OR BANK TRANSFER',
                            style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: holderCtrl,
                      style: GoogleFonts.poppins(fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Account Holder Name',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: bankCtrl,
                            style: GoogleFonts.poppins(fontSize: 13),
                            decoration: InputDecoration(
                              labelText: 'Bank Name',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: accCtrl,
                            style: GoogleFonts.poppins(fontSize: 13),
                            decoration: InputDecoration(
                              labelText: 'Account Number',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: ifscCtrl,
                      style: GoogleFonts.poppins(fontSize: 13),
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: 'IFSC Code',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0369A1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 2,
                        ),
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                if (_balance <= 0) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    const SnackBar(
                                      content: Text('Cannot withdraw: Available wallet balance is ₹0.'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }
                                final amt = double.tryParse(amountCtrl.text.trim()) ?? 0;
                                if (amt <= 0) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    const SnackBar(content: Text('Please enter a valid withdrawal amount')),
                                  );
                                  return;
                                }
                                if (amt > _balance) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text('Amount exceeds wallet balance ₹${currencyFormatter.format(_balance)}')),
                                  );
                                  return;
                                }
                                if (upiCtrl.text.trim().isEmpty && (bankCtrl.text.trim().isEmpty || accCtrl.text.trim().isEmpty)) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    const SnackBar(content: Text('Please enter UPI ID or Bank account details')),
                                  );
                                  return;
                                }

                                setModalState(() => isSubmitting = true);
                                final messenger = ScaffoldMessenger.of(ctx);
                                final navigator = Navigator.of(ctx);

                                final res = await _walletService.requestWithdrawal(
                                  email: user?.email ?? '',
                                  amount: amt,
                                  upiId: upiCtrl.text.trim(),
                                  bankName: bankCtrl.text.trim(),
                                  accountNumber: accCtrl.text.trim(),
                                  ifscCode: ifscCtrl.text.trim(),
                                  holderName: holderCtrl.text.trim(),
                                );

                                if (mounted) {
                                  navigator.pop();
                                  messenger.showSnackBar(
                                    SnackBar(
                                      content: Text(res['message'] ?? 'Withdrawal processed successfully!'),
                                      backgroundColor: res['success'] == true ? Colors.green : Colors.red,
                                    ),
                                  );
                                  _fetchWalletData();
                                }
                              },
                        child: isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'Confirm Withdrawal Request',
                                style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,##,###');
    final cs = context.colors;

    return Scaffold(
      appBar: AppTheme.gradientAppBar(
        context: context,
        title: 'My Wallet & Refunds',
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchWalletData(showLoading: false),
        // CustomScrollView so transaction rows build lazily on scroll.
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Wallet Balance Gradient Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF0891B2), // Cyan / Aqua 600
                      Color(0xFF0D9488), // Teal 600
                      Color(0xFF0369A1), // Ocean 700
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0891B2).withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.account_balance_wallet, color: Color(0xFFCFFAFE), size: 20),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  'AVAILABLE BALANCE',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFFCFFAFE),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.1,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            'Active',
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '₹${currencyFormatter.format(_balance)}',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Use directly at booking checkout or withdraw to bank/UPI.',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFFE0F2FE),
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Divider(color: Colors.white24),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF0369A1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 2,
                        ),
                        onPressed: _showWithdrawDialog,
                        icon: const Icon(Icons.north_east, color: Color(0xFF0369A1), size: 18),
                        label: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'WITHDRAW FUNDS',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF0369A1),
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              Text(
                'Transaction History',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: cs.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_transactions.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: cs.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.account_balance_wallet_outlined, size: 48, color: cs.textFaint),
                      const SizedBox(height: 12),
                      Text(
                        'No Wallet Transactions Yet',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          color: cs.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Refunds issued by admin or payments made using wallet balance will appear here.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(color: cs.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                ],
                ),
              ),
            ),
            if (!_isLoading && _transactions.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList.builder(
                  itemCount: _transactions.length,
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    final isCredit = tx['type'] == 'credit';
                    final num amt = tx['amount'] ?? 0;
                    final dateStr = tx['createdAt'] != null
                        ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(tx['createdAt'].toString()))
                        : 'Recent';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: cs.border),
                        boxShadow: [
                          BoxShadow(
                            color: cs.shadow,
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isCredit ? Colors.green.shade50 : Colors.red.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isCredit ? Icons.south_west : Icons.north_east,
                              color: isCredit ? Colors.green.shade600 : Colors.red.shade600,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tx['description'] ?? (isCredit ? 'Refund Credited' : 'Wallet Payment / Withdrawal'),
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: cs.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  dateStr,
                                  style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${isCredit ? '+' : '-'}₹${currencyFormatter.format(amt)}',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                  color: isCredit ? Colors.green.shade700 : cs.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: tx['status'] == 'Completed' ? Colors.green.shade50 : Colors.amber.shade50,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  tx['status'] ?? 'Completed',
                                  style: GoogleFonts.poppins(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: tx['status'] == 'Completed' ? Colors.green.shade700 : Colors.amber.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
