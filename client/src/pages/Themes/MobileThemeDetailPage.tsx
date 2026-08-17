import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Headphones } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { MobilePackageCard } from '../Packages/MobilePackagesPage';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { FALLBACK_THEMES, FALLBACK_PACKAGES } from '../../utils/mobileDataFallback';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.title || '';
  return String(val);
};

const THEME_DESCRIPTIONS: Record<string, string> = {
  'Honeymoon Tour': 'Romantic escapes crafted with candlelight dinners, private transfers, luxury stays, and sunset moments made for couples who want timeless memories.',
  'Leisure': 'Relaxed journeys designed for easygoing exploration, scenic comforts, spa moments, and memorable stays without the rush.',
  'Hill Station': 'Experience cool weather, panoramic views, cozy stays, and peaceful nature-filled itineraries surrounded by hilltop charm.',
  'Trekking': 'Adventure-driven holiday plans built around mountain trails, guided treks, camp nights, and unforgettable natural viewpoints.',
  'Adventure': 'High-energy experiences featuring rafting, ziplining, off-road drives, and thrilling activities across scenic landscapes.',
  'Religious': 'Spiritual journeys that blend temple visits, guided rituals, calm stays, and meaningful travel for inner peace and reflection.',
  'Family Tour': 'Family-friendly trips with comfortable stays, kid-approved activities, easy sightseeing, and plenty of shared memories.',
  'Wildlife Safari': 'Wild encounters, jungle drives, nature lodges, and scenic adventure that bring the thrill of the wilderness closer to home.',
};

const THEME_HIGHLIGHTS: Record<string, string[]> = {
  'Honeymoon Tour': ['Couple stay', 'Private cab', 'Sunset dinner', 'Luxury room'],
  'Leisure': ['Scenic stay', 'Sightseeing', 'Spa time', 'Relaxed pace'],
  'Hill Station': ['Mountain views', 'Nature trails', 'Tea gardens', 'Cool weather'],
  'Trekking': ['Guided hikes', 'Camp nights', 'Adventure', 'Trail views'],
  'Adventure': ['Zipline', 'Rafting', 'Off-road', 'Thrills'],
  'Religious': ['Temple visits', 'Spiritual stay', 'Guided tours', 'Peaceful retreats'],
  'Family Tour': ['Family rooms', 'Kid-friendly', 'Heritage spots', 'Fun activities'],
  'Wildlife Safari': ['Safari drive', 'Nature lodge', 'Birding', 'Forest stay'],
};

import { formatImageUrl } from '../../utils/imageUrl';

export const MobileThemeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let themeList: any[] = [];
        try {
          const themesRes = await apiClient.get('/themes');
          themeList = themesRes.data?.data || [];
        } catch (_) {}

        // 1. Populate map with curated FALLBACK_THEMES first
        const mapThemes = new Map<string, any>();
        FALLBACK_THEMES.forEach(t => mapThemes.set(t.slug, t));

        // 2. Merge API themes, preserving valid images & fallback metadata
        themeList.forEach((t: any) => {
          if (!t) return;
          const tName = safeStr(t.name || t.title);
          if (!tName) return;
          const tSlug = (t.slug || tName.toLowerCase().replace(/\s+/g, '-')).trim();
          
          const existing = mapThemes.get(tSlug);
          if (existing) {
            mapThemes.set(tSlug, {
              ...existing,
              ...t,
              name: t.name || existing.name,
              imageUrl: (t.imageUrl && !t.imageUrl.includes('placeholder')) ? t.imageUrl : existing.imageUrl,
              description: t.description || existing.description,
              rating: t.rating || existing.rating,
            });
          } else {
            mapThemes.set(tSlug, t);
          }
        });

        const rawSlug = decodeURIComponent(slug || '').toLowerCase();
        const cleanSlugName = rawSlug.replace(/-/g, ' ').trim();

        // 1. Exact slug match
        let found = mapThemes.get(rawSlug);

        // 2. Match by clean name
        if (!found) {
          found = Array.from(mapThemes.values()).find((t: any) => {
            const tSlug = (t.slug || '').toLowerCase();
            const tName = safeStr(t.name || t.title).toLowerCase();
            const cleanTName = tName.replace(/-/g, ' ').trim();
            return tSlug === rawSlug || cleanTName === cleanSlugName;
          });
        }

        // 3. Fallback matching
        if (!found) {
          found = FALLBACK_THEMES.find(t => t.slug.includes(rawSlug) || rawSlug.includes(t.slug));
        }

        if (!found) {
          const capitalizedName = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Honeymoon Tour';
          found = {
            name: capitalizedName,
            imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
            rating: '4.9 ★ (348 Reviews)',
            description: THEME_DESCRIPTIONS[capitalizedName] || THEME_DESCRIPTIONS['Honeymoon Tour']
          };
        }
        setTheme(found);

        // Query backend for this theme name & filter packages matching Flutter _filterPackagesForTheme
        let apiPackages: any[] = [];
        try {
          const res = await apiClient.get(`/packages?theme=${encodeURIComponent(found.name)}`);
          if (res.data?.data && Array.isArray(res.data.data)) {
            apiPackages = res.data.data;
          }
        } catch (_) {}

        let apiPkgsList: any[] = [];
        try {
          const pkgRes = await apiClient.get('/packages?limit=100');
          apiPkgsList = pkgRes.data?.data || [];
        } catch (_) {}

        // Combine API packages and FALLBACK_PACKAGES
        const combinedAllPkgs = [...apiPkgsList, ...FALLBACK_PACKAGES];
        const cleanThemeName = found.name.toLowerCase().replaceAll('tour', '').trim();
        const keywords = cleanThemeName.split(/\s+/).filter((k: string) => k.length > 2);

        const localMatched = combinedAllPkgs.filter((pkg: any) => {
          if (!pkg) return false;
          const themeStr = safeStr(pkg.themeName || pkg.theme).toLowerCase();
          const catStr = safeStr(pkg.category).toLowerCase();
          const titleStr = (pkg.title || '').toLowerCase();
          const overviewStr = (pkg.overview || '').toLowerCase();
          const destStr = safeStr(pkg.destination).toLowerCase();

          if (themeStr && themeStr.includes(cleanThemeName)) return true;
          if (catStr && catStr.includes(cleanThemeName)) return true;
          if (titleStr && titleStr.includes(cleanThemeName)) return true;

          if (keywords.length > 0) {
            return keywords.some((kw: string) => 
              titleStr.includes(kw) || overviewStr.includes(kw) || destStr.includes(kw) || catStr.includes(kw)
            );
          }
          return false;
        });

        // Combine API packages and local matched packages avoiding duplicates
        const map = new Map<string, any>();
        apiPackages.forEach(p => map.set(p.slug || p._id || p.id, p));
        localMatched.forEach(p => map.set(p.slug || p._id || p.id, p));

        setPackages(Array.from(map.values()));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[#0A6FB5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const themeName = safeStr(theme?.name || theme?.title) || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Honeymoon Tour');
  const fallbackObj = FALLBACK_THEMES.find(t => 
    t.slug === theme?.slug || 
    t.name.toLowerCase() === themeName.toLowerCase() || 
    (slug && (t.slug.includes(slug) || slug.includes(t.slug)))
  ) || FALLBACK_THEMES[0];

  const rawImg = (theme?.imageUrl && !theme.imageUrl.includes('placeholder') && !theme.imageUrl.includes('fitness')) 
    ? theme.imageUrl 
    : (theme?.image || fallbackObj.imageUrl);
  const imgUrl = formatImageUrl(rawImg, fallbackObj.imageUrl);
  const rating = theme?.rating || fallbackObj.rating || '4.9 ★ (348 Reviews)';
  const description = theme?.description || THEME_DESCRIPTIONS[themeName] || fallbackObj.description;
  const highlights = THEME_HIGHLIGHTS[themeName] || THEME_HIGHLIGHTS['Honeymoon Tour'] || ['Couple stay', 'Private cab', 'Sunset dinner', 'Luxury room'];

  return (
    <div className="min-h-screen bg-[#F3F3F3] relative pb-28">
      {/* Scrollable Container */}
      <div className="p-4 space-y-4">
        {/* Floating Back Button Top Bar */}
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/90 shadow-md flex items-center justify-center text-slate-800 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* ── THEME HERO & DESCRIPTION CARD ── Matches Flutter ThemeDetailScreen exact layout */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          {/* Main Cover Image */}
          <div className="h-64 relative bg-slate-200">
            <img src={imgUrl} alt={themeName} className="w-full h-full object-cover" />
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-3">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              THEME
            </span>
            <h1 className="font-extrabold text-3xl text-slate-900 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {themeName}
            </h1>

            {/* Star Rating Row */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              {description}
            </p>

            {/* Highlights Chips */}
            <div className="pt-2">
              <h3 className="font-bold text-sm text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Highlights
              </h3>
              <div className="flex flex-wrap gap-2">
                {highlights.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] text-xs font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── THEME PACKAGES SECTION ── */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {themeName} Packages
            </h2>
            <span className="px-2.5 py-1 rounded-xl bg-[#0A6FB5]/10 text-[#0A6FB5] text-xs font-bold">
              {packages.length} {packages.length === 1 ? 'Package' : 'Packages'}
            </span>
          </div>

          {packages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs">
              No packages available for this theme right now.
            </div>
          ) : (
            packages.map((pkg, i) => (
              <MobilePackageCard
                key={pkg._id || i}
                pkg={pkg}
                onBookNow={() => setEnquiryOpen(true)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── ORANGE FLOATING ENQUIRE FAB ── Matches Flutter ThemeDetailScreen bottom FAB */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          onClick={() => setEnquiryOpen(true)}
          className="w-full py-4 bg-[#F6A35A] text-white font-extrabold text-lg rounded-3xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Headphones className="w-6 h-6" />
          Enquire Now
        </button>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </div>
  );
};
