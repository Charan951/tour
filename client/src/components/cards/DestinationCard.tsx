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
        {/* Subtle Bottom Text Shadow - Keeps 80% of image 100% bright & clear */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="relative z-10 text-white">
          <h3 className="font-poppins font-black text-base sm:text-lg text-white group-hover:text-[#57D0C9] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-snug">
            {destination.name}
          </h3>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-xs text-slate-200 font-bold">Best Season: <strong className="text-white font-extrabold">{destination.bestTime || 'Sep - Mar'}</strong></span>
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#57D0C9] group-hover:text-slate-900 transition-colors shadow-md">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
