import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Sparkles, CheckCircle2, Info, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatImageUrl, formatSrcSet } from '../../utils/imageUrl';

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
    reviewCount?: number;
    trending?: boolean;
    featured?: boolean;
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
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative text-left"
    >
      {/* Cover Image Container (Clickable to View Details) */}
      <div className="relative h-60 overflow-hidden block">
        <Link to={`/package/${pkg.slug}`} className="block w-full h-full">
          <img
            src={formatImageUrl(pkg.coverImage, undefined, 768)}
            srcSet={formatSrcSet(pkg.coverImage, [480, 768, 1024])}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        </Link>

        {/* Top Badges (Duration & Discount) */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 border border-white/20 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> {pkg.duration.nights}N / {pkg.duration.days}D
          </span>
          {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-xs border border-white/20">
              Save ₹{(pkg.discountPrice - pkg.startingPrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Details Icon Button (Top Right) */}
        <Link
          to={`/package/${pkg.slug}`}
          title="View Full Package Details"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-95 border border-white/50 group-hover:scale-105 z-10"
        >
          <Info className="w-4 h-4 text-ocean-600" />
        </Link>

        {/* Destination & Rating Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-bold pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[140px]">{destName}</span>
          </div>
          {typeof pkg.rating === 'number' && pkg.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full font-black border border-white/20">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>{pkg.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[0.65rem] font-extrabold tracking-widest uppercase text-ocean-700 bg-ocean-50 px-2.5 py-0.5 rounded-md border border-ocean-200/80">
              {pkg.packageCode}
            </span>
            {pkg.trending && (
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Trending
              </span>
            )}
          </div>

          <Link to={`/package/${pkg.slug}`}>
            <h3 className="font-poppins font-bold text-base sm:text-lg text-slate-900 group-hover:text-ocean-600 transition-colors line-clamp-2 leading-snug">
              {pkg.title}
            </h3>
          </Link>

          {/* Key Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {pkg.highlights.slice(0, 2).map((h, i) => (
                <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-600">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Pricing & Enquire / Book Now Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 font-bold">Starting from</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                ₹{pkg.startingPrice.toLocaleString()}
              </span>
              {pkg.discountPrice && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  ₹{pkg.discountPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Enquire & Book Now Dual Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onEnquire?.(pkg, 'enquiry')}
              className="px-3.5 py-2 rounded-xl bg-ocean-50 hover:bg-ocean-100 border border-ocean-200/80 text-ocean-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 flex-1 sm:flex-none"
            >
              <Send className="w-3.5 h-3.5 text-ocean-600" />
              <span>Enquire</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onBookNow) onBookNow(pkg);
                else if (onEnquire) onEnquire(pkg, 'booking');
              }}
              className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 flex-1 sm:flex-none border-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
              <span>Book Now</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
