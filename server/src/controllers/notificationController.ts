import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { Enquiry } from '../models/Enquiry.js';
import { Booking } from '../models/Booking.js';
import { emitDataUpdate } from '../config/socketEvents.js';

const syncExistingNotificationsFromDB = async () => {
  try {
    const enquiries = await Enquiry.find({ isDeleted: false })
      .populate('destination', 'name')
      .populate('package', 'title')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const bookings = await Booking.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    for (const enq of enquiries) {
      const existing = await Notification.findOne({ entityId: enq._id.toString() });
      if (existing) continue;

      const destObj = enq.destination as any;
      const pkgObj = enq.package as any;
      const destName = destObj && typeof destObj === 'object' && destObj.name ? destObj.name : '';
      const pkgTitle = pkgObj && typeof pkgObj === 'object' && pkgObj.title ? pkgObj.title : '';
      const detailStr = pkgTitle || destName || 'Custom Trip Request';

      await Notification.create({
        type: 'enquiry',
        title: '📩 Customer Enquiry',
        message: `${enq.fullName || 'Customer'} submitted enquiry for "${detailStr}" (${enq.enquiryId || enq._id.toString().substring(0, 8)})`,
        entityId: enq._id.toString(),
        link: '/admin/leads',
        isRead: false,
        isDeleted: false,
        createdAt: enq.createdAt || new Date()
      });
    }

    for (const b of bookings) {
      const existing = await Notification.findOne({ entityId: b._id.toString() });
      if (existing) continue;

      await Notification.create({
        type: 'booking',
        title: '🎉 Tour Package Booking',
        message: `${b.customerName || 'Customer'} booked "${b.packageName || b.activityName || 'Package'}" (${b.bookingId || 'BK-TOUR'})`,
        entityId: b._id.toString(),
        link: '/admin/bookings',
        isRead: false,
        isDeleted: false,
        createdAt: b.createdAt || new Date()
      });
    }
  } catch (err) {
    console.error('Failed to sync existing notifications from DB:', err);
  }
};

const enrichExistingNotificationsPackageName = async () => {
  try {
    const notifications = await Notification.find({ isDeleted: { $ne: true } });
    for (const notif of notifications) {
      if (!notif.entityId) continue;

      if (notif.type === 'enquiry') {
        const enq = await Enquiry.findById(notif.entityId)
          .populate('package', 'title')
          .populate('activity', 'title')
          .populate('destination', 'name')
          .lean();

        if (enq) {
          const itemTitle =
            (enq.package as any)?.title ||
            (enq.activity as any)?.title ||
            (enq as any).activityTitle ||
            (enq.destination as any)?.name ||
            'Tour Package';

          if (notif.userEmail) {
            const newMsg = `Your enquiry for "${itemTitle}" status has been updated to "${notif.status || enq.status || 'Updated'}".`;
            if (notif.message !== newMsg) {
              await Notification.updateOne({ _id: notif._id }, { message: newMsg });
            }
          } else {
            const newMsg = `${enq.fullName || 'Customer'} submitted enquiry for "${itemTitle}" (${enq.enquiryId || notif.entityId.slice(-6)})`;
            if (notif.message !== newMsg) {
              await Notification.updateOne({ _id: notif._id }, { message: newMsg });
            }
          }
        }
      } else if (notif.type === 'booking') {
        const bk = await Booking.findById(notif.entityId)
          .populate('package', 'title')
          .populate('activity', 'title')
          .populate('destination', 'name')
          .lean();

        if (bk) {
          const itemTitle =
            (bk.package as any)?.title ||
            bk.packageName ||
            (bk.activity as any)?.title ||
            bk.activityName ||
            (bk.destination as any)?.name ||
            bk.destinationName ||
            'Tour Package';

          if (notif.userEmail) {
            const newMsg = `Booking #${bk.bookingId || 'BK'} ("${itemTitle}") status is now "${notif.status || bk.status || 'Updated'}".`;
            if (notif.message !== newMsg) {
              await Notification.updateOne({ _id: notif._id }, { message: newMsg });
            }
          } else {
            const newMsg = `${bk.customerName || 'Customer'} booked "${itemTitle}" (${bk.bookingId || 'BK'})`;
            if (notif.message !== newMsg) {
              await Notification.updateOne({ _id: notif._id }, { message: newMsg });
            }
          }
        }
      }
    }
  } catch (err) {}
};

// Broadcast realtime updates to all rooms
const broadcastNotificationEvent = (eventName: string, payload: any) => {
  try {
    const io = (global as any).io;
    if (io) {
      io.emit(eventName, payload);
      io.to('general_updates').emit(eventName, payload);
      io.emit('hc_data_updated', { type: 'notification', data: payload });
      io.to('general_updates').emit('data_updated', { type: 'notification', data: payload });
    }
    emitDataUpdate('notification', payload);
  } catch (err) {
    console.error('Error broadcasting notification socket event:', err);
  }
};

// Get recent notifications & unread count (ADMIN ONLY - excludes user-scoped notifications)
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 40;

    // Purge old status update notifications that accidentally had userEmail: null
    await Notification.deleteMany({
      title: { $regex: /status update/i },
      $or: [{ userEmail: null }, { userEmail: { $exists: false } }]
    }).catch(() => {});

    await enrichExistingNotificationsPackageName();

    const adminQuery = {
      isDeleted: { $ne: true },
      $or: [{ userEmail: null }, { userEmail: { $exists: false } }],
      title: { $not: /status update/i }
    };

    // Auto-populate from DB if no admin notifications exist
    const totalAdminNotifs = await Notification.countDocuments(adminQuery);
    if (totalAdminNotifs === 0) {
      await syncExistingNotificationsFromDB();
    }

    // Only return admin-level notifications (those WITHOUT a userEmail and not status updates)
    const notifications = await Notification.find(adminQuery)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      ...adminQuery,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// Mark a single notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    let notification;
    if (mongoose.Types.ObjectId.isValid(id)) {
      notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
    } else {
      await Notification.updateMany(
        { $or: [{ _id: id }, { entityId: id }] },
        { isRead: true, readAt: new Date() }
      );
      notification = await Notification.findOne({ entityId: id });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false, isDeleted: { $ne: true } });

    // Emit realtime update to all clients
    broadcastNotificationEvent('notification_updated', { id, isRead: true, unreadCount });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update notification'
    });
  }
};


// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ isRead: false, isDeleted: { $ne: true } }, { isRead: true, readAt: new Date() });

    // Emit realtime update to all clients
    broadcastNotificationEvent('notification_updated', { allRead: true, unreadCount: 0 });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all as read'
    });
  }
};

// Delete single notification — permanently removed from DB
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndDelete(id);
    } else {
      await Notification.deleteMany(
        { $or: [{ _id: id }, { entityId: id }] }
      );
    }

    const unreadCount = await Notification.countDocuments({
      isRead: false,
      isDeleted: { $ne: true },
      $or: [{ userEmail: null }, { userEmail: { $exists: false } }]
    });

    // Emit realtime deletion event to all clients
    broadcastNotificationEvent('notification_deleted', { id, unreadCount });

    res.status(200).json({
      success: true,
      message: 'Notification permanently deleted',
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
};

// ======================================================
// USER-SCOPED NOTIFICATION ENDPOINTS (for mobile app)
// ======================================================

// Get notifications for a specific user by email (mobile app)
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').toString().trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const limit = Number(req.query.limit) || 50;

    const notifications = await Notification.find({
      userEmail: email,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch user notifications' });
  }
};

// Mark a user-scoped notification as read
export const markUserNotificationRead = async (req: Request, res: Response) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const email = (req.query.email as string || '').toString().trim().toLowerCase();

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findOneAndUpdate(
        { _id: id, ...(email ? { userEmail: email } : {}) },
        { isRead: true, readAt: new Date() }
      );
    } else {
      await Notification.updateMany(
        { entityId: id, ...(email ? { userEmail: email } : {}) },
        { isRead: true, readAt: new Date() }
      );
    }

    return res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all user-scoped notifications as read
export const markAllUserNotificationsRead = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').toString().trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    await Notification.updateMany(
      { userEmail: email, isRead: false, isDeleted: { $ne: true } },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({ success: true, message: 'All user notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (hard delete from DB) a user-scoped notification
export const deleteUserNotification = async (req: Request, res: Response) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const email = (req.query.email as string || '').toString().trim().toLowerCase();

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findOneAndDelete({
        _id: id,
        ...(email ? { userEmail: email } : {})
      });
    } else {
      await Notification.deleteMany({
        entityId: id,
        ...(email ? { userEmail: email } : {})
      });
    }

    // Emit socket event so admin dashboard updates too
    broadcastNotificationEvent('user_notification_deleted', { id, userEmail: email });

    return res.status(200).json({ success: true, message: 'Notification permanently deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all notifications (admin only — hard deletes admin-level notifications, preserves user notifications)
export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    // Only delete admin-level notifications (those without a userEmail)
    await Notification.deleteMany({
      $or: [{ userEmail: null }, { userEmail: { $exists: false } }]
    });

    // Emit realtime clear event to all clients
    broadcastNotificationEvent('notification_deleted', { allCleared: true, unreadCount: 0 });

    res.status(200).json({
      success: true,
      message: 'All admin notifications permanently cleared',
      unreadCount: 0
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear notifications'
    });
  }
};


