import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Edit, MessageSquare, HelpCircle, Star, Phone, Mail, MapPin, Settings as SettingsIcon, Save } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';

export const CMSManagerPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [phone, setPhone] = useState('+91 98765 43210');
  const [whatsapp, setWhatsapp] = useState('+91 98765 43210');
  const [email, setEmail] = useState('info@holidaycity.com');
  const [address, setAddress] = useState('Kochi & Bangalore, India');

  // Modals
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Blog Form
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Travel Tips');
  const [blogBanner, setBlogBanner] = useState('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop');
  const [blogContent, setBlogContent] = useState('');

  // Testimonial Form
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  useEffect(() => {
    fetchCMS();
  }, []);

  const fetchCMS = async () => {
    try {
      setLoading(true);
      const [blogRes, testRes, faqRes, settingsRes] = await Promise.all([
        apiClient.get('/blogs'),
        apiClient.get('/testimonials'),
        apiClient.get('/faq'),
        apiClient.get('/settings')
      ]);
      setBlogs(blogRes.data.data || []);
      setTestimonials(testRes.data.data || []);
      setFaqs(faqRes.data.data || []);

      if (settingsRes.data.data) {
        const s = settingsRes.data.data;
        setPhone(s.phones?.primary || '+91 98765 43210');
        setWhatsapp(s.phones?.whatsapp || '+91 98765 43210');
        setEmail(s.emails?.primary || 'info@holidaycity.com');
        setAddress(s.address || 'Kochi & Bangalore, India');
      }
    } catch (err) {
      console.error('Failed to fetch CMS data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch('/admin/settings', {
        phones: { primary: phone, whatsapp },
        emails: { primary: email },
        address
      });
      toast.success('Company contact details updated live!');
      fetchCMS();
    } catch (err) {
      toast.error('Failed to update contact settings');
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      toast.error('Please fill in all blog required fields');
      return;
    }

    try {
      await apiClient.post('/admin/blogs', {
        title: blogTitle,
        category: blogCategory,
        banner: blogBanner, // Match Mongoose Blog schema field
        content: blogContent
      });
      toast.success('Blog article created successfully');
      setBlogModalOpen(false);
      setBlogTitle('');
      setBlogContent('');
      fetchCMS();
    } catch (err: any) {
      console.error('Blog creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to create blog');
    }
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/testimonials', {
        customerName,
        rating: Number(rating),
        review
      });
      toast.success('Testimonial added successfully');
      setTestModalOpen(false);
      setCustomerName('');
      setReview('');
      fetchCMS();
    } catch (err: any) {
      toast.error('Failed to create testimonial');
    }
  };

  return (
    <AdminLayout
      title="CMS & Settings Manager"
      subtitle="Edit live contact numbers, publish travel stories, and manage customer reviews."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBlogModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Blog Article
          </button>
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        
        {/* DYNAMIC CONTACT SETTINGS EDITOR */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#0A6FB5]" /> Company Dynamic Contact Details
            </h2>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live DB Settings
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#0A6FB5]" /> Primary Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Support Number
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#0A6FB5]" /> Official Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="info@holidaycity.com"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Office Headquarters Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Kochi & Bangalore, India"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Save Contact Details Live
              </button>
            </div>
          </form>
        </section>

        {/* Blogs Section */}
        <section className="space-y-4">
          <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0A6FB5]" /> Published Blog Articles ({blogs.length})
          </h2>

          {blogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No blog articles created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <div key={b._id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="h-36 rounded-2xl overflow-hidden">
                    <img src={b.banner || b.bannerImage} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0A6FB5]">
                    {b.category || 'Travel Tips'}
                  </span>
                  <h3 className="font-['Outfit'] font-bold text-sm text-slate-900 line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{b.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Testimonials Section */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" /> Customer Testimonials & Reviews ({testimonials.length})
          </h2>

          {testimonials.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No customer testimonials added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t._id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{t.customerName}</h4>
                    <div className="flex text-amber-400">
                      {'★'.repeat(t.rating || 5)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{t.review}"</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Blog Modal */}
      {blogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 w-full max-w-xl border border-slate-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Add New Blog Article</h3>
              <button onClick={() => setBlogModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Blog Article Title *</label>
                <input
                  type="text"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  required
                  placeholder="e.g. Top 10 Things to Do in Goa Beaches"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Category</label>
                <select
                  value={blogCategory}
                  onChange={(e) => setBlogCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                >
                  <option value="Travel Tips">Travel Tips</option>
                  <option value="Destination Guide">Destination Guide</option>
                  <option value="Honeymoon Special">Honeymoon Special</option>
                  <option value="Budget Travel">Budget Travel</option>
                </select>
              </div>

              {/* Cloudinary Image Uploader for Blog Banner */}
              <CloudinaryImageUploader
                label="Upload Cover Image to Cloudinary"
                currentUrl={blogBanner}
                onUploadSuccess={(url) => setBlogBanner(url)}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Banner Image URL *</label>
                <input
                  type="text"
                  value={blogBanner}
                  onChange={(e) => setBlogBanner(e.target.value)}
                  required
                  placeholder="https://res.cloudinary.com/charan12/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Blog Content *</label>
                <textarea
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Write full article story..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] font-bold text-white shadow-md cursor-pointer">
                  Publish Article
                </button>
                <button type="button" onClick={() => setBlogModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Testimonial Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 w-full max-w-lg border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Add Customer Review</h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTestimonial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Star Rating (1 - 5)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★</option>
                  <option value={3}>3 Stars ★★★</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Customer Review *</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter testimonial text..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-md cursor-pointer">
                  Save Testimonial
                </button>
                <button type="button" onClick={() => setTestModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold">
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
