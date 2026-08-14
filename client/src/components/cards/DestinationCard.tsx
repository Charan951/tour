import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DestinationCardProps {
  destination: {
    _id?: string;
    name: string;
    slug: string;
    banner: string;
    shortDescription?: string;
    bestTime?: string;
  };
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <Link to={`/destination/${destination.slug}`} className="block group cursor-pointer">
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative h-80 flex flex-col justify-end p-6 border border-white/60"
      >
        <img
          src={destination.banner}
          alt={destination.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-1 text-[#F6C65B] text-xs font-semibold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" /> Featured Location
          </div>
          <h3 className="font-poppins font-bold text-2xl group-hover:text-[#57D0C9] transition-colors">
            {destination.name}
          </h3>
          {destination.shortDescription && (
            <p className="text-slate-300 text-xs mt-1 line-clamp-2 leading-relaxed">
              {destination.shortDescription}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-xs text-slate-300">Best Season: <strong className="text-white">{destination.bestTime || 'Sep - Mar'}</strong></span>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#57D0C9] group-hover:text-slate-900 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
