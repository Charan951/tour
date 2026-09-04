import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { DestinationCard } from '../../components/cards/DestinationCard';
import { SEO } from '../../components/common/SEO';
import { Flag, Globe } from 'lucide-react';

import { FALLBACK_DESTINATIONS } from '../../utils/mobileDataFallback';

export const DestinationsLandingPage: React.FC = () => {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const selectedCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    fetchDestinations();
    const handleDataUpdate = () => fetchDestinationsSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
    };
  }, [location.search]);

  const fetchDestinationsSilently = async () => {
    try {
      const res = await apiClient.get('/destinations');
      if (res.data?.data) {
        setDestinations(res.data.data);
      }
    } catch (_) {}
  };

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/destinations');
      setDestinations(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch destinations', err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveDestinations = (() => {
    const map = new Map<string, any>();
    destinations.forEach(d => map.set(d.slug || d._id || d.id, d));
    FALLBACK_DESTINATIONS.forEach(d => { if (!map.has(d.slug)) map.set(d.slug, d); });
    return Array.from(map.values());
  })();

  const filteredDestinations = selectedCategory === 'Domestic'
    ? effectiveDestinations.filter((d) => {
        if (!d) return false;
        const cat = String(d.category || '');
        const countryVal = typeof d.country === 'object' && d.country !== null
          ? (d.country.name || d.country.isoCode || '')
          : String(d.country || '');
        const countryStr = String(countryVal || '');
        return cat === 'Domestic' || d.isDomestic === true || countryStr === 'India' || countryStr === 'IN';
      })
    : selectedCategory === 'International'
    ? effectiveDestinations.filter((d) => {
        if (!d) return false;
        const cat = String(d.category || '');
        const countryVal = typeof d.country === 'object' && d.country !== null
          ? (d.country.name || d.country.isoCode || '')
          : String(d.country || '');
        const countryStr = String(countryVal || '');
        return cat === 'International' || d.isDomestic === false || (Boolean(countryStr) && countryStr !== 'India' && countryStr !== 'IN');
      })
    : effectiveDestinations;

  const pageTitle = selectedCategory === 'Domestic'
    ? 'India Tour Destinations'
    : selectedCategory === 'International'
    ? 'International Tour Destinations'
    : 'Explore All Travel Destinations';

  return (
    <>
      <SEO
        title={`${pageTitle} | HolidayCity`}
        description="Explore handpicked domestic and international holiday destinations with HolidayCity."
      />

      <div className="pt-18 sm:pt-20 pb-16 px-4 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3.5 py-1.5 rounded-full inline-block">
            {selectedCategory === 'Domestic' ? 'India Domestic' : selectedCategory === 'International' ? 'International World' : 'World Directory'}
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-slate-900">
            {pageTitle}
          </h1>
          <p className="text-slate-600 text-sm">
            Discover handpicked tropical beaches, mountain escapes, cultural heritage cities, and desert oases.
          </p>

          {/* Region Tabs - Only render on main 'All' destinations page */}
          {selectedCategory === 'All' && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/destinations"
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-ocean-600 text-white shadow-md transition-all"
              >
                All Destinations ({destinations.length})
              </Link>

              <Link
                to="/destinations?category=Domestic"
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5 text-emerald-600" /> India Tour
              </Link>

              <Link
                to="/destinations?category=International"
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" /> International Tour
              </Link>
            </div>
          )}
        </div>

        {loading && effectiveDestinations.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto">
            No destinations found for this selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDestinations.map((dest) => (
              <DestinationCard key={dest._id || dest.slug} destination={dest} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
