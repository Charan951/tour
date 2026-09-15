import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { FALLBACK_DESTINATIONS } from '../../utils/mobileDataFallback';
import { formatImageUrl } from '../../utils/imageUrl';
import { SkeletonBox } from '../../components/common/Skeleton';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.name || val.isoCode || val.title || '';
  return String(val);
};

const REGIONS = ['All', 'India', 'International', 'Popular', 'Beach & Islands', 'Mountains & Valleys'];

export const MobileDestinationsPage: React.FC = () => {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/destinations');
        const apiData = res.data.data || [];
        setDestinations(apiData);
      } catch (e) {
        console.error(e);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = destinations.filter(dest => {
    if (!dest) return false;
    const q = (search || '').toLowerCase();
    const nameMatch = safeStr(dest.name).toLowerCase().includes(q);
    const countryMatch = safeStr(dest.country).toLowerCase().includes(q);
    const descMatch = safeStr(dest.description).toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || countryMatch || descMatch;

    if (!matchesSearch) return false;

    if (selectedRegion === 'All') return true;
    const country = safeStr(dest.country).toLowerCase();
    const tags = safeStr(dest.category || dest.tags || '').toLowerCase();

    if (selectedRegion === 'India') {
      return country.includes('india') || !country || country === 'in';
    }
    if (selectedRegion === 'International') {
      return country && !country.includes('india') && country !== 'in';
    }
    if (selectedRegion === 'Popular') {
      return dest.isPopular || dest.popular || dest.featured;
    }
    if (selectedRegion === 'Beach & Islands') {
      return tags.includes('beach') || tags.includes('island') || safeStr(dest.name).toLowerCase().includes('goa') || safeStr(dest.name).toLowerCase().includes('maldives') || safeStr(dest.name).toLowerCase().includes('andaman');
    }
    if (selectedRegion === 'Mountains & Valleys') {
      return tags.includes('mountain') || tags.includes('hill') || safeStr(dest.name).toLowerCase().includes('manali') || safeStr(dest.name).toLowerCase().includes('kashmir') || safeStr(dest.name).toLowerCase().includes('shimla');
    }

    return true;
  });

  return (
    <>
      {/* Blue Header Container combining AppBar + Search + Filter */}
      <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 pt-3 pb-4 rounded-b-[28px] sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5 mb-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-white active:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-black text-lg text-white">All Destinations</h1>
        </div>

        {/* Search + Filter Header Container */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="w-full pl-9 pr-8 py-3 rounded-2xl bg-white dark:bg-white text-slate-900 text-sm outline-none border border-slate-200 shadow-sm placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-white border border-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
          >
            <Filter className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Active Filter Pill */}
        {selectedRegion !== 'All' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <span className="text-white text-xs font-bold">{selectedRegion}</span>
              <button onClick={() => setSelectedRegion('All')}>
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBox key={i} className="aspect-[1/1.18]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No destinations found for your query.</div>
        ) : (
          /* 2-column grid matching Flutter layout */
          <div
            className="grid grid-cols-2 gap-4 p-4"
            style={{ paddingBottom: 100 }}
          >
            {filtered.map((dest: any, i: number) => {
              const rawImg = dest.image || dest.imageUrl || dest.banner;
              const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600');
              const countryName = safeStr(dest.country);

              return (
                <Link
                  key={dest._id || i}
                  to={`/destination/${dest.slug}`}
                  className="relative rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                  style={{ aspectRatio: '1 / 1.18' }}
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

      {/* Filter Bottom Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-3xl w-full px-5 pt-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Destination Filters</h2>
              <button
                onClick={() => { setSelectedRegion('All'); setFilterOpen(false); }}
                className="text-ocean-600 font-semibold text-sm"
              >
                Reset
              </button>
            </div>
            <p className="font-bold text-base text-slate-800 mb-3">Regions &amp; Types</p>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {REGIONS.map(reg => (
                <button
                  key={reg}
                  onClick={() => { setSelectedRegion(reg); setFilterOpen(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedRegion === reg
                      ? 'bg-ocean-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-ocean-600 text-white font-bold text-base"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};
