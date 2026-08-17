import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Globe, Compass } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { MobilePackageCard } from '../Packages/MobilePackagesPage';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { FALLBACK_DESTINATIONS, FALLBACK_PACKAGES, FALLBACK_THEMES } from '../../utils/mobileDataFallback';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.title || val.state || val.country || '';
  return String(val);
};

import { formatImageUrl } from '../../utils/imageUrl';

export const MobileDestinationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [dest, setDest] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('All Packages');
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let d: any = null;
        try {
          const destRes = await apiClient.get(`/destinations/${slug}`);
          d = destRes.data?.data;
        } catch (_) {}

        if (!d) {
          d = FALLBACK_DESTINATIONS.find(item => item.slug === slug || item._id === slug || item.id === slug) || FALLBACK_DESTINATIONS[0];
        }
        setDest(d);

        let pkgList: any[] = [];
        try {
          const pkgRes = await apiClient.get(`/packages?destination=${slug}`);
          pkgList = pkgRes.data?.data || [];
        } catch (_) {}

        if (pkgList.length === 0 && d?.name) {
          const cleanName = d.name.split(',')[0].toLowerCase().trim();
          pkgList = FALLBACK_PACKAGES.filter((p: any) => {
            const destStr = safeStr(p.destination).toLowerCase();
            const titleStr = (p.title || '').toLowerCase();
            return destStr.includes(cleanName) || titleStr.includes(cleanName);
          });
        }
        if (pkgList.length === 0) {
          pkgList = FALLBACK_PACKAGES;
        }
        setPackages(pkgList);

        const themeList = [{ name: 'All Packages', imageUrl: d?.image }, ...FALLBACK_THEMES];
        setThemes(themeList);
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

  if (!dest) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800">Destination Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-[#0A6FB5] text-white rounded-xl text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const destNameShort = dest.name.split(',')[0];
  const locationText = [safeStr(dest.state), safeStr(dest.country)].filter(Boolean).join(', ') || 'India';
  const bestTime = Array.isArray(dest.bestTimeToVisit)
    ? dest.bestTimeToVisit.join(', ')
    : dest.bestTimeToVisit || 'Nov - Feb';

  // Theme filter
  const displayedPackages = packages.filter((pkg: any) => {
    if (selectedTheme === 'All Packages') return true;
    const cleanSel = selectedTheme.toLowerCase().replace('tour', '').trim();
    const pkgTheme = safeStr(pkg.theme || pkg.category).toLowerCase();
    const pkgTitle = (pkg.title || '').toLowerCase();
    return pkgTheme.includes(cleanSel) || pkgTitle.includes(cleanSel);
  });

  return (
    <div className="min-h-screen bg-[#F3F3F3] relative pb-28">
      {/* Scrollable Content */}
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

        {/* ── IMAGE & ABOUT CARD ── Matches Image 3 exact design */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          {/* Main Cover Image */}
          <div className="h-60 relative">
            <img
              src={formatImageUrl(dest.image || dest.banner || dest.imageUrl, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800')}
              alt={dest.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-3">
            {/* Globe + Location */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Globe className="w-4 h-4 text-[#0A6FB5]" />
              <span>, {locationText}</span>
            </div>

            {/* Destination Name (Upper Case Big Bold) */}
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {dest.name}
            </h1>

            {/* About Destination Section */}
            <div className="pt-1">
              <h2 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                About Destination
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {dest.description || `Explore ${dest.name}. Discover scenic beauty, culture and tour packages.`}
              </p>
            </div>

            {/* Best Time Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <Calendar className="w-4 h-4 text-[#57D0C9] shrink-0" />
              <span className="font-bold text-slate-900">Best Time:</span>
              <span className="font-bold text-[#0A6FB5]">{bestTime}</span>
            </div>
          </div>
        </div>

        {/* ── TRAVEL THEMES SECTION ── Matches Image 3 horizontal cards */}
        {themes.length > 0 && (
          <div className="pt-2">
            <h2 className="font-bold text-base text-slate-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Travel Themes in {destNameShort}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {themes.map((themeItem: any, idx: number) => {
                const isSelected = selectedTheme === themeItem.name;
                const rawImg = themeItem.imageUrl || themeItem.image || dest.image;
                const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400');
                return (
                  <button
                    key={themeItem._id || idx}
                    onClick={() => setSelectedTheme(themeItem.name)}
                    className={`shrink-0 relative rounded-2xl overflow-hidden shadow-sm border-2 transition-all ${
                      isSelected ? 'border-[#0A6FB5] scale-105' : 'border-transparent'
                    }`}
                    style={{ width: 130, height: 95 }}
                  >
                    <img src={imgUrl} alt={themeItem.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <p className="text-white font-bold text-xs line-clamp-2 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {themeItem.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TOUR PACKAGES SECTION ── Matches Image 3 list */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {selectedTheme === 'All Packages' ? `Tour Packages in ${destNameShort}` : `${selectedTheme} Packages`}
            </h2>
            <span className="px-2.5 py-1 rounded-xl bg-[#0A6FB5]/10 text-[#0A6FB5] text-xs font-bold">
              {displayedPackages.length} {displayedPackages.length === 1 ? 'Package' : 'Packages'}
            </span>
          </div>

          {displayedPackages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs">
              No packages available for {selectedTheme} at {destNameShort} right now.
            </div>
          ) : (
            displayedPackages.map((pkg, i) => (
              <MobilePackageCard
                key={pkg._id || i}
                pkg={pkg}
                onBookNow={() => setEnquiryOpen(true)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM BUTTON ── Matches Image 3 "Enquire for TELAGANA Tour" */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-30">
        <button
          onClick={() => setEnquiryOpen(true)}
          className="w-full py-3.5 bg-[#0A6FB5] text-white font-bold text-sm rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Enquire for {destNameShort} Tour
        </button>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        selectedDestination={dest}
      />
    </div>
  );
};
