import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin, Send, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export const Footer: React.FC = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<any>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Check if current user is logged in
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('hc_user') || 'null'); } catch { return null; }
  })();

  // Hide footer on login / unauthenticated account pages
  const isAuthPath = ['/my-bookings', '/profile', '/dashboard', '/my-enquiries', '/login'].some(path => location.pathname.startsWith(path));

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch footer settings', err);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const phone = settings?.phones?.primary || '+91 63058 04155';
  const email = settings?.emails?.primary || 'info@holidaycity.com';
  const address = settings?.address || 'HolidayCity Towers, MG Road, India';

  // Do not render footer on unauthenticated login screen
  if (isAuthPath && !currentUser) {
    return null;
  }

  return (
    <footer className="relative bg-ocean-800 text-white pt-8 pb-20 lg:pb-6 overflow-hidden border-t border-white/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-aqua-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ocean-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 mb-6">
          
          {/* Brand & Socials */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="inline-block bg-white p-2.5 rounded-xl shadow-lg border border-white/20 hover:scale-105 transition-all">
              <img
                src="/logo.png"
                alt="HolidayCity Pvt. Ltd. - YOUR RELIABLE TRAVEL PARTNER"
                className="w-[200px] sm:w-[230px] md:w-[250px] h-auto object-contain"
              />
            </Link>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm font-medium">
              HolidayCity plans custom domestic and international holidays. Every trip is handled
              end to end by a personal travel consultant — you browse and enquire here, and a real
              person takes it from there.
            </p>

            {(() => {
              const social: Array<[string, string, React.ComponentType<{ className?: string }>]> = [
                ['Facebook', settings?.socialLinks?.facebook, Facebook],
                ['Instagram', settings?.socialLinks?.instagram, Instagram],
                ['YouTube', settings?.socialLinks?.youtube, Youtube],
                ['LinkedIn', settings?.socialLinks?.linkedin, Linkedin],
              ].filter(([, url]) => !!url) as any;
              if (social.length === 0) return null;
              return (
                <div className="flex items-center gap-2.5 pt-1">
                  {social.map(([name, url, Icon]: any) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`HolidayCity on ${name}`}
                      className="w-11 h-11 rounded-xl2 bg-white/10 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all border border-white/10"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Popular Destinations */}
          <div className="space-y-2.5">
            <h4 className="font-poppins font-extrabold text-sm text-gold-500">Popular Destinations</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
              <li><Link to="/destinations?search=Kerala" className="hover:text-aqua-500 transition-colors">Kerala Backwaters</Link></li>
              <li><Link to="/destinations?search=Rajasthan" className="hover:text-aqua-500 transition-colors">Rajasthan Heritage</Link></li>
              <li><Link to="/destinations?search=Kashmir" className="hover:text-aqua-500 transition-colors">Kashmir Paradise</Link></li>
              <li><Link to="/destinations?search=Dubai" className="hover:text-aqua-500 transition-colors">Dubai City Escapes</Link></li>
              <li><Link to="/destinations?search=Bali" className="hover:text-aqua-500 transition-colors">Bali Resort Island</Link></li>
              <li><Link to="/destinations" className="hover:text-aqua-500 font-extrabold text-aqua-500 transition-colors">Explore All →</Link></li>
            </ul>
          </div>

          {/* Tour Categories */}
          <div className="space-y-2.5">
            <h4 className="font-poppins font-extrabold text-sm text-gold-500">Tour Packages</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
              <li><Link to="/packages?theme=Honeymoon+Tour" className="hover:text-aqua-500 transition-colors">Honeymoon Specials</Link></li>
              <li><Link to="/packages?theme=Family+Tour" className="hover:text-aqua-500 transition-colors">Family Vacation Packages</Link></li>
              <li><Link to="/packages?theme=Hill+Station" className="hover:text-aqua-500 transition-colors">Hill Station Retreats</Link></li>
              <li><Link to="/packages?theme=Adventure" className="hover:text-aqua-500 transition-colors">Adventure & Trekking</Link></li>
              <li><Link to="/packages?theme=Religious" className="hover:text-aqua-500 transition-colors">Char Dham & Religious</Link></li>
              <li><Link to="/packages" className="hover:text-aqua-500 font-extrabold text-aqua-500 transition-colors">All Packages →</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            <h4 className="font-poppins font-extrabold text-sm text-gold-500">Get In Touch</h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-aqua-500 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-aqua-500 shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-aqua-500 shrink-0" />
                <span>{email}</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-white/10 my-4" />

        {/* Bottom Legal & Copyright Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between text-[0.6875rem] text-slate-500 gap-2">
          <p className="flex items-center gap-1">
            © 2026 HolidayCity Pvt. Ltd. All rights reserved. Crafted with <Heart className="w-3 h-3 text-rose-500 fill-current" /> for travelers worldwide.
          </p>
          <div className="flex items-center gap-5 font-bold">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
            <Link to="/admin/login" className="text-gold-500 hover:underline">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
