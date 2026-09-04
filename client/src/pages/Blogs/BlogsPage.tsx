import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';
import { formatImageUrl, formatSrcSet } from '../../utils/imageUrl';

export const stripHtml = (html?: string): string =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const excerptOf = (b: any, len = 170): string => {
  const text = b.excerpt || b.summary || stripHtml(b.content);
  return text.length > len ? `${text.slice(0, len).trimEnd()}…` : text;
};

export const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/blogs');
        setBlogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <SEO
        title="Travel Stories & Guides | HolidayCity"
        description="Read travel guides, itinerary tips, and destination notes from the HolidayCity team."
      />

      <div className="pt-18 sm:pt-20 pb-16 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600 bg-ocean-600/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Travel stories & guides
          </span>
          <h1 className="font-display font-black text-4xl text-ink">Notes from the road</h1>
          <p className="text-slate-body text-sm">
            Destination guides, itinerary tips and honest travel notes from the people who plan the trips.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-line shadow-card max-w-lg mx-auto space-y-3">
            <BookOpen className="w-8 h-8 text-ocean-600 mx-auto" />
            <h2 className="font-display font-black text-ink text-lg">No stories published yet</h2>
            <p className="text-slate-muted text-xs">
              We publish guides as trips wrap up. Check back soon, or ask a consultant directly.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-2xl2 bg-ocean-600 text-white text-xs font-black uppercase tracking-wider"
            >
              Ask a consultant <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((b) => (
              <Link
                key={b._id}
                to={`/blog/${b.slug}`}
                className="group flex flex-col justify-between bg-white rounded-3xl overflow-hidden border border-line premium-card-shadow"
              >
                <div>
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={formatImageUrl(b.banner || b.bannerImage, undefined, 768)}
                      srcSet={formatSrcSet(b.banner || b.bannerImage, [480, 768, 1024])}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md text-white text-[0.6875rem] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                      {b.category || 'Travel'}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-4 text-[0.6875rem] text-slate-muted font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                        {new Date(b.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-ocean-600" />
                        {b.author || 'HolidayCity team'}
                      </span>
                    </div>

                    <h2 className="font-display font-black text-xl text-ink group-hover:text-ocean-600 transition-colors line-clamp-2">
                      {b.title}
                    </h2>

                    <p className="text-slate-body text-xs line-clamp-3 leading-relaxed">{excerptOf(b)}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <div className="w-full py-2.5 px-4 rounded-2xl2 bg-fill border border-line text-ocean-600 font-black text-xs uppercase tracking-wider flex items-center justify-between group-hover:bg-ocean-600 group-hover:text-white transition-all">
                    <span>Read the guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
