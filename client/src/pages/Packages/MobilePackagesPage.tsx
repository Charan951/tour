import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, Clock, Star } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { FALLBACK_PACKAGES } from '../../utils/mobileDataFallback';
import { formatImageUrl } from '../../utils/imageUrl';

/* ─────────────────────────────────────────
   Helper: safely convert any field to string
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   Package Card — matches Flutter package_card.dart exactly
   - 180px image with category badge + rating badge
   - Location + duration row
   - Title
   - Price + "View Deal" outlined + "Book Now" filled buttons
───────────────────────────────────────── */
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
        {/* Category badge — top left */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A6FB5]/90 text-white text-xs font-bold">
          {category}
        </div>
        {/* Rating badge — top right */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-black/70 text-white text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {rating}
        </div>
      </Link>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Location + Duration row */}
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium mb-2">
          {destName && (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#0A6FB5] shrink-0" />
              <span className="flex-1 truncate">{destName}</span>
            </>
          )}
          {duration && (
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs">{duration}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {pkg.title}
        </h3>

        {/* Price + Buttons row */}
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <p className="text-[11px] text-slate-400">Starting from</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#0A6FB5]">₹{price.toLocaleString()}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-[11px] text-slate-400 line-through">₹{originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to={`/package/${pkg.slug}`}
              className="px-3 py-2 rounded-xl border-2 border-[#57D0C9] text-[#57D0C9] text-xs font-bold"
            >
              View Deal
            </Link>
            <button
              onClick={() => onBookNow?.(pkg)}
              className="px-3 py-2 rounded-xl bg-[#0A6FB5] text-white text-xs font-bold active:opacity-80"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Mobile Packages Page — matches Flutter PackageListScreen
   - AppBar: "Explore Packages"
   - Search bar + Filter icon button
   - Filter bottom sheet with category chips
   - Package cards list
───────────────────────────────────────── */
const CATEGORIES = ['All', 'Honeymoon', 'Family', 'Adventure', 'Wildlife', 'Beach', 'Heritage'];

export const MobilePackagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || searchParams.get('theme') || 'All';

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [filterOpen, setFilterOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/packages?limit=1000');
        const apiData = res.data.data || [];
        
        // Merge API packages with FALLBACK_PACKAGES avoiding duplicates (matching Flutter PackageService)
        const map = new Map<string, any>();
        apiData.forEach((p: any) => map.set(p.slug || p._id || p.id, p));
        FALLBACK_PACKAGES.forEach(p => {
          if (!map.has(p.slug)) map.set(p.slug, p);
        });

        setPackages(Array.from(map.values()));
      } catch (e) {
        console.error(e);
        setPackages(FALLBACK_PACKAGES);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const filtered = packages.filter(pkg => {
    if (!pkg) return false;
    const titleMatch = safeStr(pkg.title).toLowerCase().includes((search || '').toLowerCase());
    const destMatch = safeStr(pkg.destination).toLowerCase().includes((search || '').toLowerCase());
    const pkgCat = safeStr(pkg.category || pkg.theme || pkg.themeName);
    const catMatch = !selectedCategory || selectedCategory === 'All' ||
      pkgCat.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(pkgCat.toLowerCase());
    return (titleMatch || destMatch) && catMatch;
  });

  return (
    <>
      {/* AppBar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <h1 className="font-bold text-lg text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Explore Packages</h1>
      </div>

      <div className="overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="px-4 pt-4 pb-2">
          {/* Search + Filter row */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full pl-9 pr-8 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm outline-none border border-transparent focus:border-[#0A6FB5]/30"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="w-12 h-12 rounded-2xl bg-[#0A6FB5]/10 flex items-center justify-center shrink-0 active:bg-[#0A6FB5]/20 transition-colors"
            >
              <Filter className="w-5 h-5 text-[#0A6FB5]" />
            </button>
          </div>

          {/* Active filter chip */}
          {selectedCategory !== 'All' && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6FB5] rounded-full">
                <span className="text-white text-xs font-bold">{selectedCategory}</span>
                <button onClick={() => setSelectedCategory('All')}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4">
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading packages...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No holiday packages available.</div>
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
      </div>

      {/* Filter Bottom Sheet — matches Flutter _showFilterSheet() */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-3xl w-full px-5 pt-5 pb-8 shadow-2xl">
            {/* Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => { setSelectedCategory('All'); setFilterOpen(false); }}
                className="text-[#0A6FB5] font-semibold text-sm"
              >
                Reset
              </button>
            </div>
            <p className="font-bold text-base text-slate-800 mb-3">Categories</p>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setFilterOpen(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#0A6FB5] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#0A6FB5] text-white font-bold text-base"
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
