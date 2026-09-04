import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

      <div className="overflow-y-auto pb-24 px-4 pt-4" style={{ WebkitOverflowScrolling: 'touch' }}>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading themes...</div>
        ) : themes.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No themes available right now</div>
        ) : (
          /* 2-column grid: crossAxisSpacing: 14, mainAxisSpacing: 14, childAspectRatio: 0.82 */
          <div className="grid grid-cols-2 gap-3.5">
            {themes.map((theme: any, i: number) => {
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
    </>
  );
};
