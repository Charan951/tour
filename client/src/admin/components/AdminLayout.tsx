import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const isAdminUser = (): boolean => {
  try {
    const email = (
      localStorage.getItem('hc_user_email') ||
      (() => {
        const raw = localStorage.getItem('hc_user');
        if (!raw) return '';
        const u = JSON.parse(raw);
        return u.email || u.user?.email || '';
      })()
    ).trim().toLowerCase();

    const role = (() => {
      try {
        const raw = localStorage.getItem('hc_user');
        if (!raw) return '';
        const u = JSON.parse(raw);
        return (u.role || u.user?.role || '').toString().trim().toLowerCase();
      } catch { return ''; }
    })();

    return email === 'admin@holidaycity.com' || role === 'admin' || role === 'superadmin' || email.startsWith('admin@');
  } catch {
    return false;
  }
};

export interface AdminSidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const toggleAdminSidebar = () => {
  window.dispatchEvent(new Event('hc_toggle_sidebar'));
};

export const openAdminSidebar = () => {
  window.dispatchEvent(new Event('hc_open_sidebar'));
};

export const closeAdminSidebar = () => {
  window.dispatchEvent(new Event('hc_close_sidebar'));
};

export const AdminSidebarContext = React.createContext<AdminSidebarContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: toggleAdminSidebar
});

export const useAdminSidebar = (): AdminSidebarContextType => {
  const ctx = React.useContext(AdminSidebarContext);
  if (!ctx) {
    return {
      sidebarOpen: false,
      setSidebarOpen: () => {},
      toggleSidebar: () => {}
    };
  }
  return {
    sidebarOpen: ctx.sidebarOpen,
    setSidebarOpen: ctx.setSidebarOpen || ((open: boolean) => {
      if (open) openAdminSidebar();
      else closeAdminSidebar();
    }),
    toggleSidebar: toggleAdminSidebar
  };
};

import { initWebPushNotifications } from '../../services/firebaseService';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, action }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authorized = isAdminUser();

  // Connect real-time socket for popups & desktop notifications
  useRealtimeUpdates();

  useEffect(() => {
    if (authorized) {
      initWebPushNotifications();
    }
  }, [authorized]);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    const handleOpen = () => setSidebarOpen(true);
    const handleClose = () => setSidebarOpen(false);

    window.addEventListener('hc_toggle_sidebar', handleToggle);
    window.addEventListener('hc_open_sidebar', handleOpen);
    window.addEventListener('hc_close_sidebar', handleClose);

    return () => {
      window.removeEventListener('hc_toggle_sidebar', handleToggle);
      window.removeEventListener('hc_open_sidebar', handleOpen);
      window.removeEventListener('hc_close_sidebar', handleClose);
    };
  }, []);

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <AdminSidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-800 relative overflow-x-hidden">
        {/* Dimmed backdrop overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[65] transition-opacity"
          />
        )}

        {/* White Slide-Over Vertical Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
          {/* Top Header Bar with Hamburger Button & Notification Bell */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              {/* Hamburger Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/80 shadow-2xs active:scale-95"
                title="Toggle Menu Sidebar"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="font-['Outfit'] font-bold text-base sm:text-xl text-slate-900 tracking-tight line-clamp-1">{title}</h1>
                {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {action}
              <NotificationDropdown />
            </div>
          </header>

          {/* Inner Content Wrapper */}
          <div className="p-4 sm:p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </AdminSidebarContext.Provider>
  );
};
