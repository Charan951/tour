import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Zap, Calendar, Headphones, ShieldCheck, Compass, MessageSquare, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { ActivityBookingModal } from '../../components/modals/ActivityBookingModal';
import { MobilePackageCard } from '../Packages/MobilePackagesPage';
import { formatImageUrl } from '../../utils/imageUrl';
import CoverflowCarousel from '../../components/common/CoverflowCarousel';
import ScrollStack, { ScrollStackItem } from '../../components/common/ScrollStack';
import { FALLBACK_ACTIVITIES } from '../../utils/mobileDataFallback';
import { MobileHomePageSkeleton } from '../../components/common/Skeleton';
import { NotificationBell } from '../../components/common/NotificationBell';

/* ─────────────────────────────────────────
   Mobile Home Screen — matches Flutter home_screen.dart _buildHomeContent()
───────────────────────────────────────── */

interface MobileHomePageProps {
  destinations: any[];
  packages: any[];
  activities?: any[];
  banners: any[];
  themeBanners: any[];
  defaultHeroBanners: any[];
  defaultThemes: any[];
}

export const MobileHomePage: React.FC<MobileHomePageProps> = ({
  destinations,
  packages,
  activities = [],
  banners,
  themeBanners,
  defaultHeroBanners,
  defaultThemes,
}) => {
  const navigate = useNavigate();
  const [heroSlide, setHeroSlide] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');

  // Activity Enquiry & Booking modal states
  const [selectedAct, setSelectedAct] = useState<any | null>(null);
  const [actModalMode, setActModalMode] = useState<'booking' | 'enquiry'>('booking');
  const [actModalOpen, setActModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    navigate(q ? `/packages?search=${encodeURIComponent(q)}` : '/packages');
  };

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

  // Split destinations into India (domestic) vs International — same predicate as HomePage.tsx.
  const isIndia = (d: any) =>
    d.category === 'Domestic' ||
    (d.isDomestic !== false &&
      (d.country?.isoCode === 'IN' || d.country?.name === 'India' || d.country === 'India' || !d.country));
  const indiaDestinations = destinations.filter(isIndia);
  const intlDestinations = destinations.filter((d: any) => !isIndia(d));

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

  const isLoading = packages.length === 0 && destinations.length === 0 && banners.length === 0 && defaultHeroBanners.length === 0;

  if (isLoading) {
    return <MobileHomePageSkeleton />;
  }

  return (
    <>
      {/* ── App bar: logo, greeting, notification bell and a search field ── */}
      <div className="relative overflow-hidden bg-[#F1F5F9] dark:bg-gradient-to-br dark:from-ocean-800 dark:via-ocean-700 dark:to-cyan-700 border-b border-slate-200/90 dark:border-white/10 px-4 pt-5 pb-6 rounded-b-[28px] shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="relative font-display font-black text-2xl tracking-tight text-slate-900 dark:text-white">
            Holiday<span className="text-aqua-500 dark:text-cyan-300">City</span>
          </h2>
          <NotificationBell forceMobile={true} />
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-ocean-600 to-aqua-500 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0 border border-white/20">
              {(userName || 'E')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-black text-xl text-slate-900 dark:text-white leading-tight truncate">
                {userName ? `Hello, ${userName} ` : 'Hello, Explorer '}
                <span className="inline-block align-middle">👋</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-sky-100/90 font-medium truncate">Where do you want to travel next?</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative z-10 mt-5 flex items-center gap-2 bg-white border border-slate-300/80 dark:border-white/20 rounded-2xl shadow-sm pl-4 pr-1.5 h-14"
        >
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search packages, destinations, activities..."
            className="flex-1 h-full bg-transparent outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Search"
            className="w-10 h-10 rounded-xl bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white grid place-items-center transition shrink-0 shadow-md"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Content flows in the page scroll. NOTE: no `overflow-y-auto` here — it never
          actually scrolled (content-height) and it silently breaks `position: sticky`
          for descendants (e.g. the ScrollStack in Trending Packages).
          pb-40 clears the fixed MobileStickyBar (nav pills + Call/WhatsApp/Enquire
          row on the home route). */}
      <div className="pt-4 pb-72">

        {/* ── Hero Banner Slider (height: 240px matching Flutter) ── */}
        {effectiveBanners.length > 0 && (
          <div className="px-2 mt-2">
            <div className="relative rounded-2xl2 overflow-hidden shadow-md" style={{ height: 165 }}>
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
                      className="w-full h-full object-fill"
                    />
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
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'w-[18px] bg-ocean-600' : 'w-1.5 bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── India Tours — fanned coverflow carousel ── */}
        {indiaDestinations.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <span className="block font-script text-xl leading-none text-ocean-800 -mb-0.5">Domestic Destinations</span>
                <h2 className="font-bold text-base text-slate-900">India Tours</h2>
              </div>
              <Link to="/destinations?region=Domestic" className="text-ocean-600 text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CoverflowCarousel
              className="px-4"
              ctaLabel="Contact Us"
              items={indiaDestinations.slice(0, 8).map((dest: any, i: number) => ({
                id: dest._id || String(i),
                image: formatImageUrl(dest.image || dest.imageUrl || dest.banner, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'),
                title: dest.name,
                subtitle: [safeStr(dest.state), safeStr(dest.country)].filter(Boolean).join(', '),
                href: `/destination/${dest.slug}`,
              }))}
            />
          </div>
        )}

        {/* ── International Tours — fanned coverflow carousel ── */}
        {intlDestinations.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <span className="block font-script text-xl leading-none text-ocean-800 -mb-0.5">International Destinations</span>
                <h2 className="font-bold text-base text-slate-900">International Tours</h2>
              </div>
              <Link to="/destinations?region=International" className="text-ocean-600 text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CoverflowCarousel
              className="px-4"
              ctaLabel="Contact Us"
              items={intlDestinations.slice(0, 8).map((dest: any, i: number) => ({
                id: dest._id || String(i),
                image: formatImageUrl(dest.image || dest.imageUrl || dest.banner, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'),
                title: dest.name,
                subtitle: [safeStr(dest.state), safeStr(dest.country)].filter(Boolean).join(', '),
                href: `/destination/${dest.slug}`,
              }))}
            />
          </div>
        )}

        {/* ── Specialization Themes Horizontal Scroll ── */}
        {effectiveThemes.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">Specialization Themes</h2>
                <p className="text-[0.6875rem] text-slate-500 mt-0.5">Find tours tailored to your travel style</p>
              </div>
              <Link to="/themes" className="text-ocean-600 text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2 px-4 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {effectiveThemes.slice(0, 6).map((theme: any, i: number) => {
                const themeName = theme.themeName || theme.name || theme.title || 'Theme';
                const rawImg = theme.imageUrl || theme.defaultBanner || theme.image || theme.banner;
                const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400');
                const link = `/packages?category=${encodeURIComponent(themeName)}`;
                return (
                  <Link
                    key={theme._id || i}
                    to={link}
                    className="shrink-0 relative rounded-2xl2 overflow-hidden shadow-md"
                    style={{ width: 148, height: 210 }}
                  >
                    <img src={imgUrl} alt={themeName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-sm line-clamp-2 leading-tight drop-shadow">{themeName}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Thrill & Adventure Activities Section ── */}
        {activities.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  Thrill & Adventure Activities ⚡
                </h2>
                <p className="text-[0.6875rem] text-slate-500 mt-0.5">Bungee jumping, rafting, scuba diving & safari</p>
              </div>
              <Link to="/activities" className="text-ocean-600 text-xs font-bold flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2 px-4 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {activities.slice(0, 6).map((act: any, i: number) => {
                const unitPrice = Number(act.startingPrice || act.price || 1500);
                const coverImg = formatImageUrl(act.coverImage || act.image, 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600');
                return (
                  <div
                    key={act._id || i}
                    className="shrink-0 relative rounded-2xl2 overflow-hidden shadow-md bg-white border border-slate-200 flex flex-col justify-between"
                    style={{ width: 165, height: 180 }}
                  >
                    <div className="relative h-24 overflow-hidden">
                      <img src={coverImg} alt={act.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px]">
                        {act.category || 'Adventure'}
                      </span>
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-slate-900 font-bold text-xs line-clamp-1">{act.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{act.location || act.destinationName}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-black text-xs text-ocean-600">₹{unitPrice.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedAct(act);
                              setActModalMode('enquiry');
                              setActModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]"
                          >
                            Enquire
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAct(act);
                              setActModalMode('booking');
                              setActModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-ocean-600 text-white font-bold text-[10px]"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trending Tour Packages List (matches Flutter PackageCard list) ── */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">Trending Tour Packages</h2>
              <p className="text-[0.6875rem] text-slate-500 mt-0.5">Exclusive deals curated for you</p>
            </div>
            <Link to="/packages" className="text-ocean-600 text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No packages yet</div>
          ) : (
            <ScrollStack stackTop={16} fan={10} minScale={0.93}>
              {packages.slice(0, 6).map((pkg: any, i: number) => (
                <ScrollStackItem key={pkg._id || i}>
                  <MobilePackageCard
                    pkg={pkg}
                    onBookNow={(p) => {
                      setSelectedPkg(p || pkg);
                      setEnquiryOpen(true);
                    }}
                  />
                </ScrollStackItem>
              ))}
            </ScrollStack>
          )}
        </div>

        {/* ── How to Book (4-Step Ultra-Stylish Light Guide) ── */}
        <div className="mt-3 px-4">
          <div className="relative rounded-[28px] p-5 bg-gradient-to-b from-white via-sky-50/50 to-blue-50/40 border border-slate-200/90 shadow-[0_12px_36px_rgba(6,59,109,0.08)] overflow-hidden">
            {/* Background Decorative Blur Rings */}
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-ocean-600/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-600/10 blur-3xl" />

            {/* Header */}
            <div className="relative z-10 text-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-600/10 text-ocean-700 font-extrabold text-[10px] uppercase tracking-widest border border-ocean-600/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-ocean-600" /> How It Works
              </span>
              <h2 className="font-display font-black text-xl text-slate-900 mt-2 tracking-tight">
                Book Your Trip In <span className="text-ocean-600">4 Easy Steps</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium max-w-xs mx-auto">
                Simple, transparent &amp; personalized holiday planning
              </p>
            </div>

            {/* Stepper Cards list with connecting gradient vertical line */}
            <div className="relative z-10 space-y-3">
              {/* Connecting Line */}
              <div className="absolute left-[21px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-ocean-500 via-sky-400 to-emerald-500 opacity-40 pointer-events-none" />

              {[
                {
                  step: '01',
                  icon: Compass,
                  title: 'Explore & Select Package',
                  desc: 'Browse hand-picked destinations, holiday packages or specialized travel themes.',
                  badge: '100+ Tours',
                  numBg: 'bg-gradient-to-tr from-ocean-700 to-ocean-500 text-white shadow-md shadow-ocean-600/20',
                  badgeBg: 'bg-ocean-50 text-ocean-700 border-ocean-200',
                  iconColor: 'text-ocean-600'
                },
                {
                  step: '02',
                  icon: MessageSquare,
                  title: 'Submit Booking Enquiry',
                  desc: 'Select preferred travel dates, guests, and tap Enquire or Book Now.',
                  badge: 'Free Quote',
                  numBg: 'bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20',
                  badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
                  iconColor: 'text-sky-600'
                },
                {
                  step: '03',
                  icon: Headphones,
                  title: 'Personalized Itinerary',
                  desc: 'Our expert travel consultant calls to customize hotels, transfers & activities for your budget.',
                  badge: '1-on-1 Support',
                  numBg: 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20',
                  badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
                  iconColor: 'text-amber-600'
                },
                {
                  step: '04',
                  icon: CheckCircle2,
                  title: 'Confirm & Enjoy Trip!',
                  desc: 'Make secure advance payment, receive instant vouchers, and embark on your vacation.',
                  badge: 'Instant Vouchers',
                  numBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20',
                  badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  iconColor: 'text-emerald-600'
                }
              ].map(({ step, icon: Icon, title, desc, badge, numBg, badgeBg, iconColor }) => (
                <div
                  key={step}
                  className="relative flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_16px_rgba(6,59,109,0.04)] hover:shadow-md transition-all duration-300 group"
                >
                  {/* Stepper Circle */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl ${numBg} font-mono font-black text-xs flex items-center justify-center shrink-0 border border-white group-hover:scale-105 transition-transform`}>
                    {step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <h3 className="font-bold text-xs text-slate-900 leading-tight flex items-center gap-1.5 truncate">
                        <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                        <span className="truncate">{title}</span>
                      </h3>
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${badgeBg}`}>
                        {badge}
                      </span>
                    </div>
                    <p className="text-[0.72rem] text-slate-500 leading-relaxed font-normal">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA Bar */}
            <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-200/80 text-center">
              <Link
                to="/packages"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-700 text-white font-extrabold text-xs shadow-md shadow-ocean-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Browse All Tour Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Extra bottom spacer to ensure the last package card and its buttons clear MobileStickyBar */}
        <div className="h-32" aria-hidden="true" />
      </div>

      {/* Enquiry Modal */}
      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        selectedPackage={selectedPkg}
      />

      {/* Activity Booking & Enquiry Modal */}
      {selectedAct && (
        <ActivityBookingModal
          activity={selectedAct}
          isOpen={actModalOpen}
          initialMode={actModalMode}
          onClose={() => setActModalOpen(false)}
        />
      )}
    </>
  );
};
