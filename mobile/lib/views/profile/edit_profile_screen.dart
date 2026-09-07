import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

/// Edit Profile — personal information, security (change password), preferences, save / cancel.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _city;
  String _language = 'English';
  String _currency = 'INR';

  static const _languages = ['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी'];
  static const _currencies = {
    'INR': 'INR - Indian Rupee (₹)',
    'USD': 'USD - US Dollar (\$)',
    'EUR': 'EUR - Euro (€)',
    'GBP': 'GBP - Pound (£)',
    'AED': 'AED - Dirham',
  };

  @override
  void initState() {
    super.initState();
    final u = Provider.of<AuthProvider>(context, listen: false).user;
    _name = TextEditingController(text: (u?.displayName ?? u?.fullName ?? '').trim());
    _phone = TextEditingController(text: u?.mobile ?? '');
    _city = TextEditingController(text: u?.city ?? '');
    _language = _languages.contains(u?.language) ? u!.language : 'English';
    _currency = _currencies.containsKey(u?.currency) ? u!.currency : 'INR';
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final parts = _name.text.trim().split(RegExp(r'\s+'))..removeWhere((p) => p.isEmpty);
    final ok = await auth.updateProfile({
      'firstName': parts.isNotEmpty ? parts.first : '',
      'lastName': parts.length > 1 ? parts.sublist(1).join(' ') : '',
      'mobile': _phone.text.trim(),
      'city': _city.text.trim(),
      'language': _language,
      'currency': _currency,
    });
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Profile updated' : (auth.errorMessage ?? 'Could not update profile')),
      backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
    ));
    if (ok) Navigator.pop(context);
  }

  Future<void> _changePassword() async {
    final current = TextEditingController();
    final next = TextEditingController();
    final confirm = TextEditingController();
    bool show = false;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (dialogCtx, setLocal) {
          Widget field(TextEditingController c, String label) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextField(
                  controller: c,
                  obscureText: !show,
                  decoration: InputDecoration(
                    labelText: label,
                    suffixIcon: label == 'Current Password'
                        ? IconButton(
                            tooltip: show ? 'Hide password' : 'Show password',
                            icon: Icon(show ? Icons.visibility_off : Icons.visibility, size: 18),
                            onPressed: () => setLocal(() => show = !show),
                          )
                        : null,
                  ),
                ),
              );
          return AlertDialog(
            title: const Text('Change Password'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                field(current, 'Current Password'),
                field(next, 'New Password'),
                field(confirm, 'Confirm New Password'),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Use at least 6 characters.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () async {
                  if (next.text.length < 6) {
                    ScaffoldMessenger.of(dialogCtx).showSnackBar(
                      const SnackBar(content: Text('New password must be at least 6 characters')));
                    return;
                  }
                  if (next.text != confirm.text) {
                    ScaffoldMessenger.of(dialogCtx).showSnackBar(
                      const SnackBar(content: Text('Passwords do not match')));
                    return;
                  }
                  final auth = Provider.of<AuthProvider>(dialogCtx, listen: false);
                  final ok = await auth.changePassword(current.text, next.text);
                  if (!dialogCtx.mounted) return;
                  Navigator.pop(dialogCtx);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(ok ? 'Password changed' : (auth.errorMessage ?? 'Could not change password')),
                    backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
                  ));
                },
                child: const Text('Update'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final topPadding = MediaQuery.of(context).padding.top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        body: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(12, topPadding + 12, 16, 20),
              decoration: const BoxDecoration(
                gradient: AppTheme.headerGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Back',
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text('Edit Profile',
                      style: GoogleFonts.outfit(
                          fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile Avatar Initial Display
                      Center(
                        child: CircleAvatar(
                          radius: 36,
                          backgroundColor: AppTheme.primaryColor,
                          child: Text(
                            (user?.displayName ?? user?.fullName ?? '').trim().isNotEmpty
                                ? (user?.displayName ?? user?.fullName ?? '').trim()[0].toUpperCase()
                                : 'U',
                            style: GoogleFonts.outfit(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      _sectionTitle('Personal Information'),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'Full Name',
                        child: TextFormField(
                          controller: _name,
                          decoration: _bare(),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'Email',
                        filled: true,
                        trailing: _verifiedPill(),
                        child: Text(user?.email ?? '—',
                            style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
                      ),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'Phone Number',
                        child: TextFormField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          decoration: _bare(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'City',
                        child: TextFormField(
                          controller: _city,
                          decoration: _bare(hint: 'Enter your city'),
                        ),
                      ),
                      const SizedBox(height: 24),

                      _sectionTitle('Security'),
                      const SizedBox(height: 12),
                      _rowCard(
                        icon: Icons.lock_outline,
                        title: 'Change Password',
                        subtitle: 'Update your account password',
                        onTap: _changePassword,
                      ),
                      const SizedBox(height: 24),

                      _sectionTitle('Preferences'),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'Preferred Language',
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _language,
                            isExpanded: true,
                            items: _languages
                                .map((l) => DropdownMenuItem(value: l, child: Text(l, style: const TextStyle(fontSize: 14))))
                                .toList(),
                            onChanged: (v) => setState(() => _language = v ?? 'English'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _fieldCard(
                        label: 'Currency',
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _currency,
                            isExpanded: true,
                            items: _currencies.entries
                                .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 14))))
                                .toList(),
                            onChanged: (v) => setState(() => _currency = v ?? 'INR'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: auth.isLoading ? null : _save,
                          icon: auth.isLoading
                              ? const SizedBox(
                                  width: 16, height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.check, size: 18),
                          label: const Text('Save Changes'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primaryColor,
                            side: const BorderSide(color: AppTheme.borderLight),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _bare({String? hint}) => InputDecoration(
        isDense: true,
        hintText: hint,
        border: InputBorder.none,
        contentPadding: EdgeInsets.zero,
      );

  Widget _sectionTitle(String t) => Text(t,
      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textPrimary));

  Widget _verifiedPill() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.verified_user, size: 12, color: Color(0xFF475569)),
            SizedBox(width: 4),
            Text('VERIFIED',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF475569))),
          ],
        ),
      );

  Widget _fieldCard({
    required String label,
    required Widget child,
    Widget? trailing,
    bool filled = false,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      decoration: BoxDecoration(
        color: filled ? const Color(0xFFF1F5F9) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(),
                  style: const TextStyle(
                      fontSize: 10, fontWeight: FontWeight.w900,
                      letterSpacing: 0.5, color: AppTheme.textSecondary)),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }

  Widget _rowCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          leading: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.lock_outline, color: AppTheme.primaryColor, size: 20),
          ),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
          onTap: onTap,
        ),
      ),
    );
  }
}

