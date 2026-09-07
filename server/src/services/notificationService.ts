import Notification from '../models/Notification.js';

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

    return notification;
  } catch (err) {
    console.error('Failed to create DB notification:', err);
    return null;
  }
};
