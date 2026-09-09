import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { User } from '../models/User.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { Enquiry } from '../models/Enquiry.js';
import { Booking } from '../models/Booking.js';
import { Role } from '../models/Role.js';
import { sendMulticastPushNotification } from '../config/firebase.js';

// Admin role names — used to target admin-only push notifications
const ADMIN_ROLE_NAMES = ['Admin', 'Super Admin', 'Sales Executive', 'Content Manager', 'Marketing Executive'];

export const createNotification = async (data: {
  type: 'enquiry' | 'booking' | 'payment' | 'chat' | 'system' | 'package' | 'destination';
  title: string;
  message: string;
  entityId?: string;
  status?: string;
  link?: string;
  metadata?: any;
  userEmail?: string; // If set → user-scoped notification; null/undefined → admin notification
}) => {
  try {
    const notification = await Notification.create(data);
    
    // Broadcast real-time Socket.io event
    const io = (global as any).io;
    if (io) {
      const payload = notification.toObject();
      io.emit('hc_data_updated', { type: 'notification', data: payload });
      io.to('general_updates').emit('data_updated', { type: 'notification', data: payload });

      if (data.userEmail) {
        const userRoom = `user_${data.userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        io.to(userRoom).emit('user_notification', payload);
        io.emit('user_notification', payload);
      } else {
        io.emit('notification_created', payload);
        io.to('general_updates').emit('notification_created', payload);
      }
    }

    // ── FCM Push Notification ──────────────────────────────────────────────
    try {
      let tokensToSend: string[] = [];

      if (data.userEmail) {
        // ── USER-SCOPED NOTIFICATION ──────────────────────────────────────
        const targetEmail = data.userEmail.toLowerCase().trim();

        // 1. FCM tokens from the User record
        const user = await User.findOne({
          email: { $regex: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          isDeleted: false
        });
        if (user?.fcmTokens?.length) {
          tokensToSend.push(...user.fcmTokens);
        }

        // 2. DeviceToken records matching this email
        const deviceTokens = await DeviceToken.find({
          email: { $regex: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        deviceTokens.forEach(dt => { if (dt.token) tokensToSend.push(dt.token); });

        // 3. Also match by mobile number from user, enquiry, or booking
        let targetMobile = user?.mobile || '';
        if (!targetMobile && data.entityId && mongoose.Types.ObjectId.isValid(data.entityId)) {
          if (data.type === 'enquiry') {
            const enq = await Enquiry.findById(data.entityId).lean();
            if (enq?.mobile) targetMobile = enq.mobile;
          } else if (data.type === 'booking') {
            const bk = await Booking.findById(data.entityId).lean();
            if ((bk as any)?.mobile) targetMobile = (bk as any).mobile;
          }
        }

        if (targetMobile) {
          const cleanMobile = targetMobile.replace(/\D/g, '').slice(-10);
          if (cleanMobile && cleanMobile.length >= 7) {
            const mobileTokens = await DeviceToken.find({
              mobile: { $regex: cleanMobile + '$' }
            });
            mobileTokens.forEach(dt => { if (dt.token) tokensToSend.push(dt.token); });

            const mobileUser = await User.findOne({
              mobile: { $regex: cleanMobile + '$' },
              isDeleted: false
            });
            if (mobileUser?.fcmTokens?.length) {
              tokensToSend.push(...mobileUser.fcmTokens);
            }
          }
        }

        if (tokensToSend.length === 0) {
          console.warn(`⚠️ No FCM tokens found for user "${targetEmail}". User device token will register on next app launch.`);
        }

      } else {
        // ── ADMIN-SCOPED NOTIFICATION ─────────────────────────────────────
        // 1. Get admin role IDs
        const adminRoles = await Role.find({ name: { $in: ADMIN_ROLE_NAMES } }).select('_id');
        const adminRoleIds = adminRoles.map(r => r._id);

        // 2. FCM tokens from admin User records
        const adminUsers = await User.find({
          $or: [
            { role: { $in: adminRoleIds } },
            { email: 'admin@holidaycity.com' }
          ],
          isDeleted: false,
          fcmTokens: { $exists: true, $not: { $size: 0 } }
        });
        adminUsers.forEach(u => { if (u.fcmTokens) tokensToSend.push(...u.fcmTokens); });

        // 3. DeviceTokens explicitly marked as admin devices or admin email
        const adminDeviceTokens = await DeviceToken.find({
          $or: [
            { isAdmin: true },
            { email: 'admin@holidaycity.com' }
          ]
        })
          .sort({ updatedAt: -1 })
          .limit(30);
        adminDeviceTokens.forEach(dt => { if (dt.token) tokensToSend.push(dt.token); });

        // 4. SAFE FALLBACK: recent device tokens if zero admin-specific tokens exist
        if (tokensToSend.length === 0) {
          console.warn('⚠️ No admin-flagged tokens found. Using recent DeviceTokens as fallback.');
          const legacyTokens = await DeviceToken.find({})
            .sort({ updatedAt: -1 })
            .limit(20);
          legacyTokens.forEach(dt => { if (dt.token) tokensToSend.push(dt.token); });
        }

        if (tokensToSend.length === 0) {
          console.warn('⚠️ No FCM tokens for admin notification. Admin must open the mobile app.');
        }
      }

      const uniqueTokens = Array.from(new Set(tokensToSend)).filter(t => t?.trim().length > 0);
      if (uniqueTokens.length > 0) {
        const pushData: Record<string, string> = {
          id: notification._id.toString(),
          type: data.type || 'system',
          entityId: data.entityId || '',
          link: data.link || '',
          title: data.title,
          body: data.message,
          message: data.message,
          status: data.status || ''
        };

        console.log(`🚀 FCM dispatch: "${data.title}" → ${uniqueTokens.length} device(s) [${data.userEmail ? 'user:' + data.userEmail : 'admin'}]`);
        sendMulticastPushNotification(uniqueTokens, data.title, data.message, pushData)
          .then(res => {
            console.log(`✅ FCM result: ${res?.successCount} success, ${res?.failureCount} failed`);
            if (res?.failureCount && res.failureCount > 0) {
              res.responses?.forEach((r, i) => {
                if (!r.success) {
                  console.warn(`  ❌ Token[${i}] failed: ${r.error?.code} — ${r.error?.message}`);
                  if (r.error?.code === 'messaging/registration-token-not-registered' ||
                      r.error?.code === 'messaging/invalid-registration-token') {
                    DeviceToken.deleteOne({ token: uniqueTokens[i] }).catch(() => {});
                    User.updateMany({ fcmTokens: uniqueTokens[i] }, { $pull: { fcmTokens: uniqueTokens[i] } }).catch(() => {});
                    console.log(`  🧹 Cleaned up expired token[${i}]`);
                  }
                }
              });
            }
          })
          .catch(err => console.error('❌ FCM dispatch error:', err));
      } else {
        console.warn('⚠️ FCM skipped — no tokens:', data.title);
      }
    } catch (pushErr) {
      console.error('Failed to prepare push notification:', pushErr);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create DB notification:', err);
    return null;
  }
};
