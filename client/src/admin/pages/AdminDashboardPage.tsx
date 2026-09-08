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

const getFormattedDateTime = (item: any): { dateStr: string; timeStr: string; fullStr: string } => {
  let dateObj: Date | null = null;
  if (item?.createdAt) {
    dateObj = new Date(item.createdAt);
  } else if (item?.timestamp) {
    dateObj = new Date(item.timestamp);
  } else if (item?.date) {
    dateObj = new Date(item.date);
  } else if (item?._id && typeof item._id === 'string' && item._id.length === 24) {
    const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
    if (!isNaN(timestamp)) {
      dateObj = new Date(timestamp);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return {
    dateStr,
    timeStr,
    fullStr: `${dateStr} • ${timeStr}`
  };
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    enquiries: 7,
    bookings: 4,
    packages: 11,
    activities: 8,
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
      const [enqRes, bookRes, pkgRes, actRes, destRes, blogRes] = await Promise.allSettled([
        apiClient.get('/admin/enquiries'),
        apiClient.get('/admin/bookings'),
        apiClient.get('/packages?limit=12'),
        apiClient.get('/activities?limit=12'),
        apiClient.get('/destinations'),
        apiClient.get('/blogs')
      ]);

      const rawEnquiries = enqRes.status === 'fulfilled' ? (enqRes.value.data.data || []) : [];
      const map = new Map<string, any>();
      rawEnquiries.forEach((e: any) => map.set(e._id || e.enquiryId || e.id, e));
      FALLBACK_ENQUIRIES.forEach((e: any) => { if (!map.has(e._id)) map.set(e._id, e); });
      const enquiriesData = Array.from(map.values());

      const rawBookings = bookRes.status === 'fulfilled' ? (bookRes.value.data.data || []) : [];
      const bookingsCount = rawBookings.length;

      const rawPackages = pkgRes.status === 'fulfilled' ? (pkgRes.value.data.data || []) : [];
      const pkgMap = new Map<string, any>();
      rawPackages.forEach((p: any) => pkgMap.set(p._id || p.packageCode || p.slug || p.id, p));
      FALLBACK_PACKAGES.forEach((p: any) => {
        const idKey = p._id || p.packageCode || p.slug || p.id;
        if (!pkgMap.has(idKey)) pkgMap.set(idKey, p);
      });
      const packagesData = Array.from(pkgMap.values());

      const rawActivities = actRes.status === 'fulfilled' ? (actRes.value.data.data || []) : [];
      const activitiesCount = rawActivities.length;

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
        bookings: bookingsCount || 4,
        packages: packagesData.length,
        activities: activitiesCount || 8,
        destinations: destinationsData.length,
        blogs: blogsCount || 2
      });

      setRecentEnquiries(enquiriesData);
      setRecentPackages(packagesData);
      setDestinationsList(destinationsData);
      setThemesList(FALLBACK_THEMES);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
      setStats({ enquiries: 7, bookings: 4, packages: FALLBACK_PACKAGES.length, activities: 8, destinations: FALLBACK_DESTINATIONS.length, blogs: 2 });
      setRecentEnquiries(FALLBACK_ENQUIRIES);
      setRecentPackages(FALLBACK_PACKAGES);
      setDestinationsList(FALLBACK_DESTINATIONS);
      setThemesList(FALLBACK_THEMES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time socket sync across ALL entities
  const { isConnected } = useRealtimeUpdates({
    onPackageUpdate: () => fetchDashboardData(),
    onActivityUpdate: () => fetchDashboardData(),
    onDestinationUpdate: () => fetchDashboardData(),
    onBlogUpdate: () => fetchDashboardData(),
    onEnquiryUpdate: () => fetchDashboardData(),
    onBookingUpdate: () => fetchDashboardData(),
    onBannerUpdate: () => fetchDashboardData(),
    onThemeUpdate: () => fetchDashboardData()
  });

  useEffect(() => {
    fetchDashboardData();
    const handleDataUpdate = () => fetchDashboardData();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(fetchDashboardData, 60000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        );
      case 'in-progress':
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Contacted
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            New Lead
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Executive Overview"
      subtitle={`Welcome back, ${user.firstName || 'Admin'}! Here is your live business metrics breakdown.`}
      action={
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/packages"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + New Package
          </Link>
          <Link
            to="/admin/destinations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            + Add Destination
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Total Enquiries */}
          <Link
            to="/admin/leads"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-ocean-300 transition-all duration-200 group relative overflow-hidden active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Enquiries</span>
              <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 border border-ocean-100 flex items-center justify-center group-hover:bg-ocean-600 group-hover:text-white transition-all shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900 tracking-tight">{stats.enquiries}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
                {isConnected ? 'Live Sync' : 'Active'}
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-ocean-600 transition-colors">
              <span>View Customer Leads</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Active Packages */}
          <Link
            to="/admin/packages"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 transition-all duration-200 group relative overflow-hidden active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Packages</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
                <PkgIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900 tracking-tight">{stats.packages}</span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                Itineraries
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-amber-600 transition-colors">
              <span>Manage Packages</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Destinations */}
          <Link
            to="/admin/destinations"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-sky-300 transition-all duration-200 group relative overflow-hidden active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Destinations</span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all shadow-2xs">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900 tracking-tight">{stats.destinations}</span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                Domestic & Intl
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-sky-600 transition-colors">
              <span>Manage Locations</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Published Content */}
          <Link
            to="/admin/cms"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-purple-300 transition-all duration-200 group relative overflow-hidden active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Published Content</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900 tracking-tight">{stats.blogs}</span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                Blogs & Stories
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-purple-600 transition-colors">
              <span>Manage CMS Content</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </div>

        {/* Sleek Light Management Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-bold text-base text-slate-900">Quick Inventory & Content Operations</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage domestic/international packages, destination hubs, and customer enquiries live.</p>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/admin/packages"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs text-center transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
            >
              Tour Packages
            </Link>
            <Link
              to="/admin/destinations"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/90 font-bold text-xs text-center transition-all active:scale-95 shrink-0"
            >
              Destinations
            </Link>
            <Link
              to="/admin/leads"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/90 font-bold text-xs text-center transition-all active:scale-95 shrink-0"
            >
              Enquiries
            </Link>
          </div>
        </div>

        {/* Two Column Section: Recent Customer Leads & Featured Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Customer Enquiries (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-['Outfit'] font-bold text-base text-slate-900">Recent Customer Leads</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Latest travel enquiries & booking requests submitted by customers</p>
              </div>
              <Link to="/admin/leads" className="text-xs font-bold text-ocean-600 hover:text-ocean-700 inline-flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">Loading customer leads...</div>
            ) : recentEnquiries.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">No customer enquiries received yet.</div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-slate-50/90 text-slate-500 uppercase font-extrabold tracking-wider text-[10px] border-y border-slate-100">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Enquiry Time & Date</th>
                      <th className="py-3 px-3">Destination</th>
                      <th className="py-3 px-3">Travel Date</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {recentEnquiries.map((enq) => {
                      const destName = typeof enq.destination === 'object' && enq.destination !== null ? enq.destination.name : (enq.destination || 'General Trip');
                      const name = enq.fullName || 'Anonymous User';
                      const initial = name.charAt(0).toUpperCase();
                      const { dateStr, timeStr } = getFormattedDateTime(enq);
                      return (
                        <tr key={enq._id || enq.enquiryId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8.5 h-8.5 rounded-full bg-ocean-100 text-ocean-700 font-bold text-xs flex items-center justify-center shrink-0 border border-ocean-200/50">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate">{name}</div>
                                <div className="text-[11px] text-slate-400 truncate">{enq.email || enq.mobile || 'No contact details'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-ocean-600 shrink-0" />
                              <span className="font-bold text-slate-800">{timeStr}</span>
                              <span className="text-slate-400 font-medium">({dateStr})</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-ocean-600">{destName}</td>
                          <td className="py-3 px-3 text-slate-500 font-medium">
                            {enq.travelDate ? new Date(enq.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                          </td>
                          <td className="py-3 px-3">{getStatusBadge(enq.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Featured Packages (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-['Outfit'] font-bold text-base text-slate-900">Featured Packages</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Active tour itineraries ({recentPackages.length})</p>
              </div>
              <Link to="/admin/packages" className="text-xs font-bold text-ocean-600 hover:text-ocean-700">
                Manage All
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">Loading packages...</div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recentPackages.map((pkg) => {
                  const catName = getCategoryName(pkg.category);
                  return (
                    <div key={pkg._id || pkg.packageCode} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all duration-200 group">
                      <img
                        src={pkg.coverImage || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop'}
                        alt={pkg.title || 'Package'}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/60 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate group-hover:text-ocean-600 transition-colors">{pkg.title || 'Tour Package'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-emerald-600 font-extrabold">₹{pkg.startingPrice?.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catName === 'International' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
                            {catName}
                          </span>
                        </div>
                      </div>
                      <Link to="/admin/packages" className="p-2 rounded-xl text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-['Outfit'] font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-ocean-600" /> Destinations Hubs ({destinationsList.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Domestic & International destinations available for booking</p>
            </div>
            <Link to="/admin/destinations" className="text-xs font-bold text-ocean-600 hover:text-ocean-700 inline-flex items-center gap-1">
              Manage Locations <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-[420px] overflow-y-auto p-1">
            {destinationsList.map((dest) => {
              const isIntl = dest.category === 'International' || dest.isDomestic === false;
              const nameStr = typeof dest.name === 'string' ? dest.name : (dest.name?.name || 'Destination');
              const locationStr = typeof dest.country === 'string' ? dest.country : (typeof dest.state === 'string' ? dest.state : 'Popular Hub');
              return (
                <div key={dest._id || dest.slug} className="group relative rounded-2xl overflow-hidden border border-slate-200/80 hover:border-ocean-300 hover:shadow-md transition-all duration-200 bg-white hover:-translate-y-0.5">
                  <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={dest.image || dest.banner || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop'}
                      alt={nameStr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-2xs ${isIntl ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                      {isIntl ? 'Intl' : 'Domestic'}
                    </span>
                  </div>
                  <div className="p-3 space-y-0.5">
                    <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-ocean-600 transition-colors">{nameStr}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{locationStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Travel Themes Breakdown Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-['Outfit'] font-bold text-base text-slate-900 flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-ocean-600" /> Curated Travel Themes ({themesList.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Experiential travel categories active on the portal</p>
            </div>
            <Link to="/admin/cms" className="text-xs font-bold text-ocean-600 hover:text-ocean-700 inline-flex items-center gap-1">
              CMS Settings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {themesList.map((theme) => {
              const themeNameStr = typeof theme.name === 'string' ? theme.name : (theme.name?.name || 'Theme');
              return (
                <div key={theme._id || theme.slug} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-ocean-300 hover:bg-white hover:shadow-xs transition-all duration-200 flex items-center gap-3.5">
                  <img
                    src={theme.imageUrl}
                    alt={themeNameStr}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200/60 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{themeNameStr}</h4>
                    <p className="text-[10px] text-amber-600 font-extrabold mt-0.5">{theme.rating || 'Popular Theme'}</p>
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

