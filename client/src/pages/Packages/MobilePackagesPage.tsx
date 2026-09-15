import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, Clock, Star, ArrowLeft, Info, Send, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { FALLBACK_PACKAGES } from '../../utils/mobileDataFallback';
import { formatImageUrl } from '../../utils/imageUrl';
import { SkeletonCard } from '../../components/common/Skeleton';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.title || val.state || '';
  return String(val);
};

const safeDuration = (dur: any): string => {
  if (!dur) return '';
  if (typeof dur === 'string') return dur;
  if (typeof dur === 'object') {
    const n = dur.nights ?? '';
    const d = dur.days ?? '';
    return n || d ? `${n}N / ${d}D` : '';
  }
  return String(dur);
};

interface PackageCardProps {
  pkg: any;
  onEnquire?: (pkg: any, initialMode?: 'enquiry' | 'booking') => void;
  onBookNow?: (pkg: any) => void;
}

export const MobilePackageCard: React.FC<PackageCardProps> = ({ pkg, onEnquire, onBookNow }) => {
  const rawImg = pkg.images?.[0] || pkg.imageUrl || pkg.mainImage || pkg.coverImage;
  const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop');
  const price = Number(pkg.price || pkg.startingPrice || pkg.pricePerPerson || 0);
  const originalPrice = pkg.originalPrice ? Number(pkg.originalPrice) : null;
  const rating = pkg.rating ?? 4.5;
  const category = safeStr(pkg.category || pkg.theme) || 'Tour';
  const destName = safeStr(pkg.destination);
  const duration = safeDuration(pkg.duration);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.06)] mb-4 group relative">
      {/* Image + Badges */}
      <div className="relative" style={{ height: 180 }}>
        <Link to={`/package/${pkg.slug}`} className="block w-full h-full">
          <img src={imgUrl} alt={pkg.title} className="w-full h-full object-cover" />
        </Link>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-ocean-600/90 text-white text-xs font-bold pointer-events-none">
          {category}
        </div>
        
        {/* Info Icon Button (Top Right) to Open Details */}
        <Link
          to={`/package/${pkg.slug}`}
          title="View Package Details"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center backdrop-blur-md shadow-md active:scale-95 border border-white/50 z-10"
        >
          <Info className="w-4 h-4 text-ocean-600" />
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-[0.8125rem] text-slate-500 font-medium mb-2">
          {destName && (
            <>
              <MapPin className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
              <span className="flex-1 truncate">{destName}</span>
            </>
          )}
          {duration && (
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-xs">{duration}</span>
            </div>
          )}
        </div>

        <Link to={`/package/${pkg.slug}`}>
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-3 hover:text-ocean-600 transition-colors">
            {pkg.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div>
            <p className="text-[0.6875rem] text-slate-500">Starting from</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-ocean-600">₹{price.toLocaleString()}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-[0.6875rem] text-slate-500 line-through">₹{originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEnquire?.(pkg, 'enquiry')}
              className="px-3 py-1.5 rounded-xl bg-ocean-600 text-white text-xs font-bold active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3 h-3 text-white" />
              <span>Enquire</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onBookNow) onBookNow(pkg);
                else if (onEnquire) onEnquire(pkg, 'booking');
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-700 text-white text-xs font-bold active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-amber-300 fill-current" />
              <span>Book Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CATEGORIES = ['All', 'Honeymoon', 'Family', 'Adventure', 'Wildlife', 'Beach', 'Heritage'];
const PRICE_RANGES = ['All', 'Under ₹20,000', '₹20,000 - ₹50,000', 'Above ₹50,000'];

export const MobilePackagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || searchParams.get('theme') || 'All';

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMode, setEnquiryMode] = useState<'enquiry' | 'booking'>('enquiry');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/packages?limit=100');
        const apiData = res.data.data || [];
        setPackages(apiData);
      } catch (e) {
        console.error(e);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('hc_open_booking_modal') === 'true') {
      localStorage.removeItem('hc_open_booking_modal');
      localStorage.removeItem('hc_booking_mode');
      setEnquiryOpen(true);
    }
  }, []);

  const filtered = packages.filter(pkg => {
    if (!pkg) return false;
    const q = (search || '').trim().toLowerCase();
    
    // Search query matching (title, destination, code)
    let searchMatch = true;
    if (q) {
      const titleStr = safeStr(pkg.title).toLowerCase();
      const codeStr = safeStr(pkg.packageCode).toLowerCase();
      const destStr = typeof pkg.destination === 'object' && pkg.destination !== null ? safeStr(pkg.destination.name) : safeStr(pkg.destination);
      searchMatch = titleStr.includes(q) || codeStr.includes(q) || destStr.toLowerCase().includes(q);
    }

    // Category / Theme match (handles array category, themeName, or string category)
    let catMatch = true;
    if (selectedCategory && selectedCategory !== 'All') {
      const sel = selectedCategory.toLowerCase();
      const themeStr = safeStr(pkg.themeName || pkg.theme).toLowerCase();
      
      let catStr = '';
      if (typeof pkg.category === 'string') catStr = pkg.category.toLowerCase();
      else if (Array.isArray(pkg.category)) {
        catStr = pkg.category.map((c: any) => (typeof c === 'object' ? c.name || c.slug : String(c))).join(' ').toLowerCase();
      }

      const destCatStr = typeof pkg.destination === 'object' && pkg.destination !== null ? safeStr(pkg.destination.category).toLowerCase() : '';

      catMatch = catStr.includes(sel) || sel.includes(catStr) ||
                 themeStr.includes(sel) || sel.includes(themeStr) ||
                 destCatStr.includes(sel) || sel.includes(destCatStr);
    }

    // Price Filter
    const price = Number(pkg.price || pkg.startingPrice || pkg.pricePerPerson || 0);
    let priceMatch = true;
    if (selectedPriceRange === 'Under ₹20,000') priceMatch = price < 20000;
    else if (selectedPriceRange === '₹20,000 - ₹50,000') priceMatch = price >= 20000 && price <= 50000;
    else if (selectedPriceRange === 'Above ₹50,000') priceMatch = price > 50000;

    return searchMatch && catMatch && priceMatch;
  });

  return (
    <>
      {/* Blue Header Container combining AppBar + Search + Filter */}
      <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 pt-3 pb-4 rounded-b-[28px] sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5 mb-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-white active:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-black text-lg text-white">Explore Packages</h1>
        </div>

        {/* Search + Filter Row */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-9 pr-8 py-3 rounded-2xl bg-white dark:bg-white text-slate-900 text-sm outline-none border border-slate-200 shadow-sm placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-white border border-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
          >
            <Filter className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Active Filter Chips */}
        {(selectedCategory !== 'All' || selectedPriceRange !== 'All') && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {selectedCategory !== 'All' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-white text-xs font-bold">{selectedCategory}</span>
                <button onClick={() => setSelectedCategory('All')}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
            {selectedPriceRange !== 'All' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-white text-xs font-bold">{selectedPriceRange}</span>
                <button onClick={() => setSelectedPriceRange('All')}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-48 pt-4 px-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No holiday packages match your filters.</div>
          ) : (
            filtered.map((pkg, i) => (
              <MobilePackageCard
                key={pkg._id || i}
                pkg={pkg}
                onEnquire={(p, mode) => {
                  setSelectedPkg(p);
                  setEnquiryMode(mode || 'enquiry');
                  setEnquiryOpen(true);
                }}
                onBookNow={p => {
                  setSelectedPkg(p);
                  setEnquiryMode('booking');
                  setEnquiryOpen(true);
                }}
              />
            ))
          )}
        <div className="h-28" aria-hidden="true" />
      </div>

      {/* Filter Bottom Sheet Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Filter Packages</h3>
              <button onClick={() => setFilterOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      selectedCategory === cat ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map(pr => (
                  <button
                    key={pr}
                    onClick={() => setSelectedPriceRange(pr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      selectedPriceRange === pr ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setFilterOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-ocean-600 text-white font-bold text-base"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        selectedPackage={selectedPkg}
        initialMode={enquiryMode}
      />
    </>
  );
};
