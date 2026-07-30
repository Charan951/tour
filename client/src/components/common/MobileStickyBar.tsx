import React from 'react';
import { Phone, MessageSquare, Sparkles } from 'lucide-react';

interface MobileStickyBarProps {
  onEnquireClick?: () => void;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({ onEnquireClick }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-200/80 p-3 shadow-2xl">
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <a
          href="tel:+919876543210"
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-slate-100 text-slate-800 active:scale-95 transition-transform"
        >
          <Phone className="w-4 h-4 text-[#0A6FB5] mb-1" />
          <span>Call Us</span>
        </a>

        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-emerald-50 text-emerald-700 active:scale-95 transition-transform"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
          <span>WhatsApp</span>
        </a>

        <button
          onClick={onEnquireClick}
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white shadow-md active:scale-95 transition-transform"
        >
          <Sparkles className="w-4 h-4 mb-1" />
          <span>Enquire</span>
        </button>
      </div>
    </div>
  );
};
