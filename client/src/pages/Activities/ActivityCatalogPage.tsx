import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Search, Clock, MapPin, Tag, Star, ChevronRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { FALLBACK_ACTIVITIES } from '../../utils/mobileDataFallback';
import { ActivityBookingModal } from '../../components/modals/ActivityBookingModal';

const mergeActivitiesWithFallback = (apiActs: any[]) => {
  const map = new Map<string, any>();
  (apiActs || []).forEach((a: any) => map.set(a._id || a.activityCode || a.slug || a.id, a));
  FALLBACK_ACTIVITIES.forEach((a: any) => {
    const idKey = a._id || a.activityCode || a.slug || a.id;
    if (!map.has(idKey)) map.set(idKey, a);
  });
  return Array.from(map.values());
};

const DEFAULT_CATEGORIES = [
  { name: 'All', icon: '⚡' },
  { name: 'Adventure', icon: '🧗' },
  { name: 'Water Sports', icon: '🤿' },
  { name: 'Air Sports', icon: '🪂' },
  { name: 'Safari', icon: '🦁' },
  { name: 'Trekking', icon: '🥾' },
  { name: 'Sightseeing', icon: '📸' },
  { name: 'Theme Park', icon: '🎡' }
];

export const ActivityCatalogPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedActivityMode, setSelectedActivityMode] = useState<'booking' | 'enquiry'>('booking');
  const [selectedActivityForBooking, setSelectedActivityForBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('hc_open_activity_modal') === 'true') {
      localStorage.removeItem('hc_open_activity_modal');
      const savedMode = (localStorage.getItem('hc_activity_mode') as 'booking' | 'enquiry') || 'booking';
      localStorage.removeItem('hc_activity_mode');
      if (activities.length > 0) {
        setSelectedActivityMode(savedMode);
        setSelectedActivityForBooking(activities[0]);
      }
    }
  }, [activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [actRes, catRes] = await Promise.all([
        apiClient.get('/activities?limit=24'),
        apiClient.get('/categories')
      ]);
      setActivities(actRes.data?.data || []);
      if (catRes.data?.data && catRes.data.data.length > 0) {
        const fetched = catRes.data.data.map((c: any) => ({ name: c.name, icon: c.icon || '⚡' }));
        setCategories([{ name: 'All', icon: '⚡' }, ...fetched]);
      }
    } catch (err) {
      console.error('Failed to fetch activities', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    const actCat = (act.category || '').trim().toLowerCase();
    const selCat = (selectedCategory || '').trim().toLowerCase();
    const matchesCat =
      selCat === 'all' ||
      actCat === selCat ||
      actCat.includes(selCat) ||
      selCat.includes(actCat);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (act.title || '').toLowerCase().includes(q) ||
      (act.location || '').toLowerCase().includes(q) ||
      (act.destinationName || '').toLowerCase().includes(q) ||
      (act.overview || '').toLowerCase().includes(q);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-ocean-800 via-ocean-700 to-cyan-700 text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/15">
            <Zap className="w-4 h-4 fill-amber-300" /> Thrill & Adventure Experiences
          </span>
          <h1 className="font-['Outfit'] font-black text-3xl sm:text-5xl tracking-tight">
            Book Exciting Travel Activities
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto font-medium">
            From Bungee Jumping in Rishikesh to Scuba Diving in Goa and Desert Safaris in Dubai — book certified outdoor experiences with safety guaranteed.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities like Bungee Jump, Scuba Diving, Paragliding..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 shadow-xl outline-none font-medium text-sm focus:ring-2 focus:ring-cyan-400 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = cat.name === 'All'
              ? activities.length
              : activities.filter((a) => (a.category || '').toLowerCase() === cat.name.toLowerCase()).length;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ocean-600 text-white shadow-md shadow-ocean-600/20 scale-105'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Activity Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm font-semibold">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 shadow-sm space-y-3">
            <Zap className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No activities found</div>
            <p className="text-xs">Try selecting another category or clear your search keyword.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-4 py-2 bg-ocean-600 text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((act) => {
              const unitPrice = Number(act.startingPrice || act.price || 1500);
              const discount = Number(act.discountPrice || 0);

              return (
                <div
                  key={act._id || act.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Activity Cover Image */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                      <img
                        src={act.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop'}
                        alt={act.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-ocean-700 font-extrabold text-[11px] border border-white/20 shadow-sm flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> {act.category || 'Adventure'}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-300 font-black text-[11px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {act.rating || 4.8}
                        </span>
                      </div>

                      {/* Bottom Location Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{act.location || act.destinationName || 'India'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 group-hover:text-ocean-600 transition-colors line-clamp-2">
                        {act.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                          <span>{act.duration || '2 Hours'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Certified Safety</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {act.overview || 'Thrilling outdoor experience with expert safety instructors and equipment.'}
                      </p>

                      {/* Highlights */}
                      {act.highlights && act.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {act.highlights.slice(0, 2).map((hl: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                              ✓ {hl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Booking Action Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting From</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-['Outfit'] font-black text-xl text-ocean-600">₹{unitPrice.toLocaleString()}</span>
                        {discount > unitPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{discount.toLocaleString()}</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-semibold">/ person</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedActivityMode('enquiry');
                          setSelectedActivityForBooking(act);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all active:scale-95"
                      >
                        Enquire
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActivityMode('booking');
                          setSelectedActivityForBooking(act);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-extrabold text-xs shadow-md shadow-ocean-600/20 cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                      >
                        Book Now <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Booking & Enquiry Modal */}
      {selectedActivityForBooking && (
        <ActivityBookingModal
          activity={selectedActivityForBooking}
          isOpen={!!selectedActivityForBooking}
          initialMode={selectedActivityMode}
          onClose={() => setSelectedActivityForBooking(null)}
        />
      )}
    </div>
  );
};
