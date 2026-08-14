import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';

export const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/blogs');
      setBlogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch blogs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Travel Stories & Guides | HolidayCity"
        description="Read curated travel guides, itinerary tips, and honeymoon stories from HolidayCity experts."
      />

      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Travel Stories & Insights
          </span>
          <h1 className="font-poppins font-extrabold text-4xl text-slate-900">
            Explore Our Latest Travel Guides
          </h1>
          <p className="text-slate-600 text-sm">
            Expert tips, destination highlights, and secret itineraries curated by HolidayCity travel specialists.
          </p>
        </div>

        {/* Blog Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading travel stories...</div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-[#0A6FB5] mx-auto animate-pulse" />
            <h3 className="font-bold text-slate-800 text-lg">No Stories Published Yet</h3>
            <p className="text-slate-500 text-xs">Our travel writers are crafting amazing destination guides. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((b) => (
              <article key={b._id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={b.banner || b.bannerImage}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-[#0A6FB5] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {b.category || 'Travel Tips'}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0A6FB5]" />
                        {new Date(b.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#0A6FB5]" />
                        {b.author || 'HolidayCity Editorial'}
                      </span>
                    </div>

                    <h2 className="font-poppins font-bold text-xl text-slate-900 group-hover:text-[#0A6FB5] transition-colors line-clamp-2">
                      {b.title}
                    </h2>

                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                      {b.content}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[#0A6FB5] font-bold text-xs flex items-center justify-between group-hover:bg-[#0A6FB5] group-hover:text-white transition-all">
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
