import Notification from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendMulticastPushNotification } from '../config/firebase.js';

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
    
    // Broadcast real-time Socket.io notification event to all connected clients
    const io = (global as any).io;
    if (io) {
      const payload = notification.toObject();
      // Broadcast to everyone (admin dashboard + mobile app listeners)
      io.emit('notification_created', payload);
      io.to('general_updates').emit('notification_created', payload);
      io.emit('hc_data_updated', { type: 'notification', data: payload });
      io.to('general_updates').emit('data_updated', { type: 'notification', data: payload });

      // If user-scoped, also emit to user-specific room so mobile can pick it up instantly
      if (data.userEmail) {
        const userRoom = `user_${data.userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        io.to(userRoom).emit('user_notification', payload);
        io.emit('user_notification', payload); // Broadcast to all for immediate pickup
      }
    }

    // Send FCM Push Notification to target device tokens
    try {
      let tokensToSend: string[] = [];
      if (data.userEmail) {
        // Fetch target user's FCM tokens
        const user = await User.findOne({ email: data.userEmail.toLowerCase().trim(), isDeleted: false });
        if (user && user.fcmTokens && user.fcmTokens.length > 0) {
          tokensToSend = user.fcmTokens;
        }
      } else {
        // Fetch all Admin users' FCM tokens
        const adminUsers = await User.find({ isDeleted: false, fcmTokens: { $exists: true, $not: { $size: 0 } } });
        adminUsers.forEach((u) => {
          if (u.fcmTokens) {
            tokensToSend.push(...u.fcmTokens);
          }
        });
      }

      if (tokensToSend.length > 0) {
        const uniqueTokens = Array.from(new Set(tokensToSend));
        const pushData: Record<string, string> = {
          id: notification._id.toString(),
          type: data.type || 'system',
          entityId: data.entityId || '',
          link: data.link || '',
        };

        sendMulticastPushNotification(uniqueTokens, data.title, data.message, pushData)
          .catch((err) => console.error('Error dispatching push notification:', err));
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
