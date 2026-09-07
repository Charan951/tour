import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Users, ShoppingBag, Package as PkgIcon, MapPin, FileText, LogOut, ChevronRight, X, Image as ImageIcon, MessageSquare, Zap, Tag } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_access_token');
    localStorage.removeItem('hc_user');
    localStorage.removeItem('hc_user_email');
    window.dispatchEvent(new Event('hc_user_updated'));
    onClose();
    navigate('/my-bookings');
  };

  const user = JSON.parse(localStorage.getItem('hc_user') || '{}');

  const navItems = [
    {
      label: 'Executive Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      label: 'Bookings & Orders',
      path: '/admin/bookings',
      icon: ShoppingBag
    },
    {
      label: 'Lead CRM (Enquiries)',
      path: '/admin/leads',
      icon: Users
    },
    {
      label: 'Package Manager',
      path: '/admin/packages',
      icon: PkgIcon
    },
    {
      label: 'Activity Manager',
      path: '/admin/activities',
      icon: Zap
    },
    {
      label: 'Destination Manager',
      path: '/admin/destinations',
      icon: MapPin
    },
    {
      label: 'Promo Banner Manager',
      path: '/admin/banners',
      icon: ImageIcon
    },
    {
      label: 'CMS & Settings',
      path: '/admin/cms',
      icon: FileText
    },
    {
      label: 'Support Messages',
      path: '/admin/messages',
      icon: MessageSquare
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white text-slate-700 border-r border-slate-200 shadow-2xl flex flex-col justify-between shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between min-h-[72px]">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.png"
              alt="HolidayCity"
              className="h-13 sm:h-14 w-auto max-w-[175px] object-contain drop-shadow-xs transition-all"
            />
          </div>

          {/* Close Sidebar Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3.5 space-y-1 mt-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-98 ${
                  isActive
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-700 text-white shadow-md shadow-ocean-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin User Footer & Sign Out */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-ocean-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-ocean-200/50 shadow-2xs">
            {(user.firstName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">{user.firstName || 'Super Admin'}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected Live
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-all active:scale-98 cursor-pointer border border-rose-200/60 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
