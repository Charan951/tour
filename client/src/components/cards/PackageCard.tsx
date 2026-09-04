import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="glass-card-solid rounded-3xl overflow-hidden premium-card-shadow transition-all duration-300 flex flex-col group relative"
    >
      {/* Cover Image Container (Clickable to View Details) */}
      <Link to={`/package/${pkg.slug}`} className="relative h-60 overflow-hidden block">
        <img
          src={formatImageUrl(pkg.coverImage, undefined, 768)}
          srcSet={formatSrcSet(pkg.coverImage, [480, 768, 1024])}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

        {/* Duration Badge */}
        <div className="absolute top-3.5 left-3.5 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-xs font-black flex items-center gap-1 border border-white/20 shadow-md">
            <Clock className="w-3.5 h-3.5 text-aqua-500" /> {pkg.duration.nights}N / {pkg.duration.days}D
          </span>
        </div>

        {/* Discount Badge */}
        {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
          <div className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            Save ₹{(pkg.discountPrice - pkg.startingPrice).toLocaleString()}
          </div>
        )}

        {/* Destination & Rating Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-gold-500" />
            <span className="truncate max-w-[140px]">{destName}</span>
          </div>
          {typeof pkg.rating === 'number' && pkg.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md text-white px-2.5 py-1 rounded-full font-black border border-white/20">
              <Star className="w-3.5 h-3.5 fill-current text-gold-500" />
              <span>{pkg.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[0.6875rem] font-black tracking-widest uppercase text-ocean-600 bg-ocean-600/10 px-2.5 py-0.5 rounded-md border border-ocean-600/20">
              {pkg.packageCode}
            </span>
            {pkg.trending && (
              <span className="text-[0.6875rem] font-black uppercase tracking-wider text-ocean-600 bg-ocean-100 px-2 py-0.5 rounded-md">
                Trending
              </span>
            )}
          </div>

          <Link to={`/package/${pkg.slug}`}>
            <h3 className="font-display font-black text-lg text-ink group-hover:text-ocean-600 transition-colors line-clamp-2 leading-snug">
              {pkg.title}
            </h3>
          </Link>

          {/* Key Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-xs text-slate-body">
              {pkg.highlights.slice(0, 2).map((h, i) => (
                <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Pricing & Dual Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wider text-slate-muted font-black">Starting from</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-ocean-800 tracking-tight">
                ₹{pkg.startingPrice.toLocaleString()}
              </span>
              {pkg.discountPrice && (
                <span className="text-xs text-slate-muted line-through font-bold">
                  ₹{pkg.discountPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/package/${pkg.slug}`}
              className="px-3.5 py-2.5 rounded-2xl bg-fill hover:bg-line text-ink text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap border border-line flex-1 sm:flex-none"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (onBookNow) {
                  onBookNow(pkg);
                } else if (onEnquire) {
                  onEnquire(pkg, 'booking');
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-ocean-800 via-ocean-600 to-cyan-600 hover:from-ocean-900 hover:to-cyan-600 text-white text-xs font-black uppercase tracking-wider shadow-card hover:shadow-raised transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 overflow-hidden whitespace-nowrap shimmer-sheen flex-1 sm:flex-none"
            >
              <Sparkles className="w-4 h-4 text-gold-500 fill-current shrink-0" />
              <span>Book now</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
