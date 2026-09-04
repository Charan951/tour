import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

/// Edit Profile — matches the web mobile redesign (UserDashboardPage.tsx
/// `screen === 'editProfile'`) and the reference mockup: photo, personal
/// information, security (change password), preferences, save / cancel.
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
    _name = TextEditingController(text: (u?.fullName ?? '').trim());
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

  Future<void> _changePhoto() async {
    final currentAvatar = Provider.of<AuthProvider>(context, listen: false).user?.avatar ?? '';
    final ImagePicker picker = ImagePicker();

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (bottomSheetCtx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Profile Photo',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Upload a photo from your device or paste an image link',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.photo_library_outlined, color: AppTheme.primaryColor),
                  ),
                  title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Upload photo from device gallery', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                  onTap: () async {
                    Navigator.pop(bottomSheetCtx);
                    await Future.delayed(const Duration(milliseconds: 200));
                    if (!mounted) return;

                    try {
                      final XFile? image = await picker.pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 85,
                      );
                      if (image != null && mounted) {
                        await _processImageUpload(image);
                      }
                    } catch (e) {
                      debugPrint('Gallery pick error: $e');
                      if (!mounted) return;
                      _showUrlInputDialog(
                        currentAvatar,
                        errorMsg: 'Device gallery unavailable. You can paste an image link below.',
                      );
                    }
                  },
                ),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.camera_alt_outlined, color: AppTheme.primaryColor),
                  ),
                  title: const Text('Take a Photo', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Capture photo with camera', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                  onTap: () async {
                    Navigator.pop(bottomSheetCtx);
                    await Future.delayed(const Duration(milliseconds: 200));
                    if (!mounted) return;

                    try {
                      final XFile? image = await picker.pickImage(
                        source: ImageSource.camera,
                        imageQuality: 85,
                      );
                      if (image != null && mounted) {
                        await _processImageUpload(image);
                      }
                    } catch (e) {
                      debugPrint('Camera pick error: $e');
                      if (!mounted) return;
                      _showUrlInputDialog(
                        currentAvatar,
                        errorMsg: 'Camera unavailable. You can paste an image link below.',
                      );
                    }
                  },
                ),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.link_outlined, color: AppTheme.primaryColor),
                  ),
                  title: const Text('Enter Image URL', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Paste a public image link (JPG / PNG)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                  onTap: () async {
                    Navigator.pop(bottomSheetCtx);
                    await Future.delayed(const Duration(milliseconds: 200));
                    if (mounted) {
                      _showUrlInputDialog(currentAvatar);
                    }
                  },
                ),
                if (currentAvatar.isNotEmpty) ...[
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.delete_outline, color: AppTheme.errorColor),
                    ),
                    title: const Text('Remove Photo', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.errorColor)),
                    onTap: () async {
                      Navigator.pop(bottomSheetCtx);
                      await _updateAvatar('');
                    },
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _processImageUpload(XFile file) async {
    if (!mounted) return;

    try {
      final rawBytes = await file.readAsBytes();
      if (!mounted) return;

      // Show Crop & Frame Dialog before uploading
      final croppedBytes = await showDialog<Uint8List>(
        context: context,
        builder: (_) => ImageCropDialog(imageBytes: rawBytes),
      );

      if (croppedBytes == null || !mounted) return;

      // Show modal progress dialog while uploading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => PopScope(
          canPop: false,
          child: Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(width: 20),
                  Text('Uploading photo...', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                ],
              ),
            ),
          ),
        ),
      );

      final uploadedUrl = await ApiService.uploadImageBytes(croppedBytes, filename: file.name);
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop(); // Dismiss loading dialog

      await _updateAvatar(uploadedUrl);
    } catch (e) {
      debugPrint('Upload error: $e');
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).maybePop();

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Upload error: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppTheme.errorColor,
      ));
    }
  }

  Future<void> _showUrlInputDialog(String currentAvatar, {String? errorMsg}) async {
    final ctrl = TextEditingController(text: currentAvatar);
    final url = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Profile Photo Link'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (errorMsg != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(errorMsg, style: const TextStyle(fontSize: 12, color: AppTheme.errorColor)),
              ),
            ],
            const Text('Paste a public image URL (JPG / PNG).',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'https://...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, ctrl.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (url != null && mounted) {
      await _updateAvatar(url);
    }
  }

  Future<void> _updateAvatar(String url) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ok = await auth.updateProfile({'avatar': url});
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Photo updated successfully' : (auth.errorMessage ?? 'Could not update photo')),
      backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
    ));
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
                    // Photo
                    Row(
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            CircleAvatar(
                              radius: 32,
                              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.12),
                              backgroundImage: ApiService.getAvatarImageProvider(user?.avatar),
                              child: (user?.avatar == null || user!.avatar!.isEmpty)
                                  ? const Icon(Icons.person, color: AppTheme.primaryColor, size: 32)
                                  : null,
                            ),
                            Positioned(
                              bottom: -2,
                              right: -2,
                              child: GestureDetector(
                                onTap: _changePhoto,
                                child: Container(
                                  width: 26,
                                  height: 26,
                                  decoration: const BoxDecoration(
                                      color: AppTheme.textPrimary, shape: BoxShape.circle),
                                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Profile Photo',
                                  style: GoogleFonts.outfit(
                                      fontSize: 14, fontWeight: FontWeight.w800)),
                              const Text('JPG, PNG up to 5MB',
                                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              const SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: _changePhoto,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryColor,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text('Change Photo', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

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
          color: const Color(0xFFECFDF5),
          borderRadius: BorderRadius.circular(999),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.verified_user, size: 12, color: Color(0xFF047857)),
            SizedBox(width: 4),
            Text('VERIFIED',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF047857))),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Material(
        color: Colors.transparent,
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

/// Interactive Crop & Frame Dialog for profile photos.
class ImageCropDialog extends StatefulWidget {
  final Uint8List imageBytes;
  const ImageCropDialog({super.key, required this.imageBytes});

  @override
  State<ImageCropDialog> createState() => _ImageCropDialogState();
}

class _ImageCropDialogState extends State<ImageCropDialog> {
  final TransformationController _transformationController = TransformationController();
  int _turns = 0;

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.grey.shade900,
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Crop Profile Photo',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context, null),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Drag or pinch to position your photo within the circular frame.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: 260,
            height: 260,
            child: Stack(
              alignment: Alignment.center,
              children: [
                ClipOval(
                  child: Container(
                    width: 250,
                    height: 250,
                    color: Colors.black,
                    child: InteractiveViewer(
                      transformationController: _transformationController,
                      minScale: 0.8,
                      maxScale: 4.0,
                      child: RotatedBox(
                        quarterTurns: _turns,
                        child: Image.memory(
                          widget.imageBytes,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
                IgnorePointer(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primaryColor, width: 3),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: () => setState(() => _turns = (_turns + 1) % 4),
                icon: const Icon(Icons.rotate_right, color: Colors.white, size: 16),
                label: const Text('Rotate 90°', style: TextStyle(color: Colors.white, fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white38),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () {
                  _transformationController.value = Matrix4.identity();
                  setState(() => _turns = 0);
                },
                icon: const Icon(Icons.refresh, color: Colors.white, size: 16),
                label: const Text('Reset', style: TextStyle(color: Colors.white, fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white38),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, widget.imageBytes),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Use Original'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, widget.imageBytes),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Crop & Save'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
