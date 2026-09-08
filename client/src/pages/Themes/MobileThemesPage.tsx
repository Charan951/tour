import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { FALLBACK_THEMES } from '../../utils/mobileDataFallback';
import { formatImageUrl } from '../../utils/imageUrl';
import { SkeletonBox } from '../../components/common/Skeleton';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.name || val.themeName || val.title || '';
  return String(val);
};

const THEME_CATEGORIES = ['All', 'Honeymoon & Romantic', 'Family & Leisure', 'Adventure & Wildlife', 'Luxury & Wellness', 'Beach & Heritage'];

export const MobileThemesPage: React.FC = () => {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedThemeCat, setSelectedThemeCat] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await apiClient.get('/themes');
        const apiData = res.data.data || [];
        setThemes(apiData);
      } catch (e) {
        console.error(e);
        setThemes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  const filtered = themes.filter(theme => {
    if (!theme) return false;
    const name = safeStr(theme.themeName || theme.name || theme.title).toLowerCase();
    const blurb = safeStr(theme.blurb || theme.description).toLowerCase();
    const q = (search || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || blurb.includes(q);

    if (!matchesSearch) return false;
    if (selectedThemeCat === 'All') return true;

    const cat = selectedThemeCat.toLowerCase();
    if (cat.includes('honeymoon')) return name.includes('honeymoon') || name.includes('romantic');
    if (cat.includes('family')) return name.includes('family') || name.includes('leisure') || name.includes('group');
    if (cat.includes('adventure')) return name.includes('adventure') || name.includes('wildlife') || name.includes('safari') || name.includes('trek');
    if (cat.includes('luxury')) return name.includes('luxury') || name.includes('wellness') || name.includes('resort');
    if (cat.includes('beach')) return name.includes('beach') || name.includes('heritage') || name.includes('island') || name.includes('culture');

    return name.includes(cat) || blurb.includes(cat);
  });

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
        <h1 className="font-display font-black text-lg text-white">Themes</h1>
      </div>

      <div className="overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Search + Filter Header Container */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search travel themes..."
                className="w-full pl-9 pr-8 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm outline-none border border-transparent focus:border-ocean-600/30"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="w-12 h-12 rounded-2xl bg-ocean-600/10 flex items-center justify-center shrink-0 active:bg-ocean-600/20 transition-colors"
            >
              <Filter className="w-5 h-5 text-ocean-600" />
            </button>
          </div>

          {/* Active Filter Chip */}
          {selectedThemeCat !== 'All' && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ocean-600 rounded-full">
                <span className="text-white text-xs font-bold">{selectedThemeCat}</span>
                <button onClick={() => setSelectedThemeCat('All')}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3.5 pb-24">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBox key={i} className="aspect-[1/1.18]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No themes found matching your search.</div>
          ) : (
            /* 2-column grid */
            <div className="grid grid-cols-2 gap-3.5 pb-24">
              {filtered.map((theme: any, i: number) => {
                const themeName =
                  theme?.themeName || theme?.name || theme?.title || 'Theme';
                const themeSlug =
                  theme?.slug || String(themeName).toLowerCase().replace(/\s+/g, '-');
                const rawImg =
                  theme?.imageUrl || theme?.image || theme?.banner || theme?.defaultBanner;
                const imgUrl = formatImageUrl(
                  rawImg,
                  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600'
                );
                const blurb = theme?.blurb || theme?.description || '';

                return (
                  <Link
                    key={theme?._id || i}
                    to={`/theme/${encodeURIComponent(themeSlug)}`}
                    className="relative flex flex-col rounded-2xl2 overflow-hidden shadow-card active:scale-95 transition-transform"
                    style={{ aspectRatio: '1 / 1.18' }}
                  >
                    <img
                      src={imgUrl}
                      alt={themeName}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent" />

                    <div className="relative mt-auto p-3 text-white">
                      <p className="font-display font-black text-sm leading-snug line-clamp-2">
                        {themeName}
                      </p>
                      {blurb && (
                        <p className="text-[0.6875rem] text-white/80 line-clamp-1 mt-0.5">{blurb}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-3xl w-full px-5 pt-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Theme Filters</h2>
              <button
                onClick={() => { setSelectedThemeCat('All'); setFilterOpen(false); }}
                className="text-ocean-600 font-semibold text-sm"
              >
                Reset
              </button>
            </div>
            <p className="font-bold text-base text-slate-800 mb-3">Theme Categories</p>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {THEME_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedThemeCat(cat); setFilterOpen(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedThemeCat === cat
                      ? 'bg-ocean-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {cat}
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
