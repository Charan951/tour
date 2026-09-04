import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Edit, CheckCircle, Clock, MapPin, Tag, Compass, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';
import { FALLBACK_ACTIVITIES } from '../../utils/mobileDataFallback';

const mergeActivitiesWithFallback = (apiActs: any[]) => {
  const map = new Map<string, any>();
  (apiActs || []).forEach((a: any) => map.set(a._id || a.activityCode || a.slug || a.id, a));
  FALLBACK_ACTIVITIES.forEach((a: any) => {
    const idKey = a._id || a.activityCode || a.slug || a.id;
    if (!map.has(idKey)) map.set(idKey, a);
  });
  return Array.from(map.values());
};

const DEFAULT_ACTIVITY_CATEGORIES = [
  { name: 'Adventure', icon: '🧗', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'Water Sports', icon: '🤿', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'Air Sports', icon: '🪂', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { name: 'Trekking', icon: '🥾', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'Safari', icon: '🦁', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'Sightseeing', icon: '📸', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Cultural', icon: '🛕', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Theme Park', icon: '🎡', color: 'bg-rose-50 border-rose-200 text-rose-700' }
];

export const ActivityManagerPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>(DEFAULT_ACTIVITY_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [destinationFilter, setDestinationFilter] = useState('All');

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    onActivityUpdate: () => fetchDataSilently()
  });

  // Category Manager Modal State inside Activity Manager
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('⚡');
  const [catDescription, setCatDescription] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'Domestic' | 'International'>('All');
  const [title, setTitle] = useState('');
  const [activityCode, setActivityCode] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [category, setCategory] = useState('Adventure');
  const [duration, setDuration] = useState('2 Hours');
  const [startingPrice, setStartingPrice] = useState(2500);
  const [discountPrice, setDiscountPrice] = useState(3000);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop');
  const [location, setLocation] = useState('');
  const [overview, setOverview] = useState('');
  const [highlights, setHighlights] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [featured, setFeatured] = useState<boolean>(true);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actRes, destRes, catRes] = await Promise.all([
        apiClient.get('/activities?limit=100'),
        apiClient.get('/destinations'),
        apiClient.get('/categories')
      ]);
      setActivities(mergeActivitiesWithFallback(actRes.data?.data || []));
      setDestinations(destRes.data?.data || []);

      if (catRes.data?.data && catRes.data.data.length > 0) {
        const fetchedCats = catRes.data.data.map((c: any) => ({
          name: c.name,
          icon: c.icon || '⚡',
          color: 'bg-slate-50 border-slate-200 text-slate-700'
        }));
        setCategoriesList(fetchedCats);
      }
    } catch (err) {
      console.error('Failed to fetch activity manager data', err);
      setActivities(FALLBACK_ACTIVITIES);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSilently = async () => {
    try {
      const actRes = await apiClient.get('/activities?limit=100');
      setActivities(mergeActivitiesWithFallback(actRes.data?.data || []));
    } catch (_) {}
  };

  const handleEdit = (act: any) => {
    setEditingId(act._id);
    setTitle(act.title || '');
    setActivityCode(act.activityCode || '');
    setCategory(act.category || 'Adventure');
    const destObj = typeof act.destination === 'object' ? act.destination : null;
    const destId = destObj?._id || act.destination || '';
    setDestinationId(destId);

    if (destObj) {
      const isDom = destObj.category === 'Domestic' || destObj.isDomestic !== false;
      setSelectedRegion(isDom ? 'Domestic' : 'International');
    } else {
      setSelectedRegion('All');
    }

    setDuration(act.duration || '2 Hours');
    setStartingPrice(act.startingPrice || 0);
    setDiscountPrice(act.discountPrice || 0);
    setCoverImage(act.coverImage || '');
    setLocation(act.location || act.destinationName || '');
    setOverview(act.overview || '');
    setHighlights(Array.isArray(act.highlights) ? act.highlights.join(', ') : '');
    setInclusions(Array.isArray(act.inclusions) ? act.inclusions.join(', ') : '');
    setExclusions(Array.isArray(act.exclusions) ? act.exclusions.join(', ') : '');
    setFeatured(act.featured !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an Activity Title');
      return;
    }
    if (!destinationId) {
      toast.error('Please select a Destination Location for this Activity');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        activityCode: activityCode || undefined,
        destination: destinationId || undefined,
        category,
        duration: duration || '2 Hours',
        startingPrice: Number(startingPrice),
        discountPrice: Number(discountPrice) || undefined,
        coverImage,
        location,
        overview,
        highlights: highlights ? highlights.split(',').map((s) => s.trim()).filter(Boolean) : [],
        inclusions: inclusions ? inclusions.split(',').map((s) => s.trim()).filter(Boolean) : [],
        exclusions: exclusions ? exclusions.split(',').map((s) => s.trim()).filter(Boolean) : [],
        featured: featured !== false
      };

      if (editingId) {
        const res = await apiClient.patch(`/admin/activities/${editingId}`, payload);
        toast.success('Activity updated successfully');
        if (res.data?.data) {
          const updatedAct = res.data.data;
          setActivities((prev) => prev.map((a) => (a._id === editingId ? updatedAct : a)));
        }
      } else {
        const res = await apiClient.post('/admin/activities', payload);
        toast.success('Activity created successfully');
        if (res.data?.data) {
          const newAct = res.data.data;
          setActivities((prev) => [newAct, ...prev.filter((a) => a._id !== newAct._id)]);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchDataSilently();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save activity');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    const targetId = String(id);
    try {
      setActivities((prev) => prev.filter((a) => String(a._id) !== targetId));
      await apiClient.delete(`/admin/activities/${targetId}`);
      toast.success('Activity deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete activity');
    } finally {
      fetchDataSilently();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedRegion('All');
    setTitle('');
    setActivityCode('');
    setDestinationId('');
    setCategory('Adventure');
    setDuration('2 Hours');
    setStartingPrice(2500);
    setDiscountPrice(3000);
    setCoverImage('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop');
    setLocation('');
    setOverview('');
    setHighlights('');
    setInclusions('');
    setExclusions('');
  };

  const domesticDests = destinations.filter((d) => d.category === 'Domestic' || d.isDomestic !== false);
  const intlDests = destinations.filter((d) => d.category === 'International' || d.isDomestic === false);

  const displayedDestinations = selectedRegion === 'Domestic'
    ? domesticDests
    : selectedRegion === 'International'
    ? intlDests
    : destinations;

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const res = await apiClient.post('/admin/categories', {
        name: catName.trim(),
        icon: catIcon.trim() || '⚡',
        description: catDescription.trim(),
        type: 'activity'
      });
      toast.success('Category created successfully!');
      if (res.data?.data) {
        const newCat = { name: res.data.data.name, icon: res.data.data.icon || '⚡', color: 'bg-slate-50 border-slate-200 text-slate-700' };
        setCategoriesList((prev) => [...prev, newCat]);
      }
      setCatName('');
      setCatIcon('⚡');
      setCatDescription('');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catNameToDelete: string) => {
    if (!window.confirm(`Delete the "${catNameToDelete}" category?`)) return;
    try {
      // Find category from API or remove from list
      const catRes = await apiClient.get('/categories');
      const found = (catRes.data?.data || []).find((c: any) => c.name.toLowerCase() === catNameToDelete.toLowerCase());
      if (found?._id) {
        await apiClient.delete(`/admin/categories/${found._id}`);
      }
      setCategoriesList((prev) => prev.filter((c) => c.name.toLowerCase() !== catNameToDelete.toLowerCase()));
      toast.success('Category removed');
    } catch (err: any) {
      toast.error('Failed to delete category');
    }
  };

  const filteredActivities = activities.filter((a) => {
    const actCat = (a.category || '').trim().toLowerCase();
    const selCat = (categoryFilter || '').trim().toLowerCase();
    const matchesCat =
      selCat === 'all' ||
      actCat === selCat ||
      actCat.includes(selCat) ||
      selCat.includes(actCat);
    
    const destObj = typeof a.destination === 'object' && a.destination !== null ? a.destination : null;
    const destId = destObj?._id || a.destination;
    const destName = a.destinationName || destObj?.name || a.location || '';
    
    const matchesDest =
      destinationFilter === 'All' ||
      String(destId) === String(destinationFilter) ||
      destName.toLowerCase().includes(destinationFilter.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.activityCode || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.destinationName || '').toLowerCase().includes(q);

    return matchesCat && matchesDest && matchesSearch;
  });

  return (
    <AdminLayout
      title="Activity CRUD Manager"
      subtitle="Manage thrill sports, outdoor activities, entrance tickets, categories, destinations & inclusions."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Tag className="w-4 h-4 text-purple-600" /> Manage Categories
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Activity
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600 gap-3">
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
              ⚡ Live Activity Manager Active
              <span className="text-slate-400 font-normal"> ({activities.length} total activities)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity name, code, location..."
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-ocean-600 w-full sm:w-52"
            />
            <button
              onClick={() => fetchData()}
              className="text-ocean-600 hover:underline font-bold text-xs shrink-0 cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'All'
                ? 'bg-ocean-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories ({activities.length})
          </button>
          {categoriesList.map((cat) => {
            const count = activities.filter((a) => a.category?.toLowerCase() === cat.name.toLowerCase()).length;
            return (
              <button
                key={cat.name}
                onClick={() => setCategoryFilter(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  categoryFilter === cat.name
                    ? 'bg-ocean-600 border-ocean-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Activities Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No activities found matching your search or category filter.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Code</th>
                    <th className="p-4">Activity Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Starting Price</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredActivities.map((act) => {
                    const destObj = typeof act.destination === 'object' && act.destination !== null ? act.destination : null;
                    const locName = act.location || (destObj ? destObj.name : act.destinationName || 'Destinaton');
                    const catItem = categoriesList.find((c: any) => c.name.toLowerCase() === (act.category || '').toLowerCase()) || { icon: '⚡', color: 'bg-amber-50 border-amber-200 text-amber-700' };

                    return (
                      <tr key={act._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-ocean-600">{act.activityCode}</td>
                        <td className="p-4 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={act.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&auto=format&fit=crop'}
                              alt={act.title}
                              className="w-12 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                            <div>
                              <div>{act.title}</div>
                              {act.featured && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${catItem.color}`}>
                            {catItem.icon} {act.category || 'Adventure'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{locName}</td>
                        <td className="p-4 font-bold text-amber-600">{act.duration || '2 Hours'}</td>
                        <td className="p-4 font-extrabold text-emerald-600 text-sm">₹{act.startingPrice?.toLocaleString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(act)}
                            className="p-1.5 rounded-lg bg-blue-50 text-ocean-600 hover:bg-ocean-600 hover:text-white transition-colors cursor-pointer"
                            title="Edit Activity"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(act._id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Delete Activity"
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

      {/* Create / Edit Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-xl text-slate-900">
                {editingId ? 'Edit Activity Details' : 'Create New Activity'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Select Activity Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categoriesList.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-ocean-600 border-ocean-600 text-white shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Filter Buttons for Destination */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Filter Destination Region</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('All'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedRegion === 'All'
                        ? 'bg-ocean-600 border-ocean-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({destinations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('Domestic'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedRegion === 'Domestic'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🇮🇳 India ({domesticDests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('International'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedRegion === 'International'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌍 World ({intlDests.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Activity Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Bungee Jumping & Flying Fox Extreme"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Which Destination is this Activity for? *</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600 font-bold"
                  >
                    <option value="">-- Select Destination --</option>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Starting Price (₹) *</label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold focus:border-ocean-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Duration *</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    placeholder="e.g. 3 Hours / Full Day"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Specific Location / Spot Name</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mohan Chatti, Rishikesh / Grand Island, North Goa"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <CloudinaryImageUploader
                label="Upload Cover Image to Cloudinary"
                currentUrl={coverImage}
                onUploadSuccess={(url) => setCoverImage(url)}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Cover Image URL *</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-600 mb-1 font-bold">Activity Inclusions (comma separated)</label>
                  <textarea
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Jump Entry Pass, Safety Harness, Instructor Briefing, GoPro Video"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-rose-600 mb-1 font-bold">Activity Exclusions (comma separated)</label>
                  <textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Transport to Spot, Personal Shopping, Food & Water"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Activity Highlights (comma separated)</label>
                <input
                  type="text"
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="e.g. 83m Jump Height, PADI Certified Instructors, Sunset Views"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Activity Overview & Description</label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={3}
                  placeholder="Full narrative description of the activity experience..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="featuredAct"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-ocean-600 rounded cursor-pointer"
                />
                <label htmlFor="featuredAct" className="text-slate-800 font-bold text-xs cursor-pointer">
                  Feature this Activity on Home & App Landing Pages
                </label>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 font-bold text-white shadow-md cursor-pointer">
                  {editingId ? 'Update Activity Changes' : 'Publish New Activity'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal embedded inside Activity Manager */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Manage Activity Categories</h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Active Categories ({categoriesList.length})</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {categoriesList.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
                    <span>{cat.icon || '⚡'}</span>
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="ml-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Create New Category Form */}
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Add New Activity Category</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-700 mb-1 font-semibold">Category Name *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    placeholder="e.g. Desert Safari, Snow Sports"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Icon / Emoji</label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="🏜️"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-base font-bold outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Short Description (Optional)</label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="e.g. Thrilling off-road sand dune and desert activities"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-purple-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer">
                  Save New Category
                </button>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
