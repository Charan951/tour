import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  CreditCard,
  Sparkles,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react';
import { useNotifications, WebNotification } from '../../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'booking' | 'enquiry' | 'payment'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'booking') return n.type === 'booking';
    if (activeFilter === 'enquiry') return n.type === 'enquiry';
    if (activeFilter === 'payment') return n.type === 'payment';
    return true;
  });

  const handleNotificationClick = (item: WebNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.type === 'booking' || item.type === 'payment') {
      navigate('/my-bookings');
    } else if (item.type === 'enquiry') {
      navigate('/my-enquiries');
    } else {
      navigate('/my-bookings');
    }
  };

  const getTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-ocean-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'enquiry':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const s = status.toLowerCase();
    if (s.includes('confirm') || s.includes('paid') || s.includes('completed') || s.includes('resolved')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (s.includes('progress') || s.includes('process') || s.includes('partial')) {
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    }
    if (s.includes('cancel') || s.includes('reject') || s.includes('failed')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-slate-700 hover:text-ocean-600 hover:bg-ocean-50/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 active:scale-95 cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-ocean-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'booking', label: 'Bookings' },
                { id: 'enquiry', label: 'Enquiries' },
                { id: 'payment', label: 'Payments' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-ocean-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-ocean-50 text-ocean-500 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No notifications</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  You're all caught up! Updates regarding your bookings and enquiries will show here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer relative group ${
                    item.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-ocean-50/40 hover:bg-ocean-50/70'
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {getTimeAgo(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    {item.status && (
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator / Chevron */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-1">
                    {!item.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-ocean-600 shadow-xs"></span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/my-bookings');
              }}
              className="text-xs font-black text-ocean-600 hover:text-ocean-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Bookings & Enquiries</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
