import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  onEnquire?: (pkg: any) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEnquire }) => {
  const destName = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination.name : 'Top Destination';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group border border-white/60"
    >
      {/* Cover Image Container (Clickable) */}
      <Link to={`/package/${pkg.slug}`} className="relative h-56 overflow-hidden block">
        <img
          src={pkg.coverImage}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#57D0C9]" /> {pkg.duration.nights}N / {pkg.duration.days}D
          </span>
        </div>

        {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md animate-pulse">
            SAVE ₹{(pkg.discountPrice - pkg.startingPrice).toLocaleString()}
          </div>
        )}

        {/* Destination Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90 text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#F6C65B]" /> {destName}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#0A6FB5] bg-[#0A6FB5]/10 px-2.5 py-0.5 rounded-md">
              {pkg.packageCode}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-current" /> {pkg.rating || 4.9}
            </div>
          </div>

          <Link to={`/package/${pkg.slug}`}>
            <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 group-hover:text-[#0A6FB5] transition-colors line-clamp-2 leading-snug">
              {pkg.title}
            </h3>
          </Link>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {pkg.highlights.slice(0, 2).map((h, i) => (
                <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Starting From</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-['Outfit'] font-extrabold text-xl text-[#063B6D]">
                ₹{pkg.startingPrice.toLocaleString()}
              </span>
              {pkg.discountPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{pkg.discountPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/package/${pkg.slug}`}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              Details
            </Link>
            <button
              onClick={() => onEnquire && onEnquire(pkg)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Quote
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
