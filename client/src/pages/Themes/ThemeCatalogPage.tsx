import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Compass, Sparkles, Filter, ArrowRight } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import { isPackageMatchingTheme } from '../../utils/themeMatcher';

const ALL_THEMES = [
  { name: 'Honeymoon Tour', icon: '💖', defaultBanner: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop', desc: 'Romantic candlelight dinners, private beach resorts, and flower bed decor.' },
  { name: 'Leisure', icon: '🌴', defaultBanner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop', desc: 'Relaxing beach breaks, luxury spas, and slow-paced vacation escapes.' },
  { name: 'Hill Station', icon: '🏔️', defaultBanner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop', desc: 'Mist-covered mountains, tea plantations, and cool mountain breezes.' },
  { name: 'Trekking', icon: '🧗', defaultBanner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop', desc: 'Thrilling mountain trails, camping under stars, and summit views.' },
  { name: 'Adventure', icon: '🏄', defaultBanner: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1000&auto=format&fit=crop', desc: 'White-water rafting, scuba diving, zip-lining, and desert safaris.' },
  { name: 'Religious', icon: '🛕', defaultBanner: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000&auto=format&fit=crop', desc: 'Sacred pilgrimage tours, temple darshans, and spiritual retreats.' },
  { name: 'Family Tour', icon: '👨‍👩‍👧‍👦', defaultBanner: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop', desc: 'Fun-filled family vacations with theme parks, resorts, and guided tours.' },
  { name: 'Wildlife Safari', icon: '🦁', defaultBanner: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?q=80&w=1000&auto=format&fit=crop', desc: 'National park jeep safaris, tiger reserves, and jungle lodges.' }
];

export const ThemeCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTheme = searchParams.get('theme') || 'All';
  const [themeBanners, setThemeBanners] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    fetchThemeBanners();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [selectedTheme]);

  const fetchThemeBanners = async () => {
    try {
      const res = await apiClient.get('/themes');
      setThemeBanners(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch theme banners', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/packages?limit=100');
      let fetched = res.data.data || [];
      if (selectedTheme !== 'All') {
        fetched = fetched.filter((p: any) => isPackageMatchingTheme(p, selectedTheme));
      }
      setPackages(fetched);
    } catch (err) {
      console.error('Failed to fetch theme packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = (themeName: string) => {
    setSearchParams(themeName === 'All' ? {} : { theme: themeName });
    setTimeout(() => {
      document.getElementById('theme-packages-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenEnquire = (pkg: any) => {
    setSelectedPackage(pkg);
    setEnquiryModalOpen(true);
  };

  return (
    <>
      <SEO
        title={selectedTheme === 'All' ? 'Theme-Based Holiday Collections | HolidayCity' : `${selectedTheme} Tour Packages | HolidayCity`}
        description={`Browse hand-crafted ${selectedTheme === 'All' ? 'Honeymoon, Leisure, Hill Station, Trekking, Adventure, Religious, Family, and Wildlife Safari' : selectedTheme} holiday tour packages.`}
      />

      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-block">
            Specialized Vacation Styles
          </span>
          <h1 className="font-['Outfit'] font-bold text-4xl text-slate-900">
            🎨 Theme-Based Holiday Collections
          </h1>
          <p className="text-slate-600 text-sm">
            Select your preferred travel style to discover handpicked holiday packages crafted exclusively for your vacation vibe.
          </p>
        </div>

        {/* 8 Theme Banner Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_THEMES.map((theme) => {
            const uploadedBanner = themeBanners.find((tb) => tb.themeName === theme.name);
            const bannerImg = uploadedBanner?.imageUrl || theme.defaultBanner;
            const isSelected = selectedTheme === theme.name;

            return (
              <div
                key={theme.name}
                onClick={() => handleSelectTheme(theme.name)}
                className={`text-left group relative h-64 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 cursor-pointer ${
                  isSelected ? 'border-[#0A6FB5] ring-4 ring-[#0A6FB5]/20 scale-105' : 'border-white/50'
                }`}
              >
                <img src={bannerImg} alt={theme.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                
                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl p-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                      {theme.icon}
                    </span>
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#0A6FB5] text-white shadow-md">
                        Selected Theme
                      </span>
                    ) : (
                      <Link
                        to={`/packages?theme=${encodeURIComponent(theme.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors flex items-center gap-1"
                      >
                        View All <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div>
                    <h3 className="font-['Outfit'] font-extrabold text-xl group-hover:text-[#57D0C9] transition-colors">{theme.name}</h3>
                    <p className="text-[11px] text-slate-200 line-clamp-2 mt-1 font-medium">{uploadedBanner?.description || theme.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Theme Packages Catalog */}
        <div id="theme-packages-section" className="pt-8 border-t border-slate-200 space-y-6 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-[#0A6FB5] uppercase bg-[#0A6FB5]/10 px-3 py-1 rounded-full">
                {selectedTheme === 'All' ? 'ALL THEMES' : selectedTheme.toUpperCase()}
              </span>
              <h2 className="font-['Outfit'] font-bold text-2xl text-slate-900 mt-1">
                {selectedTheme === 'All' ? 'All Theme Tour Packages' : `${selectedTheme} Packages`} ({packages.length})
              </h2>
            </div>
            {selectedTheme !== 'All' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchParams({})}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Clear Filter
                </button>
                <Link
                  to={`/packages?theme=${encodeURIComponent(selectedTheme)}`}
                  className="px-4 py-2 bg-[#0A6FB5] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#085a96] transition-all flex items-center gap-1.5"
                >
                  Open in Packages Page <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto space-y-3">
              <Compass className="w-12 h-12 mx-auto text-slate-300 animate-spin-slow" />
              <p className="text-sm font-semibold text-slate-700">No tour packages listed under {selectedTheme} yet.</p>
              <p className="text-xs text-slate-400">Try exploring our other themes or contact our team for custom itinerary planning.</p>
              <button
                onClick={() => setSearchParams({})}
                className="mt-2 px-4 py-2 bg-[#0A6FB5] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#085a96]"
              >
                View All Packages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id || pkg.slug}
                  pkg={pkg}
                  onEnquire={handleOpenEnquire}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        selectedPackage={selectedPackage}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
};
