import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Compass, Sparkles, Flag, Globe, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import { isPackageMatchingTheme } from '../../utils/themeMatcher';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTheme, setSelectedTheme] = useState(searchParams.get('theme') || 'All Themes');
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'Domestic' | 'International'>('All');
  const [selectedDestination, setSelectedDestination] = useState(searchParams.get('destination') || '');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

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
    const interval = setInterval(() => {
      fetchPackagesSilently();
    }, 800);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [searchQuery, selectedTheme, selectedRegion, selectedDestination]);



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

      // Filter by Theme if selected using robust themeMatcher
      if (selectedTheme !== 'All Themes' && selectedTheme !== 'All') {
        fetched = fetched.filter((p: any) => isPackageMatchingTheme(p, selectedTheme));
      }

      // Filter by Region if selected
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

  return (
    <>
      <SEO
        title="Tour Packages Catalog | HolidayCity"
        description="Browse all domestic and international holiday tour packages with custom day itineraries."
      />

      <div className="pt-18 sm:pt-20 pb-16 px-4 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-block">
            Holiday Directory
          </span>
          <h1 className="font-poppins font-bold text-4xl text-slate-900">
            Hand-Crafted Tour Packages Catalog
          </h1>
          <p className="text-slate-600 text-sm">
            Explore hand-crafted holiday itineraries with transparent pricing, 4-star resorts, and private transfers.
          </p>
        </div>

        {/* Dynamic Search & Collapsible Filters Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-lg space-y-4 text-left">
          
          {/* Main Top Bar: Search Input + Toggle Filters Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#0A6FB5] absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchPackages(); }}
                placeholder="Search package name, destination, city..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-xs font-bold text-slate-800 focus:border-[#0A6FB5] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Toggle Filters Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-md active:scale-95 whitespace-nowrap ${
                isFilterOpen || (selectedDestination || selectedRegion !== 'All' || (selectedTheme !== 'All Themes' && selectedTheme !== 'All'))
                  ? 'bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white border-transparent'
                  : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isFilterOpen ? 'Hide Filters' : 'Filter Packages'}</span>
              {(selectedDestination || selectedRegion !== 'All' || (selectedTheme !== 'All Themes' && selectedTheme !== 'All')) && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold shadow-xs">
                  Active
                </span>
              )}
              {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible Filter Options Panel - Rendered ONLY when isFilterOpen is true */}
          {isFilterOpen && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-fade-up">
              {/* Filter Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                
                {/* 1. Destination Dropdown (6 Columns) */}
                <div className="lg:col-span-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Select Destination</label>
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-xs font-bold text-slate-800 focus:border-[#0A6FB5] focus:bg-white transition-all cursor-pointer shadow-inner"
                  >
                    <option value="">All Destinations</option>
                    {destinations.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Region Category Buttons (6 Columns) */}
                <div className="lg:col-span-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Region Category</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setSelectedRegion('All')}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                        selectedRegion === 'All'
                          ? 'bg-[#0A6FB5] text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRegion('Domestic')}
                      className={`py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                        selectedRegion === 'Domestic'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Flag className="w-3 h-3" /> India
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRegion('International')}
                      className={`py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                        selectedRegion === 'International'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Globe className="w-3 h-3" /> World
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Filters Chips */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Filter by Travel Theme:</span>
                  {(searchQuery || selectedDestination || selectedTheme !== 'All Themes' || selectedRegion !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedDestination('');
                        setSelectedTheme('All Themes');
                        setSelectedRegion('All');
                        setSearchParams({});
                      }}
                      className="text-xs font-bold text-[#0A6FB5] hover:underline cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {THEME_FILTERS.map((theme) => {
                    const isSelected = selectedTheme === theme.name;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setSelectedTheme(theme.name)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0A6FB5] border-[#0A6FB5] text-white shadow-md scale-105'
                            : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Bottom Close CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Apply & Close Filters</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
            <Compass className="w-8 h-8 text-[#0A6FB5] mx-auto animate-spin-slow" />
            <h3 className="font-bold text-slate-800 text-lg">No Tour Packages Match Your Filters</h3>
            <p className="text-slate-500 text-xs">Try selecting a different theme or region scope.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id || pkg.slug}
                pkg={pkg}
                onEnquire={handleOpenEnquire}
              />
            ))}
          </div>
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
