import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { Star, Clock, MapPin, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, Phone, MessageSquare, Mail, Send, ShieldCheck, Hotel, Utensils, Compass, Camera } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pkg, setPkg] = useState<any>(null);
  const [similarPackages, setSimilarPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [activeInfoTab, setActiveInfoTab] = useState<'inclusions' | 'exclusions'>('inclusions');
  const [selectedPricingCategory, setSelectedPricingCategory] = useState<string>('Deluxe');
  const [travelersCount, setTravelersCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  // Form for sidebar quote
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
      const payload = {
        ...data,
        package: pkg?._id,
        destination: pkg?.destination?._id,
        source: 'PackagePage'
      };

      await apiClient.post('/enquiries', payload);
      toast.success('Enquiry submitted successfully! Our travel expert will contact you within 30 minutes.');
      reset();
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

  // Photo strip images (4 horizontal images across top like Minto Style)
  const photos = [
    pkg.coverImage,
    pkg.gallery?.[0] || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
    pkg.gallery?.[1] || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop',
    pkg.gallery?.[2] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'
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

      <div className="pt-24 pb-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top 4-Photo Strip Gallery (Minto Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-3xl overflow-hidden shadow-xl h-56 sm:h-72 mb-6 bg-slate-900 border border-slate-200">
            {photos.map((imgUrl, i) => (
              <div key={i} className="relative h-full overflow-hidden group">
                <img
                  src={imgUrl}
                  alt={`Gallery photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>

          {/* Header Info Block (Exact Minto Layout) */}
          <div className="mb-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
            
            {/* Title & Package Code */}
            <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-slate-900 leading-tight">
              {pkg.title} <span className="text-slate-500 font-semibold text-2xl sm:text-3xl">({pkg.packageCode})</span>
            </h1>

            {/* Badges & Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-md font-bold">
                {pkg.duration.days < 10 ? `0${pkg.duration.days}` : pkg.duration.days} Day
              </span>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <span className="text-emerald-600 font-bold">{pkg.rating || 4.5} ★ Reviews</span>
                <span className="text-amber-500">★★★★★</span>
                <span className="text-slate-400">(348 reviews)</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{destName}</span>
            </div>

            {/* Feature Badges & Action CTAs Row */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
              
              {/* Feature Icons */}
              <div className="flex items-center gap-4 text-slate-700 text-xs font-semibold">
                <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-200/60">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  <span>Meals</span>
                </div>
                <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-xl border border-sky-200/60">
                  <Camera className="w-4 h-4 text-sky-500" />
                  <span>Sightseeing</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200/60">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Activity</span>
                </div>
                <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-200/60">
                  <Hotel className="w-4 h-4 text-purple-500" />
                  <span>Hotel</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <a
                  href="tel:+919876543210"
                  className="px-4 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Whatsapp
                </a>
                <button
                  onClick={() => setEnquiryModalOpen(true)}
                  className="px-4 py-2 rounded-full border border-rose-500 text-rose-500 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Enquiry
                </button>
              </div>

            </div>

          </div>

          {/* Main 2-Column Grid (Left: 70%, Right: 30%) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN (70%) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* SECTION: OUR TOUR ITINERARY (ACCORDION) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
                  <h2 className="font-poppins font-bold text-2xl text-slate-900">Our Tour Itinerary</h2>
                  <span className="text-xs text-slate-500 font-semibold">{pkg.itinerary?.length || pkg.duration.days} Days Covered</span>
                </div>

                <div className="space-y-3">
                  {(pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [
                    { day: 1, title: `${destName} Water Sports & Activity`, description: `Experience Parasailing, Jet Skiing, Banana Ride, Bumper Ride, and Speedboat rides at Calangute beach with safety gear included.`, time: '07:00 Am to 05:30 pm' }
                  ]).map((dayItem: any) => {
                    const isOpen = expandedDay === dayItem.day;
                    return (
                      <div key={dayItem.day} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <button
                          onClick={() => setExpandedDay(isOpen ? null : dayItem.day)}
                          className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                              Day {dayItem.day}
                            </span>
                            <span>{dayItem.title}</span>
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-2 text-xs text-slate-600 space-y-3 border-t border-slate-100 bg-slate-50/50">
                            {dayItem.time && (
                              <p className="font-bold text-slate-700">Time: {dayItem.time}</p>
                            )}
                            <p className="leading-relaxed text-slate-700">{dayItem.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: OUR TOUR INFORMATION (MINTO STYLED TABS) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <h2 className="font-poppins font-bold text-2xl text-slate-900 mb-6">Our Tour Information</h2>
                
                {/* Tab Switcher Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setActiveInfoTab('inclusions')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all text-center cursor-pointer ${
                      activeInfoTab === 'inclusions'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Inclusion
                  </button>
                  <button
                    onClick={() => setActiveInfoTab('exclusions')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all text-center cursor-pointer ${
                      activeInfoTab === 'exclusions'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Exclusion
                  </button>
                </div>

                {/* Tab Content */}
                {activeInfoTab === 'inclusions' ? (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                      Package Inclusion :
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                      {(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [
                        'Activity Point Calangute Beach',
                        'Parasailing',
                        'Jet ski',
                        'Speed boat Ride',
                        'Banana Ride',
                        'Bumper Ride'
                      ]).map((inc: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="inline-block bg-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                      Package Exclusion :
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                      {(pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : [
                        'Personal Expenses',
                        'Flight / Train Airfare',
                        'Hard & Soft Drinks',
                        'Anything not mentioned in inclusions'
                      ]).map((exc: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
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
                <h2 className="font-poppins font-bold text-2xl text-slate-900">Our Tour Details</h2>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-line font-medium">
                  {pkg.overview || `Thrilling ${pkg.title}! Get ready for an adrenaline-pumping adventure with our holiday package. Perfect for adventure lovers, couples, and family trips!`}
                </div>
              </div>

              {/* SECTION: OUR SIMILAR PACKAGES */}
              {similarPackages.length > 0 && (
                <div className="space-y-6">
                  <h2 className="font-poppins font-bold text-2xl text-slate-900">Our Similar Packages</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {similarPackages.map((simPkg) => (
                      <PackageCard key={simPkg._id || simPkg.slug} pkg={simPkg} onEnquire={() => setEnquiryModalOpen(true)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT STICKY SIDEBAR (30% - MINTO HOLIDAYS EXACT MATCH) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                
                {/* Price Card */}
                <div className="bg-slate-50 rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
                  <span className="text-xs font-semibold text-rose-500 block">Starting from</span>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-poppins font-extrabold text-4xl text-slate-900">
                      ₹{pkg.startingPrice.toLocaleString()}/-
                    </span>
                  </div>

                  {pkg.discountPrice && (
                    <span className="text-sm text-slate-400 line-through block">
                      ₹{pkg.discountPrice.toLocaleString()}/-
                    </span>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <select
                      value={selectedPricingCategory}
                      onChange={(e) => setSelectedPricingCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none"
                    >
                      <option value="Deluxe">Deluxe</option>
                      <option value="Standard">Standard</option>
                      <option value="Luxury">Luxury</option>
                    </select>

                    <select
                      value={travelersCount}
                      onChange={(e) => setTravelersCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setEnquiryModalOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Get More Details
                  </button>
                </div>

                {/* 4 Colored Action Buttons Grid (Exact Minto Match) */}
                <div className="grid grid-cols-2 gap-3 font-bold text-xs">
                  <a
                    href="tel:+919876543210"
                    className="py-3 rounded-xl bg-[#222222] text-white flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" /> Contact us
                  </a>

                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 rounded-xl bg-[#25D366] text-white flex items-center justify-center gap-2 shadow-md hover:bg-emerald-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Whatsapp Us
                  </a>

                  <button
                    onClick={() => setEnquiryModalOpen(true)}
                    className="py-3 rounded-xl bg-[#FFC107] text-slate-900 flex items-center justify-center gap-2 shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4" /> Send Us Mail
                  </button>

                  <button
                    onClick={() => setEnquiryModalOpen(true)}
                    className="py-3 rounded-xl bg-[#FF5722] text-white flex items-center justify-center gap-2 shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Enquiry Now
                  </button>
                </div>

                {/* EMBEDDED DIRECT LEAD ENQUIRY FORM */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <h3 className="font-poppins font-bold text-base text-slate-900">
                      Get a Free Quote Submit Your Details Below
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit(onSidebarEnquirySubmit)} className="space-y-3">
                    <div>
                      <input
                        {...register('fullName')}
                        type="text"
                        placeholder="Enter Full Name *"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/50"
                      />
                      {errors.fullName && <p className="text-rose-500 text-[10px] mt-0.5">{errors.fullName.message as string}</p>}
                    </div>

                    <div>
                      <input
                        {...register('mobile')}
                        type="text"
                        placeholder="Contact Phone No *"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/50"
                      />
                      {errors.mobile && <p className="text-rose-500 text-[10px] mt-0.5">{errors.mobile.message as string}</p>}
                    </div>

                    <div>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="Enter Email Id *"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/50"
                      />
                      {errors.email && <p className="text-rose-500 text-[10px] mt-0.5">{errors.email.message as string}</p>}
                    </div>

                    <div>
                      <textarea
                        {...register('message')}
                        rows={3}
                        placeholder="Leave a comment here"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5] bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
                    >
                      {submitting ? 'Submitting...' : 'Submit Your Enquiry'}
                    </button>
                  </form>
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
