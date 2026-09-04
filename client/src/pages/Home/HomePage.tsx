import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, MapPin, Calendar, ShieldCheck, Headphones, Award, Heart, ChevronLeft, ChevronRight, MessageSquare, Phone, ArrowRight, Star, Users, ThumbsUp, Compass, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { formatImageUrl, formatSrcSet } from '../../utils/imageUrl';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import CoverflowCarousel from '../../components/common/CoverflowCarousel';
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
  { name: 'Honeymoon Tour', blurb: 'Private, unhurried, romantic', defaultBanner: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Honeymoon+Tour' },
  { name: 'Leisure', blurb: 'Slow days, easy pace', defaultBanner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Leisure' },
  { name: 'Hill Station', blurb: 'Cool air and long views', defaultBanner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Hill+Station' },
  { name: 'Trekking', blurb: 'Guided routes, real trails', defaultBanner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Trekking' },
  { name: 'Adventure', blurb: 'Water, air and adrenaline', defaultBanner: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Adventure' },
  { name: 'Religious', blurb: 'Pilgrimage circuits, planned well', defaultBanner: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Religious' },
  { name: 'Family Tour', blurb: 'Comfortable for every age', defaultBanner: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Family+Tour' },
  { name: 'Wildlife Safari', blurb: 'Parks, lodges and early starts', defaultBanner: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?q=80&w=800&auto=format&fit=crop', link: '/packages?theme=Wildlife+Safari' }
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
  const [heroPaused, setHeroPaused] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
    // Live updates are event-driven: apiClient dispatches `hc_data_updated` after any
    // mutation (and the socket layer forwards remote changes to it). The interval is
    // only a slow safety net for a tab left open for a long time.
    const handleDataUpdate = () => fetchDataSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      if (!document.hidden) fetchDataSilently();
    }, 120000);
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
    if (prefersReducedMotion || heroPaused || effectiveHeroBanners.length <= 1) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setHeroSlide((prev) => (prev + 1) % effectiveHeroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [effectiveHeroBanners.length, prefersReducedMotion, heroPaused]);

  useEffect(() => {
    if (prefersReducedMotion || banners.length === 0) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners, prefersReducedMotion]);

  // Auto-scroll Domestic Destinations Carousel
  useEffect(() => {
    if (prefersReducedMotion || domesticDestinations.length <= 4) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
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
  }, [domesticDestinations.length, prefersReducedMotion]);

  // Auto-scroll International Destinations Carousel
  useEffect(() => {
    if (prefersReducedMotion || intlDestinations.length <= 4) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
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
  }, [intlDestinations.length, prefersReducedMotion]);

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

      <h1 className="sr-only">
        HolidayCity — custom domestic and international holiday packages, planned with a personal travel consultant
      </h1>

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
                    src={formatImageUrl(imgUrl, undefined, 2000)}
                    srcSet={formatSrcSet(imgUrl, [768, 1280, 1920, 2400])}
                    sizes="100vw"
                    alt={slide.title || 'HolidayCity holiday destination'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
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

              {/* Slide Indicator Dots + pause toggle */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
                {effectiveHeroBanners.map((_, idx) => {
                  const isActive = (heroSlide % effectiveHeroBanners.length) === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setHeroSlide(idx)}
                      aria-label={`Go to hero slide ${idx + 1}`}
                      className={`relative h-2.5 rounded-full transition-all duration-500 cursor-pointer after:absolute after:-inset-2 after:content-[''] ${
                        isActive ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white'
                      }`}
                    />
                  );
                })}
                {!prefersReducedMotion && (
                  <button
                    onClick={() => setHeroPaused((p) => !p)}
                    aria-label={heroPaused ? 'Resume slideshow' : 'Pause slideshow'}
                    className="ml-2 w-8 h-8 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer"
                  >
                    {heroPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                )}
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
          className="glass-card rounded-3xl2 p-4 sm:p-5 shadow-2xl border border-white/80 text-slate-800 text-left relative"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* 1. Keyword Search Input */}
            <div className="lg:col-span-3 p-3.5 rounded-2xl bg-slate-50/90 flex items-center gap-3 border border-slate-200/80 shadow-inner">
              <Search className="w-5 h-5 text-ocean-600 shrink-0" />
              <div className="w-full">
                <label className="block text-[0.6875rem] uppercase font-black text-slate-500 tracking-wider">Search Keyword</label>
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
              <MapPin className="w-5 h-5 text-ocean-600 shrink-0" />
              <div className="w-full">
                <label className="block text-[0.6875rem] uppercase font-black text-slate-500 tracking-wider">Destination</label>
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
              <Sparkles className="w-5 h-5 text-ocean-600 shrink-0" />
              <div className="w-full">
                <label className="block text-[0.6875rem] uppercase font-black text-slate-500 tracking-wider">Travel Theme</label>
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
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-600 text-white font-extrabold text-xs lg:text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 overflow-hidden whitespace-nowrap shimmer-sheen"
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
                <span className="text-xs font-black text-ocean-600 flex items-center gap-1.5 bg-ocean-600/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> Realtime Matches ({realtimeMatchingPackages.length} Packages Found)
                </span>
                <Link
                  to={buildSearchUrl()}
                  className="text-xs font-bold text-ocean-600 hover:underline flex items-center gap-1"
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
                        <span className="text-[0.6875rem] font-black uppercase text-ocean-600">{pkg.packageCode}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate group-hover:text-ocean-600 transition-colors">{pkg.title}</h4>
                        <div className="flex items-center justify-between text-[0.6875rem] mt-0.5">
                          <span className="text-slate-500 font-medium">{pkg.duration?.nights || 5}N / {pkg.duration?.days || 6}D</span>
                          <span className="font-black text-ocean-800">₹{(pkg.startingPrice || 0).toLocaleString()}/-</span>
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
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="block font-script text-3xl sm:text-[2.5rem] leading-none text-ocean-800 -mb-1">
            Top Destination
          </span>
          <h2 className="font-poppins font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Experience India's Magic, HolidayCity Style
          </h2>
        </div>

        {/* Fanned coverflow carousel of India destinations */}
        <CoverflowCarousel
          ctaLabel="Contact Us"
          items={domesticDestinations.slice(0, 9).map((dest, i) => ({
            id: dest._id || String(i),
            image: dest.banner || dest.image || dest.imageUrl,
            title: dest.name,
            subtitle:
              dest.packageCount !== undefined
                ? `${dest.packageCount} tour package${dest.packageCount === 1 ? '' : 's'}`
                : (dest.state || dest.country || ''),
            href: `/destination/${dest.slug}`,
          }))}
        />
      </motion.section>

      {/* SECTION 2: INTERNATIONAL DESTINATIONS - 4 CARDS PER VIEW WITH HORIZONTAL SIDE SCROLLER */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="block font-script text-3xl sm:text-[2.5rem] leading-none text-ocean-800 -mb-1">
            Top Destination
          </span>
          <h2 className="font-poppins font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Explore the World, With Us
          </h2>
        </div>

        {/* Fanned coverflow carousel of international destinations */}
        <CoverflowCarousel
          ctaLabel="Contact Us"
          items={intlDestinations.slice(0, 9).map((dest, i) => ({
            id: dest._id || String(i),
            image: dest.banner || dest.image || dest.imageUrl,
            title: dest.name,
            subtitle:
              dest.packageCount !== undefined
                ? `${dest.packageCount} tour package${dest.packageCount === 1 ? '' : 's'}`
                : (dest.state || dest.country || ''),
            href: `/destination/${dest.slug}`,
          }))}
        />
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
          <span className="text-xs font-black uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-4 py-1.5 rounded-full border border-ocean-600/20 inline-block">
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
                    className="group relative h-40 sm:h-44 rounded-2xl2 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block border border-slate-200/50"
                  >
                    <img
                      src={bannerImg}
                      alt={theme.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                    <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white z-10">
                      <h3 className="font-display font-black text-sm sm:text-base group-hover:text-aqua-300 transition-colors leading-snug drop-shadow-md">
                        {theme.name}
                      </h3>
                      <span className="text-[0.6875rem] font-semibold text-white/85 mt-0.5 block">
                        {theme.blurb}
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
              className="special-banner rounded-2xl2 overflow-hidden shadow-xl border border-slate-200/60 group relative w-full select-none"
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
                      className="w-full h-full rounded-2xl2 block object-cover group-hover:scale-105 transition-transform duration-500"
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
                    className="w-full h-full rounded-2xl2 block object-cover"
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
          <span className="text-xs font-black uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3.5 py-1 rounded-full border border-ocean-600/20 inline-block">
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

      {/* Why HolidayCity — value section above the packages */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Photo collage */}
          <div className="relative">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-1/2 rounded-[2.25rem] overflow-hidden shadow-raised" style={{ aspectRatio: '3 / 4.4' }}>
                <img
                  src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=800&auto=format&fit=crop"
                  alt="Traveler looking out over a mountain range"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="w-1/2 flex flex-col gap-3 sm:gap-4">
                <div className="rounded-3xl overflow-hidden shadow-card" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=700&auto=format&fit=crop"
                    alt="Kayaking on a still mountain lake"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-card flex-1 min-h-[180px]">
                  <img
                    src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=700&auto=format&fit=crop"
                    alt="Friends taking a photo together while travelling"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <div className="absolute left-[calc(50%-6px)] top-[46%] -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-raised grid place-items-center">
              <Compass className="w-6 h-6 text-ocean-600" />
            </div>

            <div className="absolute -bottom-5 left-[38%] bg-white rounded-2xl shadow-card px-4 py-2.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-ocean-600/10 grid place-items-center shrink-0">
                <Heart className="w-4 h-4 text-ocean-600" />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.6875rem] font-bold text-slate-500">Every trip</span>
                <span className="block text-sm font-black text-slate-900">Human-planned</span>
              </span>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span className="font-script text-3xl sm:text-[2.5rem] leading-none text-ocean-600">Let's plan it together</span>
            <h2 className="font-poppins font-black text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.12] text-slate-900 mt-2">
              Your trip deserves more than <span className="text-ocean-600">just a booking</span>
            </h2>
            <div className="w-16 h-1 rounded-full bg-ocean-600/30 my-6" />
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg">
              Choosing the right travel partner isn&rsquo;t about tickets &mdash; it&rsquo;s about confidence,
              comfort, and a real person who knows the destination. That&rsquo;s what HolidayCity is built to give you.
            </p>

            <div className="mt-8 space-y-4 max-w-xl">
              {[
                { icon: Users, title: 'One consultant, end to end', body: 'A named travel expert owns your trip from the first call to the last day.' },
                { icon: Sparkles, title: 'Built around you', body: 'No cookie-cutter packages — a plan shaped to your dates, budget and pace, with support the whole way.' },
              ].map((f) => (
                <div key={f.title} className="glass-card-solid rounded-3xl p-5 flex items-start gap-4">
                  <span className="w-12 h-12 rounded-2xl2 bg-ocean-600 text-white grid place-items-center shrink-0">
                    <f.icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-poppins font-black text-base text-slate-900">{f.title}</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{f.body}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 mt-1" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="px-7 py-3.5 rounded-2xl2 bg-ocean-600 hover:bg-ocean-700 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised transition flex items-center gap-2"
              >
                About us <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="font-script text-xl text-ocean-600/80">Know our story</span>
            </div>
          </div>
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
            <span className="text-xs font-black uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3.5 py-1 rounded-full border border-ocean-600/20 inline-block mb-1.5">
              Handpicked Vacation Deals
            </span>
            <h2 className="font-poppins font-black text-3xl text-slate-900">Featured Tour Packages</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Bespoke itineraries with price matching & verified luxury resort stays.</p>
          </div>
          <Link
            to="/packages"
            className="px-6 py-3 rounded-2xl bg-ocean-800 hover:bg-ocean-600 text-white font-extrabold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer border border-white/20"
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

      {/* How working with HolidayCity actually goes */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="bg-gradient-to-r from-ocean-800 via-ocean-600 to-ocean-800 rounded-3xl p-8 sm:p-12 text-white shadow-glass border border-white/20 relative overflow-hidden">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center mt-8">
            {[
              { icon: Compass, t: 'Tell us the trip', d: 'Dates, group, rough budget, the kind of holiday you want.' },
              { icon: Users, t: 'A consultant takes it', d: 'One named person owns your trip from first call to last day.' },
              { icon: Award, t: 'You get a real quote', d: 'A firm, itemised itinerary and price — usually the same day.' },
              { icon: ThumbsUp, t: 'Pay when it is right', d: 'Nothing changes hands until the plan is confirmed by you.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="space-y-2 p-5 rounded-2xl bg-white/10 border border-white/10">
                <Icon className="w-7 h-7 text-aqua-300 mx-auto" />
                <p className="font-display font-black text-base text-white">{t}</p>
                <p className="text-xs font-medium text-white/80 leading-relaxed">{d}</p>
              </div>
            ))}
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
