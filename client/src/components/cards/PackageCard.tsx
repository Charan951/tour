import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatImageUrl } from '../../utils/imageUrl';

interface PackageCardProps {
  pkg: {
    _id?: string;
    title: string;
    slug: string;
    packageCode: string;
    startingPrice: number;
    discountPrice?: number;
    coverImage: string;
    duration: { nights: number; days: number };
    rating?: number;
    destination?: any;
    highlights?: string[];
  };
  onEnquire?: (pkg: any, initialMode?: 'enquiry' | 'booking') => void;
  onBookNow?: (pkg: any) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEnquire, onBookNow }) => {
  const destName = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination.name : 'Top Destination';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="glass-card rounded-3xl overflow-hidden premium-card-shadow transition-all duration-300 flex flex-col group border border-white/80 relative"
    >
      {/* Cover Image Container (Clickable to View Details) */}
      <Link to={`/package/${pkg.slug}`} className="relative h-60 overflow-hidden block">
        <img
          src={formatImageUrl(pkg.coverImage)}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

        {/* Duration Badge */}
        <div className="absolute top-3.5 left-3.5 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 border border-white/20 shadow-md">
            <Clock className="w-3.5 h-3.5 text-[#57D0C9]" /> {pkg.duration.nights}N / {pkg.duration.days}D
          </span>
        </div>

        {/* Discount Badge */}
        {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
          <div className="absolute top-3.5 right-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg animate-pulse">
            SAVE ₹{(pkg.discountPrice - pkg.startingPrice).toLocaleString()}
          </div>
        )}

        {/* Destination & Rating Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-[#F6C65B]" />
            <span className="truncate max-w-[140px]">{destName}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-full font-black shadow-md">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{pkg.rating || 4.9}</span>
          </div>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#0A6FB5] bg-[#0A6FB5]/10 px-2.5 py-0.5 rounded-md border border-[#0A6FB5]/20">
              {pkg.packageCode}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Instant Confirmation
            </span>
          </div>

          <Link to={`/package/${pkg.slug}`}>
            <h3 className="font-poppins font-extrabold text-lg text-slate-900 group-hover:text-[#0A6FB5] transition-colors line-clamp-2 leading-snug">
              {pkg.title}
            </h3>
          </Link>

          {/* Key Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
              {pkg.highlights.slice(0, 2).map((h, i) => (
                <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Pricing & Dual Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Starting From</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-black text-2xl text-[#063B6D] tracking-tight">
                ₹{pkg.startingPrice.toLocaleString()}
              </span>
              {pkg.discountPrice && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  ₹{pkg.discountPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/package/${pkg.slug}`}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap border border-slate-200/80 shadow-2xs flex-1 sm:flex-none"
              aria-label="View Details"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (onBookNow) {
                  onBookNow(pkg);
                } else if (onEnquire) {
                  onEnquire(pkg, 'booking');
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#063B6D] via-[#0A6FB5] to-[#0891B2] hover:from-[#04284b] hover:to-[#0284c7] text-white text-xs font-black shadow-lg hover:shadow-xl hover:shadow-[#0A6FB5]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 overflow-hidden whitespace-nowrap shimmer-sheen flex-1 sm:flex-none"
            >
              <Sparkles className="w-4 h-4 text-[#F6C65B] fill-current animate-pulse shrink-0" />
              <span className="tracking-wide">Book Now</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
