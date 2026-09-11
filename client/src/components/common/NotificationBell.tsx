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
        return <Calendar className="w-5 h-5 text-[#6C5CE7]" />;
      case 'enquiry':
        return <MessageSquare className="w-5 h-5 text-[#00CEC9]" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-[#00B894]" />;
      default:
        return <Sparkles className="w-5 h-5 text-ocean-600 dark:text-cyan-400" />;
    }
  };

  const getTypeIconBg = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-[#6C5CE7]/12 dark:bg-[#6C5CE7]/20';
      case 'enquiry':
        return 'bg-[#00CEC9]/12 dark:bg-[#00CEC9]/20';
      case 'payment':
        return 'bg-[#00B894]/12 dark:bg-[#00B894]/20';
      default:
        return 'bg-ocean-600/12 dark:bg-cyan-500/20';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    const s = status.toLowerCase();
    if (s.includes('confirm') || s.includes('paid') || s.includes('completed') || s.includes('resolved')) {
      return 'bg-[#E6FFFA] dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40';
    }
    if (s.includes('progress') || s.includes('pending') || s.includes('process') || s.includes('new')) {
      return 'bg-[#FEFCBF] dark:bg-amber-950/60 text-[#B7791F] dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/40';
    }
    if (s.includes('cancel') || s.includes('reject') || s.includes('failed') || s.includes('closed')) {
      return 'bg-[#FED7D7] dark:bg-rose-950/60 text-[#C53030] dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/40';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-slate-700 hover:text-ocean-600 hover:bg-ocean-50/80 dark:text-white dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 active:scale-95 cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-800 dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── MOBILE FULL-SCREEN NOTIFICATION PAGE — Matches Flutter notifications_screen.dart ── */}
      {isOpen && showMobileOverlay && (
        <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col w-full h-full min-h-screen animate-in fade-in slide-in-from-bottom duration-200">
          {/* Mobile Header Bar matching Flutter AppBar */}
          <div className="bg-white dark:bg-[#161F2E] border-b border-slate-200/90 dark:border-slate-800 px-4 h-14 flex items-center justify-between sticky top-0 z-20 shadow-xs">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            </button>

            <h1 className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white text-center flex-1">
              Notifications
            </h1>

            <div className="flex items-center gap-1 min-w-[70px] justify-end">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[#0EA5E9] hover:text-sky-600 font-bold text-sm px-2 py-1 rounded-lg active:scale-95 transition-all cursor-pointer"
                  title="Read All"
                >
                  Read All
                </button>
              ) : notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full active:scale-95 transition-all cursor-pointer"
                  title="Delete All"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Mobile Notification List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
            {notifications.length === 0 ? (
              <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center mb-5">
                  <Inbox className="w-10 h-10 text-[#0EA5E9]" />
                </div>
                <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white">
                  No Notifications Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed font-medium">
                  You will receive real-time updates when an admin updates your booking, enquiry, or payment status.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) markAsRead(item.id);
                  }}
                  className={`p-3.5 rounded-[18px] border transition-all relative group flex gap-3.5 items-start cursor-pointer ${
                    item.isRead
                      ? 'bg-white dark:bg-[#161F2E] border-slate-200 dark:border-[#2A3648] shadow-xs'
                      : 'bg-[#F0F9FF] dark:bg-sky-950/40 border-[#0EA5E9]/35 dark:border-sky-500/40 shadow-sm'
                  }`}
                >
                  {/* Icon Container (44x44, rounded-14px) */}
                  <div className={`w-11 h-11 rounded-[14px] ${getTypeIconBg(item.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`font-['Outfit'] text-[0.9375rem] truncate ${
                        item.isRead ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-extrabold text-slate-900 dark:text-white'
                      }`}>
                        {item.title}
                      </h4>
                      {/* Unread indicator dot (9x9 circular dot) */}
                      {!item.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] shrink-0 ml-1 shadow-xs" />
                      )}
                    </div>

                    <p className={`text-xs leading-[1.35] ${
                      item.isRead ? 'text-slate-500 dark:text-slate-400 font-normal' : 'text-slate-800 dark:text-slate-200 font-medium'
                    }`}>
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {item.status && (
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-extrabold rounded-md ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {getTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Swipe / Delete Button (Light Red Background matching Flutter dismiss background) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-[#7F1D1D]/40 hover:bg-rose-100 dark:hover:bg-[#7F1D1D]/60 text-rose-600 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50 active:scale-90 transition-all shrink-0 ml-1"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                  </button>
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
