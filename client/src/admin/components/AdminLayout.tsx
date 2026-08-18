import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const isAdminUser = (): boolean => {
  try {
    const raw = localStorage.getItem('hc_user');
    if (!raw) return false;
    const u = JSON.parse(raw);
    const normEmail = (u.email || '').trim().toLowerCase();
    return normEmail === 'admin@holidaycity.com' || normEmail.startsWith('admin@');
  } catch {
    return false;
  }
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, action }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authorized = isAdminUser();

  useEffect(() => {
    if (!authorized) {
      navigate('/my-bookings', { replace: true });
    }
  }, [authorized, navigate]);

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-800 relative overflow-x-hidden">
      {/* Dimmed backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* White Slide-Over Vertical Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Header Bar with Hamburger Button */}
        <header className="bg-white border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Hamburger Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-2 font-bold text-sm shrink-0"
              title="Toggle Menu Sidebar"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            <div className="min-w-0">
              <h1 className="font-poppins font-bold text-xl sm:text-3xl text-slate-900 tracking-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          {action && <div className="flex items-center gap-2 sm:gap-3 shrink-0">{action}</div>}
        </header>

        {/* Inner Content Wrapper */}
        <div className="p-4 sm:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
