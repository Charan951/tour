import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, User, ChevronRight } from 'lucide-react';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { MobilePackageCard } from '../Packages/MobilePackagesPage';

import { formatImageUrl } from '../../utils/imageUrl';

/* ─────────────────────────────────────────
   Mobile Home Screen — matches Flutter home_screen.dart _buildHomeContent()
───────────────────────────────────────── */

interface MobileHomePageProps {
  destinations: any[];
  packages: any[];
  banners: any[];
  themeBanners: any[];
  defaultHeroBanners: any[];
  defaultThemes: any[];
}

export const MobileHomePage: React.FC<MobileHomePageProps> = ({
  destinations,
  packages,
  banners,
  themeBanners,
  defaultHeroBanners,
  defaultThemes,
}) => {
  const navigate = useNavigate();
  const [heroSlide, setHeroSlide] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Safely extract a renderable string from any field (handles populated objects)
  const safeStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.name || val.title || val.state || val.country || '';
    }
    return String(val);
  };

  const loadUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem('hc_user') || 'null');
      const token = localStorage.getItem('hc_token');
      if (u && token) setCurrentUser(u);
      else setCurrentUser(null);
    } catch { setCurrentUser(null); }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('hc_user_updated', loadUser);
    return () => window.removeEventListener('hc_user_updated', loadUser);
  }, []);

  // Auto-scroll banner
  useEffect(() => {
    const effectiveBanners = banners.length > 0 ? banners : defaultHeroBanners;
    if (effectiveBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % effectiveBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners, defaultHeroBanners]);

  const effectiveBanners = banners.length > 0 ? banners : defaultHeroBanners;
  const effectiveThemes = themeBanners.length > 0 ? themeBanners : defaultThemes;

  const userName = currentUser?.firstName || null;

  // Banner tap target matching Flutter _handleBannerTap()
  const resolveBannerUrl = (slide: any) => {
    if (!slide) return '/packages';
    if (slide.link || slide.linkUrl) return slide.link || slide.linkUrl;

    const title = (slide.title || '').toLowerCase();
    const destName = (slide.destinationName || '').toLowerCase();
    const destSlug = (slide.destinationSlug || '').toLowerCase();

    // Find destination match
    const matchedDest = destinations.find((d: any) => {
      const dSlug = (d.slug || '').toLowerCase();
      const dName = (d.name || '').toLowerCase();
      return (destSlug && dSlug === destSlug) ||
             (destName && dName.includes(destName)) ||
             title.includes(dSlug) ||
             title.includes(dName.split(',')[0]);
    });

    if (matchedDest) {
      return `/destination/${matchedDest.slug}`;
    }

    return `/packages?search=${encodeURIComponent(slide.title || '')}`;
  };

  return (
    <>
      {/* ── AppBar ── Matches Flutter AppBar with logo on Home tab */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <img
          src="/logo.png"
          alt="HolidayCity"
          className="h-10 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <button
          onClick={() => navigate('/my-bookings')}
          className="w-9 h-9 rounded-full bg-[#0A6FB5]/10 flex items-center justify-center active:bg-[#0A6FB5]/20 transition-colors"
        >
          <User className="w-5 h-5 text-[#0A6FB5]" />
        </button>
      </div>

      {/* ── Scrollable Content (matches Flutter SingleChildScrollView) ── */}
      <div className="overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* ── Welcome Header ── */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {userName ? `Hello, ${userName} 👋` : 'Welcome to HolidayCity 👋'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Your Travel Companion</p>
        </div>

        {/* ── Hero Banner Slider (height: 240px matching Flutter) ── */}
        {effectiveBanners.length > 0 && (
          <div className="px-2 mt-2">
            <div className="relative rounded-[18px] overflow-hidden shadow-md" style={{ height: 200 }}>
              {effectiveBanners.map((slide: any, index: number) => {
                const rawImg = slide.imageUrl || slide.url || slide.banner || slide.image;
                const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200');
                const isActive = index === (heroSlide % effectiveBanners.length);
                const targetUrl = resolveBannerUrl(slide);
                return (
                  <Link
                    key={slide._id || index}
                    to={targetUrl}
                    className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                  >
                    <img
                      src={imgUrl}
                      alt={slide.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    {slide.title && (
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-white font-bold text-sm line-clamp-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{slide.title}</p>
                        {slide.subtitle && <p className="text-white/80 text-[11px] mt-0.5 line-clamp-1">{slide.subtitle}</p>}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Dot indicators (matching Flutter) */}
            {effectiveBanners.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {effectiveBanners.map((_: any, idx: number) => {
                  const isActive = idx === (heroSlide % effectiveBanners.length);
                  return (
                    <button
                      key={idx}
                      onClick={() => setHeroSlide(idx)}
                      style={{ width: isActive ? 18 : 6, height: 6, borderRadius: 3, transition: 'width 0.3s' }}
                      className={`${isActive ? 'bg-[#0A6FB5]' : 'bg-slate-300'}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Specialization Themes Horizontal Scroll (matches Flutter) ── */}
        {effectiveThemes.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Specialization Themes</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Find tours tailored to your travel style</p>
              </div>
              <Link to="/themes" className="text-[#0A6FB5] text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2 px-4 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {effectiveThemes.slice(0, 6).map((theme: any, i: number) => {
                const rawImg = theme.imageUrl || theme.defaultBanner || theme.image;
                const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400');
                const link = `/packages?category=${encodeURIComponent(theme.name)}`;
                return (
                  <Link
                    key={theme._id || i}
                    to={link}
                    className="shrink-0 relative rounded-[18px] overflow-hidden shadow-md"
                    style={{ width: 148, height: 210 }}
                  >
                    <img src={imgUrl} alt={theme.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-sm line-clamp-2 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{theme.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Popular Destinations Horizontal Scroll (matches Flutter) ── */}
        {destinations.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Popular Destinations</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Top places travelers are loving</p>
              </div>
              <Link to="/destinations" className="text-[#0A6FB5] text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2 px-4 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {destinations.slice(0, 6).map((dest: any, i: number) => {
                const rawImg = dest.image || dest.imageUrl || dest.banner;
                const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400');
                return (
                  <Link
                    key={dest._id || i}
                    to={`/destination/${dest.slug}`}
                    className="shrink-0 relative rounded-[18px] overflow-hidden shadow-md"
                    style={{ width: 148, height: 210 }}
                  >
                    <img src={imgUrl} alt={dest.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      {(dest.state || dest.country) && (
                        <p className="text-white/70 text-[10px] font-semibold">
                          {[safeStr(dest.state), safeStr(dest.country)].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-white font-bold text-sm line-clamp-2 leading-tight mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>{dest.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trending Tour Packages List (matches Flutter PackageCard list) ── */}
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Trending Tour Packages</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Exclusive deals curated for you</p>
            </div>
            <Link to="/packages" className="text-[#0A6FB5] text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No packages found</div>
          ) : (
            <div>
              {packages.slice(0, 6).map((pkg: any, i: number) => (
                <MobilePackageCard
                  key={pkg._id || i}
                  pkg={pkg}
                  onBookNow={() => setEnquiryOpen(true)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Enquire Now FAB area (bottom) ── */}
        <div className="px-4 mt-6 mb-4">
          <button
            onClick={() => setEnquiryOpen(true)}
            className="w-full py-3.5 bg-[#57D0C9] text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm"
          >
            <Headphones className="w-4 h-4" />
            Enquire Now
          </button>
        </div>
      </div>

      {/* Enquiry Modal */}
      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </>
  );
};
