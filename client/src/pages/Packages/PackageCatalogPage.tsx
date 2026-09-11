import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Compass, Flag, Globe, ChevronDown, X, ArrowUpDown } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import { isPackageMatchingTheme } from '../../utils/themeMatcher';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';

const THEME_FILTERS = [
  { name: 'All Themes', icon: '✨' },
  { name: 'Honeymoon Tour', icon: '💖' },
  { name: 'Leisure', icon: '🌴' },
  { name: 'Hill Station', icon: '🏔️' },
  { name: 'Trekking', icon: '🧗' },
  { name: 'Adventure', icon: '🏄' },
  { name: 'Religious', icon: '🛕' },
  { name: 'Family Tour', icon: '👨‍👩‍👧‍👦' },
  { name: 'Wildlife Safari', icon: '🦁' }
];

export const PackageCatalogPage: React.FC = () => {
  useRealtimeUpdates();
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTheme, setSelectedTheme] = useState(searchParams.get('theme') || 'All Themes');
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'Domestic' | 'International'>('All');
  const [selectedDestination, setSelectedDestination] = useState(searchParams.get('destination') || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'days_asc' | 'days_desc'>('featured');

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [packages]);

  useEffect(() => {
    const themeParam = searchParams.get('theme');
    if (themeParam && themeParam !== selectedTheme) {
      setSelectedTheme(themeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDestinations();
    fetchPackages();
    const handleDataUpdate = () => fetchPackagesSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
    };
  }, [searchQuery, selectedTheme, selectedRegion, selectedDestination, sortBy]);

  const fetchPackagesSilently = async () => {
    try {
      let url = `/packages?limit=100`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedDestination) url += `&destination=${encodeURIComponent(selectedDestination)}`;
      const res = await apiClient.get(url);
      let fetched = res.data.data || [];

      if (selectedTheme !== 'All Themes' && selectedTheme !== 'All') {
        fetched = fetched.filter((p: any) => isPackageMatchingTheme(p, selectedTheme));
      }
      if (selectedRegion === 'Domestic') {
        fetched = fetched.filter((p: any) => {
          const d = p.destination;
          return typeof d === 'object' && d !== null ? (d.category === 'Domestic' || d.isDomestic !== false) : true;
        });
      } else if (selectedRegion === 'International') {
        fetched = fetched.filter((p: any) => {
          const d = p.destination;
          return typeof d === 'object' && d !== null ? (d.category === 'International' || d.isDomestic === false) : false;
        });
      }

      // Sort
      if (sortBy === 'price_asc') {
        fetched.sort((a: any, b: any) => (Number(a.price || a.startingPrice) || 0) - (Number(b.price || b.startingPrice) || 0));
      } else if (sortBy === 'price_desc') {
        fetched.sort((a: any, b: any) => (Number(b.price || b.startingPrice) || 0) - (Number(a.price || a.startingPrice) || 0));
      } else if (sortBy === 'days_asc') {
        fetched.sort((a: any, b: any) => (Number(a.duration?.days) || 0) - (Number(b.duration?.days) || 0));
      } else if (sortBy === 'days_desc') {
        fetched.sort((a: any, b: any) => (Number(b.duration?.days) || 0) - (Number(a.duration?.days) || 0));
      }

      setPackages(fetched);
    } catch (_) {}
  };

  const fetchDestinations = async () => {
    try {
      const res = await apiClient.get('/destinations');
      setDestinations(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch destinations dropdown', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      let url = `/packages?limit=100`;

      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedDestination) url += `&destination=${encodeURIComponent(selectedDestination)}`;

      const res = await apiClient.get(url);
      let fetched = res.data.data || [];

      if (selectedTheme !== 'All Themes' && selectedTheme !== 'All') {
        fetched = fetched.filter((p: any) => isPackageMatchingTheme(p, selectedTheme));
      }

      if (selectedRegion === 'Domestic') {
        fetched = fetched.filter((p: any) => {
          const d = p.destination;
          return typeof d === 'object' && d !== null ? (d.category === 'Domestic' || d.isDomestic !== false) : true;
        });
      } else if (selectedRegion === 'International') {
        fetched = fetched.filter((p: any) => {
          const d = p.destination;
          return typeof d === 'object' && d !== null ? (d.category === 'International' || d.isDomestic === false) : false;
        });
      }

      // Sort
      if (sortBy === 'price_asc') {
        fetched.sort((a: any, b: any) => (Number(a.price || a.startingPrice) || 0) - (Number(b.price || b.startingPrice) || 0));
      } else if (sortBy === 'price_desc') {
        fetched.sort((a: any, b: any) => (Number(b.price || b.startingPrice) || 0) - (Number(a.price || a.startingPrice) || 0));
      } else if (sortBy === 'days_asc') {
        fetched.sort((a: any, b: any) => (Number(a.duration?.days) || 0) - (Number(b.duration?.days) || 0));
      } else if (sortBy === 'days_desc') {
        fetched.sort((a: any, b: any) => (Number(b.duration?.days) || 0) - (Number(a.duration?.days) || 0));
      }

      setPackages(fetched);
    } catch (err) {
      console.error('Failed to fetch package catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const [enquiryModalMode, setEnquiryModalMode] = useState<'enquiry' | 'booking'>('enquiry');

  const handleOpenEnquire = (pkg: any, initialMode: 'enquiry' | 'booking' = 'enquiry') => {
    setSelectedPackage(pkg);
    setEnquiryModalMode(initialMode);
    setEnquiryModalOpen(true);
  };

  const hasActiveFilters = searchQuery || selectedDestination || (selectedTheme !== 'All Themes' && selectedTheme !== 'All') || selectedRegion !== 'All' || sortBy !== 'featured';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDestination('');
    setSelectedTheme('All Themes');
    setSelectedRegion('All');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <>
      <SEO
        title="Tour Packages Catalog | HolidayCity"
        description="Browse all domestic and international holiday tour packages with custom day itineraries."
      />

      <div className="pt-14 sm:pt-[60px] pb-12 px-4 max-w-7xl mx-auto space-y-4">
        
        {/* Sleek Compact Header - Restored Starting Text */}
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-[0.65rem] font-black uppercase tracking-widest text-ocean-600 bg-ocean-50 border border-ocean-200/80 px-3 py-0.5 rounded-full inline-block">
            Holiday Directory
          </span>
          <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 leading-tight">
            Hand-Crafted Tour Packages Catalog
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Explore hand-crafted holiday itineraries with transparent pricing, 4-star resorts, and private transfers.
          </p>
        </div>

        {/* Compact & Professional Clean Filter Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm space-y-3 text-left">
          
          {/* Row 1: Search Box + Destination Dropdown + Region Switcher + Sort By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
            
            {/* 1. Search Box (4 cols) */}
            <div className="lg:col-span-4 relative">
              <Search className="w-3.5 h-3.5 text-ocean-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search package name, destination, city..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-ocean-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2. Destination Dropdown (3 cols) */}
            <div className="lg:col-span-3 relative">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full py-2 pl-3 pr-7 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-ocean-600 focus:bg-white transition-all cursor-pointer appearance-none truncate"
              >
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Region Category Switcher (3 cols) */}
            <div className="lg:col-span-3">
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setSelectedRegion('All')}
                  className={`flex-1 py-1 rounded-lg text-center transition-all ${
                    selectedRegion === 'All'
                      ? 'bg-white text-ocean-700 shadow-xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  All Scope
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('Domestic')}
                  className={`flex-1 py-1 rounded-lg text-center flex items-center justify-center gap-0.5 transition-all ${
                    selectedRegion === 'Domestic'
                      ? 'bg-white text-ocean-700 shadow-xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Flag className="w-2.5 h-2.5 text-emerald-600" /> India
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('International')}
                  className={`flex-1 py-1 rounded-lg text-center flex items-center justify-center gap-0.5 transition-all ${
                    selectedRegion === 'International'
                      ? 'bg-white text-ocean-700 shadow-xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-2.5 h-2.5 text-sky-600" /> World
                </button>
              </div>
            </div>

            {/* 4. Sort By Dropdown (2 cols) */}
            <div className="lg:col-span-2 relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full py-2 pl-3 pr-7 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-ocean-600 focus:bg-white transition-all cursor-pointer appearance-none truncate"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="days_asc">Duration: Shortest</option>
                <option value="days_desc">Duration: Longest</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

          </div>

          {/* Row 2: Theme Pills Bar + Result Count & Reset Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Theme:
              </span>
              {THEME_FILTERS.map((theme) => {
                const isSelected = selectedTheme === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setSelectedTheme(theme.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-ocean-600 border-ocean-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">{theme.icon}</span>
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold text-slate-600">
                <strong className="text-ocean-600 font-extrabold">{packages.length}</strong> packages
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Packages Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-2">
            <Compass className="w-8 h-8 text-ocean-600 mx-auto animate-spin-slow" />
            <h3 className="font-bold text-slate-800 text-lg">No Tour Packages Match Your Filters</h3>
            <p className="text-slate-500 text-xs">Try selecting a different theme or region scope.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.slice(0, visibleCount).map((pkg) => (
                <PackageCard
                  key={pkg._id || pkg.slug}
                  pkg={pkg}
                  onEnquire={handleOpenEnquire}
                />
              ))}
            </div>
            {visibleCount < packages.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-6 py-3 rounded-2xl2 bg-white border border-line text-ink font-black text-xs uppercase tracking-wider hover:bg-fill transition-all active:scale-95"
                >
                  Show more ({packages.length - visibleCount} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        selectedPackage={selectedPackage}
        initialMode={enquiryModalMode}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
};
