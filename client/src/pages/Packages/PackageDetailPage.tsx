import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { Star, Clock, MapPin, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, Phone, MessageSquare, Mail, Send, ShieldCheck, Hotel, Utensils, Compass, Camera, ArrowLeft, UserCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [similarPackages, setSimilarPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [activeInfoTab, setActiveInfoTab] = useState<'inclusions' | 'exclusions'>('inclusions');
  const [sidebarTab, setSidebarTab] = useState<'enquiry' | 'booking'>('enquiry');
  const [selectedPricingCategory, setSelectedPricingCategory] = useState<string>('Deluxe');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [travelDate, setTravelDate] = useState<string>('');
  const [destinationInput, setDestinationInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      travelDate: '',
      adults: 2,
      children: 0,
      travelType: 'Couple',
      message: ''
    }
  });

  // Auto-populate logged-in account details (matching Flutter mobile app behavior)
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('hc_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) {
          setCurrentUser(u);
          const name = u.fullName || u.name || '';
          const email = u.email || localStorage.getItem('hc_user_email') || '';
          const mobile = u.mobile || u.phone || '';

          if (name) setValue('fullName', name);
          if (email) setValue('email', email);
          if (mobile) setValue('mobile', mobile);
        }
      }
    } catch (e) {
      console.error('Failed to parse logged in user for auto-fill', e);
    }
  }, [setValue]);

  const handleOpenEnquiry = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSidebarTab('enquiry');
    const el = document.getElementById('single-sidebar-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleOpenBooking = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSidebarTab('booking');
    const el = document.getElementById('single-sidebar-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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

  const onSidebarEnquirySubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const isBooking = sidebarTab === 'booking';
      const endpoint = isBooking ? '/bookings' : '/enquiries';

      const totalTravelers = adultsCount + childrenCount;

      const payload = {
        ...data,
        fullName: data.fullName,
        customerName: data.fullName,
        mobile: data.mobile,
        email: data.email,
        package: pkg?._id,
        packageCode: pkg?.packageCode,
        destination: pkg?.destination?._id,
        preferredDestination: destinationInput || destName,
        travelDate: travelDate || data.travelDate || undefined,
        pricingCategory: selectedPricingCategory,
        travelersCount: totalTravelers,
        adults: adultsCount,
        children: childrenCount,
        travelers: totalTravelers,
        totalPrice: isBooking ? pkg.startingPrice * totalTravelers : undefined,
        userId: currentUser?._id || currentUser?.id,
        type: isBooking ? 'Booking' : 'Enquiry',
        source: 'PackageDetailPage'
      };

      await apiClient.post(endpoint, payload);
      toast.success(
        isBooking
          ? 'Instant booking request submitted successfully! View your booking under My Dashboard.'
          : 'Enquiry submitted successfully! Our travel expert will contact you within 15 minutes.'
      );
      if (!currentUser) reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-12 h-12 border-4 border-[#0A6FB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading package details...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto">
        <h2 className="font-poppins font-bold text-2xl text-slate-800">Package Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested tour package itinerary could not be loaded.</p>
        <Link to="/packages" className="mt-4 inline-block px-4 py-2 bg-[#0A6FB5] text-white rounded-xl text-xs font-bold">
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
              <ArrowLeft className="w-4 h-4 text-[#0A6FB5]" /> Back to Tour Packages
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Home</span> • <span>Packages</span> • <span className="text-[#0A6FB5] font-bold">{pkg.title}</span>
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
            
            {/* Top-Left Badge */}
            <div className="absolute top-4 left-4 z-10 animate-float-slow">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md text-white text-xs font-extrabold uppercase tracking-wider border border-white/20 shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Featured Package 2026
              </span>
            </div>

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
                  <MapPin className="w-3.5 h-3.5 text-[#57D0C9]" />
                  <span>{destName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover-lift-lg">
                  ⏱️ {pkg.duration.days} Days / {pkg.duration.nights || pkg.duration.days - 1} Nights
                </span>
                <span className="px-3.5 py-1.5 rounded-2xl bg-amber-400 text-slate-950 text-xs font-black shadow-lg hover-lift-lg">
                  ★ {pkg.rating || 4.5}
                </span>
              </div>
            </div>
          </div>

          {/* Header Info Block */}
          <div className="mb-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6 animate-fade-up">
            
            {/* Title & Price / Action Buttons Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] text-[11px] font-extrabold uppercase tracking-wider border border-[#0A6FB5]/20 animate-pulse-glow">
                    <Sparkles className="w-3.5 h-3.5" /> Best Seller 2026
                  </span>
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
                    {pkg.duration.days < 10 ? `0${pkg.duration.days}` : pkg.duration.days} Days / {pkg.duration.nights || pkg.duration.days - 1} Nights
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                    <span className="text-amber-500">★★★★★</span>
                    <span className="text-slate-900 font-black">{pkg.rating || 4.5}</span>
                    <span className="text-slate-500">(526 reviews)</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#0A6FB5]" />
                    <span>{destName}</span>
                  </span>
                </div>

                <h1 className="font-poppins font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
                  {pkg.title} <span className="text-slate-400 font-semibold text-2xl sm:text-3xl">({pkg.packageCode})</span>
                </h1>
              </div>

              {/* Clean Starting Price Badge */}
              <div className="bg-[#0A6FB5]/10 px-6 py-4 rounded-3xl border border-[#0A6FB5]/20 text-center shrink-0 hover-lift-lg animate-glow-vivid">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0A6FB5] block">Starting Price</span>
                <span className="font-poppins font-black text-3xl sm:text-4xl text-[#0A6FB5] block mt-0.5">
                  ₹{pkg.startingPrice.toLocaleString()}/-
                </span>
                <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">Per Person • Inclusive of all taxes</span>
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
                  <span className="text-xs font-extrabold text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-xl border border-[#0A6FB5]/20">
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
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0A6FB5] to-[#57D0C9] text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">
                              Day {dayItem.day}
                            </span>
                            <span className="text-base text-slate-900">{dayItem.title}</span>
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-[#0A6FB5] shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="p-5 pt-2 text-xs text-slate-600 space-y-3 border-t border-slate-100 bg-slate-50/60">
                            {dayItem.time && (
                              <div className="inline-flex items-center gap-1.5 font-extrabold text-[#0A6FB5] bg-[#0A6FB5]/10 px-3 py-1 rounded-lg border border-[#0A6FB5]/20">
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
              <div className="space-y-6">
                
                {/* SINGLE UNIFIED RIGHT SIDEBAR CARD (100% ONE CARD ONLY) */}
                <div id="single-sidebar-card" className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-5">
                  
                  {/* Top Mode Selector Tabs: Enquiry vs Book Package Now */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setSidebarTab('enquiry')}
                      className={`py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        sidebarTab === 'enquiry'
                          ? 'bg-[#0A6FB5] text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-4 h-4" /> Plan Trip (Enquiry)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarTab('booking')}
                      className={`py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        sidebarTab === 'booking'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" /> Book Package Now
                    </button>
                  </div>

                  {/* TAB 1: ENQUIRY MODE */}
                  {sidebarTab === 'enquiry' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3 text-center">
                        <h3 className="font-poppins font-black text-base text-slate-900">
                          Plan Your Custom Trip With Us
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Fill in details below to get instant quote & custom pricing.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit(onSidebarEnquirySubmit)} className="space-y-3">
                        {currentUser && (
                          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-900 shadow-2xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <UserCheck className="w-4 h-4 text-[#0A6FB5] shrink-0" />
                              <span className="truncate">Auto-filled: {currentUser.fullName || currentUser.name || 'Account'}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#0A6FB5] bg-white px-2 py-0.5 rounded-lg border border-sky-200 shrink-0">
                              Logged In
                            </span>
                          </div>
                        )}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                          <input
                            {...register('fullName')}
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold"
                          />
                          {errors.fullName && <p className="text-rose-500 text-[10px] mt-0.5 font-bold">{errors.fullName.message as string}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone No *</label>
                            <input
                              {...register('mobile')}
                              type="text"
                              placeholder="+91 98765 43210"
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold"
                            />
                            {errors.mobile && <p className="text-rose-500 text-[10px] mt-0.5 font-bold">{errors.mobile.message as string}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Id *</label>
                            <input
                              {...register('email')}
                              type="email"
                              placeholder="name@example.com"
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold"
                            />
                            {errors.email && <p className="text-rose-500 text-[10px] mt-0.5 font-bold">{errors.email.message as string}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination</label>
                            <input
                              type="text"
                              value={destinationInput || destName}
                              onChange={(e) => setDestinationInput(e.target.value)}
                              placeholder="e.g. Maldives, Bali"
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Travel Date / Month</label>
                            <input
                              type="text"
                              value={travelDate}
                              onChange={(e) => setTravelDate(e.target.value)}
                              placeholder="e.g. Nov 2026 / Diwali"
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Adults & Kids Steppers */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-extrabold text-slate-800 block">Adults (12+)</span>
                              <span className="text-[9px] text-slate-400 font-semibold">Full Fare</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="font-poppins font-black text-xs text-slate-900 w-3 text-center">
                                {adultsCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAdultsCount(adultsCount + 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pl-2 border-l border-slate-200/80">
                            <div>
                              <span className="text-[11px] font-extrabold text-slate-800 block">Kids (5-11)</span>
                              <span className="text-[9px] text-slate-400 font-semibold">Child Fare</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="font-poppins font-black text-xs text-slate-900 w-3 text-center">
                                {childrenCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => setChildrenCount(childrenCount + 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 shadow-2xs font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferences / Special Notes</label>
                          <textarea
                            {...register('message')}
                            rows={2}
                            placeholder="Leave a comment here..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/60 font-semibold resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white font-black text-xs shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/20 active:scale-95 shimmer-sheen hover-lift-lg"
                        >
                          {submitting ? 'Submitting Request...' : 'Submit Enquiry Request'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 2: BOOK PACKAGE NOW / INSTANT BOOKING MODE */}
                  {sidebarTab === 'booking' && (
                    <form onSubmit={handleSubmit(onSidebarEnquirySubmit)} className="space-y-5 bg-gradient-to-br from-[#063B6D] via-[#0A6FB5] to-[#085a94] p-5.5 rounded-3xl text-white shadow-xl border border-white/20">
                      
                      <div className="border-b border-white/20 pb-2 text-center">
                        <h3 className="font-poppins font-black text-base text-white">
                          Confirm Your Instant Booking
                        </h3>
                        <p className="text-[11px] text-slate-200 mt-0.5">
                          Enter details below to lock your price & book instantly.
                        </p>
                      </div>

                      {/* 1. STARTING: USER DETAILS */}
                      <div className="space-y-3 bg-white/10 p-4 rounded-2xl border border-white/15">
                        <span className="block text-[11px] font-extrabold text-[#57D0C9] uppercase tracking-wider">
                          1. Your Personal & Contact Details:
                        </span>

                        {currentUser && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/15 border border-white/20 text-xs font-bold text-white">
                            <div className="flex items-center gap-1.5 truncate">
                              <UserCheck className="w-4 h-4 text-[#57D0C9] shrink-0" />
                              <span className="truncate">Auto-filled for {currentUser.fullName || currentUser.name || 'User'}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#0A6FB5] bg-white px-2 py-0.5 rounded-lg shrink-0">
                              Logged In
                            </span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-100 mb-1">Full Name *</label>
                          <input
                            {...register('fullName')}
                            type="text"
                            placeholder="Enter Full Name *"
                            className="w-full p-2.5 rounded-xl border border-white/30 text-xs outline-none text-slate-900 bg-white font-semibold"
                          />
                          {errors.fullName && <p className="text-amber-300 text-[10px] mt-0.5 font-bold">{errors.fullName.message as string}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-100 mb-1">Phone No *</label>
                            <input
                              {...register('mobile')}
                              type="text"
                              placeholder="Phone No *"
                              className="w-full p-2.5 rounded-xl border border-white/30 text-xs outline-none text-slate-900 bg-white font-semibold"
                            />
                            {errors.mobile && <p className="text-amber-300 text-[10px] mt-0.5 font-bold">{errors.mobile.message as string}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-100 mb-1">Email Id *</label>
                            <input
                              {...register('email')}
                              type="email"
                              placeholder="Email *"
                              className="w-full p-2.5 rounded-xl border border-white/30 text-xs outline-none text-slate-900 bg-white font-semibold"
                            />
                            {errors.email && <p className="text-amber-300 text-[10px] mt-0.5 font-bold">{errors.email.message as string}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-100 mb-1">Travel Notes / Remarks (Optional)</label>
                          <textarea
                            {...register('message')}
                            rows={2}
                            placeholder="Add special requests for your trip..."
                            className="w-full p-2.5 rounded-xl border border-white/30 text-xs outline-none text-slate-900 bg-white font-semibold resize-none"
                          />
                        </div>
                      </div>

                      {/* 2. AFTER THAT: SELECT PACKAGE CLASS TIER */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
                          2. Select Package Class Tier:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: 'Standard', mult: 1.0 },
                            { name: 'Deluxe', mult: 1.25 },
                            { name: 'Luxury', mult: 1.6 }
                          ].map((t) => {
                            const isSel = selectedPricingCategory === t.name;
                            const price = Math.round(pkg.startingPrice * t.mult);
                            return (
                              <button
                                key={t.name}
                                type="button"
                                onClick={() => setSelectedPricingCategory(t.name)}
                                className={`py-2.5 px-1.5 rounded-2xl border text-center transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-white text-slate-900 border-white shadow-lg font-black scale-105'
                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold'
                                }`}
                              >
                                <span className="block text-xs font-black">{t.name}</span>
                                <span className={`block text-[10px] mt-0.5 font-extrabold ${isSel ? 'text-[#0A6FB5]' : 'text-amber-300'}`}>
                                  ₹{price.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. AFTER THAT: NUMBER OF TRAVELERS / USERS */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
                          3. Number of Travelers (Users):
                        </label>
                        <div className="flex items-center justify-between bg-white/15 p-2 rounded-2xl border border-white/20">
                          <span className="text-xs font-bold text-white pl-2">Total Persons</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={travelersCount}
                              onChange={(e) => setTravelersCount(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-12 h-8 text-center bg-white text-slate-900 font-poppins font-black text-sm rounded-xl outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTravelersCount(travelersCount + 1)}
                              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4. AFTER THAT: TOTAL ESTIMATED PRICE */}
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#57D0C9]">
                            4. Total Estimated Price:
                          </span>
                          <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                            🔥 12% OFF
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-poppins font-black text-3xl text-white">
                            ₹{(pkg.startingPrice * travelersCount).toLocaleString()}/-
                          </span>
                          {pkg.discountPrice && (
                            <span className="text-sm text-slate-300 line-through">
                              ₹{(pkg.discountPrice * travelersCount).toLocaleString()}/-
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-200 mt-0.5 font-medium">Inclusive of all taxes & meals ({travelersCount} Travelers)</p>
                      </div>

                      {/* 5. CONFIRM & BOOK PACKAGE NOW BUTTON */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#57D0C9] to-[#34b0a9] text-slate-950 font-black text-sm shadow-xl transition-all cursor-pointer border border-white/40 mt-2 shimmer-sheen hover-lift-lg"
                      >
                        {submitting ? 'Submitting Booking...' : 'Confirm & Book Package Now'}
                      </button>
                    </form>
                  )}

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
      />
    </>
  );
};
