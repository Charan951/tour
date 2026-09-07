import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Users, ShoppingBag, CreditCard, MessageSquare, Package, ArrowRight } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';

const DELETED_KEY = 'hc_web_deleted_notifications_v1';

const getDeletedNotificationIds = (): Set<String> => {
  try {
    const saved = localStorage.getItem(DELETED_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set();
  }
};

const saveDeletedNotificationIds = (...ids: (string | undefined)[]) => {
  try {
    const deletedSet = getDeletedNotificationIds();
    ids.forEach((id) => {
      if (id) deletedSet.add(id);
    });
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
};

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/admin/notifications');
      if (res.data?.data) {
        const deletedSet = getDeletedNotificationIds();
        const filtered = res.data.data.filter((n: any) =>
          !deletedSet.has(n._id) && !deletedSet.has(n.id) && (!n.entityId || !deletedSet.has(n.entityId))
        );

        setNotifications(filtered);
        setUnreadCount(filtered.filter((n: any) => !n.isRead).length);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Real-time socket sync
  useRealtimeUpdates({
    onNotificationUpdate: () => fetchNotifications(),
    onEnquiryUpdate: () => fetchNotifications(),
    onBookingUpdate: () => fetchNotifications(),
    onPackageUpdate: () => fetchNotifications()
  });

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('hc_data_updated', handleUpdate);
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      window.removeEventListener('hc_data_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await apiClient.patch(`/admin/notifications/${id}/read`);
    } catch (_) {}
  };

  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const notifToDelete = notifications.find(n => n._id === id || n.id === id);
      const entityId = notifToDelete?.entityId || notifToDelete?.referenceId;

      // Persist in deleted set locally immediately
      saveDeletedNotificationIds(id, entityId);

      // Instant UI update
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id && (!entityId || (n.entityId !== entityId && n.referenceId !== entityId))));
      setUnreadCount(prev => {
        const remaining = notifications.filter(n => n._id !== id && n.id !== id && (!entityId || (n.entityId !== entityId && n.referenceId !== entityId)));
        return remaining.filter(n => !n.isRead).length;
      });

      // Execute backend DB deletion
      await apiClient.delete(`/admin/notifications/${id}`);
      if (entityId) {
        await apiClient.delete(`/admin/notifications/${entityId}`).catch(() => {});
      }

      toast.success('Notification deleted', { id: 'notif-action-toast', duration: 1000 });
    } catch (_) {
      toast.error('Failed to delete notification', { id: 'notif-action-toast', duration: 1500 });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await apiClient.patch('/admin/notifications/read-all');
      toast.success('All notifications marked as read', { id: 'notif-action-toast', duration: 1200 });
    } catch (_) {
      toast.error('Failed to mark notifications as read', { id: 'notif-action-toast', duration: 1500 });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      notifications.forEach(n => saveDeletedNotificationIds(n._id, n.id, n.entityId, n.referenceId));
      setNotifications([]);
      setUnreadCount(0);

      await apiClient.delete('/admin/notifications/clear-all');
      toast.success('Notifications cleared', { id: 'notif-action-toast', duration: 1200 });
    } catch (_) {
      toast.error('Failed to clear notifications', { id: 'notif-action-toast', duration: 1500 });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'enquiry':
        return <Users className="w-4 h-4 text-ocean-600" />;
      case 'booking':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      case 'package':
      case 'destination':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'enquiry':
        return 'bg-ocean-50 border-ocean-100';
      case 'booking':
        return 'bg-emerald-50 border-emerald-100';
      case 'payment':
        return 'bg-amber-50 border-amber-100';
      case 'chat':
        return 'bg-sky-50 border-sky-100';
      case 'package':
      case 'destination':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-2xs active:scale-95"
        title="Real-Time Admin Notifications"
      >
        <Bell className="w-5 h-5 text-slate-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-600 text-white font-black text-[10px] shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-xs text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Panel Header */}
          <div className="bg-slate-50/90 border-b border-slate-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-['Outfit'] font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700 font-extrabold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-[11px] font-semibold cursor-pointer transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px]">Real-time customer enquiries and bookings will appear here instantly.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const itemKey = n._id || n.id;
                return (
                  <div
                    key={itemKey}
                    onClick={(e) => handleMarkAsRead(itemKey, e)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                      !n.isRead ? 'bg-ocean-50/40 hover:bg-ocean-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getNotificationBg(n.type)}`}>
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold text-xs ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatTime(n.createdAt || n.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {/* Direct Action Buttons: Mark as Read & Delete */}
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {!n.isRead ? (
                        <button
                          onClick={(e) => handleMarkAsRead(itemKey, e)}
                          className="p-1 rounded-lg hover:bg-emerald-100 text-ocean-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0 my-1" />
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(itemKey, e)}
                        className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="bg-slate-50/90 border-t border-slate-100 p-2.5 text-center">
            <button
              onClick={() => { setIsOpen(false); navigate('/admin/leads'); }}
              className="text-xs font-bold text-ocean-600 hover:text-ocean-700 inline-flex items-center gap-1 cursor-pointer"
            >
              Go to Lead CRM <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
