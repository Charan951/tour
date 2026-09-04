import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.name || val.isoCode || '';
  return String(val);
};

/* ─────────────────────────────────────────
   Mobile Destinations Page — matches Flutter _buildDestinationsGridTab()
   - AppBar: "All Destinations"
   - 2-column grid (crossAxisCount: 2, childAspectRatio: 0.85)
   - Each card: full image, dark gradient, name + country overlay (bottom-left)
───────────────────────────────────────── */
import { FALLBACK_DESTINATIONS } from '../../utils/mobileDataFallback';

import { formatImageUrl } from '../../utils/imageUrl';

export const MobileDestinationsPage: React.FC = () => {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/destinations');
        const apiData = res.data.data || [];
        
        // Merge API destinations with FALLBACK_DESTINATIONS avoiding duplicates
        const map = new Map<string, any>();
        apiData.forEach((d: any) => map.set(d.slug || d._id || d.id, d));
        FALLBACK_DESTINATIONS.forEach(d => {
          if (!map.has(d.slug)) map.set(d.slug, d);
        });

        setDestinations(Array.from(map.values()));
      } catch (e) {
        console.error(e);
        setDestinations(FALLBACK_DESTINATIONS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <>
      {/* AppBar */}
      <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center gap-2.5">
        <Link
          to="/"
          aria-label="Back to home"
          className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-white active:bg-white/15 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-black text-lg text-white">All Destinations</h1>
      </div>

      <div className="overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading destinations...</div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No destinations available.</div>
        ) : (
          /* 2-column grid matching Flutter SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.85) */
          <div
            className="grid grid-cols-2 gap-4 p-4"
            style={{ paddingBottom: 100 }}
          >
            {destinations.map((dest: any, i: number) => {
              const rawImg = dest.image || dest.imageUrl || dest.banner;
              const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600');
              const countryName = safeStr(dest.country);

              return (
                <Link
                  key={dest._id || i}
                  to={`/destination/${dest.slug}`}
                  className="relative rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                  style={{ aspectRatio: '1 / 1.18' }} /* childAspectRatio: 0.85 = height/width = 1/0.85 ≈ 1.18 */
                >
                  <img src={imgUrl} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  {/* Name + Country — bottom left */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-base leading-tight line-clamp-2">
                      {dest.name}
                    </p>
                    {countryName && (
                      <p className="text-white/80 text-xs mt-0.5">{countryName}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
