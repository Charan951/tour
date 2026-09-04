import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Palette, ShoppingBag, User, Phone, MessageCircle, Mail } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

// All user-dashboard routes count as "Profile" being active
const USER_ROUTES = ['/dashboard', '/profile', '/my-bookings', '/my-enquiries', '/login'];

export const MobileStickyBar: React.FC = () => {
  const location = useLocation();
  const [contact, setContact] = useState<{ phone?: string; whatsapp?: string }>({});

  useEffect(() => {
    apiClient
      .get('/settings')
      .then((res) => {
        const p = res.data?.data?.phones;
        if (p) setContact({ phone: p.primary, whatsapp: p.whatsapp || p.primary });
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: 'Home',         path: '/',             icon: Home },
    { label: 'Destinations', path: '/destinations', icon: Compass },
    { label: 'Themes',       path: '/themes',       icon: Palette },
    { label: 'Packages',     path: '/packages',     icon: ShoppingBag },
    { label: 'Profile',      path: '/my-bookings',  icon: User },
  ];

  const getIsActive = (item: (typeof navItems)[0]) => {
    if (item.path === '/') return location.pathname === '/';
    if (item.path === '/my-bookings') return USER_ROUTES.some((r) => location.pathname.startsWith(r));
    return location.pathname.startsWith(item.path);
  };

  // Contact actions only belong on the home page.
  const showContactRow = location.pathname === '/';

  const tel = contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : undefined;
  const wa = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        'Hi HolidayCity, I would like to plan a trip.'
      )}`
    : undefined;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-line/80 px-3 pb-2.5 pt-2 shadow-[0_-4px_24px_rgba(6,59,109,0.12)]">
      {/* Persistent "talk to a human" row */}
      {showContactRow && (
      <div className="flex items-stretch gap-2 mb-1.5">
        {tel && (
          <a
            href={tel}
            aria-label="Call HolidayCity"
            className="flex-1 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold text-[0.6875rem] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Phone className="w-3.5 h-3.5 text-ocean-600" /> Call
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            aria-label="Message HolidayCity on WhatsApp"
            className="flex-1 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-[0.6875rem] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <MessageCircle className="w-3.5 h-3.5 text-whatsapp" /> WhatsApp
          </a>
        )}
      </div>
      )}

      {/* Pill-style nav bar */}
      <div className="flex items-center bg-white rounded-3xl2 border border-line h-[58px] overflow-hidden shadow-[0_-2px_16px_rgba(6,59,109,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getIsActive(item);

          return (
            <Link
              key={item.label}
              to={item.path}
              style={{ flex: isActive ? '0 0 34%' : '1 1 0%' }}
              className={`flex items-center justify-center gap-1.5 h-[46px] my-[6px] mx-1 rounded-2xl2 transition-all duration-200 active:opacity-80 ${
                isActive ? 'bg-ocean-600 shadow-[0_4px_10px_rgba(10,111,181,0.22)]' : 'bg-transparent'
              }`}
            >
              <Icon
                className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                style={{ width: isActive ? 20 : 22, height: isActive ? 20 : 22 }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {isActive && (
                <span className="text-white font-black whitespace-nowrap overflow-hidden text-ellipsis text-[0.6875rem]">
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
