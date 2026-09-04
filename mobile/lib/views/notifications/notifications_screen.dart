import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/notification_model.dart';
import '../../providers/notification_provider.dart';
import '../booking/my_bookings_screen.dart';
import '../enquiry/my_enquiries_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'All';

  final List<String> _filters = ['All', 'Unread', 'Bookings', 'Enquiries', 'Payments'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Notifications',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, child) {
              if (provider.notifications.isEmpty) return const SizedBox();
              return PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, color: AppTheme.textPrimary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                onSelected: (value) {
                  if (value == 'read_all') {
                    provider.markAllAsRead();
                  } else if (value == 'clear_all') {
                    provider.clearAll();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'read_all',
                    child: Row(
                      children: [
                        const Icon(Icons.done_all_rounded, size: 18, color: AppTheme.primaryColor),
                        const SizedBox(width: 10),
                        Text(
                          'Mark all as read',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'clear_all',
                    child: Row(
                      children: [
                        const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent),
                        const SizedBox(width: 10),
                        Text(
                          'Clear all',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.redAccent),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, child) {
          final allList = provider.notifications;
          final filteredList = _getFilteredNotifications(allList);

          return Column(
            children: [
              // Filter Chips
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((filter) {
                      final isSelected = _selectedFilter == filter;
                      int badgeCount = 0;
                      if (filter == 'Unread') {
                        badgeCount = provider.unreadCount;
                      }

                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          labelPadding: const EdgeInsets.symmetric(horizontal: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          label: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(filter),
                              if (badgeCount > 0) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.redAccent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '$badgeCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedFilter = filter),
                          selectedColor: AppTheme.primaryColor,
                          backgroundColor: const Color(0xFFF0F4F8),
                          labelStyle: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? Colors.white : AppTheme.textSecondary,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color: isSelected ? AppTheme.primaryColor : Colors.transparent,
                            ),
                          ),
                          showCheckmark: false,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Notification List or Empty View
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => provider.checkForUpdates(),
                  child: filteredList.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          itemCount: filteredList.length,
                          itemBuilder: (context, index) {
                            final notification = filteredList[index];
                            return _buildNotificationCard(context, notification, provider);
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  List<NotificationModel> _getFilteredNotifications(List<NotificationModel> list) {
    switch (_selectedFilter) {
      case 'Unread':
        return list.where((n) => !n.isRead).toList();
      case 'Bookings':
        return list.where((n) => n.type == 'booking').toList();
      case 'Enquiries':
        return list.where((n) => n.type == 'enquiry').toList();
      case 'Payments':
        return list.where((n) => n.type == 'payment').toList();
      default:
        return list;
    }
  }

  Widget _buildEmptyState() {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.18),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_off_outlined,
                  size: 42,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'No Notifications Yet',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'You will receive real-time updates when an admin updates your booking, enquiry, or payment status.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationCard(
      BuildContext context, NotificationModel item, NotificationProvider provider) {
    IconData iconData;
    Color iconColor;
    Color iconBg;

    switch (item.type) {
      case 'booking':
        iconData = Icons.confirmation_number_rounded;
        iconColor = const Color(0xFF6C5CE7);
        iconBg = const Color(0xFF6C5CE7).withValues(alpha: 0.12);
        break;
      case 'enquiry':
        iconData = Icons.assignment_turned_in_rounded;
        iconColor = const Color(0xFF00CEC9);
        iconBg = const Color(0xFF00CEC9).withValues(alpha: 0.12);
        break;
      case 'payment':
        iconData = Icons.account_balance_wallet_rounded;
        iconColor = const Color(0xFF00B894);
        iconBg = const Color(0xFF00B894).withValues(alpha: 0.12);
        break;
      default:
        iconData = Icons.notifications_active_rounded;
        iconColor = AppTheme.primaryColor;
        iconBg = AppTheme.primaryColor.withValues(alpha: 0.12);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: item.isRead ? Colors.white : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.isRead
              ? const Color(0xFFE2E8F0)
              : AppTheme.primaryColor.withValues(alpha: 0.35),
          width: item.isRead ? 1 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            provider.markAsRead(item.id);
            _showNotificationDetailsBottomSheet(context, item, provider);
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type Icon
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(iconData, color: iconColor, size: 22),
                ),
                const SizedBox(width: 14),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                fontWeight: item.isRead ? FontWeight.w600 : FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                          if (!item.isRead)
                            Container(
                              width: 9,
                              height: 9,
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.message,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: item.isRead ? FontWeight.w400 : FontWeight.w500,
                          color: item.isRead
                              ? AppTheme.textSecondary
                              : const Color(0xFF1E293B),
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (item.status != null && item.status!.isNotEmpty) ...[
                            _buildStatusTag(item.status!),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            _formatTimestamp(item.timestamp),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showNotificationDetailsBottomSheet(
      BuildContext context, NotificationModel item, NotificationProvider provider) {
    IconData iconData;
    Color iconColor;
    Color iconBg;

    switch (item.type) {
      case 'booking':
        iconData = Icons.confirmation_number_rounded;
        iconColor = const Color(0xFF6C5CE7);
        iconBg = const Color(0xFF6C5CE7).withValues(alpha: 0.12);
        break;
      case 'enquiry':
        iconData = Icons.assignment_turned_in_rounded;
        iconColor = const Color(0xFF00CEC9);
        iconBg = const Color(0xFF00CEC9).withValues(alpha: 0.12);
        break;
      case 'payment':
        iconData = Icons.account_balance_wallet_rounded;
        iconColor = const Color(0xFF00B894);
        iconBg = const Color(0xFF00B894).withValues(alpha: 0.12);
        break;
      default:
        iconData = Icons.notifications_active_rounded;
        iconColor = AppTheme.primaryColor;
        iconBg = AppTheme.primaryColor.withValues(alpha: 0.12);
    }

    final formattedDate = DateFormat('EEE, MMM d, yyyy • h:mm a').format(item.timestamp);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) => Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 20,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Drag Handle
            Center(
              child: Container(
                width: 42,
                height: 4.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Header Row: Type Icon, Title & Close Button
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(iconData, color: iconColor, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.type.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                          color: iconColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.title,
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(bottomSheetContext),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 16),

            // Status & Timestamp Badges
            Row(
              children: [
                if (item.status != null && item.status!.isNotEmpty) ...[
                  _buildStatusTag(item.status!),
                  const SizedBox(width: 10),
                ],
                const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Text(
                  formattedDate,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Notification Message Body Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Notification Details:',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.message,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF1E293B),
                      height: 1.5,
                    ),
                  ),
                  if (item.referenceId != null && item.referenceId!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Ref ID: ${item.referenceId}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF334155),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 22),

            // Action Buttons
            Row(
              children: [
                if (item.type == 'booking' || item.type == 'enquiry' || item.type == 'payment') ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(bottomSheetContext);
                        if (item.type == 'booking' || item.type == 'payment') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                          );
                        } else if (item.type == 'enquiry') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const MyEnquiriesScreen()),
                          );
                        }
                      },
                      icon: Icon(
                        item.type == 'booking'
                            ? Icons.confirmation_number_rounded
                            : (item.type == 'enquiry'
                                ? Icons.assignment_turned_in_rounded
                                : Icons.account_balance_wallet_rounded),
                        size: 18,
                        color: Colors.white,
                      ),
                      label: Text(
                        item.type == 'booking'
                            ? 'View My Bookings'
                            : (item.type == 'enquiry' ? 'View My Enquiries' : 'View Payments'),
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 4,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(bottomSheetContext),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'Close',
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTag(String status) {
    Color bg = const Color(0xFFEDF2F7);
    Color fg = const Color(0xFF4A5568);

    final s = status.toLowerCase();
    if (s.contains('confirm') || s.contains('paid') || s.contains('completed')) {
      bg = const Color(0xFFE6FFFA);
      fg = const Color(0xFF047857);
    } else if (s.contains('progress') || s.contains('pending')) {
      bg = const Color(0xFFFEFCBF);
      fg = const Color(0xFFB7791F);
    } else if (s.contains('cancel') || s.contains('reject') || s.contains('closed')) {
      bg = const Color(0xFFFED7D7);
      fg = const Color(0xFFC53030);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inSeconds < 60) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return DateFormat('MMM d, h:mm a').format(dt);
    }
  }
}
