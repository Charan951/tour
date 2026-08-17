import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Palette, ShoppingBag, User } from 'lucide-react';

// All user-dashboard routes count as "Profile" being active
const USER_ROUTES = ['/dashboard', '/profile', '/my-bookings', '/my-enquiries'];

export const MobileStickyBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home',         path: '/',            icon: Home },
    { label: 'Destinations', path: '/destinations', icon: Compass },
    { label: 'Themes',       path: '/themes',       icon: Palette },
    { label: 'Packages',     path: '/packages',     icon: ShoppingBag },
    { label: 'Profile',      path: '/my-bookings',  icon: User },
  ];

  const getIsActive = (item: (typeof navItems)[0]) => {
    if (item.path === '/') return location.pathname === '/';
    if (item.path === '/my-bookings') return USER_ROUTES.some(r => location.pathname.startsWith(r));
    return location.pathname.startsWith(item.path);
  };

  const activeIndex = navItems.findIndex(getIsActive);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 shadow-[0_-2px_20px_rgba(0,0,0,0.08)] px-3 pb-3 pt-2.5">
      {/* Pill-style nav bar — matches Flutter home_screen.dart bottom nav exactly */}
      <div className="flex items-center bg-white rounded-[28px] border border-slate-200/80 shadow-[0_-2px_16px_rgba(0,0,0,0.05)] h-[58px] overflow-hidden">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = getIsActive(item);

          return (
            <Link
              key={item.label}
              to={item.path}
              style={{ flex: isActive ? '0 0 34%' : '1 1 0%' }}
              className={`flex items-center justify-center gap-1.5 h-[46px] my-[6px] mx-1 rounded-[20px] transition-all duration-200 active:opacity-80 ${
                isActive
                  ? 'bg-[#0A6FB5] shadow-[0_4px_10px_rgba(10,111,181,0.22)]'
                  : 'bg-transparent'
              }`}
            >
              <Icon
                className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                style={{ width: isActive ? 20 : 22, height: isActive ? 20 : 22 }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {isActive && (
                <span
                  className="text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontSize: '8.5px', fontWeight: 700 }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
