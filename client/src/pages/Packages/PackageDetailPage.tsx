import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, Mail, ShieldCheck, Hotel, Utensils, Camera, ArrowLeft, UserCheck, Car, Send, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openEnquiry = (mode: 'enquiry' | 'booking' = 'enquiry') => {
    setEnquiryInitialMode(mode);
    setEnquiryModalOpen(true);
  };
  const handleOpenEnquiry = (p?: any, mode: 'enquiry' | 'booking' = 'enquiry') => openEnquiry(mode);

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
    if (localStorage.getItem('hc_open_booking_modal') === 'true') {
      localStorage.removeItem('hc_open_booking_modal');
      const mode = (localStorage.getItem('hc_booking_mode') as 'enquiry' | 'booking') || 'booking';
      localStorage.removeItem('hc_booking_mode');
      setEnquiryInitialMode(mode);
      setEnquiryModalOpen(true);
    }
  }, []);

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

  // Main Cover Image (Fixed on hero banner)
  const mainImg = pkg.coverImage || pkg.bannerImage || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800&auto=format&fit=crop';

  // Gallery list for carousel & full-screen lightbox
  const galleryList = [
    ...(Array.isArray(pkg.gallery) ? pkg.gallery : []),
    ...(Array.isArray(pkg.images) ? pkg.images : [])
  ].filter((u: any) => typeof u === 'string' && u.trim());

  const allPhotos = Array.from(new Set([
    mainImg,
    ...galleryList
  ].filter((u: any) => typeof u === 'string' && u.trim())));

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

      <div className="pt-14 sm:pt-[60px] pb-12 bg-slate-50 min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
          
          {/* Top Bar: Back Button & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-ocean-600" />
              <span>Back to Packages</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 truncate">
              <Link to="/" className="hover:text-ocean-600">Home</Link>
              <span>/</span>
              <Link to="/packages" className="hover:text-ocean-600">Packages</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold truncate max-w-[220px] sm:max-w-[320px]">{pkg.title}</span>
            </div>
          </div>

          {/* Hero Gallery Section with Fixed Cover Banner & Carousel Below */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            
            {/* 1. Main Hero Cover Banner Image (Clean Cover Photo with zero overlay clutter) */}
            <div className="w-full h-48 sm:h-60 md:h-[280px] lg:h-[310px] relative overflow-hidden group bg-slate-900 rounded-2xl border border-slate-200/80 shadow-inner">
              <img
                src={mainImg}
                alt={pkg.title}
                className="w-full h-full object-cover transition-all duration-500 ease-out cursor-pointer group-hover:scale-105"
                onClick={() => setActiveLightboxImg(mainImg)}
              />
            </div>

            {/* 2. Gallery Carousel Strip (Below Banner - Click opens photo full page) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-ocean-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tour Gallery ({allPhotos.length} {allPhotos.length === 1 ? 'Photo' : 'Photos'} — Click to view full page)
                  </span>
                </div>
                
                {allPhotos.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable Carousel Track */}
              <div
                ref={carouselRef}
                className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth"
              >
                {allPhotos.map((photoUrl, idx) => (
                  <button
                    key={`${photoUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveLightboxImg(photoUrl)}
                    className="relative shrink-0 w-32 sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden border-2 border-slate-200/90 hover:border-ocean-500 shadow-2xs transition-all cursor-pointer group hover:scale-[1.03]"
                  >
                    <img
                      src={photoUrl}
                      alt={`Gallery Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-all flex items-end justify-between p-2">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-extrabold text-white flex items-center gap-1">
                        <Maximize2 className="w-2.5 h-2.5 text-sky-400" /> Full Page
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Quick Features Header */}
            <div className="px-1 pt-2 pb-1 space-y-3 border-t border-slate-100">
              <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 leading-snug">
                {pkg.title}
              </h1>

              {/* Key Features Quick Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Confirmation</span>
                </span>
                <span className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-xl border border-sky-200/80">
                  <Hotel className="w-3.5 h-3.5 text-sky-600" />
                  <span>4-Star Resort Stays</span>
                </span>
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200/80">
                  <Car className="w-3.5 h-3.5 text-amber-600" />
                  <span>Private AC Vehicle</span>
                </span>
                <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-200/80">
                  <Utensils className="w-3.5 h-3.5 text-purple-600" />
                  <span>Daily Meals Included</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (8 cols - 66%) */}
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Overview Section */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
                <h2 className="font-poppins font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>Package Overview</span>
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-line">
                  {pkg.overview || `Experience the ultimate getaway with ${pkg.title}. Designed with handpicked luxury stays, guided sightseeing, and seamless transfers.`}
                </p>

                {/* Highlights List */}
                {pkg.highlights && pkg.highlights.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">Key Highlights</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-800">
                      {pkg.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Detailed Itinerary Accordion */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-poppins font-bold text-lg text-slate-900">Day-by-Day Itinerary</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Detailed daily schedule and planned activities</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedDay(expandedDay === null ? 1 : null)}
                    className="text-xs font-bold text-ocean-600 hover:text-ocean-700 bg-ocean-50 hover:bg-ocean-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    {expandedDay === null ? 'Expand All Days' : 'Collapse All'}
                  </button>
                </div>

                <div className="space-y-3">
                  {(pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [
                    { day: 1, title: `${destName} Arrival & City Exploration`, description: `Upon arrival, meet our representative for private transfer to your resort. Check-in, refresh, and enjoy an evening walking tour of local markets.`, time: '09:00 AM onwards' },
                    { day: 2, title: `Full Day Sightseeing & Key Attractions`, description: `Enjoy a delicious breakfast followed by a full-day guided excursion covering historical landmarks, natural view points, and sunset spots.`, time: '08:30 AM to 06:00 PM' }
                  ]).map((dayItem: any) => {
                    const isOpen = expandedDay === dayItem.day || expandedDay === null;
                    return (
                      <div key={dayItem.day} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all">
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isOpen && expandedDay !== null ? -1 : dayItem.day)}
                          className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-xl bg-ocean-600 text-white text-xs font-extrabold shrink-0 shadow-2xs">
                              Day {dayItem.day}
                            </span>
                            <span className="font-bold text-slate-900 text-sm sm:text-base">{dayItem.title}</span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-ocean-600 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-2 text-xs text-slate-600 space-y-2 border-t border-slate-100 bg-slate-50/50">
                            {dayItem.time && (
                              <div className="inline-flex items-center gap-1.5 font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md text-[0.7rem] border border-ocean-200/60">
                                <Clock className="w-3 h-3 text-ocean-600" />
                                <span>Schedule: {dayItem.time}</span>
                              </div>
                            )}
                            <p className="leading-relaxed text-slate-700 text-xs sm:text-sm font-medium">{dayItem.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Inclusions & Exclusions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="font-poppins font-bold text-lg text-slate-900">What's Included & Excluded</h2>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('inclusions')}
                      className={`px-3 py-1 rounded-lg transition-all ${activeInfoTab === 'inclusions' ? 'bg-white text-emerald-700 shadow-2xs font-extrabold' : 'text-slate-600'}`}
                    >
                      Inclusions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('exclusions')}
                      className={`px-3 py-1 rounded-lg transition-all ${activeInfoTab === 'exclusions' ? 'bg-white text-rose-700 shadow-2xs font-extrabold' : 'text-slate-600'}`}
                    >
                      Exclusions
                    </button>
                  </div>
                </div>

                {activeInfoTab === 'inclusions' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [
                      '4-Star Deluxe Resort Stay',
                      'Daily Breakfast & Dinner',
                      'Private AC Vehicle for Sightseeing',
                      'Airport / Railway Station Transfers',
                      'All Taxes & Driver Toll Allowances'
                    ]).map((inc: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 text-xs font-bold text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : [
                      'Airfare / Train Tickets',
                      'Personal Expenses (Laundry, Drinks, Phone calls)',
                      'Monument Entry Tickets & Camera Fees',
                      'Anything not specified in inclusions',
                      'Travel & Medical Insurance'
                    ]).map((exc: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 bg-rose-50/60 p-3 rounded-xl border border-rose-200/60 text-xs font-bold text-slate-800">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{exc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Similar Packages Recommendations */}
              {similarPackages.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h2 className="font-poppins font-bold text-xl text-slate-900">Similar Tour Packages</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {similarPackages.map((simPkg) => (
                      <PackageCard key={simPkg._id || simPkg.slug} pkg={simPkg} onEnquire={handleOpenEnquiry} />
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR (4 cols - 34%) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              
              {/* Sticky Price & Action Booking Box */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5 text-left">
                
                {/* Price Display */}
                <div>
                  <span className="text-[0.65rem] font-black uppercase tracking-widest text-ocean-600 block">Starting Price</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-poppins font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                      ₹{pkg.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ person</span>
                  </div>
                  {pkg.discountPrice && pkg.discountPrice > pkg.startingPrice && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        ₹{pkg.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-[0.65rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Save ₹{(pkg.discountPrice - pkg.startingPrice).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Transparent price including stays, private cab transfers & daily breakfasts.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setEnquiryInitialMode('booking'); setEnquiryModalOpen(true); }}
                    className="w-full py-3.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                    <span>Book Package Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setEnquiryInitialMode('enquiry'); setEnquiryModalOpen(true); }}
                    className="w-full py-3.5 rounded-xl bg-ocean-50 hover:bg-ocean-100 border border-ocean-200/80 text-ocean-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-ocean-600" />
                    <span>Send Quick Enquiry</span>
                  </button>
                </div>

                {/* Trust Highlights */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verified 4-Star Accommodations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-ocean-600 shrink-0" />
                    <span>Dedicated Tour Manager Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>No hidden payment charges</span>
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

      {/* Lightbox Full-screen Photo Viewer */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in cursor-pointer"
          onClick={() => setActiveLightboxImg(null)}
        >
          {/* Top Bar: Counter + Close Button */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white pointer-events-none">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold pointer-events-auto">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>
                Photo {allPhotos.indexOf(activeLightboxImg) >= 0 ? allPhotos.indexOf(activeLightboxImg) + 1 : 1} of {allPhotos.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-lg flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/30 active:scale-95 pointer-events-auto"
              aria-label="Close full screen view"
            >
              ✕
            </button>
          </div>

          {/* Full Screen Image Container */}
          <div
            className="relative max-w-6xl max-h-[85vh] w-full flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightboxImg}
              alt="Full Page Tour View"
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            
            {/* Previous & Next Controls in Full Screen Modal */}
            {allPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = allPhotos.indexOf(activeLightboxImg);
                    const prevIdx = (currentIdx - 1 + allPhotos.length) % allPhotos.length;
                    setActiveLightboxImg(allPhotos[prevIdx]);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = allPhotos.indexOf(activeLightboxImg);
                    const nextIdx = (currentIdx + 1) % allPhotos.length;
                    setActiveLightboxImg(allPhotos[nextIdx]);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
