import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit, MapPin, Tag, ExternalLink, Sparkles, Flag, Globe, Palette } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';

const ALL_THEME_NAMES = [
  'Honeymoon Tour',
  'Leisure',
  'Hill Station',
  'Trekking',
  'Adventure',
  'Religious',
  'Family Tour',
  'Wildlife Safari'
];

export const BannerManagerPage: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [themeBanners, setThemeBanners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    onBannerUpdate: (updatedData) => {
      if (updatedData?.deleted) {
        const targetId = String(updatedData.id || updatedData._id || '');
        setBanners((prev) => prev.filter((b) => String(b._id) !== targetId));
      } else if (updatedData?._id) {
        const targetId = String(updatedData._id);
        setBanners((prev) => {
          const exists = prev.some((b) => String(b._id) === targetId);
          if (exists) {
            return prev.map((b) => (String(b._id) === targetId ? updatedData : b));
          }
          return [updatedData, ...prev];
        });
      }
    },
    onThemeUpdate: () => fetchDataSilently()
  });

  // Destination Banner Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [targetSection, setTargetSection] = useState<'OfferCard' | 'HomeBanner' | 'DestinationBanner' | 'HeroBanner'>('OfferCard');
  const [offerText, setOfferText] = useState('Limited Offer');
  const [priceText, setPriceText] = useState('₹8,500 Per Person');
  const [durationText, setDurationText] = useState('03 Night / 04 Days');
  const [linkUrl, setLinkUrl] = useState('');

  // Theme Banner Form State
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [selectedThemeName, setSelectedThemeName] = useState('Honeymoon Tour');
  const [themeImageUrl, setThemeImageUrl] = useState('');
  const [themeDesc, setThemeDesc] = useState('');

  useEffect(() => {
    fetchData();
    const handleDataUpdate = () => fetchDataSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      fetchDataSilently();
    }, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchDataSilently = async () => {
    try {
      const [banRes, destRes, themeRes] = await Promise.all([
        apiClient.get('/banners'),
        apiClient.get('/destinations'),
        apiClient.get('/themes')
      ]);
      if (banRes.data?.data) setBanners(banRes.data.data);
      if (destRes.data?.data) setDestinations(destRes.data.data);
      if (themeRes.data?.data) setThemeBanners(themeRes.data.data);
    } catch (_) {}
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [banRes, destRes, themeRes] = await Promise.all([
        apiClient.get('/banners'),
        apiClient.get('/destinations'),
        apiClient.get('/themes')
      ]);
      setBanners(banRes.data.data || []);
      setDestinations(destRes.data.data || []);
      setThemeBanners(themeRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner._id);
    setTitle(banner.title || '');
    setImageUrl(banner.imageUrl || '');
    const destObj = typeof banner.destination === 'object' ? banner.destination : null;
    setDestinationId(destObj?._id || banner.destination || '');
    setTargetSection(banner.targetSection || 'OfferCard');
    setOfferText(banner.offerText || 'Limited Offer');
    setPriceText(banner.priceText || '₹8,500 Per Person');
    setDurationText(banner.durationText || '03 Night / 04 Days');
    setLinkUrl(banner.linkUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('Please upload a banner image');
      return;
    }

    try {
      const payload = {
        title,
        imageUrl,
        destination: destinationId || null,
        targetSection,
        offerText,
        priceText,
        durationText,
        linkUrl
      };

      if (editingId) {
        const res = await apiClient.patch(`/admin/banners/${editingId}`, payload);
        toast.success('Banner updated successfully');
        if (res.data?.data) {
          const updated = res.data.data;
          setBanners((prev) => prev.map((b) => (String(b._id) === String(editingId) ? updated : b)));
        }
      } else {
        const res = await apiClient.post('/admin/banners', payload);
        toast.success('Banner published successfully');
        if (res.data?.data) {
          const newBanner = res.data.data;
          setBanners((prev) => [newBanner, ...prev.filter((b) => String(b._id) !== String(newBanner._id))]);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchDataSilently();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleSaveThemeBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeImageUrl) {
      toast.error('Please upload a theme banner image');
      return;
    }
    try {
      await apiClient.post('/admin/themes', {
        themeName: selectedThemeName,
        imageUrl: themeImageUrl,
        description: themeDesc
      });
      toast.success(`Theme banner updated for ${selectedThemeName}!`);
      setThemeModalOpen(false);
      setThemeImageUrl('');
      setThemeDesc('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save theme banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo banner?')) return;
    const targetId = String(id);
    try {
      setBanners((prev) => prev.filter((b) => String(b._id) !== targetId));
      await apiClient.delete(`/admin/banners/${targetId}`);
      toast.success('Banner deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete banner');
    } finally {
      fetchData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setImageUrl('');
    setDestinationId('');
    setTargetSection('OfferCard');
    setOfferText('Limited Offer');
    setPriceText('₹8,500 Per Person');
    setDurationText('03 Night / 04 Days');
    setLinkUrl('');
  };

  return (
    <AdminLayout
      title="Banner & Theme CRUD Manager"
      subtitle="Upload promo banners and custom theme banner images directly to Cloudinary."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Destination Banner
          </button>

          <button
            onClick={() => { setThemeImageUrl(''); setThemeModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Palette className="w-4 h-4" /> Add Theme Banner
          </button>
        </div>
      }
    >
      <div className="space-y-10">
        
        {/* SECTION 1: THEME BANNERS CRUD (MATCHING IMAGE COPY 3) */}
        <section className="space-y-4">
          <h2 className="font-['Outfit'] font-bold text-xl text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" /> Travel Specialization Theme Banners ({themeBanners.length}/8 Uploaded)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_THEME_NAMES.map((themeName) => {
              const tb = themeBanners.find((t) => t.themeName === themeName);
              return (
                <div key={themeName} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    {tb ? (
                      <img src={tb.imageUrl} alt={themeName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-60" /> Default Banner Image Active
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-md">
                      {themeName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      {tb ? 'Custom Cloudinary' : 'System Default'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tb && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Reset custom banner for ${themeName} to default image?`)) return;
                            try {
                              await apiClient.delete(`/admin/themes/${tb._id}`);
                              toast.success(`Reset ${themeName} banner to default`);
                              fetchData();
                            } catch (e) {
                              toast.error('Failed to reset theme banner');
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          title="Reset to Default Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedThemeName(themeName);
                          setThemeImageUrl(tb?.imageUrl || '');
                          setThemeDesc(tb?.description || '');
                          setThemeModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Banner
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: DESTINATION PROMO OFFER BANNERS */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="font-['Outfit'] font-bold text-xl text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-ocean-600" /> Destination Promo Offer Banners ({banners.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No promo offer banners uploaded yet. Click "Add Destination Banner" above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((b) => {
                const destObj = typeof b.destination === 'object' && b.destination !== null ? b.destination : null;

                return (
                  <div key={b._id} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-ocean-600 text-white shadow-md">
                          {b.targetSection || 'OfferCard'}
                        </span>
                        {destObj && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-md">
                            {destObj.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-['Outfit'] font-bold text-sm text-slate-900 line-clamp-1">{b.title}</h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg bg-blue-50 text-ocean-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Destination Banner Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">{editingId ? 'Edit Destination Banner' : 'Create New Destination Banner'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Banner Title / Destination Name *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Kedarnath Tour Offer"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <CloudinaryImageUploader
                label="Upload Clean Banner Image to Cloudinary *"
                currentUrl={imageUrl}
                onUploadSuccess={(url) => setImageUrl(url)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Assign Destination</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  >
                    <option value="">General Destination Promo</option>
                    {destinations.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Placement Slot *</label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  >
                    <option value="HeroBanner">Home Page Hero Banner</option>
                    <option value="HomeBanner">Right Specialization Slider</option>
                    <option value="OfferCard">Offer Card Row (4 Cards)</option>
                    <option value="DestinationBanner">Destination Page Hero Banner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Offer Badge / Tag</label>
                  <input
                    type="text"
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    placeholder="e.g. Special Deal 20% OFF"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Price Display Text</label>
                  <input
                    type="text"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="e.g. ₹8,500 Per Person"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Duration Display Text</label>
                  <input
                    type="text"
                    value={durationText}
                    onChange={(e) => setDurationText(e.target.value)}
                    placeholder="e.g. 03 Night / 04 Days"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Redirect URL (Optional)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. /packages/kedarnath-yatra or https://..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 font-bold text-white shadow-md">
                  Save Banner Image
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Banner Upload Modal */}
      {themeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Upload Theme Banner: {selectedThemeName}</h3>
              <button onClick={() => setThemeModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveThemeBanner} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Select Travel Theme</label>
                <select
                  value={selectedThemeName}
                  onChange={(e) => setSelectedThemeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                >
                  {ALL_THEME_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <CloudinaryImageUploader
                label="Upload Custom Theme Banner to Cloudinary *"
                currentUrl={themeImageUrl}
                onUploadSuccess={(url) => setThemeImageUrl(url)}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Theme Description</label>
                <textarea
                  value={themeDesc}
                  onChange={(e) => setThemeDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe this travel style..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md">
                  Publish Theme Banner
                </button>
                <button type="button" onClick={() => setThemeModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold">
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
