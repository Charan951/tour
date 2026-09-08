import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, Clock, Star, ArrowLeft } from 'lucide-react';
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
  onBookNow?: (pkg: any) => void;
}

export const MobilePackageCard: React.FC<PackageCardProps> = ({ pkg, onBookNow }) => {
  const rawImg = pkg.images?.[0] || pkg.imageUrl || pkg.mainImage || pkg.coverImage;
  const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop');
  const price = Number(pkg.price || pkg.startingPrice || pkg.pricePerPerson || 0);
  const originalPrice = pkg.originalPrice ? Number(pkg.originalPrice) : null;
  const rating = pkg.rating ?? 4.5;
  const category = safeStr(pkg.category || pkg.theme) || 'Tour';
  const destName = safeStr(pkg.destination);
  const duration = safeDuration(pkg.duration);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.06)] mb-4">
      {/* Image + Badges */}
      <Link to={`/package/${pkg.slug}`} className="block relative" style={{ height: 180 }}>
        <img src={imgUrl} alt={pkg.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-ocean-600/90 text-white text-xs font-bold">
          {category}
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-black/70 text-white text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {rating}
        </div>
      </Link>

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

        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-3">
          {pkg.title}
        </h3>

        <div className="flex items-center justify-between gap-2">
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
            <Link
              to={`/package/${pkg.slug}`}
              className="px-3 py-2 rounded-xl border-2 border-aqua-500 text-aqua-500 text-xs font-bold"
            >
              View Deal
            </Link>
            <button
              onClick={() => onBookNow?.(pkg)}
              className="px-3 py-2 rounded-xl bg-ocean-600 text-white text-xs font-bold active:opacity-80"
            >
              Book Now
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
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/packages?limit=30');
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
    const titleMatch = safeStr(pkg.title).toLowerCase().includes((search || '').toLowerCase());
    const destMatch = safeStr(pkg.destination).toLowerCase().includes((search || '').toLowerCase());
    const pkgCat = safeStr(pkg.category || pkg.theme || pkg.themeName);
    const catMatch = !selectedCategory || selectedCategory === 'All' ||
      pkgCat.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(pkgCat.toLowerCase());

    const price = Number(pkg.price || pkg.startingPrice || pkg.pricePerPerson || 0);
    let priceMatch = true;
    if (selectedPriceRange === 'Under ₹20,000') priceMatch = price < 20000;
    else if (selectedPriceRange === '₹20,000 - ₹50,000') priceMatch = price >= 20000 && price <= 50000;
    else if (selectedPriceRange === 'Above ₹50,000') priceMatch = price > 50000;

    return (titleMatch || destMatch) && catMatch && priceMatch;
  });

  return (
    <>
      {/* AppBar */}
      <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center gap-2.5">
        <Link
          to="/"
          aria-label="Back to home"
          className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-white active:bg-white/15 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-black text-lg text-white">Explore Packages</h1>
      </div>

      <div className="overflow-y-auto pb-48" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="px-4 pt-4 pb-2">
          {/* Search + Filter row */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full pl-9 pr-8 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm outline-none border border-transparent focus:border-ocean-600/30"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="w-12 h-12 rounded-2xl bg-ocean-600/10 flex items-center justify-center shrink-0 active:bg-ocean-600/20 transition-colors"
            >
              <Filter className="w-5 h-5 text-ocean-600" />
            </button>
          </div>

          {/* Active filter chips */}
          {(selectedCategory !== 'All' || selectedPriceRange !== 'All') && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {selectedCategory !== 'All' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ocean-600 rounded-full">
                  <span className="text-white text-xs font-bold">{selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('All')}>
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
              {selectedPriceRange !== 'All' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 rounded-full">
                  <span className="text-white text-xs font-bold">{selectedPriceRange}</span>
                  <button onClick={() => setSelectedPriceRange('All')}>
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4">
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
                onBookNow={p => { setSelectedPkg(p); setEnquiryOpen(true); }}
              />
            ))
          )}
        </div>

        <div className="h-28" aria-hidden="true" />
      </div>

      {/* Filter Bottom Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-3xl w-full px-5 pt-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedPriceRange('All'); setFilterOpen(false); }}
                className="text-ocean-600 font-semibold text-sm"
              >
                Reset All
              </button>
            </div>

            <p className="font-bold text-base text-slate-800 mb-3">Categories</p>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-ocean-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="font-bold text-base text-slate-800 mb-3">Budget Range</p>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {PRICE_RANGES.map(pr => (
                <button
                  key={pr}
                  onClick={() => setSelectedPriceRange(pr)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedPriceRange === pr
                      ? 'bg-cyan-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {pr}
                </button>
              ))}
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
      />
    </>
  );
};
