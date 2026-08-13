import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Edit, MessageSquare, HelpCircle, Star, Phone, Mail, MapPin, Settings as SettingsIcon, Save } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { CloudinaryImageUploader } from '../../components/common/CloudinaryImageUploader';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';

import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';

export const CMSManagerPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time socket updates
  const { isConnected } = useRealtimeUpdates({
    onBlogUpdate: (updatedData) => {
      if (updatedData?.deleted) {
        const targetId = String(updatedData.id || updatedData._id || '');
        setBlogs((prev) => prev.filter((b) => String(b._id) !== targetId));
      } else if (updatedData?._id) {
        const targetId = String(updatedData._id);
        setBlogs((prev) => {
          const exists = prev.some((b) => String(b._id) === targetId);
          if (exists) {
            return prev.map((b) => (String(b._id) === targetId ? updatedData : b));
          }
          return [updatedData, ...prev];
        });
      }
    }
  });

  // Settings State
  const [companyName, setCompanyName] = useState('HolidayCity');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [whatsapp, setWhatsapp] = useState('+91 98765 43210');
  const [email, setEmail] = useState('info@holidaycity.com');
  const [address, setAddress] = useState('Kochi & Bangalore, India');
  const [metaTitle, setMetaTitle] = useState('HolidayCity | Explore. Experience. Enjoy.');
  const [metaDescription, setMetaDescription] = useState('Discover domestic and international holiday packages with HolidayCity.');

  // Modals
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);

  // Blog Form
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Travel Tips');
  const [blogBanner, setBlogBanner] = useState('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop');
  const [blogContent, setBlogContent] = useState('');

  // Testimonial Form
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  // FAQ Form
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  useEffect(() => {
    fetchCMS();
    const handleDataUpdate = () => fetchCMSSilently();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => {
      fetchCMSSilently();
    }, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchCMSSilently = async () => {
    try {
      const [blogRes, testRes, faqRes] = await Promise.all([
        apiClient.get('/blogs'),
        apiClient.get('/testimonials'),
        apiClient.get('/faq')
      ]);
      if (blogRes.data?.data) setBlogs(blogRes.data.data);
      if (testRes.data?.data) setTestimonials(testRes.data.data);
      if (faqRes.data?.data) setFaqs(faqRes.data.data);
    } catch (_) {}
  };

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

      if (settingsRes.data?.data) {
        const s = settingsRes.data.data;
        setCompanyName(s.companyName || 'HolidayCity');
        setPhone(s.phones?.primary || '+91 98765 43210');
        setWhatsapp(s.phones?.whatsapp || '+91 98765 43210');
        setEmail(s.emails?.primary || 'info@holidaycity.com');
        setAddress(s.address || 'Kochi & Bangalore, India');
        if (s.seoDefaults) {
          setMetaTitle(s.seoDefaults.metaTitle || 'HolidayCity | Explore. Experience. Enjoy.');
          setMetaDescription(s.seoDefaults.metaDescription || 'Discover domestic and international holiday packages with HolidayCity.');
        }
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
        companyName,
        phones: { primary: phone, whatsapp },
        emails: { primary: email },
        address,
        seoDefaults: { metaTitle, metaDescription }
      });
      toast.success('Company contact details and settings saved live!');
      fetchCMS();
    } catch (err) {
      toast.error('Failed to update contact settings');
    }
  };

  // --- BLOG HANDLERS ---
  const handleOpenCreateBlog = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogCategory('Travel Tips');
    setBlogBanner('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop');
    setBlogContent('');
    setBlogModalOpen(true);
  };

  const handleOpenEditBlog = (b: any) => {
    setEditingBlogId(b._id);
    setBlogTitle(b.title || '');
    setBlogCategory(b.category || 'Travel Tips');
    setBlogBanner(b.banner || b.bannerImage || '');
    setBlogContent(b.content || '');
    setBlogModalOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      toast.error('Please fill in all blog required fields');
      return;
    }

    try {
      const payload = {
        title: blogTitle,
        category: blogCategory,
        banner: blogBanner,
        content: blogContent,
        status: 'Published'
      };

      if (editingBlogId) {
        const res = await apiClient.patch(`/admin/blogs/${editingBlogId}`, payload);
        toast.success('Blog article updated successfully');
        if (res.data?.data) {
          const updated = res.data.data;
          setBlogs((prev) => prev.map((b) => (String(b._id) === String(editingBlogId) ? updated : b)));
        }
      } else {
        const res = await apiClient.post('/admin/blogs', payload);
        toast.success('Blog article created successfully');
        if (res.data?.data) {
          const newBlog = res.data.data;
          setBlogs((prev) => [newBlog, ...prev.filter((b) => String(b._id) !== String(newBlog._id))]);
        }
      }

      setBlogModalOpen(false);
      fetchCMSSilently();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save blog');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    const targetId = String(id);
    try {
      setBlogs((prev) => prev.filter((b) => String(b._id) !== targetId));
      await apiClient.delete(`/admin/blogs/${targetId}`);
      toast.success('Blog deleted');
    } catch (err: any) {
      toast.error('Failed to delete blog');
    } finally {
      fetchCMSSilently();
    }
  };

  // --- TESTIMONIAL HANDLERS ---
  const handleOpenCreateTestimonial = () => {
    setEditingTestId(null);
    setCustomerName('');
    setRating(5);
    setReview('');
    setTestModalOpen(true);
  };

  const handleOpenEditTestimonial = (t: any) => {
    setEditingTestId(t._id);
    setCustomerName(t.customerName || '');
    setRating(t.rating || 5);
    setReview(t.review || '');
    setTestModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !review) {
      toast.error('Customer name and review are required');
      return;
    }
    try {
      const payload = {
        customerName,
        rating: Number(rating),
        review
      };

      if (editingTestId) {
        const res = await apiClient.patch(`/admin/testimonials/${editingTestId}`, payload);
        toast.success('Testimonial updated');
        if (res.data?.data) {
          const updated = res.data.data;
          setTestimonials((prev) => prev.map((t) => (String(t._id) === String(editingTestId) ? updated : t)));
        }
      } else {
        const res = await apiClient.post('/admin/testimonials', payload);
        toast.success('Testimonial created');
        if (res.data?.data) {
          const newTest = res.data.data;
          setTestimonials((prev) => [newTest, ...prev.filter((t) => String(t._id) !== String(newTest._id))]);
        }
      }

      setTestModalOpen(false);
      fetchCMSSilently();
    } catch (err: any) {
      toast.error('Failed to save testimonial');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    const targetId = String(id);
    try {
      setTestimonials((prev) => prev.filter((t) => String(t._id) !== targetId));
      await apiClient.delete(`/admin/testimonials/${targetId}`);
      toast.success('Testimonial deleted');
    } catch (err: any) {
      toast.error('Failed to delete testimonial');
    } finally {
      fetchCMSSilently();
    }
  };

  // --- FAQ HANDLERS ---
  const handleOpenCreateFAQ = () => {
    setEditingFaqId(null);
    setFaqCategory('General');
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqModalOpen(true);
  };

  const handleOpenEditFAQ = (f: any) => {
    setEditingFaqId(f._id);
    setFaqCategory(f.category || 'General');
    setFaqQuestion(f.question || '');
    setFaqAnswer(f.answer || '');
    setFaqModalOpen(true);
  };

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const payload = {
        category: faqCategory,
        question: faqQuestion,
        answer: faqAnswer
      };

      if (editingFaqId) {
        const res = await apiClient.patch(`/admin/faqs/${editingFaqId}`, payload);
        toast.success('FAQ updated');
        if (res.data?.data) {
          const updated = res.data.data;
          setFaqs((prev) => prev.map((f) => (String(f._id) === String(editingFaqId) ? updated : f)));
        }
      } else {
        const res = await apiClient.post('/admin/faqs', payload);
        toast.success('FAQ created');
        if (res.data?.data) {
          const newFaq = res.data.data;
          setFaqs((prev) => [newFaq, ...prev.filter((f) => String(f._id) !== String(newFaq._id))]);
        }
      }

      setFaqModalOpen(false);
      fetchCMSSilently();
    } catch (err: any) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    const targetId = String(id);
    try {
      setFaqs((prev) => prev.filter((f) => String(f._id) !== targetId));
      await apiClient.delete(`/admin/faqs/${targetId}`);
      toast.success('FAQ deleted');
    } catch (err: any) {
      toast.error('Failed to delete FAQ');
    } finally {
      fetchCMS();
    }
  };

  return (
    <AdminLayout
      title="CMS & Settings Manager"
      subtitle="Edit live contact numbers, publish travel stories, customer reviews, and FAQs."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateBlog}
            className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Blog Article
          </button>
          <button
            onClick={handleOpenCreateTestimonial}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
          <button
            onClick={handleOpenCreateFAQ}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        
        {/* DYNAMIC CONTACT SETTINGS EDITOR */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#0A6FB5]" /> Company Settings & Contact Information
            </h2>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live DB Sync
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="HolidayCity"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
              />
            </div>

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

            <div className="sm:col-span-2">
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
          <div className="flex items-center justify-between">
            <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0A6FB5]" /> Published Blog Articles ({blogs.length})
            </h2>
            <button
              onClick={handleOpenCreateBlog}
              className="text-[#0A6FB5] font-bold text-xs hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Article
            </button>
          </div>

          {blogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No blog articles created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <div key={b._id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-36 rounded-2xl overflow-hidden bg-slate-100">
                      <img src={b.banner || b.bannerImage} alt={b.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0A6FB5]">
                      {b.category || 'Travel Tips'}
                    </span>
                    <h3 className="font-['Outfit'] font-bold text-sm text-slate-900 line-clamp-2">{b.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{b.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditBlog(b)}
                      className="p-1.5 rounded-lg bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white transition-colors"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(b._id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Testimonials Section */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Customer Testimonials & Reviews ({testimonials.length})
            </h2>
            <button
              onClick={handleOpenCreateTestimonial}
              className="text-amber-600 font-bold text-xs hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Review
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No customer testimonials added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t._id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{t.customerName}</h4>
                      <div className="flex text-amber-400">
                        {'★'.repeat(t.rating || 5)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{t.review}"</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditTestimonial(t)}
                      className="p-1.5 rounded-lg bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white transition-colors"
                      title="Edit Testimonial"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t._id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Delete Testimonial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FAQs Section */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" /> Frequently Asked Questions ({faqs.length})
            </h2>
            <button
              onClick={handleOpenCreateFAQ}
              className="text-purple-600 font-bold text-xs hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New FAQ
            </button>
          </div>

          {faqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              No FAQs added yet.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              {faqs.map((f) => (
                <div key={f._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                      {f.category || 'General'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{f.question}</h4>
                    <p className="text-xs text-slate-600">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditFAQ(f)}
                      className="p-1.5 rounded-lg bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFAQ(f._id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Add/Edit Blog Modal */}
      {blogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 w-full max-w-xl border border-slate-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">
                {editingBlogId ? 'Edit Blog Article' : 'Add New Blog Article'}
              </h3>
              <button onClick={() => setBlogModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4 text-xs">
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
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Blog Content *</label>
                <textarea
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  required
                  rows={5}
                  placeholder="Write full article story..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] font-bold text-white shadow-md cursor-pointer">
                  {editingBlogId ? 'Update Article' : 'Publish Article'}
                </button>
                <button type="button" onClick={() => setBlogModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Testimonial Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 w-full max-w-lg border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">
                {editingTestId ? 'Edit Customer Review' : 'Add Customer Review'}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4 text-xs">
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
                  <option value={2}>2 Stars ★★</option>
                  <option value={1}>1 Star ★</option>
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

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer">
                  {editingTestId ? 'Update Review' : 'Save Testimonial'}
                </button>
                <button type="button" onClick={() => setTestModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 w-full max-w-lg border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">
                {editingFaqId ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              <button onClick={() => setFaqModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveFAQ} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Category</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                >
                  <option value="General">General</option>
                  <option value="Booking">Booking</option>
                  <option value="Visa">Visa</option>
                  <option value="Payment">Payment</option>
                  <option value="Cancellation">Cancellation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Question *</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  required
                  placeholder="e.g. What documents are required for Visa?"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Answer *</label>
                <textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter detailed answer..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md cursor-pointer">
                  {editingFaqId ? 'Update FAQ' : 'Save FAQ'}
                </button>
                <button type="button" onClick={() => setFaqModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
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
