import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Package as PkgIcon, MapPin, FileText, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { AdminLayout } from '../components/AdminLayout';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    enquiries: 0,
    packages: 0,
    destinations: 0,
    blogs: 0
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('hc_user') || '{}');

  useEffect(() => {
    fetchStats();
    const handleDataUpdate = () => fetchStats();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      fetchStats();
    }, 800);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);




  const fetchStats = async () => {
    try {
      const [enqRes, pkgRes, destRes, blogRes] = await Promise.allSettled([
        apiClient.get('/admin/enquiries'),
        apiClient.get('/packages?limit=100'),
        apiClient.get('/destinations'),
        apiClient.get('/blogs')
      ]);

      const enquiriesCount = enqRes.status === 'fulfilled' ? (enqRes.value.data.meta?.total || enqRes.value.data.data?.length || 0) : 0;
      const packagesCount = pkgRes.status === 'fulfilled' ? (pkgRes.value.data.meta?.total || pkgRes.value.data.data?.length || 0) : 0;
      const destsCount = destRes.status === 'fulfilled' ? (destRes.value.data.data?.length || 0) : 0;
      const blogsCount = blogRes.status === 'fulfilled' ? (blogRes.value.data.meta?.total || blogRes.value.data.data?.length || 0) : 0;

      setStats({
        enquiries: enquiriesCount,
        packages: packagesCount,
        destinations: destsCount,
        blogs: blogsCount
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
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
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#0A6FB5]/50 group block relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A6FB5] flex items-center justify-center group-hover:bg-[#0A6FB5] group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Outfit'] font-extrabold text-3xl text-slate-900">{stats.enquiries}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> Live Atlas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>View Customer Leads</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A6FB5]" />
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
        <div className="bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-['Outfit'] font-bold text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-300" /> Quick Package & Destination Actions
            </h3>
            <p className="text-xs text-white/90 max-w-xl">
              Add new tour itineraries, set domestic vs international categories, or update quick facts and pricing instantly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/packages"
              className="px-5 py-3 rounded-2xl bg-white text-[#0A6FB5] font-bold text-xs shadow-md hover:bg-slate-50 transition-all cursor-pointer"
            >
              + Create New Package
            </Link>
            <Link
              to="/admin/destinations"
              className="px-5 py-3 rounded-2xl bg-slate-900/40 border border-white/20 text-white font-bold text-xs hover:bg-slate-900/60 transition-all cursor-pointer"
            >
              + Add Destination
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
