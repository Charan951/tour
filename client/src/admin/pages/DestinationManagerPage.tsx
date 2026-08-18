import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2, Edit, Globe, Flag, Sun, Calendar } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
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
          className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Auto-Sync Active <span className="text-slate-400 font-normal">({destinations.length} total destinations)</span></span>
          </div>
          <button
            onClick={() => fetchDestinations()}
            className="text-[#0A6FB5] hover:underline font-bold text-xs"
          >
            ↻ Refresh Destinations
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading destinations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {destinations.map((d) => {
              const isDom = d.category === 'Domestic' || d.isDomestic !== false;
              return (
                <div key={d._id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 relative">
                  <div className="relative h-40 rounded-2xl overflow-hidden">
                    <img src={d.banner} alt={d.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-md ${
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
                      <span className="text-[#0A6FB5] font-semibold">Best: {d.bestTime || 'Nov - Feb'}</span> | <span>{d.weather || 'Tropical'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="p-1.5 rounded-lg bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white transition-colors"
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

      {/* Edit / Create Destination Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">{editingId ? 'Edit Destination Location' : 'Add New Destination Location'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Region Selector */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Select Region Scope *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setCategory('Domestic'); setCountryName('India'); }}
                    className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      category === 'Domestic'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className="w-4 h-4" /> 🇮🇳 India (Domestic)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCategory('International'); if (countryName === 'India') setCountryName('Maldives'); }}
                    className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      category === 'International'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-4 h-4" /> 🌍 World (International)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Destination Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Goa Beaches or Himachal"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Country Name *</label>
                  <input
                    type="text"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    required
                    placeholder="e.g. India or Maldives"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Best Time / Season *</label>
                  <input
                    type="text"
                    value={bestTime}
                    onChange={(e) => setBestTime(e.target.value)}
                    required
                    placeholder="e.g. Nov - Feb"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Weather Description *</label>
                  <input
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    required
                    placeholder="e.g. Pleasant Tropical Breezes"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
              </div>

              <CloudinaryImageUploader
                label="Upload Banner Image to Cloudinary"
                currentUrl={banner}
                onUploadSuccess={(url) => setBanner(url)}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Banner Image URL *</label>
                <input
                  type="text"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  required
                  placeholder="https://res.cloudinary.com/charan12/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Short Summary / Description *</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="Enter destination overview..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] font-bold text-white shadow-md cursor-pointer">
                  {editingId ? 'Update Destination' : 'Publish Destination'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
