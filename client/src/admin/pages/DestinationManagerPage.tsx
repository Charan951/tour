import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2, Edit, Globe, Flag, Sun, Calendar, Sparkles, Compass, Menu } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout, useAdminSidebar } from '../components/AdminLayout';
import toast from 'react-hot-toast';
import { FALLBACK_DESTINATIONS } from '../../utils/mobileDataFallback';

const mergeDestinationsWithFallback = (apiDests: any[]) => {
  const map = new Map<string, any>();
  (apiDests || []).forEach((d: any) => map.set(d._id || d.slug || d.id || d.name, d));
  FALLBACK_DESTINATIONS.forEach((d: any) => {
    const idKey = d._id || d.slug || d.id || d.name;
    if (!map.has(idKey)) map.set(idKey, d);
  });
  return Array.from(map.values());
};

export const DestinationManagerPage: React.FC = () => {
  const { toggleSidebar } = useAdminSidebar();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<'Domestic' | 'International'>('Domestic');
  const [countryName, setCountryName] = useState('India');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop');
  const [shortDescription, setShortDescription] = useState('');
  const [bestTime, setBestTime] = useState('Nov - Feb');
  const [weather, setWeather] = useState('Pleasant Tropical Breezes');
  const [featured, setFeatured] = useState(true);

  useEffect(() => {
    fetchDestinations();
    const handleDataUpdate = () => fetchDestinationsSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      fetchDestinationsSilently();
    }, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchDestinationsSilently = async () => {
    try {
      const res = await apiClient.get('/destinations');
      setDestinations(mergeDestinationsWithFallback(res.data?.data || []));
    } catch (_) {}
  };

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/destinations');
      setDestinations(mergeDestinationsWithFallback(res.data?.data || []));
    } catch (err) {
      console.error('Failed to fetch destination manager data', err);
      setDestinations(FALLBACK_DESTINATIONS);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (dest: any) => {
    setEditingId(dest._id);
    setName(dest.name || '');
    setSlug(dest.slug || '');
    setCategory(dest.category || (dest.isDomestic !== false ? 'Domestic' : 'International'));
    setCountryName(dest.countryName || (dest.category === 'International' ? 'International' : 'India'));
    setBanner(dest.banner || '');
    setShortDescription(dest.shortDescription || '');
    setBestTime(dest.bestTime || 'Nov - Feb');
    setWeather(dest.weather || 'Pleasant Tropical Breezes');
    setFeatured(dest.featured !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category,
        isDomestic: category === 'Domestic',
        countryName,
        banner,
        shortDescription,
        bestTime,
        weather,
        featured
      };

      if (editingId) {
        const res = await apiClient.patch(`/admin/destinations/${editingId}`, payload);
        toast.success('Destination updated successfully');
        if (res.data?.data) {
          const updatedDest = res.data.data;
          setDestinations((prev) => prev.map((d) => (d._id === editingId ? updatedDest : d)));
        }
      } else {
        const res = await apiClient.post('/admin/destinations', payload);
        toast.success('Destination created successfully');
        if (res.data?.data) {
          const newDest = res.data.data;
          setDestinations((prev) => [newDest, ...prev.filter((d) => d._id !== newDest._id)]);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchDestinations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save destination');
    }
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    const targetId = String(id);
    try {
      setDestinations((prev) => prev.filter((d) => String(d._id) !== targetId));
      await apiClient.delete(`/admin/destinations/${targetId}`);
      toast.success('Destination deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete destination');
    } finally {
      fetchDestinations();
    }
  };


  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setCategory('Domestic');
    setCountryName('India');
    setBanner('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop');
    setShortDescription('');
    setBestTime('Nov - Feb');
    setWeather('Pleasant Tropical Breezes');
    setFeatured(true);
  };

  return (
    <AdminLayout
      title="Destination CRUD Manager"
      subtitle="Manage India (Domestic) vs World (International) locations, Quick Facts, and banner images."
      action={
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Auto-Sync Active <span className="text-slate-400 font-normal">({destinations.length} total destinations)</span></span>
          </div>
          <button
            onClick={() => fetchDestinations()}
            className="text-ocean-600 hover:underline font-bold text-xs cursor-pointer"
          >
            ↻ Refresh Destinations
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading destinations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {destinations.map((d) => {
              const isDom = d.category === 'Domestic' || d.isDomestic !== false;
              return (
                <div key={d._id} className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
                    <img src={d.banner} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                        isDom ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {isDom ? <Flag className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {isDom ? 'India (Domestic)' : 'World (International)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 line-clamp-1">{d.name}</h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                      {d.packageCount || 0} Packages
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{d.shortDescription}</p>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div className="text-slate-600 text-[11px]">
                      <span className="text-ocean-600 font-semibold">Best: {d.bestTime || 'Nov - Feb'}</span> | <span>{d.weather || 'Tropical'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="p-1.5 rounded-lg bg-blue-50 text-ocean-600 hover:bg-ocean-600 hover:text-white transition-colors"
                        title="Edit Destination"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d._id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                        title="Soft Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Destination Full Screen Executive Editor Overlay */}
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
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    {editingId ? 'Editor Mode' : 'New Destination'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">• Admin Portal</span>
                </div>
                <h3 className="font-['Outfit'] font-bold text-base text-slate-900 leading-tight mt-0.5">
                  {editingId ? 'Edit Destination Location' : 'Add New Destination Location'}
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
                  const form = document.getElementById('dest-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-ocean-600 to-sky-600 hover:from-ocean-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-ocean-600/15 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Publish Destination'}
              </button>
            </div>
          </div>

          {/* Full Screen Body Content - Clean Balanced Layout */}
          <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <form id="dest-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800 items-start">
              
              {/* LEFT COLUMN: Main Form Details (2/3 width) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* 1. Core Destination Info Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Compass className="w-4 h-4 text-ocean-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Destination Identity</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-[11px]">Destination Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Goa Beaches"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold text-xs focus:bg-white focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-[11px]">Country Name *</label>
                      <input
                        type="text"
                        value={countryName}
                        onChange={(e) => setCountryName(e.target.value)}
                        required
                        placeholder="e.g. India or Maldives"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold text-xs focus:bg-white focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-[11px]">Short Summary & Overview *</label>
                    <textarea
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      required
                      rows={3}
                      placeholder="Write an inviting summary overview of this destination..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-medium text-xs focus:bg-white focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/10 transition-all leading-relaxed"
                    />
                  </div>
                </div>

                {/* 2. Visual Banner Asset Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Destination Cover Banner</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <CloudinaryImageUploader
                        label="Upload Banner Image"
                        currentUrl={banner}
                        onUploadSuccess={(url) => setBanner(url)}
                      />
                      <div className="mt-2.5">
                        <label className="block text-slate-600 font-bold mb-1 text-[10px]">Banner Direct URL *</label>
                        <input
                          type="text"
                          value={banner}
                          onChange={(e) => setBanner(e.target.value)}
                          required
                          placeholder="https://res.cloudinary.com/..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-mono text-[10px] focus:bg-white focus:border-ocean-600"
                        />
                      </div>
                    </div>

                    {banner ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32 bg-slate-950 shadow-inner">
                        <img src={banner} alt="Banner Preview" className="w-full h-32 object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                          <span className="px-2 py-0.5 rounded bg-sky-500/90 text-white font-bold text-[9px] uppercase tracking-wider">Live Banner Preview</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                        No banner uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Season & Climate Specifications Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-slate-900 text-xs">Travel Season & Weather Specs</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-[11px]">Best Time / Season *</label>
                      <input
                        type="text"
                        value={bestTime}
                        onChange={(e) => setBestTime(e.target.value)}
                        required
                        placeholder="e.g. Nov - Feb (Winter Peak)"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold text-xs focus:bg-white focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-[11px]">Weather Description *</label>
                      <input
                        type="text"
                        value={weather}
                        onChange={(e) => setWeather(e.target.value)}
                        required
                        placeholder="e.g. Pleasant Tropical Breezes"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold text-xs focus:bg-white focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Sidebar Settings & Controls (1/3 width) */}
              <div className="space-y-5">

                {/* 1. Region Scope Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">
                    Select Region Scope *
                  </h4>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => { setCategory('Domestic'); setCountryName('India'); }}
                      className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                        category === 'Domestic'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="font-bold">🇮🇳 India (Domestic)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setCategory('International'); if (countryName === 'India') setCountryName('Maldives'); }}
                      className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                        category === 'International'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="font-bold">🌍 World (International)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Primary Action Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-ocean-600 to-sky-600 hover:from-ocean-700 hover:to-sky-700 font-bold text-white text-xs shadow-md shadow-ocean-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    {editingId ? 'Save Changes' : 'Publish Destination'}
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
