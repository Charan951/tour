import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package as PkgIcon, Plus, Trash2, Edit, Sparkles, CheckCircle, Flag, Globe, Calendar, Clock, Heart, Mountain, Compass as CompassIcon, Shield, Sun, Menu } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout, useAdminSidebar } from '../components/AdminLayout';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';
import { FALLBACK_PACKAGES } from '../../utils/mobileDataFallback';

const mergePackagesWithFallback = (apiPkgs: any[]) => {
  const map = new Map<string, any>();
  (apiPkgs || []).forEach((p: any) => map.set(p._id || p.packageCode || p.slug || p.id, p));
  FALLBACK_PACKAGES.forEach((p: any) => {
    const idKey = p._id || p.packageCode || p.slug || p.id;
    if (!map.has(idKey)) map.set(idKey, p);
  });
  return Array.from(map.values());
};

const TRAVEL_THEMES = [
  { name: 'Honeymoon Tour', icon: '💖', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { name: 'Leisure', icon: '🌴', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Hill Station', icon: '🏔️', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'Trekking', icon: '🧗', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'Adventure', icon: '🏄', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Religious', icon: '🛕', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'Family Tour', icon: '👨‍👩‍👧‍👦', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { name: 'Wildlife Safari', icon: '🦁', color: 'bg-teal-50 border-teal-200 text-teal-700' }
];

export const PackageManagerPage: React.FC = () => {
  const { toggleSidebar } = useAdminSidebar();
  const [packages, setPackages] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [themeFilter, setThemeFilter] = useState('All');

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    onPackageUpdate: (updatedData) => {
      console.log('📡 Real-time package update received:', updatedData);
      if (updatedData?.deleted) {
        const targetId = String(updatedData.id || updatedData._id || '');
        setPackages((prev) => prev.filter((pkg) => String(pkg._id) !== targetId));
      } else if (updatedData?._id) {
        const targetId = String(updatedData._id);
        setPackages((prev) => {
          const exists = prev.some((pkg) => String(pkg._id) === targetId);
          if (exists) {
            return prev.map((pkg) => (String(pkg._id) === targetId ? updatedData : pkg));
          }
          return [updatedData, ...prev];
        });
      }
    },
    onDestinationUpdate: (updatedData) => {
      if (updatedData?.deleted) {
        const targetId = String(updatedData.id || updatedData._id || '');
        setDestinations((prev) => prev.filter((d) => String(d._id) !== targetId));
      } else if (updatedData?._id) {
        const targetId = String(updatedData._id);
        setDestinations((prev) => {
          const exists = prev.some((d) => String(d._id) === targetId);
          if (exists) {
            return prev.map((d) => (String(d._id) === targetId ? updatedData : d));
          }
          return [updatedData, ...prev];
        });
      }
    }
  });

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'Domestic' | 'International' | 'All'>('All');
  const [themeName, setThemeName] = useState('Honeymoon Tour');
  const [title, setTitle] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [startingPrice, setStartingPrice] = useState(25000);
  const [discountPrice, setDiscountPrice] = useState(29000);
  const [nights, setNights] = useState(4);
  const [days, setDays] = useState(5);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop');
  const [gallery, setGallery] = useState<string[]>([]);
  const [overview, setOverview] = useState('');
  const [highlights, setHighlights] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [featured, setFeatured] = useState<boolean>(true);

  // Dynamic Day-by-Day Itinerary List
  const [itinerary, setItinerary] = useState<Array<{ day: number; title: string; description: string; time?: string }>>([
    { day: 1, title: 'Day 1: Arrival & Transfer', description: 'Arrival at destination, transfer to pre-booked hotel and evening free for leisure.' }
  ]);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch destinations when modal opens (if needed)
  useEffect(() => {
    if (destinations.length === 0) {
      fetchDestinations();
    }
  }, [isModalOpen]);



  const fetchDestinations = async () => {
    try {
      const destRes = await apiClient.get('/destinations');
      if (destRes.data?.data) setDestinations(destRes.data.data);
    } catch (err) {
      console.error('Failed to fetch destinations', err);
    }
  };

  const fetchDataSilently = async () => {
    try {
      const pkgRes = await apiClient.get('/packages?limit=30');
      setPackages(mergePackagesWithFallback(pkgRes.data?.data || []));
    } catch (_) {}
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgRes, destRes] = await Promise.all([
        apiClient.get('/packages?limit=30'),
        apiClient.get('/destinations')
      ]);
      setPackages(mergePackagesWithFallback(pkgRes.data?.data || []));
      setDestinations(destRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch package manager data', err);
      setPackages(FALLBACK_PACKAGES);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (pkg: any) => {
    setEditingId(pkg._id);
    setTitle(pkg.title || '');
    setPackageCode(pkg.packageCode || '');
    setThemeName(pkg.themeName || 'Honeymoon Tour');
    const destObj = typeof pkg.destination === 'object' ? pkg.destination : null;
    const destId = destObj?._id || pkg.destination || '';
    setDestinationId(destId);

    if (destObj) {
      const isDom = destObj.category === 'Domestic' || destObj.isDomestic !== false;
      setSelectedRegion(isDom ? 'Domestic' : 'International');
    } else {
      setSelectedRegion('All');
    }

    setStartingPrice(pkg.startingPrice || 0);
    setDiscountPrice(pkg.discountPrice || 0);
    setNights(pkg.duration?.nights || 3);
    setDays(pkg.duration?.days || 4);
    setCoverImage(pkg.coverImage || '');
    setGallery(
      Array.isArray(pkg.gallery) && pkg.gallery.length
        ? pkg.gallery
        : (Array.isArray(pkg.images) ? pkg.images : [])
    );
    setOverview(pkg.overview || '');
    setHighlights(pkg.highlights ? pkg.highlights.join(', ') : '');
    setInclusions(pkg.inclusions ? pkg.inclusions.join(', ') : '');
    setExclusions(pkg.exclusions ? pkg.exclusions.join(', ') : '');
    setFeatured(pkg.featured !== false);

    if (pkg.itinerary && pkg.itinerary.length > 0) {
      setItinerary(pkg.itinerary);
    } else {
      setItinerary([
        { day: 1, title: 'Day 1: Arrival & Transfer', description: 'Arrival at destination, transfer to pre-booked hotel and evening free for leisure.' }
      ]);
    }

    setIsModalOpen(true);
  };

  const handleAddItineraryDay = () => {
    const nextDayNum = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      { day: nextDayNum, title: `Day ${nextDayNum}: Sightseeing & Tour`, description: '' }
    ]);
  };

  const handleRemoveItineraryDay = (index: number) => {
    const updated = itinerary.filter((_, i) => i !== index).map((item, idx) => ({ ...item, day: idx + 1 }));
    setItinerary(updated);
  };

  const handleItineraryChange = (index: number, field: string, value: string) => {
    const updated = [...itinerary];
    (updated[index] as any)[field] = value;
    setItinerary(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationId) {
      toast.error('Please select a Destination Location');
      return;
    }

    try {
      const payload = {
        title,
        packageCode: packageCode || undefined,
        destination: destinationId,
        themeName,
        startingPrice: Number(startingPrice),
        discountPrice: Number(discountPrice) || undefined,
        duration: { nights: Number(nights), days: Number(days) },
        coverImage,
        gallery: gallery.filter((u) => u && u.trim()),
        overview,
        highlights: highlights ? highlights.split(',').map((s) => s.trim()) : [],
        inclusions: inclusions ? inclusions.split(',').map((s) => s.trim()) : [],
        exclusions: exclusions ? exclusions.split(',').map((s) => s.trim()) : [],
        featured: featured !== false,
        itinerary: itinerary.map((item, idx) => ({

          day: idx + 1,
          title: item.title || `Day ${idx + 1}`,
          description: item.description || ''
        }))
      };

      if (editingId) {
        const res = await apiClient.patch(`/admin/packages/${editingId}`, payload);
        toast.success('Package updated successfully');
        if (res.data?.data) {
          const updatedPkg = res.data.data;
          setPackages((prev) => prev.map((p) => (p._id === editingId ? updatedPkg : p)));
        }
      } else {
        const res = await apiClient.post('/admin/packages', payload);
        toast.success('Package created successfully');
        if (res.data?.data) {
          const newPkg = res.data.data;
          setPackages((prev) => [newPkg, ...prev.filter((p) => p._id !== newPkg._id)]);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchDataSilently();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    const targetId = String(id);
    try {
      setPackages((prev) => prev.filter((pkg) => String(pkg._id) !== targetId));
      await apiClient.delete(`/admin/packages/${targetId}`);
      toast.success('Package deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete package');
    } finally {
      fetchDataSilently();
    }
  };


  const resetForm = () => {
    setEditingId(null);
    setSelectedRegion('All');
    setThemeName('Honeymoon Tour');
    setGallery([]);
    setTitle('');
    setPackageCode('');
    setDestinationId('');
    setStartingPrice(25000);
    setDiscountPrice(29000);
    setNights(4);
    setDays(5);
    setOverview('');
    setHighlights('');
    setInclusions('');
    setExclusions('');
    setFeatured(true);
    setItinerary([
      { day: 1, title: 'Day 1: Arrival & Transfer', description: 'Arrival at destination, transfer to pre-booked hotel and evening free for leisure.' }
    ]);
  };

  const domesticDests = destinations.filter((d) => d.category === 'Domestic' || d.isDomestic !== false);
  const intlDests = destinations.filter((d) => d.category === 'International' || d.isDomestic === false);

  const displayedDestinations = selectedRegion === 'Domestic'
    ? domesticDests
    : selectedRegion === 'International'
    ? intlDests
    : destinations;

  const filteredPackages = packages.filter((pkg) => {
    const destObj = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination : null;
    const destId = destObj?._id || pkg.destination;
    const destName = destObj?.name || '';

    const matchesDest =
      destinationFilter === 'All' ||
      String(destId) === String(destinationFilter) ||
      destName.toLowerCase().includes(destinationFilter.toLowerCase());

    const matchesTheme = themeFilter === 'All' || (pkg.themeName || '').toLowerCase() === themeFilter.toLowerCase();

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (pkg.title || '').toLowerCase().includes(q) ||
      (pkg.packageCode || '').toLowerCase().includes(q) ||
      destName.toLowerCase().includes(q);

    return matchesDest && matchesTheme && matchesSearch;
  });

  return (
    <AdminLayout
      title="Tour Package CRUD Manager"
      subtitle="Full CRUD: Dynamic Day-by-Day Itineraries, Inclusions, Exclusions, Travel Themes & Tour Details."
      action={
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Package
        </button>
      }
    >
      <div className="space-y-6">
        {/* Control & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
              )}
            </span>
            <span>
              {isConnected ? (
                <>⚡ Live Real-Time Auto-Sync Active</>
              ) : (
                <>🔄 Fallback Mode - Polling Updates</>
              )}
              <span className="text-slate-400 font-normal"> ({packages.length} total packages)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Filter by Destination */}
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-ocean-600 text-slate-800"
            >
              <option value="All">All Destinations ({destinations.length})</option>
              {destinations.map((d) => {
                const destDisplayName = typeof d.name === 'object' && d.name !== null ? (d.name.name || 'Destination') : (d.name || 'Destination');
                return (
                  <option key={d._id} value={d._id}>{destDisplayName}</option>
                );
              })}
            </select>

            {/* Filter by Theme */}
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-ocean-600 text-slate-800"
            >
              <option value="All">All Themes ({TRAVEL_THEMES.length})</option>
              {TRAVEL_THEMES.map((t) => (
                <option key={t.name} value={t.name}>{t.icon} {t.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package code, title, destination..."
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-ocean-600 w-full sm:w-48"
            />

            <button
              onClick={() => fetchData()}
              className="text-ocean-600 hover:underline font-bold text-xs shrink-0 cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading packages...</div>
        ) : filteredPackages.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
            No packages found matching your filter or search query.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                    <th className="p-4">Code</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Theme</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Itinerary Days</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPackages.map((pkg) => {
                    const destObj = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination : null;
                    const destName = destObj ? destObj.name : 'Destination';
                    const themeItem = TRAVEL_THEMES.find((t) => t.name === pkg.themeName) || TRAVEL_THEMES[1];

                    return (
                      <tr key={pkg._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-ocean-600">{pkg.packageCode}</td>
                        <td className="p-4 font-bold text-slate-900 text-sm">{pkg.title}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${themeItem.color}`}>
                            {themeItem.icon} {pkg.themeName || 'Leisure'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{destName}</td>
                        <td className="p-4 font-bold text-amber-600">{pkg.itinerary?.length || pkg.duration?.days || 1} Days</td>
                        <td className="p-4 font-extrabold text-emerald-600 text-sm">₹{pkg.startingPrice?.toLocaleString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="p-1.5 rounded-lg bg-blue-50 text-ocean-600 hover:bg-ocean-600 hover:text-white transition-colors"
                            title="Edit Package"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg._id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Create Package Full Screen Executive Editor Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto flex flex-col w-full h-full min-h-screen">
          {/* Top Full-Width Compact Header Bar */}
          <div className="sticky top-0 z-40 bg-white border-b border-slate-200/90 px-6 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                title="Toggle Sidebar Navigation"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-2xs active:scale-95 shrink-0"
              >
                <Menu className="w-4 h-4 text-slate-700" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-ocean-50 text-ocean-600 border border-ocean-200/60 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-ocean-100 text-ocean-800 border border-ocean-200">
                    {editingId ? 'Editor Mode' : 'New Package'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">• Admin Portal</span>
                </div>
                <h3 className="font-['Outfit'] font-bold text-base text-slate-900 leading-tight mt-0.5">
                  {editingId ? 'Edit Tour Package' : 'Create New Tour Package'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                ✕ Discard
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = document.getElementById('package-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-ocean-600 to-sky-600 hover:from-ocean-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-ocean-600/15 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Publish Package'}
              </button>
            </div>
          </div>

          {/* Full Screen Body Content - Clean Balanced Layout */}
          <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <form id="package-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800 items-start">
              
              {/* LEFT COLUMN: Main Form Details (2/3 width) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* 1. Core Package Info Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Package Title & Overview</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">Package Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g. Shimla Kufri Volvo Tour Package"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold text-xs focus:bg-white focus:border-ocean-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">Package Code</label>
                      <input
                        type="text"
                        value={packageCode}
                        onChange={(e) => setPackageCode(e.target.value)}
                        placeholder="e.g. PKG-SHM-001"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-ocean-700 font-extrabold text-xs focus:bg-white focus:border-ocean-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Tour Overview Description</label>
                    <textarea
                      value={overview}
                      onChange={(e) => setOverview(e.target.value)}
                      rows={2}
                      placeholder="Enter concise narrative tour description with hashtags..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-900 text-xs font-medium focus:bg-white focus:border-ocean-600 transition-all leading-normal"
                    />
                  </div>
                </div>

                {/* 2. Media & Visual Assets Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Cover Media Asset</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <CloudinaryImageUploader
                        label="Upload Cover Image"
                        currentUrl={coverImage}
                        onUploadSuccess={(url) => setCoverImage(url)}
                      />
                      <div className="mt-2">
                        <label className="block text-slate-600 font-semibold mb-0.5 text-[10px]">Cover Direct URL *</label>
                        <input
                          type="text"
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          required
                          placeholder="https://res.cloudinary.com/..."
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-900 font-mono text-[10px] focus:bg-white focus:border-ocean-600"
                        />
                      </div>
                    </div>

                    {coverImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-950">
                        <img src={coverImage} alt="Cover Preview" className="w-full h-28 object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/90 text-white font-bold text-[9px] uppercase">Live Preview</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[11px]">
                        No image uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* 2b. Gallery images — shown as a carousel on the package detail page */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <h4 className="font-bold text-slate-900 text-xs">Gallery Images (carousel)</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">{gallery.length} image{gallery.length === 1 ? '' : 's'}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 -mt-1">
                    Add extra photos travellers can swipe through on the package page. The cover image is always shown first.
                  </p>

                  {gallery.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {gallery.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative rounded-lg overflow-hidden border border-slate-200 h-20 bg-slate-100 group">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                    <CloudinaryImageUploader
                      label="Add gallery image"
                      onUploadSuccess={(url) => setGallery((prev) => (prev.includes(url) ? prev : [...prev, url]))}
                    />
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5 text-[10px]">…or paste an image URL</label>
                      <input
                        type="text"
                        placeholder="https://res.cloudinary.com/..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const v = (e.target as HTMLInputElement).value.trim();
                            if (v) {
                              setGallery((prev) => (prev.includes(v) ? prev : [...prev, v]));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-900 font-mono text-[10px] focus:bg-white focus:border-ocean-600"
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5">Press Enter to add.</p>
                    </div>
                  </div>
                </div>

                {/* 3. DYNAMIC DAY-BY-DAY ITINERARY BUILDER */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                      <h4 className="font-bold text-slate-900 text-xs">Day-by-Day Itinerary Builder</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItineraryDay}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      + Add Day {itinerary.length + 1}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {itinerary.map((item, index) => (
                      <div key={index} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/90 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            Day {item.day}
                          </span>
                          {itinerary.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItineraryDay(index)}
                              className="text-rose-500 hover:text-rose-700 text-xs"
                              title="Remove Day"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                          placeholder={`Day ${item.day} Title (e.g. Arrive Delhi - Drive to Shimla)`}
                          className="w-full p-1.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-ocean-600"
                        />

                        <textarea
                          value={item.description}
                          onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                          rows={1}
                          placeholder={`Day ${item.day} Sightseeing & Hotel Check-in Details...`}
                          className="w-full p-1.5 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-800 outline-none focus:border-ocean-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. INCLUSIONS & EXCLUSIONS */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                    Inclusions & Exclusions
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/60 space-y-1">
                      <label className="block text-emerald-800 font-bold text-[11px]">Package Inclusions</label>
                      <textarea
                        value={inclusions}
                        onChange={(e) => setInclusions(e.target.value)}
                        rows={2}
                        placeholder="e.g. Delhi-Shimla Volvo Bus, 02 Night Stay, Daily Breakfast"
                        className="w-full p-2 rounded bg-white border border-emerald-200 text-[11px] font-medium text-slate-900 outline-none"
                      />
                    </div>

                    <div className="bg-rose-50/40 p-2.5 rounded-lg border border-rose-200/60 space-y-1">
                      <label className="block text-rose-800 font-bold text-[11px]">Package Exclusions</label>
                      <textarea
                        value={exclusions}
                        onChange={(e) => setExclusions(e.target.value)}
                        rows={2}
                        placeholder="e.g. Personal Shopping, Flight Airfare, GST 5%"
                        className="w-full p-2 rounded bg-white border border-rose-200 text-[11px] font-medium text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Sidebar Settings & Controls (1/3 width) */}
              <div className="space-y-3.5">

                {/* 1. Travel Theme Category */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                    Travel Theme *
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TRAVEL_THEMES.map((theme) => {
                      const isSelected = themeName === theme.name;
                      return (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => setThemeName(theme.name)}
                          className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-ocean-600 border-ocean-600 text-white shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{theme.icon}</span>
                          <span className="truncate">{theme.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Destination Assignment */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h4 className="font-bold text-slate-900 text-xs">Destination *</h4>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => { setSelectedRegion('All'); setDestinationId(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedRegion === 'All' ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedRegion('Domestic'); setDestinationId(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedRegion === 'Domestic' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        🇮🇳 India
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedRegion('International'); setDestinationId(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedRegion === 'International' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        🌍 World
                      </button>
                    </div>
                  </div>

                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-900 text-xs font-bold focus:border-ocean-600 focus:bg-white"
                  >
                    <option value="">Select Destination</option>
                    {selectedRegion === 'All' ? (
                      <>
                        <optgroup label="🇮🇳 India (Domestic)">
                          {domesticDests.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🌍 World (International)">
                          {intlDests.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      displayedDestinations.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Pricing & Duration Economics */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                    Pricing & Duration
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[10px]">Starting Price (₹) *</label>
                      <input
                        type="number"
                        value={startingPrice}
                        onChange={(e) => setStartingPrice(Number(e.target.value))}
                        required
                        className="w-full p-1.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-emerald-800 font-extrabold text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">Discount Price (₹)</label>
                      <input
                        type="number"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(Number(e.target.value))}
                        placeholder="e.g. 29000"
                        className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[10px]">Nights *</label>
                      <input
                        type="number"
                        value={nights}
                        onChange={(e) => setNights(Number(e.target.value))}
                        required
                        className="w-full p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[10px]">Days *</label>
                      <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        required
                        className="w-full p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Visibility & Actions */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80">
                    <input
                      type="checkbox"
                      id="featuredPkg"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-3.5 h-3.5 text-ocean-600 rounded cursor-pointer accent-ocean-600"
                    />
                    <label htmlFor="featuredPkg" className="text-slate-800 font-bold text-[11px] cursor-pointer leading-tight">
                      Feature on Home & App Landing
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-ocean-600 to-sky-600 hover:from-ocean-700 hover:to-sky-700 font-extrabold text-white text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {editingId ? 'Save Changes' : 'Publish Package'}
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
