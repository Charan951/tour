import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/notification_model.dart';
import '../../providers/notification_provider.dart';
import '../../services/notification_router.dart';
import '../../services/push_notification_service.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = context.colors;
    return Scaffold(
      backgroundColor: cs.scaffold,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: cs.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Notifications',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: cs.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, child) {
              if (provider.unreadCount == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: TextButton(
                  onPressed: () => provider.markAllAsRead(),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF0EA5E9),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  ),
                  child: Text(
                    'Read All',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, child) {
          final allList = provider.notifications;
          final denied = PushNotificationService.instance.notificationsDenied;

          final content = allList.isEmpty
              ? _buildEmptyState(context)
              : _buildList(context, provider, allList);

          if (!denied) return content;
          return Column(
            children: [
              _PermissionBanner(),
              Expanded(child: content),
            ],
          );
        },
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    NotificationProvider provider,
    List<NotificationModel> allList,
  ) {
    return RefreshIndicator(
            onRefresh: () => provider.checkForUpdates(),
            color: const Color(0xFF0EA5E9),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              itemCount: allList.length,
              itemBuilder: (context, index) {
                final notification = allList[index];
                return Dismissible(
                  key: Key(notification.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Delete',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
                  onDismissed: (_) {
                    provider.deleteNotification(notification.id);
                  },
                  child: _buildNotificationCard(context, notification, provider),
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final cs = context.colors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF0EA5E9).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_off_outlined,
                size: 40,
                color: Color(0xFF0EA5E9),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No Notifications Yet',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: cs.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You will receive real-time updates when an admin updates your booking, enquiry, or payment status.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: cs.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationCard(
      BuildContext context, NotificationModel item, NotificationProvider provider) {
    final cs = context.colors;
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
        color: item.isRead
            ? cs.surface
            : (context.isDark
                ? const Color(0xFF0EA5E9).withValues(alpha: 0.12)
                : const Color(0xFFF0F9FF)),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: item.isRead
              ? cs.border
              : const Color(0xFF0EA5E9).withValues(alpha: 0.35),
          width: item.isRead ? 1 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: cs.shadow,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            if (!item.isRead) {
              provider.markAsRead(item.id);
            }
            NotificationRouter.handleType(item.type);
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(iconData, color: iconColor, size: 22),
                ),
                const SizedBox(width: 12),

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
                                color: cs.textPrimary,
                              ),
                            ),
                          ),
                          if (!item.isRead)
                            Container(
                              width: 9,
                              height: 9,
                              margin: const EdgeInsets.only(left: 6),
                              decoration: const BoxDecoration(
                                color: Color(0xFF0EA5E9),
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
                              ? cs.textSecondary
                              : cs.textPrimary,
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

/// Shown at the top of the Notifications screen when the OS notification
/// permission has been denied.
class _PermissionBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cs = context.colors;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.notifications_off_rounded,
              color: Color(0xFFB45309), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Push notifications are turned off',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: cs.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'You still see updates here, but not on your lock screen. '
                  'Turn them on in Settings → Apps → HolidayCity → Notifications.',
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    height: 1.4,
                    color: cs.textSecondary,
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
