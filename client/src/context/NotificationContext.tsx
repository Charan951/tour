import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

export interface WebNotification {
  id: string;
  title: string;
  message: string;
  type: 'enquiry' | 'booking' | 'payment' | 'admin' | 'system';
  timestamp: string; // ISO string
  isRead: boolean;
  status?: string;
  referenceId?: string;
}

interface NotificationContextType {
  notifications: WebNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  checkForUpdates: () => Promise<void>;
}

const STORAGE_KEY = 'hc_web_notifications_v1';
const ENQUIRY_STATE_KEY = 'hc_web_known_enquiries_v1';
const BOOKING_STATE_KEY = 'hc_web_known_bookings_v1';
const DELETED_KEY = 'hc_web_deleted_notifications_v1';

const getDeletedNotificationIds = (): string[] => {
  try {
    const saved = localStorage.getItem(DELETED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveDeletedNotificationId = (id?: string, refId?: string) => {
  try {
    const current = getDeletedNotificationIds();
    const set = new Set(current);
    if (id) set.add(id);
    if (refId) set.add(refId);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<WebNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const rawList: WebNotification[] = JSON.parse(saved);
      const deletedSet = new Set(getDeletedNotificationIds());
      return rawList.filter(
        (n) => !deletedSet.has(n.id) && (!n.referenceId || !deletedSet.has(n.referenceId))
      );
    } catch {
      return [];
    }
  });

  const knownEnquiriesRef = useRef<Record<string, string>>((() => {
    try {
      const saved = localStorage.getItem(ENQUIRY_STATE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  const knownBookingsRef = useRef<Record<string, { status: string; paymentStatus: string }>>((() => {
    try {
      const saved = localStorage.getItem(BOOKING_STATE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  // Save notifications to localStorage on update
  const updateNotifications = useCallback((updater: (prev: WebNotification[]) => WebNotification[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Error saving notifications:', err);
      }
      return next;
    });
  }, []);

  const addNotification = useCallback((item: WebNotification) => {
    const deletedSet = new Set(getDeletedNotificationIds());
    if (deletedSet.has(item.id) || (item.referenceId && deletedSet.has(item.referenceId))) {
      return;
    }

    updateNotifications((prev) => {
      // Avoid duplicates within 5 seconds
      const exists = prev.some(
        (n) =>
          n.id === item.id ||
          (n.referenceId && item.referenceId && n.referenceId === item.referenceId) ||
          (n.title === item.title &&
            n.message === item.message &&
            Math.abs(new Date(n.timestamp).getTime() - new Date(item.timestamp).getTime()) < 5000)
      );
      if (exists) return prev;

      // Show toast alert
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border border-ocean-100 p-4`}
          >
            <div className="flex-1 w-0 flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600 font-black">
                  🔔
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
              </div>
            </div>
            <div className="flex border-l border-slate-100 pl-3 ml-3 items-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none p-2 flex items-center justify-center text-xs font-bold text-ocean-600 hover:text-ocean-700"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );

      return [item, ...prev];
    });
  }, [updateNotifications]);

  // Sync function to poll backend and detect changes
  const checkForUpdates = useCallback(async () => {
    const token = localStorage.getItem('hc_token') || localStorage.getItem('hc_access_token');
    const userStr = localStorage.getItem('hc_user');
    if (!token && !userStr) return;

    let userEmail = '';
    let isAdmin = window.location.pathname.startsWith('/admin');
    try {
      if (userStr) {
        const u = JSON.parse(userStr);
        userEmail = u.email || '';
        if (u.role === 'admin' || u.isAdmin) isAdmin = true;
      }
    } catch {}

    // Skip customer-side status change notifications when in admin mode
    if (isAdmin) return;

    const deletedSet = new Set(getDeletedNotificationIds());

    // 1. Check Enquiries
    try {
      const res = await apiClient.get('/enquiries/my', {
        params: userEmail ? { email: userEmail } : undefined,
      });
      const enquiries = Array.isArray(res.data) ? res.data : res.data?.data || [];
      let enquiryStateChanged = false;

      const currentKnownEnquiries = { ...knownEnquiriesRef.current };

      for (const eq of enquiries) {
        const id = eq.id || eq._id;
        if (!id || deletedSet.has(id)) continue;

        const currentStatus = (eq.status || 'Pending').toString().trim();
        const destinationName =
          eq.destination?.name ||
          eq.destination ||
          eq.package?.title ||
          eq.packageTitle ||
          'Tour Enquiry';

        if (!currentKnownEnquiries[id]) {
          // Initial baseline
          currentKnownEnquiries[id] = currentStatus;
          enquiryStateChanged = true;
        } else {
          const prevStatus = currentKnownEnquiries[id];
          if (prevStatus !== currentStatus) {
            currentKnownEnquiries[id] = currentStatus;
            enquiryStateChanged = true;

            addNotification({
              id: `enquiry_${id}_${Date.now()}`,
              title: 'Enquiry Status Update',
              message: `Your enquiry for "${destinationName}" status has been updated to "${currentStatus}".`,
              type: 'enquiry',
              timestamp: new Date().toISOString(),
              isRead: false,
              status: currentStatus,
              referenceId: id,
            });
          }
        }
      }

      if (enquiryStateChanged) {
        knownEnquiriesRef.current = currentKnownEnquiries;
        localStorage.setItem(ENQUIRY_STATE_KEY, JSON.stringify(currentKnownEnquiries));
      }
    } catch (e) {
      // Ignore background sync errors
    }

    // 2. Check Bookings
    try {
      const res = await apiClient.get('/bookings/my', {
        params: userEmail ? { email: userEmail } : undefined,
      });
      const bookings = Array.isArray(res.data) ? res.data : res.data?.data || [];
      let bookingStateChanged = false;

      const currentKnownBookings = { ...knownBookingsRef.current };

      for (const bk of bookings) {
        const id = (bk._id || bk.id || '').toString();
        if (!id || deletedSet.has(id)) continue;

        const currentStatus = (bk.status || 'Pending').toString();
        const currentPayment = (bk.paymentStatus || 'Pending').toString();
        const packageName =
          (typeof bk.package === 'object' ? bk.package?.title : bk.packageName) || 'Booking';
        const bookingCode = bk.bookingCode || id.slice(-6).toUpperCase();

        const prev = currentKnownBookings[id];

        if (!prev) {
          currentKnownBookings[id] = {
            status: currentStatus,
            paymentStatus: currentPayment,
          };
          bookingStateChanged = true;
        } else {
          if (prev.status !== currentStatus) {
            currentKnownBookings[id] = { ...currentKnownBookings[id], status: currentStatus };
            bookingStateChanged = true;

            addNotification({
              id: `booking_status_${id}_${Date.now()}`,
              title: 'Booking Status Update',
              message: `Booking #${bookingCode} (${packageName}) is now "${currentStatus}".`,
              type: 'booking',
              timestamp: new Date().toISOString(),
              isRead: false,
              status: currentStatus,
              referenceId: id,
            });
          }

          if (prev.paymentStatus !== currentPayment) {
            currentKnownBookings[id] = { ...currentKnownBookings[id], paymentStatus: currentPayment };
            bookingStateChanged = true;

            addNotification({
              id: `booking_payment_${id}_${Date.now()}`,
              title: 'Payment Status Update',
              message: `Payment for booking #${bookingCode} has been updated to "${currentPayment}".`,
              type: 'payment',
              timestamp: new Date().toISOString(),
              isRead: false,
              status: currentPayment,
              referenceId: id,
            });
          }
        }
      }

      if (bookingStateChanged) {
        knownBookingsRef.current = currentKnownBookings;
        localStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(currentKnownBookings));
      }
    } catch (e) {
      // Ignore background sync errors
    }
  }, [addNotification]);

  // Load baseline maps on mount
  useEffect(() => {
    try {
      const savedEnq = localStorage.getItem(ENQUIRY_STATE_KEY);
      if (savedEnq) knownEnquiriesRef.current = JSON.parse(savedEnq);
      const savedBk = localStorage.getItem(BOOKING_STATE_KEY);
      if (savedBk) knownBookingsRef.current = JSON.parse(savedBk);
    } catch {}
  }, []);

  // Set up 8-second polling timer
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(() => {
      checkForUpdates();
    }, 8000);

    const handleUserUpdate = () => {
      checkForUpdates();
    };

    window.addEventListener('hc_user_updated', handleUserUpdate);
    window.addEventListener('hc_data_updated', handleUserUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hc_user_updated', handleUserUpdate);
      window.removeEventListener('hc_data_updated', handleUserUpdate);
    };
  }, [checkForUpdates]);

  const markAsRead = (id: string) => {
    updateNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    apiClient.patch(`/admin/notifications/${id}/read`).catch(() => {});
  };

  const markAllAsRead = () => {
    updateNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    apiClient.patch('/admin/notifications/read-all').catch(() => {});
  };

  const clearAll = () => {
    notifications.forEach((n) => saveDeletedNotificationId(n.id, n.referenceId));
    updateNotifications(() => []);
    apiClient.delete('/admin/notifications/clear-all').catch(() => {});
  };

  const removeNotification = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    saveDeletedNotificationId(id, target?.referenceId);
    updateNotifications((prev) =>
      prev.filter((n) => n.id !== id && (!target?.referenceId || n.referenceId !== target.referenceId))
    );
    apiClient.delete(`/admin/notifications/${id}`).catch(() => {});
    if (target?.referenceId) {
      apiClient.delete(`/admin/notifications/${target.referenceId}`).catch(() => {});
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        checkForUpdates,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
