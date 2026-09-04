import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, Mail, ShieldCheck, Hotel, Utensils, Camera, ArrowLeft, UserCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [similarPackages, setSimilarPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [activeInfoTab, setActiveInfoTab] = useState<'inclusions' | 'exclusions'>('inclusions');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryInitialMode, setEnquiryInitialMode] = useState<'enquiry' | 'booking'>('enquiry');

  const openEnquiry = (mode: 'enquiry' | 'booking' = 'enquiry') => {
    setEnquiryInitialMode(mode);
    setEnquiryModalOpen(true);
  };
  const handleOpenEnquiry = () => openEnquiry('enquiry');

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/packages');
    }
  };

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/packages/${slug}`);
        const currentPkg = res.data.data;
        setPkg(currentPkg);

        if (currentPkg?.destination?._id) {
          const simRes = await apiClient.get(`/packages?destination=${currentPkg.destination._id}&limit=3`);
          setSimilarPackages((simRes.data.data || []).filter((p: any) => p._id !== currentPkg._id));
        }
      } catch (err) {
        console.error('Failed to fetch package details', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPackageData();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-12 h-12 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading package details...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto">
        <h2 className="font-poppins font-bold text-2xl text-slate-800">Package Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested tour package itinerary could not be loaded.</p>
        <Link to="/packages" className="mt-4 inline-block px-4 py-2 bg-ocean-600 text-white rounded-xl text-xs font-bold">
          View All Packages
        </Link>
      </div>
    );
  }

  const destName = typeof pkg.destination === 'object' && pkg.destination !== null ? pkg.destination.name : 'Destination';

  // Photo strip images (4 horizontal images matching main package cover image)
  const rawPhotos = Array.isArray(pkg.images) && pkg.images.length > 0
    ? pkg.images
    : (Array.isArray(pkg.gallery) && pkg.gallery.length > 0 ? pkg.gallery : []);

  const mainImg = pkg.coverImage || pkg.bannerImage || rawPhotos[0] || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800&auto=format&fit=crop';

  const photos = [
    mainImg,
    rawPhotos[0] || mainImg,
    rawPhotos[1] || 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=600&auto=format&fit=crop',
    rawPhotos[2] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'
  ];

  // Dynamic TouristTrip Schema matching seo.md Section 4.1
  const touristTripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description: pkg.overview || `Book ${pkg.title} with HolidayCity.`,
    touristType: pkg.themeName || 'Holiday',
    offers: {
      '@type': 'Offer',
      price: String(pkg.startingPrice || '0'),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: '2026-01-01'
    },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: pkg.itinerary?.length || 0,
      itemListElement: (pkg.itinerary || []).map((dayItem: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `Day ${dayItem.day || index + 1}: ${dayItem.title || 'Sightseeing & Transfers'}`
      }))
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'HolidayCity',
      url: 'https://holidaycity.com'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is included in ${pkg.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: pkg.inclusions?.join(', ') || 'Accommodation, breakfasts, sightseeing transfers, and customer assistance.'
        }
      },
      {
        '@type': 'Question',
        name: `How do I book ${pkg.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Fill out the enquiry form or call HolidayCity travel experts to get an instant customized itinerary quote.'
        }
      }
    ]
  };

  return (
    <>
      <SEO
        title={`${pkg.title} (${pkg.packageCode}) | HolidayCity`}
        description={pkg.overview || `Book ${pkg.title} with HolidayCity. Customizable ${pkg.duration || 'multi-day'} itinerary with guaranteed quality stays.`}
        ogImage={pkg.coverImage}
        schemaMarkup={[touristTripSchema, faqSchema]}
      />

      <div className="pt-18 sm:pt-20 pb-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Navigation Button */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-ocean-600" /> Back to Tour Packages
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Home</span> • <span>Packages</span> • <span className="text-ocean-600 font-bold">{pkg.title}</span>
            </div>
          </div>

          {/* Top Single Hero Cover Image Banner */}
          <div className="w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl relative mb-8 border border-slate-200 group bg-slate-900">
            <img
              src={mainImg}
              alt={pkg.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
            
            {/* Top-Left Badge — only when the package is genuinely featured/trending */}
            {(pkg.featured || pkg.trending) && (
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3.5 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider border border-white/20 shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  {pkg.trending ? 'Trending now' : 'Featured'}
                </span>
              </div>
            )}

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
              <div className="animate-fade-up">
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-md border border-amber-300/30">
                  {pkg.packageCode}
                </span>
                <h2 className="font-poppins font-black text-xl sm:text-2xl md:text-3xl text-white mt-1 drop-shadow-md">
                  {pkg.title}
                </h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-aqua-500" />
                  <span>{destName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover-lift-lg">
                  ⏱️ {pkg.duration.days} Days / {pkg.duration.nights || pkg.duration.days - 1} Nights
                </span>
                {typeof pkg.rating === 'number' && pkg.rating > 0 && (
                  <span className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md text-white text-xs font-black border border-white/20 flex items-center gap-1">
                    <span className="text-gold-500">★</span> {pkg.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Info Block */}
          <div className="mb-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6 animate-fade-up">
            
            {/* Title & Price / Action Buttons Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                  {pkg.trending && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-600/10 text-ocean-600 text-[0.6875rem] font-black uppercase tracking-wider border border-ocean-600/20">
                      <Sparkles className="w-3.5 h-3.5" /> Trending now
                    </span>
                  )}
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-2xs">
                    {pkg.duration.days < 10 ? `0${pkg.duration.days}` : pkg.duration.days} Days / {pkg.duration.nights || pkg.duration.days - 1} Nights
                  </span>
                  {typeof pkg.rating === 'number' && pkg.rating > 0 && (
                    <span className="flex items-center gap-1 text-slate-body bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold">
                      <span className="text-gold-600">★</span>
                      <span className="text-ink font-black">{pkg.rating.toFixed(1)}</span>
                      {typeof pkg.reviewCount === 'number' && pkg.reviewCount > 0 && (
                        <span className="text-slate-muted">({pkg.reviewCount.toLocaleString()} reviews)</span>
                      )}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-body bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-ocean-600" />
                    <span>{destName}</span>
                  </span>
                </div>

                <h1 className="font-display font-black text-3xl sm:text-4xl text-ink leading-tight">
                  {pkg.title} <span className="text-slate-muted font-black text-2xl sm:text-3xl">({pkg.packageCode})</span>
                </h1>
              </div>

              {/* Starting price */}
              <div className="bg-ocean-600/10 px-6 py-4 rounded-3xl border border-ocean-600/20 text-center shrink-0">
                <span className="text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600 block">Starting price</span>
                <span className="font-display font-black text-3xl sm:text-4xl text-ocean-600 block mt-0.5">
                  ₹{pkg.startingPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-muted block mt-0.5">per person · taxes included</span>
              </div>

            </div>

            {/* Feature Icons Row */}
            <div className="flex flex-wrap items-center gap-3 text-slate-700 text-xs font-bold">
              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2.5 rounded-2xl border border-orange-200/60 shadow-2xs">
                <Utensils className="w-4 h-4 text-orange-500" />
                <span>Meals Included</span>
              </div>
              <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2.5 rounded-2xl border border-sky-200/60 shadow-2xs">
                <Camera className="w-4 h-4 text-sky-500" />
                <span>Sightseeing</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-2xl border border-amber-200/60 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Activities</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-2xl border border-purple-200/60 shadow-2xs">
                <Hotel className="w-4 h-4 text-purple-500" />
                <span>Luxury Hotel</span>
              </div>
            </div>

          </div>

          {/* Main 2-Column Grid (Left: 70%, Right: 30%) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN (70%) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* SECTION: OUR TOUR ITINERARY */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="font-poppins font-black text-2xl text-slate-900">Our Tour Itinerary</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Day-by-day detailed schedule & activity highlights</p>
                  </div>
                  <span className="text-xs font-extrabold text-ocean-600 bg-ocean-600/10 px-3.5 py-1.5 rounded-xl border border-ocean-600/20">
                    {pkg.itinerary?.length || pkg.duration.days} Days Covered
                  </span>
                </div>

                <div className="space-y-3.5">
                  {(pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [
                    { day: 1, title: `${destName} Water Sports & Activity`, description: `Experience Parasailing, Jet Skiing, Banana Ride, Bumper Ride, and Speedboat rides at Calangute beach with safety gear included.`, time: '07:00 AM to 05:30 PM' }
                  ]).map((dayItem: any) => {
                    const isOpen = expandedDay === dayItem.day;
                    return (
                      <div key={dayItem.day} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
                        <button
                          onClick={() => setExpandedDay(isOpen ? null : dayItem.day)}
                          className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-extrabold text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-3.5">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ocean-600 to-cyan-600 text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">
                              Day {dayItem.day}
                            </span>
                            <span className="text-base text-slate-900">{dayItem.title}</span>
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-ocean-600 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="p-5 pt-2 text-xs text-slate-600 space-y-3 border-t border-slate-100 bg-slate-50/60">
                            {dayItem.time && (
                              <div className="inline-flex items-center gap-1.5 font-extrabold text-ocean-600 bg-ocean-600/10 px-3 py-1 rounded-lg border border-ocean-600/20">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Schedule: {dayItem.time}</span>
                              </div>
                            )}
                            <p className="leading-relaxed text-slate-700 text-sm font-medium">{dayItem.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: OUR TOUR INFORMATION (INCLUSION & EXCLUSION) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="font-poppins font-black text-2xl text-slate-900">Our Tour Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Clear breakdown of what's included and excluded</p>
                </div>
                
                {/* Tab Switcher Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveInfoTab('inclusions')}
                    className={`py-3.5 rounded-2xl font-black text-sm transition-all text-center cursor-pointer ${
                      activeInfoTab === 'inclusions'
                        ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold'
                    }`}
                  >
                    Included In Package
                  </button>
                  <button
                    onClick={() => setActiveInfoTab('exclusions')}
                    className={`py-3.5 rounded-2xl font-black text-sm transition-all text-center cursor-pointer ${
                      activeInfoTab === 'exclusions'
                        ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold'
                    }`}
                  >
                    Not Included (Exclusions)
                  </button>
                </div>

                {/* Tab Content */}
                {activeInfoTab === 'inclusions' ? (
                  <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
                    <div className="inline-block bg-emerald-600 text-white text-xs font-black px-4 py-1.5 rounded-xl shadow-xs">
                      Package Inclusions :
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-800 font-bold">
                      {(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [
                        'Activity Point Calangute Beach',
                        'Parasailing & Safety Gear',
                        'Jet Ski Ride with Instructor',
                        'Speedboat Cruise Ride',
                        'Banana Boat Ride',
                        'Bumper Boat Ride',
                        'Luxury Hotel Accommodation',
                        'Daily Breakfast & Dinner'
                      ]).map((inc: string, i: number) => (
                        <li key={i} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-4">
                    <div className="inline-block bg-rose-600 text-white text-xs font-black px-4 py-1.5 rounded-xl shadow-xs">
                      Package Exclusions :
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-800 font-bold">
                      {(pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : [
                        'Personal Expenses & Laundry',
                        'Flight / Train Airfare',
                        'Hard & Soft Drinks',
                        'Anything not mentioned in inclusions',
                        'Travel & Medical Insurance',
                        'Tips & Gratuities'
                      ]).map((exc: string, i: number) => (
                        <li key={i} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SECTION: OUR TOUR DETAILS (NARRATIVE OVERVIEW) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
                <h2 className="font-poppins font-black text-2xl text-slate-900">Our Tour Details</h2>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {pkg.overview || `Thrilling ${pkg.title}! Get ready for an adrenaline-pumping adventure with our holiday package. Perfect for adventure lovers, couples, and family trips!`}
                </div>
              </div>

              {/* SECTION: OUR SIMILAR PACKAGES */}
              {similarPackages.length > 0 && (
                <div className="space-y-6">
                  <h2 className="font-poppins font-black text-2xl text-slate-900">Our Similar Tour Packages</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {similarPackages.map((simPkg) => (
                      <PackageCard key={simPkg._id || simPkg.slug} pkg={simPkg} onEnquire={handleOpenEnquiry} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR (30%) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">

                {/* Quote / booking card — opens the shared PackageEnquiryModal */}
                <div id="single-sidebar-card" className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 space-y-5">
                  <div>
                    <span className="text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600 block">Starting price</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display font-black text-4xl text-ocean-800 tracking-tight">
                        ₹{pkg.startingPrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-slate-muted">/ person</span>
                    </div>
                    {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
                      <span className="text-xs text-slate-muted line-through font-semibold">
                        ₹{pkg.discountPrice.toLocaleString()}
                      </span>
                    )}
                    <p className="text-xs text-slate-body mt-2 leading-relaxed">
                      Prices are indicative. Share your dates and group size and a HolidayCity
                      consultant sends a firm, customised quote — usually the same day.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => { setEnquiryInitialMode('enquiry'); setEnquiryModalOpen(true); }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-ocean-600 to-ocean-700 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" /> Get a custom quote
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEnquiryInitialMode('booking'); setEnquiryModalOpen(true); }}
                      className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-ink font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-gold-600" /> Start a booking request
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-body">
                    <p className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-ocean-600 shrink-0" /> A named consultant handles your trip end to end</p>
                    <p className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-ocean-600 shrink-0" /> Talk on call, email or WhatsApp — whatever suits you</p>
                    <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-ocean-600 shrink-0" /> No payment until your itinerary is confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        selectedPackage={pkg}
        initialMode={enquiryInitialMode}
      />
    </>
  );
};
