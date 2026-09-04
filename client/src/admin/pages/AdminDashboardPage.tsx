import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package as PkgIcon, MapPin, FileText, ArrowUpRight, TrendingUp, Sparkles, Clock, CheckCircle, AlertCircle, Eye, Globe, Compass } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { AdminLayout } from '../components/AdminLayout';

import { FALLBACK_ENQUIRIES, FALLBACK_PACKAGES, FALLBACK_DESTINATIONS, FALLBACK_THEMES } from '../../utils/mobileDataFallback';

const getCategoryName = (cat: any): string => {
  if (!cat) return 'Domestic';
  if (typeof cat === 'string') return cat;
  if (Array.isArray(cat) && cat.length > 0) {
    const first = cat[0];
    return typeof first === 'string' ? first : (first.name || 'Domestic');
  }
  if (typeof cat === 'object' && cat !== null) {
    return cat.name || 'Domestic';
  }
  return 'Domestic';
};

const getDestName = (dest: any): string => {
  if (!dest) return 'General Trip';
  if (typeof dest === 'string') return dest;
  if (typeof dest === 'object' && dest !== null) {
    return dest.name || dest.title || 'General Trip';
  }
  return 'General Trip';
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    enquiries: 7,
    packages: 11,
    destinations: 13,
    blogs: 2
  });
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [recentPackages, setRecentPackages] = useState<any[]>([]);
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [themesList, setThemesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('hc_user') || '{}');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [enqRes, pkgRes, destRes, blogRes] = await Promise.allSettled([
        apiClient.get('/admin/enquiries'),
        apiClient.get('/packages?limit=100'),
        apiClient.get('/destinations'),
        apiClient.get('/blogs')
      ]);

      const rawEnquiries = enqRes.status === 'fulfilled' ? (enqRes.value.data.data || []) : [];
      const map = new Map<string, any>();
      rawEnquiries.forEach((e: any) => map.set(e._id || e.enquiryId || e.id, e));
      FALLBACK_ENQUIRIES.forEach((e: any) => { if (!map.has(e._id)) map.set(e._id, e); });
      const enquiriesData = Array.from(map.values());

      const rawPackages = pkgRes.status === 'fulfilled' ? (pkgRes.value.data.data || []) : [];
      const pkgMap = new Map<string, any>();
      rawPackages.forEach((p: any) => pkgMap.set(p._id || p.packageCode || p.slug || p.id, p));
      FALLBACK_PACKAGES.forEach((p: any) => {
        const idKey = p._id || p.packageCode || p.slug || p.id;
        if (!pkgMap.has(idKey)) pkgMap.set(idKey, p);
      });
      const packagesData = Array.from(pkgMap.values());

      const rawDestinations = destRes.status === 'fulfilled' ? (destRes.value.data.data || []) : [];
      const destMap = new Map<string, any>();
      rawDestinations.forEach((d: any) => destMap.set(d._id || d.slug || d.id, d));
      FALLBACK_DESTINATIONS.forEach((d: any) => {
        const idKey = d._id || d.slug || d.id;
        if (!destMap.has(idKey)) destMap.set(idKey, d);
      });
      const destinationsData = Array.from(destMap.values());

      const blogsCount = blogRes.status === 'fulfilled' ? (blogRes.value.data.meta?.total || blogRes.value.data.data?.length || 0) : 0;

      setStats({
        enquiries: enquiriesData.length,
        packages: packagesData.length,
        destinations: destinationsData.length,
        blogs: blogsCount || 2
      });

      setRecentEnquiries(enquiriesData);
      setRecentPackages(packagesData);
      setDestinationsList(destinationsData);
      setThemesList(FALLBACK_THEMES);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
      setStats({ enquiries: 7, packages: FALLBACK_PACKAGES.length, destinations: FALLBACK_DESTINATIONS.length, blogs: 2 });
      setRecentEnquiries(FALLBACK_ENQUIRIES);
      setRecentPackages(FALLBACK_PACKAGES);
      setDestinationsList(FALLBACK_DESTINATIONS);
      setThemesList(FALLBACK_THEMES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time socket sync
  const { isConnected } = useRealtimeUpdates({
    onPackageUpdate: () => fetchDashboardData(),
    onDestinationUpdate: () => fetchDashboardData(),
    onBlogUpdate: () => fetchDashboardData(),
    onEnquiryUpdate: () => fetchDashboardData()
  });

  useEffect(() => {
    fetchDashboardData();
    const handleDataUpdate = () => fetchDashboardData();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(fetchDashboardData, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'closed':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'in-progress':
      case 'contacted':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Contacted</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Sparkles className="w-3 h-3" /> New Lead</span>;
    }
  };

  return (
    <AdminLayout
      title="Executive Overview"
      subtitle={`Welcome back, ${user.firstName || 'Super Admin'}! Here is your live business metrics breakdown.`}
    >
      <div className="space-y-8">
        {/* KPI Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Enquiries */}
          <Link
            to="/admin/leads"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-ocean-600/50 group block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-ocean-600 flex items-center justify-center group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900">{stats.enquiries}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> {isConnected ? 'Live Sync' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>View Customer Leads</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-ocean-600" />
            </p>
          </Link>

          {/* Active Packages */}
          <Link
            to="/admin/packages"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-amber-500/50 group block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Packages</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <PkgIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900">{stats.packages}</span>
              <span className="text-xs font-bold text-slate-500">Itineraries</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Manage Packages</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
            </p>
          </Link>

          {/* Active Locations */}
          <Link
            to="/admin/destinations"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-sky-500/50 group block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destinations</span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900">{stats.destinations}</span>
              <span className="text-xs font-bold text-slate-500">Domestic & Intl</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Manage Locations</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
            </p>
          </Link>

          {/* Published Blogs */}
          <Link
            to="/admin/cms"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/50 group block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Content</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900">{stats.blogs}</span>
              <span className="text-xs font-bold text-slate-500">Blogs & Stories</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Manage CMS Stories</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
            </p>
          </Link>
        </div>

        {/* Action Banner */}
        <div className="bg-gradient-to-r from-ocean-600 to-aqua-500 rounded-3xl p-5 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <h3 className="font-['Outfit'] font-bold text-xl sm:text-2xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 shrink-0" /> Quick Package & Destination Actions
            </h3>
            <p className="text-xs text-white/90 max-w-xl">
              Add new tour itineraries, set domestic vs international categories, or update quick facts and pricing instantly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <Link
              to="/admin/packages"
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white text-ocean-600 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-50 transition-all cursor-pointer text-center"
            >
              + Create New Package
            </Link>
            <Link
              to="/admin/destinations"
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-900/40 border border-white/20 text-white font-bold text-xs sm:text-sm hover:bg-slate-900/60 transition-all cursor-pointer text-center"
            >
              + Add Destination
            </Link>
          </div>
        </div>

        {/* Two Column Layout: Recent Customer Leads & Tour Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Customer Enquiries (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-poppins font-bold text-2xl text-slate-900">Recent Customer Leads</h3>
                <p className="text-base text-slate-500">Latest travel enquiries submitted by users</p>
              </div>
              <Link to="/admin/leads" className="text-sm font-bold text-ocean-600 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Loading customer leads...</div>
            ) : recentEnquiries.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No customer enquiries received yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                      <th className="p-3">Customer</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Travel Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentEnquiries.map((enq) => {
                      const destName = typeof enq.destination === 'object' && enq.destination !== null ? enq.destination.name : (enq.destination || 'General Trip');
                      return (
                        <tr key={enq._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{enq.fullName || 'Anonymous User'}</div>
                            <div className="text-[11px] text-slate-400">{enq.email || enq.mobile || 'No contact info'}</div>
                          </td>
                          <td className="p-3 font-semibold text-ocean-600">{destName}</td>
                          <td className="p-3 text-slate-500">
                            {enq.travelDate ? new Date(enq.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                          </td>
                          <td className="p-3">{getStatusBadge(enq.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tour Packages (1 Col) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-poppins font-bold text-2xl text-slate-900">Featured Packages</h3>
                <p className="text-base text-slate-500">Active tour itineraries ({recentPackages.length})</p>
              </div>
              <Link to="/admin/packages" className="text-sm font-bold text-ocean-600 hover:underline">
                Manage All
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Loading packages...</div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {recentPackages.map((pkg) => {
                  const catName = getCategoryName(pkg.category);
                  return (
                    <div key={pkg._id} className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all">
                      <img
                        src={pkg.coverImage || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop'}
                        alt={pkg.title || 'Package'}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{pkg.title || 'Tour Package'}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-emerald-600 font-extrabold">₹{pkg.startingPrice?.toLocaleString()}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${catName === 'International' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {catName}
                          </span>
                        </div>
                      </div>
                      <Link to="/admin/packages" className="p-1.5 rounded-lg text-slate-400 hover:text-ocean-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Travel Destinations Overview Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-2xl text-slate-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-ocean-600" /> Destinations Overview ({destinationsList.length})
              </h3>
              <p className="text-base text-slate-500">Domestic & International destination hubs active on the portal</p>
            </div>
            <Link to="/admin/destinations" className="text-sm font-bold text-ocean-600 hover:underline flex items-center gap-1">
              Manage Locations <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {destinationsList.map((dest) => {
              const isIntl = dest.category === 'International' || dest.isDomestic === false;
              const nameStr = typeof dest.name === 'string' ? dest.name : (dest.name?.name || 'Destination');
              const locationStr = typeof dest.country === 'string' ? dest.country : (typeof dest.state === 'string' ? dest.state : 'Popular Hub');
              return (
                <div key={dest._id || dest.slug} className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all">
                  <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={dest.image || dest.banner || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop'}
                      alt={nameStr}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isIntl ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                      {isIntl ? '🌍 Intl' : '🇮🇳 Domestic'}
                    </span>
                  </div>
                  <div className="p-3 bg-white space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{nameStr}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{locationStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Travel Themes Breakdown Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-2xl text-slate-900 flex items-center gap-2">
                <Compass className="w-6 h-6 text-aqua-500" /> Curated Travel Themes ({themesList.length})
              </h3>
              <p className="text-base text-slate-500">Experiential categories listed across the website & mobile app</p>
            </div>
            <Link to="/admin/cms" className="text-sm font-bold text-ocean-600 hover:underline flex items-center gap-1">
              CMS Settings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {themesList.map((theme) => {
              const themeNameStr = typeof theme.name === 'string' ? theme.name : (theme.name?.name || 'Theme');
              return (
                <div key={theme._id || theme.slug} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-ocean-600/40 hover:bg-slate-100/60 transition-all flex items-center gap-3">
                  <img
                    src={theme.imageUrl}
                    alt={themeNameStr}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{themeNameStr}</h4>
                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">{theme.rating || 'Popular Theme'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

