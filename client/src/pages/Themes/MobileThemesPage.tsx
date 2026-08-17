import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

/* ─────────────────────────────────────────
   Mobile Themes Page — matches Flutter ThemeScreen exactly
   - Header row: "Themes" title + green "Live" badge
   - 2-column grid (crossAxisCount: 2, crossAxisSpacing: 14, childAspectRatio: 0.82)
   - Each card: top image (aspectRatio 1.6), white card, name + star rating below
───────────────────────────────────────── */
import { FALLBACK_THEMES } from '../../utils/mobileDataFallback';

import { formatImageUrl } from '../../utils/imageUrl';

export const MobileThemesPage: React.FC = () => {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await apiClient.get('/themes');
        const apiData = res.data.data || [];

        // Merge API themes with FALLBACK_THEMES avoiding duplicates
        const map = new Map<string, any>();
        apiData.forEach((t: any) => map.set(t.slug || t._id || t.id, t));
        FALLBACK_THEMES.forEach(t => {
          if (!map.has(t.slug)) map.set(t.slug, t);
        });

        setThemes(Array.from(map.values()));
      } catch (e) {
        console.error(e);
        setThemes(FALLBACK_THEMES);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  return (
    <>
      {/* No AppBar — themes is a tab, content starts directly */}
      <div className="overflow-y-auto pb-24 px-4 pt-3" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Header row: "Themes" + Live badge — matches Flutter Row at top of ThemeScreen */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-extrabold text-2xl text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Themes
          </h1>
          {/* Live badge — matches Flutter successColor circle + "Live" text */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500/12">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-600">Live</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading themes...</div>
        ) : themes.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No themes available right now</div>
        ) : (
          /* 2-column grid: crossAxisSpacing: 14, mainAxisSpacing: 14, childAspectRatio: 0.82 */
          <div className="grid grid-cols-2 gap-3.5">
            {themes.map((theme: any, i: number) => {
              const themeName = theme?.name || theme?.title || 'Theme';
              const themeSlug = theme?.slug || themeName.toLowerCase().replace(/\s+/g, '-');
              const rawImg = theme?.imageUrl || theme?.image || theme?.defaultBanner;
              const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600');
              const rating = theme?.rating || 'Top pick';

              return (
                <Link
                  key={theme?._id || i}
                  to={`/theme/${encodeURIComponent(themeSlug)}`}
                  className="bg-white rounded-[18px] overflow-hidden shadow-sm active:scale-95 transition-transform"
                  style={{ aspectRatio: '1 / 1.22' }} /* 1/0.82 ≈ 1.22 */
                >
                  {/* Top image — aspectRatio: 1.6 means width/height = 1.6 → height = width/1.6 */}
                  <div style={{ aspectRatio: '1.6 / 1' }} className="w-full overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={themeName}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400';
                      }}
                    />
                  </div>

                  {/* Content below image */}
                  <div className="px-3 pt-3 pb-2.5 flex flex-col justify-between flex-1">
                    <p
                      className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug"
                      style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15 }}
                    >
                      {themeName}
                    </p>
                    {/* Star + rating row */}
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-[11px] text-slate-500 line-clamp-1">{rating}</span>
                    </div>
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
