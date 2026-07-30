import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package as PkgIcon, Plus, Trash2, Edit, Sparkles, CheckCircle, Flag, Globe, Calendar, Clock, Heart, Mountain, Compass as CompassIcon, Shield, Sun } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';

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
  const [packages, setPackages] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [overview, setOverview] = useState('');
  const [highlights, setHighlights] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');

  // Dynamic Day-by-Day Itinerary List
  const [itinerary, setItinerary] = useState<Array<{ day: number; title: string; description: string; time?: string }>>([
    { day: 1, title: 'Day 1: Arrival & Transfer', description: 'Arrival at destination, transfer to pre-booked hotel and evening free for leisure.' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgRes, destRes] = await Promise.all([
        apiClient.get('/packages?limit=100'),
        apiClient.get('/destinations')
      ]);
      setPackages(pkgRes.data.data || []);
      setDestinations(destRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch package manager data', err);
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
    setOverview(pkg.overview || '');
    setHighlights(pkg.highlights ? pkg.highlights.join(', ') : '');
    setInclusions(pkg.inclusions ? pkg.inclusions.join(', ') : '');
    setExclusions(pkg.exclusions ? pkg.exclusions.join(', ') : '');

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
        overview,
        highlights: highlights ? highlights.split(',').map((s) => s.trim()) : [],
        inclusions: inclusions ? inclusions.split(',').map((s) => s.trim()) : [],
        exclusions: exclusions ? exclusions.split(',').map((s) => s.trim()) : [],
        itinerary: itinerary.map((item, idx) => ({
          day: idx + 1,
          title: item.title || `Day ${idx + 1}`,
          description: item.description || ''
        }))
      };

      if (editingId) {
        await apiClient.patch(`/admin/packages/${editingId}`, payload);
        toast.success('Package updated successfully');
      } else {
        await apiClient.post('/admin/packages', payload);
        toast.success('Package created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to save package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to soft-delete this package?')) return;
    try {
      await apiClient.delete(`/admin/packages/${id}`);
      toast.success('Package deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedRegion('All');
    setThemeName('Honeymoon Tour');
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

  return (
    <AdminLayout
      title="Tour Package CRUD Manager"
      subtitle="Full CRUD: Dynamic Day-by-Day Itineraries, Inclusions, Exclusions, Travel Themes & Tour Details."
      action={
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Package
        </button>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading packages...</div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
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
                  {packages.map((pkg) => {
                    const destObj = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination : null;
                    const destName = destObj ? destObj.name : 'Destination';
                    const themeItem = TRAVEL_THEMES.find((t) => t.name === pkg.themeName) || TRAVEL_THEMES[1];

                    return (
                      <tr key={pkg._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-[#0A6FB5]">{pkg.packageCode}</td>
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
                            className="p-1.5 rounded-lg bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white transition-colors"
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

      {/* Edit / Create Package Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-xl text-slate-900">{editingId ? 'Edit Tour Package' : 'Create New Tour Package'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              
              {/* SELECT TRAVEL THEME */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Select Travel Theme Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TRAVEL_THEMES.map((theme) => {
                    const isSelected = themeName === theme.name;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setThemeName(theme.name)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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

              {/* Region Filter Buttons */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold">Filter Destination Region *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('All'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedRegion === 'All'
                        ? 'bg-[#0A6FB5] border-[#0A6FB5] text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Destinations ({destinations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('Domestic'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedRegion === 'Domestic'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" /> 🇮🇳 India ({domesticDests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('International'); setDestinationId(''); }}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedRegion === 'International'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> 🌍 World ({intlDests.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Package Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Shimla Kufri Volvo Tour Package"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Destination Location *</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
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
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Starting Price (₹) *</label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nights</label>
                  <input
                    type="number"
                    value={nights}
                    onChange={(e) => setNights(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Days</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
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
                  placeholder="https://res.cloudinary.com/charan12/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              {/* DYNAMIC OUR TOUR ITINERARY BUILDER */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0A6FB5] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Our Tour Itinerary (Day-by-Day Builder)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItineraryDay}
                    className="px-3 py-1.5 rounded-lg bg-[#0A6FB5] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Day {itinerary.length + 1}
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {itinerary.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-600 text-xs">Day {item.day}</span>
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
                        placeholder={`Day ${item.day} Title (e.g. Arrive Delhi - Shimla)`}
                        className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#0A6FB5]"
                      />

                      <textarea
                        value={item.description}
                        onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                        rows={2}
                        placeholder={`Day ${item.day} Activities & Sightseeing Details...`}
                        className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#0A6FB5]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* OUR TOUR INFORMATION (INCLUSIONS & EXCLUSIONS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-600 mb-1 font-bold">Package Inclusions (comma separated)</label>
                  <textarea
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Delhi-Shimla Volvo Bus, 02 Night Stay, Pick up & Drop, Daily Breakfast & Dinner"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-rose-600 mb-1 font-bold">Package Exclusions (comma separated)</label>
                  <textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Personal Expenses, Flight Airfare, Hard Drinks, GST 5%"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* OUR TOUR DETAILS (NARRATIVE OVERVIEW) */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Our Tour Details (Overview & Hashtags)</label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={3}
                  placeholder="Enter full narrative tour description with hashtags..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] font-bold text-white shadow-md cursor-pointer">
                  {editingId ? 'Update Package Changes' : 'Publish New Package'}
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
