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
    <footer className="relative bg-[#063B6D] text-white pt-16 pb-24 lg:pb-12 overflow-hidden border-t border-white/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#57D0C9]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0A6FB5]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        


        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block bg-white p-3 rounded-2xl shadow-xl border border-white/20 hover:scale-105 transition-all">
              <img
                src="/logo.png"
                alt="HolidayCity Pvt. Ltd. - YOUR RELIABLE TRAVEL PARTNER"
                className="w-[200px] sm:w-[240px] h-auto object-contain"
                style={{ aspectRatio: '881 / 147' }}
              />
            </Link>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm font-medium">
              HolidayCity is India's premier luxury travel agency and holiday package curation platform. Experience unforgettable journeys crafted by certified destination experts.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all border border-white/10 shadow-md"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white transition-all border border-white/10 shadow-md"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all border border-white/10 shadow-md"><Youtube className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all border border-white/10 shadow-md"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-3">
            <h4 className="font-poppins font-extrabold text-base text-[#F6C65B]">Popular Destinations</h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li><Link to="/destinations?search=Kerala" className="hover:text-[#57D0C9] transition-colors">Kerala Backwaters</Link></li>
              <li><Link to="/destinations?search=Rajasthan" className="hover:text-[#57D0C9] transition-colors">Rajasthan Heritage</Link></li>
              <li><Link to="/destinations?search=Kashmir" className="hover:text-[#57D0C9] transition-colors">Kashmir Paradise</Link></li>
              <li><Link to="/destinations?search=Dubai" className="hover:text-[#57D0C9] transition-colors">Dubai City Escapes</Link></li>
              <li><Link to="/destinations?search=Bali" className="hover:text-[#57D0C9] transition-colors">Bali Resort Island</Link></li>
              <li><Link to="/destinations" className="hover:text-[#57D0C9] font-extrabold text-[#57D0C9] transition-colors">Explore All Destinations →</Link></li>
            </ul>
          </div>

          {/* Tour Categories */}
          <div className="space-y-3">
            <h4 className="font-poppins font-extrabold text-base text-[#F6C65B]">Tour Packages</h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li><Link to="/packages?theme=Honeymoon+Tour" className="hover:text-[#57D0C9] transition-colors">Honeymoon Specials</Link></li>
              <li><Link to="/packages?theme=Family+Tour" className="hover:text-[#57D0C9] transition-colors">Family Vacation Packages</Link></li>
              <li><Link to="/packages?theme=Hill+Station" className="hover:text-[#57D0C9] transition-colors">Hill Station Retreats</Link></li>
              <li><Link to="/packages?theme=Adventure" className="hover:text-[#57D0C9] transition-colors">Adventure & Trekking</Link></li>
              <li><Link to="/packages?theme=Religious" className="hover:text-[#57D0C9] transition-colors">Char Dham & Religious</Link></li>
              <li><Link to="/packages" className="hover:text-[#57D0C9] font-extrabold text-[#57D0C9] transition-colors">All Tour Packages →</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-poppins font-extrabold text-base text-[#F6C65B]">Get In Touch</h4>
            <ul className="space-y-3 text-xs text-slate-300 font-medium">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#57D0C9] shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#57D0C9] shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#57D0C9] shrink-0" />
                <span>{email}</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-white/10 my-8" />

        {/* Bottom Legal & Copyright Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p className="flex items-center gap-1">
            © 2026 HolidayCity Pvt. Ltd. All rights reserved. Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for travelers worldwide.
          </p>
          <div className="flex items-center gap-6 font-bold">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
            <Link to="/admin/login" className="text-[#F6C65B] hover:underline">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
