import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Sparkles, CheckCircle2, Layers, Search, Eye } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { AdminLayout } from '../components/AdminLayout';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import toast from 'react-hot-toast';

export const CategoryManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [type, setType] = useState<'activity' | 'package' | 'both'>('activity');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat._id);
    setName(cat.name || '');
    setIcon(cat.icon || '⚡');
    setDescription(cat.description || '');
    setCoverImage(cat.coverImage || '');
    setType(cat.type || 'activity');
    setDisplayOrder(String(cat.displayOrder ?? 1));
    setStatus(cat.status || 'Active');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${catName}" category?`)) return;
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      toast.success('Category deleted successfully');
      setCategories((prev) => prev.filter((c) => String(c._id) !== String(id)));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        icon: icon.trim() || '⚡',
        description: description.trim(),
        coverImage: coverImage.trim(),
        type,
        displayOrder: parseInt(displayOrder) || 0,
        status
      };

      if (editingId) {
        const res = await apiClient.patch(`/admin/categories/${editingId}`, payload);
        toast.success('Category updated successfully');
        if (res.data?.data) {
          const updated = res.data.data;
          setCategories((prev) => prev.map((c) => (String(c._id) === String(editingId) ? updated : c)));
        }
      } else {
        const res = await apiClient.post('/admin/categories', payload);
        toast.success('Category created successfully');
        if (res.data?.data) {
          const newCat = res.data.data;
          setCategories((prev) => [...prev, newCat]);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon('⚡');
    setDescription('');
    setCoverImage('');
    setType('activity');
    setDisplayOrder('1');
    setStatus('Active');
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      title="Category Manager"
      subtitle="Create, update, and manage activity & tour package categories."
      action={
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      }
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-ocean-600 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              Total Categories: <strong className="text-ocean-600">{categories.length}</strong>
            </span>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm font-semibold">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No categories found. Click "Create Category" to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-ocean-50 border border-ocean-100 flex items-center justify-center text-2xl shadow-inner">
                      {cat.icon || '⚡'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        cat.type === 'activity' ? 'bg-amber-100 text-amber-800' :
                        cat.type === 'package' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cat.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        cat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-['Outfit'] font-bold text-base text-slate-900">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Order: #{cat.displayOrder || 0}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-ocean-600 hover:text-white text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-all cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">
                {editingId ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 mb-1 font-semibold">Category Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Water Sports"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Icon / Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🤿"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 text-center font-bold text-base focus:border-ocean-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short summary of activities or tours in this category..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 text-xs focus:border-ocean-600"
                />
              </div>

              <CloudinaryImageUploader
                label="Cover Image URL (Optional)"
                currentUrl={coverImage}
                onUploadSuccess={(url) => setCoverImage(url)}
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Category Scope</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-semibold text-xs focus:border-ocean-600"
                  >
                    <option value="activity">Activities</option>
                    <option value="package">Tour Packages</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    min="0"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-semibold text-xs focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-semibold text-xs focus:border-ocean-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 font-bold text-white shadow-md active:scale-95 transition-all">
                  {editingId ? 'Update Category' : 'Save Category'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200">
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
