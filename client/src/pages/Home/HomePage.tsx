import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, MapPin, Calendar, ShieldCheck, Headphones, Award, Heart, ChevronLeft, ChevronRight, MessageSquare, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';

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
  const [destinations, setDestinations] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [themeBanners, setThemeBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [selectedSearchDestination, setSelectedSearchDestination] = useState('');
  const [selectedSearchTheme, setSelectedSearchTheme] = useState('All Themes');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (selectedSearchDestination) params.set('destination', selectedSearchDestination);
    if (selectedSearchTheme && selectedSearchTheme !== 'All Themes') {
      params.set('theme', selectedSearchTheme);
    }
    const str = params.toString();
    return `/packages${str ? `?${str}` : ''}`;
  };

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
        apiClient.get('/packages?limit=12'),
        apiClient.get('/banners'),
        apiClient.get('/themes')
      ]);

      if (destRes.status === 'fulfilled' && destRes.value.data?.data) {
        setDestinations(destRes.value.data.data);
      }
      if (pkgRes.status === 'fulfilled' && pkgRes.value.data?.data) {
        setPackages(pkgRes.value.data.data);
      }
      if (banRes.status === 'fulfilled' && banRes.value.data?.data) {
        setBanners(banRes.value.data.data);
      }
      if (themeRes.status === 'fulfilled' && themeRes.value.data?.data) {
        setThemeBanners(themeRes.value.data.data);
      }
    } catch (_) {}
  };


  const explicitHeroBanners = banners.filter((b) => b.targetSection === 'HeroBanner');
  const homeBanners = banners.filter((b) => b.targetSection === 'HomeBanner');
  const effectiveHeroBanners = explicitHeroBanners.length > 0 
    ? explicitHeroBanners 
    : (homeBanners.length > 0 ? homeBanners : DEFAULT_HERO_BANNERS);

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

  const fetchData = async () => {
    try {
      const [destRes, pkgRes, banRes, themeRes] = await Promise.all([
        apiClient.get('/destinations'),
        apiClient.get('/packages?limit=12'),
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

  const handleOpenEnquire = (pkg?: any) => {
    setSelectedPackage(pkg || null);
    setEnquiryModalOpen(true);
  };

  const domesticDestinations = destinations.filter(
    (d) => d.category === 'Domestic' || (d.isDomestic !== false && (d.country?.isoCode === 'IN' || d.country?.name === 'India'))
  );
  const intlDestinations = destinations.filter(
    (d) => d.category === 'International' || (d.isDomestic === false && d.category !== 'Domestic')
  );

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

  return (
    <>
      <SEO
        title="HolidayCity | Explore. Experience. Enjoy."
        description="Book domestic & international tour packages with HolidayCity. Explore Kerala, Bali, Kashmir, Dubai, Maldives, Vietnam and more."
      />

      {/* Floating Vertical "Inquiry Now" Side Tab */}
      <button
        onClick={() => handleOpenEnquire()}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs px-2 py-4 rounded-r-2xl shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 cursor-pointer border-y border-r border-white/40 group"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <Sparkles className="w-4 h-4 animate-spin-slow rotate-90" />
        <span className="tracking-widest uppercase text-[11px]">Enquiry Now</span>
      </button>

      {/* Dynamic Hero Banner Carousel Section (Pure 1000x400 / 5:2 ratio banner slider) */}
      <section className="relative w-full overflow-hidden pt-28 sm:pt-32">
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

          {/* Dynamic Hero Carousel Navigation Controls */}
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

              {/* Bottom Hero Carousel Slide Indicators */}
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

      {/* Standalone Search Bar Widget (Positioned Directly Below Hero Image on Mobile) */}
      <section className="relative z-30 max-w-5xl mx-auto px-4 mt-4 sm:-mt-14 mb-8 sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-xl rounded-[28px] p-3 sm:p-4 shadow-2xl border border-slate-200/80 text-slate-800 text-left"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center gap-3 border border-slate-200/70 shadow-inner">
              <MapPin className="w-5 h-5 text-[#0A6FB5]" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination</label>
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

            <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center gap-3 border border-slate-200/70 shadow-inner">
              <Sparkles className="w-5 h-5 text-[#0A6FB5]" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Theme</label>
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

            <Link
              to={buildSearchUrl()}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" /> Search Packages
            </Link>
          </div>
        </motion.div>
      </section>

      {/* SECTION 1: DOMESTIC DESTINATIONS - "Experience India's Magic" */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <h2 className="font-['Outfit'] font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Experience India's Magic, HolidayCity Style
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm italic">
            Where every journey becomes a beautiful memory.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {domesticDestinations.map((dest, i) => (
            <Link
              key={dest._id || i}
              to={`/destination/${dest.slug}`}
              className="group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-slate-900 flex flex-col justify-end border border-slate-200/50"
            >
              <img
                src={dest.banner}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />

              <div className="relative z-10 p-3 text-center text-white">
                <h3 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider group-hover:text-[#57D0C9] transition-colors leading-tight line-clamp-1">
                  {dest.name}
                </h3>
                <span className="text-[10px] text-slate-300 font-medium block mt-0.5 opacity-90">
                  {dest.packageCount !== undefined ? dest.packageCount : 0} Tour Packages
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 2: INTERNATIONAL DESTINATIONS - "Explore the World, With Us" */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <h2 className="font-['Outfit'] font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Explore the World, With Us
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm italic">
            Where your travel dreams take flight with HolidayCity.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {intlDestinations.map((dest, i) => (
            <Link
              key={dest._id || i}
              to={`/destination/${dest.slug}`}
              className="group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-slate-900 flex flex-col justify-end border border-slate-200/50"
            >
              <img
                src={dest.banner}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />

              <div className="relative z-10 p-3 text-center text-white">
                <h3 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider group-hover:text-[#57D0C9] transition-colors leading-tight line-clamp-1">
                  {dest.name}
                </h3>
                <span className="text-[10px] text-slate-300 font-medium block mt-0.5 opacity-90">
                  {dest.packageCount !== undefined ? dest.packageCount : 0} Tour Packages
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: OUR TRAVEL SPECIALIZATION (DIRECTLY BELOW EXPLORE THE WORLD, WITH US) */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-block">
            Specialized Collections
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-3xl text-slate-900">
            Our Travel Specialization
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Handcrafted tour package themes tailored to your unique vacation style.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side: 8 Theme Grid Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECIALIZATION_THEMES.map((theme) => {
              const uploadedBanner = themeBanners.find((tb) => tb.themeName === theme.name);
              const bannerImg = uploadedBanner?.imageUrl || theme.defaultBanner;

              return (
                <Link
                  key={theme.name}
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
                    <h3 className="font-['Outfit'] font-extrabold text-sm sm:text-base group-hover:text-[#57D0C9] transition-colors leading-snug drop-shadow-md">
                      {theme.name}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-300 opacity-90 mt-0.5 block">
                      {theme.rating}
                    </span>
                  </div>
                </Link>
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

                  {/* Carousel Controls: Previous & Next Arrows */}
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
      </section>

      {/* SECTION 4: PROMO OFFER CARDS ROW (MATCHING IMAGE COPY 8.PNG) */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <h2 className="font-['Outfit'] font-extrabold text-3xl text-slate-900">
            Exclusive Promotional Offers
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Handpicked limited-time discount vouchers and destination deals.
          </p>
        </div>

        {/* 2 Columns on Mobile (col-6), 4 Columns on Desktop (col-lg-3) matching Minto Holidays */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(offerCardBanners.length > 0 ? offerCardBanners : [
            { title: 'Kedarnath Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Kedarnath' },
            { title: 'Thailand Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1506665531195-3566fe296661?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Thailand' },
            { title: 'Kullu Manali Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Manali' },
            { title: 'Goa Tour Package Offer', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop', linkUrl: '/packages?search=Goa' }
          ]).map((b: any, idx: number) => {
            const targetUrl = getBannerTargetUrl(b);

            return (
              <Link
                key={b._id || idx}
                to={targetUrl}
                className="block group"
              >
                <div className="destination-banner rounded-[18px] overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 bg-slate-900 border border-slate-200/50">
                  <img
                    src={b.imageUrl}
                    alt={b.title || 'Tour Package Offer'}
                    className="w-full h-auto rounded-[18px] block object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Tour Packages Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-200/60">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="font-['Outfit'] font-extrabold text-3xl text-slate-900">Featured Tour Packages</h2>
            <p className="text-slate-500 text-xs mt-1">Handpicked itineraries with guaranteed price matching & quality resort stays.</p>
          </div>
          <Link to="/packages" className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-[#0A6FB5] transition-all flex items-center gap-1.5">
            <span>View All Packages</span> <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg._id || pkg.slug}
              pkg={pkg}
              onEnquire={handleOpenEnquire}
            />
          ))}
        </div>
      </section>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        selectedPackage={selectedPackage}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
};
