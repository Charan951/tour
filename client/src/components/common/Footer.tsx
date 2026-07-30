import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin, Send } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);

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

  const phone = settings?.phones?.primary || '+91 98765 43210';
  const email = settings?.emails?.primary || 'info@holidaycity.com';
  const address = settings?.address || 'Kochi & Bangalore, India';

  return (
    <footer className="relative bg-[#063B6D] text-white pt-16 pb-24 lg:pb-12 overflow-hidden">
      {/* Animated Wave SVG Top Divider */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none z-10 transform -translate-y-full">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 text-[#063B6D] fill-current">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block bg-white p-3.5 rounded-2xl shadow-lg border border-white/20">
              <img
                src="/logo.png"
                alt="HolidayCity Pvt. Ltd. - YOUR RELIABLE TRAVEL PARTNER"
                className="w-[200px] sm:w-[240px] h-auto object-contain"
                style={{ aspectRatio: '881 / 147' }}
              />
            </Link>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              HolidayCity is India's leading travel and holiday package curation platform. Discover curated domestic and international destinations with personalized expert consulting.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#57D0C9] transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#57D0C9] transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#57D0C9] transition-colors"><Youtube className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#57D0C9] transition-colors"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-['Outfit'] font-bold text-lg text-[#F6C65B]">Popular Destinations</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/destinations" className="hover:text-[#57D0C9] transition-colors">Kerala Backwaters</Link></li>
              <li><Link to="/destinations" className="hover:text-[#57D0C9] transition-colors">Bali Islands</Link></li>
              <li><Link to="/destinations" className="hover:text-[#57D0C9] transition-colors">Kashmir Valley</Link></li>
              <li><Link to="/destinations" className="hover:text-[#57D0C9] transition-colors">Dubai Oasis</Link></li>
              <li><Link to="/destinations" className="hover:text-[#57D0C9] transition-colors">Explore All</Link></li>
            </ul>
          </div>

          {/* Packages */}
          <div className="space-y-3">
            <h4 className="font-['Outfit'] font-bold text-lg text-[#F6C65B]">Tour Packages</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/packages" className="hover:text-[#57D0C9] transition-colors">Honeymoon Specials</Link></li>
              <li><Link to="/packages" className="hover:text-[#57D0C9] transition-colors">Family Vacation Trips</Link></li>
              <li><Link to="/packages" className="hover:text-[#57D0C9] transition-colors">Luxury Resorts</Link></li>
              <li><Link to="/packages" className="hover:text-[#57D0C9] transition-colors">Weekend Getaways</Link></li>
              <li><Link to="/packages" className="hover:text-[#57D0C9] transition-colors">Group Departures</Link></li>
            </ul>
          </div>

          {/* DYNAMIC Contact Details */}
          <div className="space-y-3">
            <h4 className="font-['Outfit'] font-bold text-lg text-[#F6C65B]">Contact Us</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#57D0C9] shrink-0" /> {address}</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#57D0C9] shrink-0" /> {phone}</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#57D0C9] shrink-0" /> {email}</li>
            </ul>
          </div>
        </div>

        <hr className="border-white/10 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 HolidayCity. All rights reserved. Explore. Experience. Enjoy.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-white">About Us</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/admin/login" className="text-[#F6C65B] hover:underline font-bold">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
