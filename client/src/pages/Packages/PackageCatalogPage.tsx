import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Compass, Sparkles, Flag, Globe } from 'lucide-react';
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

  const handleOpenEnquire = (pkg: any) => {
    setSelectedPackage(pkg);
    setEnquiryModalOpen(true);
  };

  return (
    <>
      <SEO
        title="Tour Packages Catalog | HolidayCity"
        description="Browse all domestic and international holiday tour packages with custom day itineraries."
      />

      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-block">
            Holiday Directory
          </span>
          <h1 className="font-['Outfit'] font-bold text-4xl text-slate-900">
            Hand-Crafted Tour Packages Catalog
          </h1>
          <p className="text-slate-600 text-sm">
            Explore hand-crafted holiday itineraries with transparent pricing, 4-star resorts, and private transfers.
          </p>
        </div>

        {/* Dynamic Filters Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Search & Region Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search package name or activity..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-xs text-slate-800 focus:border-[#0A6FB5]"
              />
            </div>

            {/* Destination Dropdown Filter */}
            <div>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-xs font-semibold text-slate-800 focus:border-[#0A6FB5]"
              >
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Region Filter Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRegion('All')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedRegion === 'All'
                    ? 'bg-[#0A6FB5] border-[#0A6FB5] text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedRegion('Domestic')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                  selectedRegion === 'Domestic'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3 h-3" /> India
              </button>
              <button
                type="button"
                onClick={() => setSelectedRegion('International')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                  selectedRegion === 'International'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3 h-3" /> World
              </button>
            </div>
          </div>

          {/* Theme Filters Chips */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter by Travel Theme:</span>
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
                        ? 'bg-[#0A6FB5] border-[#0A6FB5] text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.name}</span>
                  </button>
                );
              })}
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
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
};
