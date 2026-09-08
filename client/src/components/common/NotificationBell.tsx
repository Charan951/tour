import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  CreditCard,
  Sparkles,
  Inbox,
  X,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useNotifications, WebNotification } from '../../context/NotificationContext';

interface NotificationBellProps {
  forceMobile?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ forceMobile }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Screen size detection for responsive mobile vs desktop overlay
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showMobileOverlay = forceMobile || isMobileScreen;

  // Lock body scroll when mobile full-screen notification page is open
  useEffect(() => {
    if (isOpen && showMobileOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, showMobileOverlay]);

  // Close dropdown on click outside or escape key (for desktop panel mode)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showMobileOverlay && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  }, [isOpen, showMobileOverlay]);

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
        <Bell className="w-5 h-5 text-slate-800" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── MOBILE FULL-SCREEN NOTIFICATION PAGE ── */}
      {isOpen && showMobileOverlay && (
        <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col w-full h-full min-h-screen animate-in fade-in slide-in-from-bottom duration-200">
          {/* Mobile Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/80 active:scale-95"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <div>
                <h1 className="font-['Outfit'] font-extrabold text-lg text-slate-900 leading-tight">Notifications</h1>
                {unreadCount > 0 ? (
                  <span className="text-xs text-ocean-600 font-bold">{unreadCount} Unread Notifications</span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">All caught up</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-sky-200/60 active:scale-95 transition-all"
                  title="Mark all unread as read"
                >
                  <CheckCheck className="w-4 h-4 text-sky-600" />
                  <span>Mark All Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-rose-200/60 active:scale-95 transition-all"
                  title="Delete all notifications"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete All</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Notification List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
            {notifications.length === 0 ? (
              <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-sky-50 text-ocean-600 flex items-center justify-center mb-4 border border-sky-100 shadow-sm">
                  <Inbox className="w-8 h-8 text-ocean-600" />
                </div>
                <h3 className="font-['Outfit'] font-black text-lg text-slate-900">No Notifications</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-medium">
                  Your notification list is empty.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all relative group flex gap-3.5 items-start ${
                    item.isRead
                      ? 'bg-white border-slate-200/80 shadow-2xs'
                      : 'bg-sky-50/70 border-sky-300/80 shadow-xs'
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.title}</h4>
                      <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">{getTimeAgo(item.timestamp)}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {item.message}
                    </p>

                    {item.status && (
                      <div className="mt-2.5 flex items-center gap-2 pt-1 border-t border-slate-100/80">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-md ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Mark as Read & Delete */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 ml-1">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 transition-all cursor-pointer border border-sky-200 active:scale-90"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer border border-rose-200/60 active:scale-90"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── DESKTOP FLOATING DROPDOWN PANEL ── */}
      {isOpen && !showMobileOverlay && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/10"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-400/20"
                  title="Delete all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List Content */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-ocean-50 text-ocean-500 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No notifications</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Your notification list is empty.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex gap-3 items-start transition-colors relative group ${
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

                    <p className="text-xs text-slate-600 leading-snug">
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

                  {/* Action Buttons: Mark as Read & Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors border border-sky-200/80"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNotification(item.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200/60"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
