import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, MapPin, Calendar, ShieldCheck, Headphones, Award, Heart, ChevronLeft, ChevronRight, MessageSquare, Phone, ArrowRight, Star, Users, ThumbsUp, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import { MobileHomePage } from './MobileHomePage';
import { FALLBACK_PACKAGES, FALLBACK_DESTINATIONS, FALLBACK_THEMES } from '../../utils/mobileDataFallback';
import { isPackageMatchingTheme } from '../../utils/themeMatcher';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

const SPECIALIZATION_THEMES = [
  { name: 'Honeymoon Tour', rating: '4.9 ★ (348 Reviews)', defaultBanner: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Honeymoon+Tour' },
  { name: 'Leisure', rating: '4.8 ★ (162 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Leisure' },
  { name: 'Hill Station', rating: '4.9 ★ (81 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Hill+Station' },
  { name: 'Trekking', rating: '5.0 ★ (55 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Trekking' },
  { name: 'Adventure', rating: '4.9 ★ (141 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Adventure' },
  { name: 'Religious', rating: '5.0 ★ (41 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Religious' },
  { name: 'Family Tour', rating: '4.8 ★ (210 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Family+Tour' },
  { name: 'Wildlife Safari', rating: '4.9 ★ (35 Packages)', defaultBanner: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Wildlife+Safari' }
];

const DEFAULT_SIDE_BANNERS = [
  {
    title: 'Goa Tour Package Offer',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop',
    linkUrl: '/packages?search=Goa'
  },
  {
    title: 'Kerala Backwaters Special Offer',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000&auto=format&fit=crop',
    linkUrl: '/packages?search=Kerala'
  },
  {
    title: 'Kashmir Holiday Paradise Offer',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
    linkUrl: '/packages?search=Kashmir'
  }
];

const DEFAULT_HERO_BANNERS = [
  {
    title: 'Explore Tropical Paradises',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    subtitle: 'Hand-crafted beach resort packages in Maldives, Goa & Bali'
  },
  {
    title: 'Majestic Mountain Escapes',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop',
    subtitle: 'Bespoke holiday itineraries for Kashmir, Manali & Ladakh'
  },
  {
    title: 'Exotic Island & Cultural Tours',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000&auto=format&fit=crop',
    subtitle: 'Unforgettable international journeys to Vietnam, Thailand & Dubai'
  },
  {
    title: 'Serene Backwaters & Heritage',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2000&auto=format&fit=crop',
    subtitle: 'Relaxing houseboat stays & authentic South Indian experiences'
  }
];

export const HomePage: React.FC = () => {
  const isMobile = useIsMobile();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [themeBanners, setThemeBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [searchInputText, setSearchInputText] = useState('');
  const [selectedSearchDestination, setSelectedSearchDestination] = useState('');
  const [selectedSearchTheme, setSelectedSearchTheme] = useState('All Themes');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [enquiryModalMode, setEnquiryModalMode] = useState<'enquiry' | 'booking'>('enquiry');

  // Side Scroller References for 4-Card Horizontal Scroll
  const domesticScrollRef = useRef<HTMLDivElement>(null);
  const intlScrollRef = useRef<HTMLDivElement>(null);

  const scrollSide = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.85;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchInputText.trim()) {
      params.set('search', searchInputText.trim());
    }
    if (selectedSearchDestination) {
      const destObj = destinations.find(
        (d) => d._id === selectedSearchDestination || d.name === selectedSearchDestination || d.slug === selectedSearchDestination
      );
      if (destObj) {
        if (destObj._id) params.set('destination', destObj._id);
        params.set('search', destObj.name);
      } else {
        params.set('search', selectedSearchDestination);
      }
    }
    if (selectedSearchTheme && selectedSearchTheme !== 'All Themes') {
      params.set('theme', selectedSearchTheme);
    }
    const str = params.toString();
    return `/packages${str ? `?${str}` : ''}`;
  };

  // Realtime matching packages calculation for live instant search preview
  const realtimeMatchingPackages = packages.filter((pkg) => {
    let match = true;

    // Search input text match
    if (searchInputText.trim()) {
      const q = searchInputText.toLowerCase().trim();
      const titleMatch = (pkg.title || '').toLowerCase().includes(q);
      const codeMatch = (pkg.packageCode || '').toLowerCase().includes(q);
      const destName = (typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination.name : pkg.destination || '').toLowerCase();
      const destMatch = destName.includes(q);
      match = match && (titleMatch || codeMatch || destMatch);
    }

    // Destination match
    if (selectedSearchDestination) {
      const selectedName = selectedSearchDestination.toLowerCase();
      const destName = (typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination.name : pkg.destination || '').toLowerCase();
      const destId = (typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination._id || pkg.destination.id : pkg.destination || '');
      match = match && (destName.includes(selectedName) || destId === selectedSearchDestination || selectedSearchDestination === destName);
    }

    // Theme match
    if (selectedSearchTheme && selectedSearchTheme !== 'All Themes') {
      match = match && isPackageMatchingTheme(pkg, selectedSearchTheme);
    }

    return match;
  });

  useEffect(() => {
    fetchData();
    const handleDataUpdate = () => fetchDataSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      fetchDataSilently();
    }, 800);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchDataSilently = async () => {
    try {
      const [destRes, pkgRes, banRes, themeRes] = await Promise.allSettled([
        apiClient.get('/destinations'),
        apiClient.get('/packages?limit=6'),
        apiClient.get('/banners'),
        apiClient.get('/themes')
      ]);

      if (destRes.status === 'fulfilled') {
        const apiDests = destRes.value.data?.data || [];
        const map = new Map<string, any>();
        apiDests.forEach((d: any) => map.set(d.slug || d._id || d.id, d));
        FALLBACK_DESTINATIONS.forEach(d => { if (!map.has(d.slug)) map.set(d.slug, d); });
        setDestinations(Array.from(map.values()));
      }

      if (pkgRes.status === 'fulfilled') {
        const apiPkgs = pkgRes.value.data?.data || [];
        const map = new Map<string, any>();
        apiPkgs.forEach((p: any) => map.set(p.slug || p._id || p.id, p));
        FALLBACK_PACKAGES.forEach(p => { if (!map.has(p.slug)) map.set(p.slug, p); });
        setPackages(Array.from(map.values()));
      }

      if (banRes.status === 'fulfilled' && banRes.value.data?.data) {
        setBanners(banRes.value.data.data);
      }

      if (themeRes.status === 'fulfilled') {
        const apiThemes = themeRes.value.data?.data || [];
        const map = new Map<string, any>();
        apiThemes.forEach((t: any) => map.set(t.slug || t._id || t.id, t));
        FALLBACK_THEMES.forEach(t => { if (!map.has(t.slug)) map.set(t.slug, t); });
        setThemeBanners(Array.from(map.values()));
      }
    } catch (_) {}
  };

  const explicitHeroBanners = banners.filter((b) => b.targetSection === 'HeroBanner');
  const homeBanners = banners.filter((b) => b.targetSection === 'HomeBanner');
  const effectiveHeroBanners = explicitHeroBanners.length > 0 
    ? explicitHeroBanners 
    : (homeBanners.length > 0 ? homeBanners : DEFAULT_HERO_BANNERS);

  const effectiveDestinations = (() => {
    const map = new Map<string, any>();
    destinations.forEach(d => map.set(d.slug || d._id || d.id, d));
    FALLBACK_DESTINATIONS.forEach(d => { if (!map.has(d.slug)) map.set(d.slug, d); });
    return Array.from(map.values());
  })();

  const domesticDestinations = effectiveDestinations.filter(
    (d) => d.category === 'Domestic' || (d.isDomestic !== false && (d.country?.isoCode === 'IN' || d.country?.name === 'India' || d.country === 'India'))
  );
  const intlDestinations = effectiveDestinations.filter(
    (d) => d.category === 'International' || d.isDomestic === false || (d.country && d.country !== 'India' && d.country?.isoCode !== 'IN' && d.country?.name !== 'India')
  );

  useEffect(() => {
    if (effectiveHeroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % effectiveHeroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [effectiveHeroBanners.length]);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  // Auto-scroll Domestic Destinations Carousel
  useEffect(() => {
    if (domesticDestinations.length <= 4) return;
    const interval = setInterval(() => {
      if (domesticScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = domesticScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const cardWidth = clientWidth * 0.85;

        if (scrollLeft >= maxScroll - 10) {
          domesticScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          domesticScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [domesticDestinations.length]);

  // Auto-scroll International Destinations Carousel
  useEffect(() => {
    if (intlDestinations.length <= 4) return;
    const interval = setInterval(() => {
      if (intlScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = intlScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const cardWidth = clientWidth * 0.85;

        if (scrollLeft >= maxScroll - 10) {
          intlScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          intlScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [intlDestinations.length]);

  const fetchData = async () => {
    try {
      const [destRes, pkgRes, banRes, themeRes] = await Promise.all([
        apiClient.get('/destinations'),
        apiClient.get('/packages?limit=6'),
        apiClient.get('/banners'),
        apiClient.get('/themes')
      ]);
      setDestinations(destRes.data.data || []);
      setPackages(pkgRes.data.data || []);
      setBanners(banRes.data.data || []);
      setThemeBanners(themeRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch home page data', err);
    }
  };

  const handleOpenEnquire = (pkg?: any, initialMode: 'enquiry' | 'booking' = 'enquiry') => {
    setSelectedPackage(pkg || null);
    setEnquiryModalMode(initialMode);
    setEnquiryModalOpen(true);
  };

  const offerCardBanners = banners.filter((b) => b.targetSection === 'OfferCard');
  const sideBanners = banners.filter((b) => b.targetSection === 'HomeBanner');
  const effectiveSideBanners = sideBanners.length > 0 
    ? sideBanners 
    : (banners.length > 0 ? banners : DEFAULT_SIDE_BANNERS);

  const getBannerTargetUrl = (b: any) => {
    if (!b) return '/packages';
    if (b.linkUrl) return b.linkUrl;
    if (typeof b.destination === 'object' && b.destination !== null && b.destination.slug) {
      return `/destination/${b.destination.slug}`;
    }
    if (typeof b.destination === 'string' && b.destination) {
      const found = destinations.find((d: any) => d._id === b.destination || d.slug === b.destination);
      if (found) return `/destination/${found.slug}`;
    }
    if (b.title) {
      const titleLower = b.title.toLowerCase();
      const matched = destinations.find((d: any) => {
        const dName = d.name.toLowerCase();
        const dSlug = d.slug.toLowerCase();
        return (
          titleLower.includes(dName) ||
          dName.includes(titleLower) ||
          titleLower.includes(dSlug) ||
          dSlug.includes(titleLower)
        );
      });
      if (matched) return `/destination/${matched.slug}`;
    }
    return `/packages?search=${encodeURIComponent(b.title || '')}`;
  };

  // ── Mobile View ──
  if (isMobile) {
    return (
      <>
        <SEO title="HolidayCity | Explore. Experience. Enjoy." description="Book domestic & international tour packages with HolidayCity." />
        <MobileHomePage
          destinations={destinations}
          packages={packages}
          banners={effectiveHeroBanners}
          themeBanners={themeBanners}
          defaultHeroBanners={DEFAULT_HERO_BANNERS}
          defaultThemes={SPECIALIZATION_THEMES}
        />
      </>
    );
  }

  return (
    <>
      <SEO
        title="HolidayCity | Explore. Experience. Enjoy."
        description="Book domestic & international tour packages with HolidayCity. Explore Kerala, Bali, Kashmir, Dubai, Maldives, Vietnam and more."
      />

      {/* Floating Vertical "Enquiry Now" Side Tab */}
      <motion.button
        whileHover={{ scale: 1.1, x: 3 }}
        onClick={() => handleOpenEnquire()}
        className="fixed left-0 top-[58%] -translate-y-1/2 z-40 bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white font-black text-xs px-2 py-3.5 rounded-r-2xl shadow-2xl transition-all flex items-center gap-2 cursor-pointer border-0 overflow-hidden group backdrop-blur-sm"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow rotate-90" />
        <span className="tracking-widest uppercase text-[10.5px]">Enquiry Now</span>
      </motion.button>

      {/* Dynamic Hero Banner Carousel Section */}
      <section className="relative w-full overflow-hidden pt-0">
        <div
          className="relative w-full select-none overflow-hidden"
          style={{ aspectRatio: '1000 / 400' }}
        >
          {effectiveHeroBanners.map((slide: any, index: number) => {
            const isActive = index === (heroSlide % effectiveHeroBanners.length);
            const imgUrl = slide.imageUrl || slide.url || slide.banner;
            const targetUrl = getBannerTargetUrl(slide);

            return (
              <div
                key={slide._id || index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  isActive
                    ? 'opacity-100 scale-100 z-10'
                    : 'opacity-0 scale-105 z-0 pointer-events-none'
                }`}
              >
                <Link to={targetUrl} className="block w-full h-full cursor-pointer group">
                  <img
                    src={imgUrl}
                    alt={slide.title || 'HolidayCity Hero Banner'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </Link>
              </div>
            );
          })}

          {/* Hero Navigation Controls */}
          {effectiveHeroBanners.length > 1 && (
            <>
              <button
                onClick={() => setHeroSlide((prev) => (prev - 1 + effectiveHeroBanners.length) % effectiveHeroBanners.length)}
                aria-label="Previous Hero Background"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl hover:scale-110 transition-all cursor-pointer group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform text-white" />
              </button>

              <button
                onClick={() => setHeroSlide((prev) => (prev + 1) % effectiveHeroBanners.length)}
                aria-label="Next Hero Background"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl hover:scale-110 transition-all cursor-pointer group"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform text-white" />
              </button>

              {/* Slide Indicator Dots */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
                {effectiveHeroBanners.map((_, idx) => {
                  const isActive = (heroSlide % effectiveHeroBanners.length) === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setHeroSlide(idx)}
                      aria-label={`Switch to hero background ${idx + 1}`}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                        isActive ? 'w-7 sm:w-8 bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] shadow-lg shadow-[#57D0C9]/40' : 'w-2 sm:w-2.5 bg-white/60 hover:bg-white'
                      }`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Standalone Quick Search Bar Widget */}
      <section className="relative z-30 max-w-6xl mx-auto px-4 mt-3 sm:-mt-8 mb-10 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[28px] p-4 sm:p-5 shadow-2xl border border-white/80 text-slate-800 text-left relative"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* 1. Keyword Search Input */}
            <div className="lg:col-span-3 p-3.5 rounded-2xl bg-slate-50/90 flex items-center gap-3 border border-slate-200/80 shadow-inner">
              <Search className="w-5 h-5 text-[#0A6FB5] shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Search Keyword</label>
                <input
                  type="text"
                  value={searchInputText}
                  onChange={(e) => setSearchInputText(e.target.value)}
                  placeholder="Destination or package..."
                  className="w-full text-xs font-bold bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* 2. Destination Dropdown Filter */}
            <div className="lg:col-span-3 p-3.5 rounded-2xl bg-slate-50/90 flex items-center gap-3 border border-slate-200/80 shadow-inner">
              <MapPin className="w-5 h-5 text-[#0A6FB5] shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Destination</label>
                <select
                  value={selectedSearchDestination}
                  onChange={(e) => setSelectedSearchDestination(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent outline-none text-slate-800 cursor-pointer"
                >
                  <option value="">All Destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest._id || dest.slug} value={dest.name}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Theme Dropdown Filter */}
            <div className="lg:col-span-3 p-3.5 rounded-2xl bg-slate-50/90 flex items-center gap-3 border border-slate-200/80 shadow-inner">
              <Sparkles className="w-5 h-5 text-[#0A6FB5] shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Travel Theme</label>
                <select
                  value={selectedSearchTheme}
                  onChange={(e) => setSelectedSearchTheme(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent outline-none text-slate-800 cursor-pointer"
                >
                  <option value="All Themes">All Themes</option>
                  <option value="Honeymoon Tour">Honeymoon Tour</option>
                  <option value="Leisure">Leisure</option>
                  <option value="Hill Station">Hill Station</option>
                  <option value="Trekking">Trekking</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Religious">Religious</option>
                  <option value="Family Tour">Family Tour</option>
                  <option value="Wildlife Safari">Wildlife Safari</option>
                </select>
              </div>
            </div>

            {/* 4. Search Submit CTA */}
            <div className="lg:col-span-3">
              <Link
                to={buildSearchUrl()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] hover:from-[#085a94] hover:to-[#4bb8b1] text-white font-extrabold text-xs lg:text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 overflow-hidden whitespace-nowrap shimmer-sheen"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>Search Packages</span>
              </Link>
            </div>
          </div>

          {/* REALTIME INSTANT SEARCH RESULTS PREVIEW DROPDOWN */}
          {(searchInputText.trim() || selectedSearchDestination || (selectedSearchTheme && selectedSearchTheme !== 'All Themes')) && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3 animate-fade-up">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-[#0A6FB5] flex items-center gap-1.5 bg-[#0A6FB5]/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> Realtime Matches ({realtimeMatchingPackages.length} Packages Found)
                </span>
                <Link
                  to={buildSearchUrl()}
                  className="text-xs font-bold text-[#0A6FB5] hover:underline flex items-center gap-1"
                >
                  <span>Explore All {realtimeMatchingPackages.length} Packages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {realtimeMatchingPackages.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs font-semibold text-slate-500">
                  No packages found matching your filter. Try selecting a different destination or theme!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {realtimeMatchingPackages.slice(0, 6).map((pkg) => (
                    <Link
                      key={pkg._id || pkg.slug}
                      to={`/package/${pkg.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group"
                    >
                      <img
                        src={pkg.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200'}
                        alt={pkg.title}
                        className="w-14 h-14 rounded-xl object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="overflow-hidden flex-1">
                        <span className="text-[9px] font-black uppercase text-[#0A6FB5]">{pkg.packageCode}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#0A6FB5] transition-colors">{pkg.title}</h4>
                        <div className="flex items-center justify-between text-[11px] mt-0.5">
                          <span className="text-slate-500 font-medium">{pkg.duration?.nights || 5}N / {pkg.duration?.days || 6}D</span>
                          <span className="font-black text-[#063B6D]">₹{(pkg.startingPrice || 0).toLocaleString()}/-</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* SECTION 1: DOMESTIC DESTINATIONS - 4 CARDS PER VIEW WITH HORIZONTAL SIDE SCROLLER */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 max-w-7xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1 rounded-full border border-[#0A6FB5]/20 inline-block mb-1.5">
              Incredible India
            </span>
            <h2 className="font-poppins font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Experience India's Magic, HolidayCity Style
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Where every journey becomes an unforgettable memory.
            </p>
          </div>

          {/* Side Scroller Arrow Controls (Left & Right) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollSide(domesticScrollRef, 'left')}
              className="w-10 h-10 rounded-full bg-white text-slate-800 hover:bg-[#0A6FB5] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Scroll Destinations Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollSide(domesticScrollRef, 'right')}
              className="w-10 h-10 rounded-full bg-white text-slate-800 hover:bg-[#0A6FB5] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Scroll Destinations Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Cards Per View Side Scroller Row */}
        <div
          ref={domesticScrollRef}
          className="flex items-center gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1 px-1 -mx-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {domesticDestinations.map((dest, i) => (
            <motion.div
              key={dest._id || i}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-[82vw] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] shrink-0 group relative h-64 sm:h-72 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-slate-100 flex flex-col justify-between p-3 border border-slate-200/70"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link to={`/destination/${dest.slug}`} className="block w-full h-full relative">
                <img
                  src={dest.banner}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Subtle bottom shadow overlay to keep the photo 100% bright & clear */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Top Glassmorphic Title Badge */}
                <div className="relative z-10 p-3 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-white/20 text-center shadow-lg">
                  <h3 className="font-poppins font-black text-sm uppercase tracking-wider text-white group-hover:text-[#57D0C9] transition-colors leading-tight line-clamp-1">
                    {dest.name}
                  </h3>
                  <span className="text-[11px] text-slate-200 font-extrabold block mt-0.5">
                    {dest.packageCount !== undefined ? dest.packageCount : 0} Tour Packages
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 2: INTERNATIONAL DESTINATIONS - 4 CARDS PER VIEW WITH HORIZONTAL SIDE SCROLLER */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1 rounded-full border border-[#0A6FB5]/20 inline-block mb-1.5">
              Global Getaways
            </span>
            <h2 className="font-poppins font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Explore the World, With Us
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Where your dream international holiday takes flight.
            </p>
          </div>

          {/* Side Scroller Arrow Controls (Left & Right) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollSide(intlScrollRef, 'left')}
              className="w-10 h-10 rounded-full bg-white text-slate-800 hover:bg-[#0A6FB5] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Scroll International Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollSide(intlScrollRef, 'right')}
              className="w-10 h-10 rounded-full bg-white text-slate-800 hover:bg-[#0A6FB5] hover:text-white border border-slate-200 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Scroll International Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Cards Per View Side Scroller Row */}
        <div
          ref={intlScrollRef}
          className="flex items-center gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1 px-1 -mx-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {intlDestinations.map((dest, i) => (
            <motion.div
              key={dest._id || i}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-[82vw] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] shrink-0 group relative h-64 sm:h-72 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-slate-100 flex flex-col justify-between p-3 border border-slate-200/70"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link to={`/destination/${dest.slug}`} className="block w-full h-full relative">
                <img
                  src={dest.banner}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Subtle bottom shadow overlay to keep the photo 100% bright & clear */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Top Glassmorphic Title Badge */}
                <div className="relative z-10 p-3 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-white/20 text-center shadow-lg">
                  <h3 className="font-poppins font-black text-sm uppercase tracking-wider text-white group-hover:text-[#57D0C9] transition-colors leading-tight line-clamp-1">
                    {dest.name}
                  </h3>
                  <span className="text-[11px] text-slate-200 font-extrabold block mt-0.5">
                    {dest.packageCount !== undefined ? dest.packageCount : 0} Tour Packages
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 3: OUR TRAVEL SPECIALIZATION - INCREASED SIZE & GRAND THEMING */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-1.5">
          <span className="text-xs font-black uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-4 py-1.5 rounded-full border border-[#0A6FB5]/20 inline-block">
            Specialized Collections
          </span>
          <h2 className="font-poppins font-black text-3xl sm:text-4xl text-slate-900">
            Our Travel Specialization
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Handcrafted tour package themes tailored to your unique vacation style.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side: 8 Theme Grid Cards (Original 4-Column Grid) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECIALIZATION_THEMES.map((theme) => {
              const uploadedBanner = themeBanners.find((tb) => tb.themeName === theme.name);
              const bannerImg = uploadedBanner?.imageUrl || theme.defaultBanner;

              return (
                <motion.div
                  key={theme.name}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                >
                  <Link
                    to={theme.link}
                    className="group relative h-40 sm:h-44 rounded-[18px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block border border-slate-200/50"
                  >
                    <img
                      src={bannerImg}
                      alt={theme.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                    <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white z-10">
                      <h3 className="font-poppins font-extrabold text-sm sm:text-base group-hover:text-[#57D0C9] transition-colors leading-snug drop-shadow-md">
                        {theme.name}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-300 opacity-90 mt-0.5 block">
                        {theme.rating}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side: Special Banner Slider with Carousel Controls (Exact 1080:967 Aspect Ratio) */}
          <div className="lg:col-span-4 w-full">
            <div
              className="special-banner rounded-[18px] overflow-hidden shadow-xl border border-slate-200/60 group relative w-full select-none"
              style={{ aspectRatio: '1080 / 967' }}
            >
              {effectiveSideBanners.length > 0 ? (
                <>
                  <Link
                    to={getBannerTargetUrl(effectiveSideBanners[currentSlide % effectiveSideBanners.length])}
                    className="block w-full h-full"
                  >
                    <img
                      src={effectiveSideBanners[currentSlide % effectiveSideBanners.length]?.imageUrl}
                      alt={effectiveSideBanners[currentSlide % effectiveSideBanners.length]?.title || 'Specialization Banner'}
                      className="w-full h-full rounded-[18px] block object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {effectiveSideBanners.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentSlide((prev) => (prev - 1 + effectiveSideBanners.length) % effectiveSideBanners.length);
                        }}
                        aria-label="Previous Banner"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all border border-white/30 z-20 hover:scale-110 opacity-80 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentSlide((prev) => (prev + 1) % effectiveSideBanners.length);
                        }}
                        aria-label="Next Banner"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all border border-white/30 z-20 hover:scale-110 opacity-80 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Carousel Indicator Dots */}
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
                        {effectiveSideBanners.map((_, idx) => {
                          const isActive = (currentSlide % effectiveSideBanners.length) === idx;
                          return (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentSlide(idx);
                              }}
                              aria-label={`Go to slide ${idx + 1}`}
                              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                isActive ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/50 hover:bg-white/90'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link to="/packages" className="block w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop"
                    alt="Specialization Banner"
                    className="w-full h-full rounded-[18px] block object-cover"
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: PROMO OFFER CARDS ROW */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1.5">
          <span className="text-xs font-black uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1 rounded-full border border-[#0A6FB5]/20 inline-block">
            Limited-Time Deals
          </span>
          <h2 className="font-poppins font-black text-3xl text-slate-900">
            Exclusive Promotional Offers
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Handpicked limited-time discount vouchers and destination deals.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(offerCardBanners.length > 0 ? offerCardBanners : [
            { title: 'Kedarnath Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Kedarnath' },
            { title: 'Thailand Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1506665531195-3566fe296661?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Thailand' },
            { title: 'Kullu Manali Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Manali' },
            { title: 'Goa Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Goa' }
          ]).map((b: any, idx: number) => {
            const targetUrl = getBannerTargetUrl(b);

            return (
              <motion.div key={b._id || idx} whileHover={{ y: -6, scale: 1.02 }}>
                <Link to={targetUrl} className="block group">
                  <div className="destination-banner relative h-48 sm:h-56 md:h-64 rounded-3xl overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-200/50">
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'Tour Package Offer'}
                      className="w-full h-full object-cover rounded-3xl group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Featured Tour Packages Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1 rounded-full border border-[#0A6FB5]/20 inline-block mb-1.5">
              Handpicked Vacation Deals
            </span>
            <h2 className="font-poppins font-black text-3xl text-slate-900">Featured Tour Packages</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Bespoke itineraries with price matching & verified luxury resort stays.</p>
          </div>
          <Link
            to="/packages"
            className="px-6 py-3 rounded-2xl bg-[#063B6D] hover:bg-[#0A6FB5] text-white font-extrabold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <span>View All Packages</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.slice(0, 6).map((pkg) => (
            <PackageCard
              key={pkg._id || pkg.slug}
              pkg={pkg}
              onEnquire={handleOpenEnquire}
            />
          ))}
        </div>
      </motion.section>

      {/* Trust & Satisfaction Metrics Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="bg-gradient-to-r from-[#063B6D] via-[#0A6FB5] to-[#063B6D] rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-white/20 relative overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Users className="w-7 h-7 text-[#57D0C9] mx-auto" />
              <p className="font-poppins font-black text-3xl text-white">25k+</p>
              <p className="text-xs font-bold text-slate-200">Happy Travelers</p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Award className="w-7 h-7 text-[#57D0C9] mx-auto" />
              <p className="font-poppins font-black text-3xl text-white">45k+</p>
              <p className="text-xs font-bold text-slate-200">Tours Completed</p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <ThumbsUp className="w-7 h-7 text-[#57D0C9] mx-auto" />
              <p className="font-poppins font-black text-3xl text-white">30k+</p>
              <p className="text-xs font-bold text-slate-200">5-Star Reviews</p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Star className="w-7 h-7 text-[#F6C65B] fill-current mx-auto" />
              <p className="font-poppins font-black text-3xl text-white">4.9 / 5.0</p>
              <p className="text-xs font-bold text-slate-200">Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        selectedPackage={selectedPackage}
        initialMode={enquiryModalMode}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
};
