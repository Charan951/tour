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

const getCurrentUserEmail = (): string => {
  try {
    const userStr = localStorage.getItem('hc_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      return (u.email || '').toString().trim().toLowerCase();
    }
  } catch {}
  return '';
};

const getStorageKey = (email?: string) =>
  email ? `hc_web_notifications_${email}` : 'hc_web_notifications_guest';
const getEnquiryKey = (email?: string) =>
  email ? `hc_web_known_enquiries_${email}` : 'hc_web_known_enquiries_guest';
const getBookingKey = (email?: string) =>
  email ? `hc_web_known_bookings_${email}` : 'hc_web_known_bookings_guest';
const getDeletedKey = (email?: string) =>
  email ? `hc_web_deleted_notifications_${email}` : 'hc_web_deleted_notifications_guest';

const getDeletedNotificationIds = (email?: string): string[] => {
  try {
    const saved = localStorage.getItem(getDeletedKey(email));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveDeletedNotificationId = (email?: string, id?: string, refId?: string) => {
  try {
    const current = getDeletedNotificationIds(email);
    const set = new Set(current);
    if (id) set.add(id);
    if (refId) set.add(refId);
    localStorage.setItem(getDeletedKey(email), JSON.stringify(Array.from(set)));
  } catch {}
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => getCurrentUserEmail());

  const [notifications, setNotifications] = useState<WebNotification[]>(() => {
    const email = getCurrentUserEmail();
    if (!email) return []; // Guest users get 0 notifications
    try {
      const saved = localStorage.getItem(getStorageKey(email));
      if (!saved) return [];
      const rawList: WebNotification[] = JSON.parse(saved);
      const deletedSet = new Set(getDeletedNotificationIds(email));
      return rawList.filter(
        (n) => !deletedSet.has(n.id) && (!n.referenceId || !deletedSet.has(n.referenceId))
      );
    } catch {
      return [];
    }
  });

  const knownEnquiriesRef = useRef<Record<string, string>>({});
  const knownBookingsRef = useRef<Record<string, { status: string; paymentStatus: string }>>({});

  // Reload local state when user email changes (switch account / logout)
  useEffect(() => {
    const activeEmail = currentUserEmail;
    if (!activeEmail) {
      setNotifications([]);
      knownEnquiriesRef.current = {};
      knownBookingsRef.current = {};
      return;
    }

    try {
      const savedNotifs = localStorage.getItem(getStorageKey(activeEmail));
      const deletedSet = new Set(getDeletedNotificationIds(activeEmail));
      if (savedNotifs) {
        const rawList: WebNotification[] = JSON.parse(savedNotifs);
        setNotifications(
          rawList.filter(
            (n) => !deletedSet.has(n.id) && (!n.referenceId || !deletedSet.has(n.referenceId))
          )
        );
      } else {
        setNotifications([]);
      }

      const savedEnq = localStorage.getItem(getEnquiryKey(activeEmail));
      knownEnquiriesRef.current = savedEnq ? JSON.parse(savedEnq) : {};

      const savedBk = localStorage.getItem(getBookingKey(activeEmail));
      knownBookingsRef.current = savedBk ? JSON.parse(savedBk) : {};
    } catch {
      setNotifications([]);
    }
  }, [currentUserEmail]);

  // Save notifications to user-scoped localStorage on update
  const updateNotifications = useCallback(
    (updater: (prev: WebNotification[]) => WebNotification[]) => {
      setNotifications((prev) => {
        const next = updater(prev);
        const activeEmail = getCurrentUserEmail();
        if (activeEmail) {
          try {
            localStorage.setItem(getStorageKey(activeEmail), JSON.stringify(next));
          } catch (err) {
            console.error('Error saving notifications:', err);
          }
        }
        return next;
      });
    },
    []
  );

  const addNotification = useCallback(
    (item: WebNotification) => {
      const activeEmail = getCurrentUserEmail();
      const deletedSet = new Set(getDeletedNotificationIds(activeEmail));
      if (deletedSet.has(item.id) || (item.referenceId && deletedSet.has(item.referenceId))) {
        return;
      }

      updateNotifications((prev) => {
        const exists = prev.some(
          (n) =>
            n.id === item.id ||
            (n.referenceId && item.referenceId && n.referenceId === item.referenceId) ||
            (n.title === item.title &&
              n.message === item.message &&
              Math.abs(new Date(n.timestamp).getTime() - new Date(item.timestamp).getTime()) < 5000)
        );
        if (exists) return prev;

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
    },
    [updateNotifications]
  );

  // Sync function to poll backend and detect changes
  const checkForUpdates = useCallback(async () => {
    const activeEmail = getCurrentUserEmail();
    const token = localStorage.getItem('hc_token') || localStorage.getItem('hc_access_token');
    const userStr = localStorage.getItem('hc_user');

    if (!token && !userStr) {
      if (currentUserEmail !== '') setCurrentUserEmail('');
      return;
    }

    if (activeEmail !== currentUserEmail) {
      setCurrentUserEmail(activeEmail);
    }

    if (!activeEmail) return;

    const isAdmin = window.location.pathname.startsWith('/admin');
    if (isAdmin) return;

    const deletedSet = new Set(getDeletedNotificationIds(activeEmail));

    // 0. Fetch user notifications directly from backend
    try {
      const notifRes = await apiClient.get('/notifications/my', {
        params: { email: activeEmail },
      });
      const serverNotifs = notifRes.data?.data || [];
      if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
        updateNotifications((prev) => {
          let updated = [...prev];
          for (const sNotif of serverNotifs) {
            const id = sNotif._id || sNotif.id;
            if (!id || deletedSet.has(id)) continue;
            const exists = updated.some((n) => n.id === id || n.referenceId === sNotif.entityId);
            if (!exists) {
              updated.unshift({
                id: id,
                title: sNotif.title || 'Notification',
                message: sNotif.message || '',
                type: sNotif.type || 'system',
                timestamp: sNotif.createdAt || new Date().toISOString(),
                isRead: Boolean(sNotif.isRead),
                status: sNotif.status,
                referenceId: sNotif.entityId,
              });
            }
          }
          return updated.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
      }
    } catch (e) {}

    // 1. Check Enquiries
    try {
      const res = await apiClient.get('/enquiries/my', {
        params: { email: activeEmail },
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
        localStorage.setItem(getEnquiryKey(activeEmail), JSON.stringify(currentKnownEnquiries));
      }
    } catch (e) {}

    // 2. Check Bookings
    try {
      const res = await apiClient.get('/bookings/my', {
        params: { email: activeEmail },
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
        localStorage.setItem(getBookingKey(activeEmail), JSON.stringify(currentKnownBookings));
      }
    } catch (e) {}
  }, [addNotification, currentUserEmail, updateNotifications]);

  // Set up 60-second polling fallback timer & user update listener
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(() => {
      checkForUpdates();
    }, 60000);

    const handleUserUpdate = () => {
      const latestEmail = getCurrentUserEmail();
      if (latestEmail !== currentUserEmail) {
        setCurrentUserEmail(latestEmail);
        checkForUpdates();
      }
    };

    window.addEventListener('hc_user_updated', handleUserUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hc_user_updated', handleUserUpdate);
    };
  }, [checkForUpdates, currentUserEmail]);

  const markAsRead = (id: string) => {
    const activeEmail = getCurrentUserEmail();
    updateNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (activeEmail) {
      apiClient.patch(`/notifications/my/${id}/read?email=${activeEmail}`).catch(() => {});
    } else {
      apiClient.patch(`/admin/notifications/${id}/read`).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    const activeEmail = getCurrentUserEmail();
    updateNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (activeEmail) {
      apiClient.patch(`/notifications/my/read-all?email=${activeEmail}`).catch(() => {});
    } else {
      apiClient.patch('/admin/notifications/read-all').catch(() => {});
    }
  };

  const clearAll = () => {
    const activeEmail = getCurrentUserEmail();
    notifications.forEach((n) => saveDeletedNotificationId(activeEmail, n.id, n.referenceId));
    updateNotifications(() => []);
    if (activeEmail) {
      apiClient.delete(`/notifications/my/clear-all?email=${activeEmail}`).catch(() => {});
    } else {
      apiClient.delete('/admin/notifications/clear-all').catch(() => {});
    }
  };

  const removeNotification = (id: string) => {
    const activeEmail = getCurrentUserEmail();
    const target = notifications.find((n) => n.id === id);
    saveDeletedNotificationId(activeEmail, id, target?.referenceId);
    updateNotifications((prev) =>
      prev.filter((n) => n.id !== id && (!target?.referenceId || n.referenceId !== target.referenceId))
    );
    if (activeEmail) {
      apiClient.delete(`/notifications/my/${id}?email=${activeEmail}`).catch(() => {});
    } else {
      apiClient.delete(`/admin/notifications/${id}`).catch(() => {});
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
