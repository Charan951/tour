import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Sun, Calendar, Sparkles, Compass, ShieldCheck, ArrowLeft, Layers, ArrowRight, Zap, Star, Clock } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import { FALLBACK_DESTINATIONS, FALLBACK_PACKAGES, FALLBACK_THEMES, FALLBACK_ACTIVITIES } from '../../utils/mobileDataFallback';

export const DestinationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [dest, setDest] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedThemeFilter, setSelectedThemeFilter] = useState('All Themes');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [enquiryInitialMode, setEnquiryInitialMode] = useState<'enquiry' | 'booking'>('enquiry');

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/destinations');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let currentDest: any = null;

        // 1. Fetch Destination from API or Fallback
        try {
          const destRes = await apiClient.get(`/destinations/${slug}`);
          currentDest = destRes.data?.data;
        } catch (_) {}

        if (!currentDest) {
          currentDest = FALLBACK_DESTINATIONS.find(
            (d) =>
              d.slug === slug ||
              (d as any)._id === slug ||
              (d as any).id === slug ||
              d.name.toLowerCase().includes(slug?.toLowerCase() || '')
          ) || null;
        }

        if (!currentDest) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setDest(currentDest);

        // 2. Fetch Packages & Activities for Destination in parallel
        let pkgList: any[] = [];
        let actList: any[] = [];

        try {
          const destParam = currentDest._id || slug;
          const [pkgRes, actRes] = await Promise.all([
            apiClient.get(`/packages?destination=${destParam}`),
            apiClient.get(`/activities?destination=${destParam}`)
          ]);
          pkgList = pkgRes.data?.data || [];
          actList = actRes.data?.data || [];
        } catch (_) {}

        // Fallback Package Matcher
        if (pkgList.length === 0 && currentDest?.name) {
          const cleanName = currentDest.name.split(',')[0].toLowerCase().trim();
          pkgList = FALLBACK_PACKAGES.filter((p: any) => {
            const destStr = (typeof p.destination === 'string' ? p.destination : p.destination?.name || '').toLowerCase();
            const titleStr = (p.title || '').toLowerCase();
            const slugStr = (p.slug || '').toLowerCase();
            return (
              destStr.includes(cleanName) ||
              titleStr.includes(cleanName) ||
              slugStr.includes(cleanName) ||
              (cleanName.includes('telag') && (destStr.includes('telag') || titleStr.includes('telag') || destStr.includes('hyd') || titleStr.includes('hyd')))
            );
          });
        }

        // Fallback Activity Matcher
        if (actList.length === 0 && currentDest?.name) {
          const cleanName = currentDest.name.split(',')[0].toLowerCase().trim().replace(/beaches/gi, '').trim();
          const tokens = cleanName.split(/[\s&]+/).filter((t: string) => t.length >= 3);
          actList = FALLBACK_ACTIVITIES.filter((a: any) => {
            const destStr = (a.destinationName || a.location || '').toLowerCase();
            const titleStr = (a.title || '').toLowerCase();
            return (
              destStr.includes(cleanName) ||
              cleanName.includes(destStr) ||
              titleStr.includes(cleanName) ||
              tokens.some((tok: string) => destStr.includes(tok) || titleStr.includes(tok))
            );
          });
        }

        setPackages(pkgList);
        setActivities(actList);
      } catch (err) {
        console.error('Failed to fetch destination details', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-12 h-12 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading destination guide & tour packages...</p>
      </div>
    );
  }

  if (notFound || !dest) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto px-4 space-y-3">
        <h1 className="font-display font-black text-2xl text-ink">We don't have a guide for that yet</h1>
        <p className="text-sm text-slate-muted">
          That destination isn't published on the site — but a consultant can still build a trip there.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link to="/destinations" className="px-4 py-2 rounded-2xl2 bg-fill text-ink text-xs font-black uppercase tracking-wider">
            All destinations
          </Link>
          <Link to="/contact" className="px-4 py-2 rounded-2xl2 bg-ocean-600 text-white text-xs font-black uppercase tracking-wider">
            Ask a consultant
          </Link>
        </div>
      </div>
    );
  }

  const countryDisplay = dest.countryName || (typeof dest.country === 'object' ? dest.country?.name : (dest.category === 'Domestic' ? 'India' : 'International'));
  const destBanner = dest.banner || dest.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop';

  // Filter packages by theme
  const filteredPackages = selectedThemeFilter === 'All Themes'
    ? packages
    : packages.filter(p => (p.theme || p.themeName || '').toLowerCase() === selectedThemeFilter.toLowerCase());

  // Extract available themes for this destination
  const availableThemes = Array.from(
    new Set(
      packages.map(p => p.theme || p.themeName).filter(Boolean)
    )
  );

  return (
    <>
      <SEO
        title={`Explore ${dest.name} Tour Packages | HolidayCity`}
        description={dest.shortDescription || dest.overview || `Browse hand-crafted holiday packages for ${dest.name}. Best time to visit, top attractions, and custom itineraries.`}
        ogImage={destBanner}
      />

      {/* Clean Hero Banner */}
      <div className="relative h-72 sm:h-88 pt-14 flex items-center justify-center text-center text-white overflow-hidden">
        <img src={destBanner} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent pointer-events-none" />
        
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-16 left-4 sm:left-8 z-20 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 hover:bg-white transition-all active:scale-95 cursor-pointer"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>

        <div className="relative z-10 max-w-3xl px-4 space-y-2">
          <span className="text-[0.6875rem] sm:text-xs font-bold uppercase tracking-widest text-gold-500 bg-slate-900/60 px-3.5 py-1 rounded-full border border-white/20">
            TRAVEL GUIDE & PACKAGES
          </span>
          <h1 className="font-poppins font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">{dest.name}</h1>
        </div>
      </div>

      <div className="py-12 px-4 max-w-7xl mx-auto space-y-12">
        {/* Destination Guide Overview & Quick Facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 glass-card rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="font-poppins font-bold text-2xl text-slate-900">About {dest.name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{dest.overview || dest.shortDescription || dest.description}</p>
          </div>

          {/* DYNAMIC QUICK FACTS CARD */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-slate-200/80">
            <h3 className="font-poppins font-bold text-lg text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ocean-600" /> Quick Facts
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <p><strong className="text-slate-800 font-bold">Best Season:</strong> {Array.isArray(dest.bestTimeToVisit) ? dest.bestTimeToVisit.join(', ') : (dest.bestTime || 'Nov - Feb')}</p>
              <p><strong className="text-slate-800 font-bold">Weather:</strong> {dest.weather || 'Pleasant Tropical Breezes'}</p>
              <p><strong className="text-slate-800 font-bold">Country:</strong> {countryDisplay}</p>
            </div>
          </div>
        </div>

        {/* SECTION: RELATED TRAVEL THEMES */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3 py-1 rounded-full border border-ocean-600/20 inline-block mb-1.5">
                Handcrafted Collections
              </span>
              <h2 className="font-poppins font-extrabold text-2xl text-slate-900">
                Related Travel Themes for {dest.name}
              </h2>
            </div>

            {/* Interactive Theme Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
              <button
                onClick={() => setSelectedThemeFilter('All Themes')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedThemeFilter === 'All Themes'
                    ? 'bg-gradient-to-r from-ocean-600 to-cyan-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Packages ({packages.length})
              </button>

              {(availableThemes.length > 0 ? availableThemes : ['Family Tour', 'Honeymoon Tour', 'Leisure', 'Heritage']).map((tName: any) => (
                <button
                  key={tName}
                  onClick={() => setSelectedThemeFilter(tName)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    selectedThemeFilter === tName
                      ? 'bg-gradient-to-r from-ocean-600 to-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tName}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Collection Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {FALLBACK_THEMES.slice(0, 4).map((theme) => (
              <Link
                key={theme.name}
                to={`/packages?theme=${encodeURIComponent(theme.name)}`}
                className="group relative h-36 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 block"
              >
                <img
                  src={theme.imageUrl}
                  alt={theme.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end text-white z-10">
                  <h3 className="font-display font-black text-xs sm:text-sm group-hover:text-aqua-500 transition-colors leading-snug">
                    {theme.name}
                  </h3>
                  {theme.blurb && (
                    <span className="text-[0.6875rem] font-semibold text-white/80 mt-0.5 block">
                      {theme.blurb}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SECTION: RELATED ACTIVITIES FOR THIS DESTINATION */}
        {activities.length > 0 && (
          <div id="activities-section" className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-1.5">
                  Thrill & Outdoor Adventures
                </span>
                <h2 className="font-poppins font-extrabold text-2xl text-slate-900">
                  Activities & Things to Do in {dest.name}
                </h2>
              </div>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((act) => {
                const priceVal = act.startingPrice || act.price || 1500;
                const actSlug = act.slug || act._id;
                return (
                  <Link
                    key={act._id || act.activityCode || act.slug}
                    to={`/activities/${actSlug}`}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={act.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop'}
                        alt={act.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {act.category || 'Adventure'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{act.rating || 4.8}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-poppins font-bold text-slate-900 text-base group-hover:text-ocean-600 transition-colors line-clamp-1">
                          {act.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {act.duration || '2 Hours'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Starting from</span>
                          <span className="font-extrabold text-emerald-600 text-base">₹{priceVal.toLocaleString()}</span>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-ocean-50 text-ocean-600 font-bold text-xs group-hover:bg-ocean-600 group-hover:text-white transition-all flex items-center gap-1">
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: ALL PACKAGES FOR THIS DESTINATION */}
        <div id="packages-section" className="scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3 py-1 rounded-full">
                Customized Itineraries
              </span>
              <h2 className="font-poppins font-bold text-3xl text-slate-900 mt-2">
                All {dest.name} Tour Packages
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold mt-2 sm:mt-0">
              Showing {filteredPackages.length} {filteredPackages.length === 1 ? 'Package' : 'Packages'}
            </span>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-600 space-y-3 max-w-md mx-auto">
              <Compass className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-bold text-slate-800">No Packages Currently Found</h3>
              <p className="text-xs text-slate-500">Contact our travel consultants to get a custom quote for {dest.name}.</p>
              <button
                onClick={() => { setSelectedPackage(null); setEnquiryInitialMode('enquiry'); setEnquiryModalOpen(true); }}
                className="px-5 py-2.5 rounded-xl bg-ocean-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Request Custom Quote
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg._id || pkg.slug}
                  pkg={pkg}
                  onEnquire={(p, mode) => {
                    setSelectedPackage(p);
                    if (mode) setEnquiryInitialMode(mode);
                    setEnquiryModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        selectedPackage={selectedPackage}
        initialMode={enquiryInitialMode}
      />
    </>
  );
};
