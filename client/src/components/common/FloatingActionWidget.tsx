import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.887-9.885 9.887m0-18.177C5.787 3.608.288 9.106.286 15.908c-.001 2.174.566 4.298 1.642 6.162L0 28l6.113-1.603a12.27 12.27 0 005.932 1.523h.005c6.801 0 12.301-5.5 12.303-12.302 0-3.287-1.28-6.377-3.605-8.703A12.23 12.23 0 0012.051 3.608z"/>
  </svg>
);

export const FloatingActionWidget: React.FC = () => {
  const location = useLocation();
  const [phone, setPhone] = useState('+919876543210');
  const [whatsapp, setWhatsapp] = useState('919876543210');

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data.data) {
        const s = res.data.data;
        if (s.phones?.primary) {
          setPhone(s.phones.primary.replace(/\s+/g, ''));
        }
        if (s.phones?.whatsapp) {
          setWhatsapp(s.phones.whatsapp.replace(/\D/g, ''));
        } else if (s.phones?.primary) {
          setWhatsapp(s.phones.primary.replace(/\D/g, ''));
        }
      }
    } catch (err) {
      console.error('Failed to load contact settings for floating widget', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Hide floating action buttons on package detail page
  if (location.pathname.includes('/package/')) {
    return null;
  }

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-3 font-['Plus_Jakarta_Sans']">
      
      {/* TOP BUTTON: Animated Call Us Ringing Button */}
      <a
        href={`tel:${phone}`}
        className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-r from-blue-600 to-[#0A6FB5] text-white shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-white/80 cursor-pointer"
        title="Call HolidayCity Expert"
      >
        <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
        <Phone className="w-6 h-6 relative z-10 animate-phone-ring" />
        
        {/* Hover Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          📞 Call Us
        </span>
      </a>

      {/* BOTTOM BUTTON: Official Animated WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-white/80 cursor-pointer animate-glow-vivid"
        title="Chat on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-pulse" />
        <WhatsAppIcon className="w-7 h-7 relative z-10 fill-white animate-whatsapp-pulse" />

        {/* Hover Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          💬 Chat on WhatsApp
        </span>
      </a>
    </div>
  );
};
