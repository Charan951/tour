import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';
import { formatImageUrl } from '../../utils/imageUrl';
import { stripHtml } from './BlogsPage';

const looksLikeHtml = (s?: string) => !!s && /<\/?[a-z][\s\S]*>/i.test(s);

// Turn stored blog content into safe plain-text paragraphs. We deliberately do NOT
// render it as HTML: content is authored in the CMS and there is no client- or
// server-side sanitizer in the pipeline, so injecting it would be a stored-XSS surface.
const toParagraphs = (content?: string): string[] => {
  if (!content) return [];
  const source = looksLikeHtml(content)
    ? content
        .replace(/<\/(p|div|h[1-6]|li|br)\s*>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n\n')
    : content;
  return stripHtmlPreservingBreaks(source)
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const stripHtmlPreservingBreaks = (s: string): string =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/blogs/${slug}`);
        if (res.data?.data) setBlog(res.data.data);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-2/3 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="h-4 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="pt-28 pb-20 px-4 max-w-md mx-auto text-center space-y-3">
        <h1 className="font-display font-black text-2xl text-ink">Story not found</h1>
        <p className="text-sm text-slate-muted">This guide may have been moved or unpublished.</p>
        <Link to="/blogs" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl2 bg-ocean-600 text-white text-xs font-black uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" /> All stories
        </Link>
      </div>
    );
  }

  const paragraphs = toParagraphs(blog.content);

  return (
    <>
      <SEO
        title={`${blog.seo?.metaTitle || blog.title} | HolidayCity`}
        description={blog.seo?.metaDescription || stripHtml(blog.content).slice(0, 155)}
        ogImage={blog.banner || blog.bannerImage}
      />

      <article className="pt-18 sm:pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <Link to="/blogs" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-body hover:text-ocean-600">
          <ArrowLeft className="w-4 h-4" /> All stories
        </Link>

        <p className="mt-6 text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600">
          {blog.category || 'Travel'}
        </p>
        <h1 className="mt-2 font-display font-black text-3xl sm:text-4xl text-ink leading-tight text-balance">
          {blog.title}
        </h1>

        <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-ocean-600" />
            {new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-ocean-600" />
            {blog.author || 'HolidayCity team'}
          </span>
        </div>

        {(blog.banner || blog.bannerImage) && (
          <img
            src={formatImageUrl(blog.banner || blog.bannerImage, undefined, 1280)}
            alt={blog.title}
            className="mt-6 w-full rounded-3xl border border-line object-cover"
            loading="eager"
            decoding="async"
          />
        )}

        <div className="article-body mt-8">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-r from-ocean-800 to-ocean-600 p-6 sm:p-8 text-white">
          <h2 className="font-display font-black text-xl">Planning a trip like this?</h2>
          <p className="text-sm text-white/85 mt-1">
            Tell a consultant what you have in mind and get a custom itinerary and quote back — usually the same day.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-2xl2 bg-white text-ocean-800 text-xs font-black uppercase tracking-wider"
          >
            Start an enquiry
          </Link>
        </div>
      </article>
    </>
  );
};
