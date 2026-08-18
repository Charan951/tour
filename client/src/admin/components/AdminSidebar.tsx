import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Users, ShoppingBag, Package as PkgIcon, MapPin, FileText, LogOut, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

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
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-2xl flex flex-col justify-between shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="HolidayCity"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Close Sidebar Icon Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-4 space-y-1.5 mt-2">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose} // Auto-close sidebar on item click!
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0A6FB5] to-[#085a94] text-white shadow-md shadow-[#0A6FB5]/20 scale-[1.01]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer Button */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
