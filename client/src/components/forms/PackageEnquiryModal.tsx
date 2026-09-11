import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Phone, Mail, UserCheck, 
  MapPin, User, Calendar, 
  Minus, Plus, Info, Sparkles, Send, MessageSquare, ShieldCheck, Clock, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAuthModal } from '../auth/UserAuthModal';

interface PackageEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: any;
  selectedDestination?: any;
  initialMode?: 'enquiry' | 'booking';
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.887-9.885 9.887m0-18.177C5.787 3.608.288 9.106.286 15.908c-.001 2.174.566 4.298 1.642 6.162L0 28l6.113-1.603a12.27 12.27 0 005.932 1.523h.005c6.801 0 12.301-5.5 12.303-12.302 0-3.287-1.28-6.377-3.605-8.703A12.23 12.23 0 0012.051 3.608z"/>
  </svg>
);

export const PackageEnquiryModal: React.FC<PackageEnquiryModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  selectedDestination,
  initialMode = 'enquiry'
}) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mode, setMode] = useState<'enquiry' | 'booking'>(initialMode);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Booking & Enquiry form state
  const [travelersCount, setTravelersCount] = useState(2);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Deluxe' | 'Luxury'>('Standard');
  const [travelDate, setTravelDate] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  // Location Activities Add-Ons state
  const [locationActivities, setLocationActivities] = useState<any[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, isOpen]);

  const loadUser = () => {
    try {
      const u = localStorage.getItem('hc_user');
      const token = localStorage.getItem('hc_token');
      if (u && token) {
        setCurrentUser(JSON.parse(u));
      } else {
        setCurrentUser(null);
      }
    } catch (_) {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const u = localStorage.getItem('hc_user');
      const token = localStorage.getItem('hc_token');
      if (!u || !token) {
        toast.error('Please log in to submit a booking or enquiry');
        localStorage.setItem('hc_redirect_after_login', window.location.pathname + window.location.search);
        localStorage.setItem('hc_open_booking_modal', 'true');
        localStorage.setItem('hc_booking_mode', initialMode || 'booking');
        onClose();
        navigate('/profile');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    fetchSettings();
    loadUser();
    window.addEventListener('hc_user_updated', loadUser);
    return () => window.removeEventListener('hc_user_updated', loadUser);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch modal settings', err);
    }
  };

  const whatsappNumber = settings?.phones?.whatsapp
    ? settings.phones.whatsapp.replace(/\D/g, '')
    : (settings?.phones?.primary ? settings.phones.primary.replace(/\D/g, '') : '918800542270');

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
      message: ''
    }
  });

  const destText = typeof selectedPackage?.destination === 'object'
    ? selectedPackage.destination?.name
    : (selectedPackage?.destination || selectedDestination?.name || destinationInput);

  useEffect(() => {
    if (isOpen && currentUser) {
      const name = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.name || currentUser.fullName || '';
      const userEmail = currentUser.email || '';
      const userMobile = currentUser.mobile || currentUser.phone || '';
      if (name) setValue('fullName', name);
      if (userEmail) setValue('email', userEmail);
      if (userMobile) setValue('mobile', userMobile);
    }
    if (isOpen) {
      const defaultDest = selectedPackage?.destination?.name || selectedPackage?.destination || selectedDestination?.name || '';
      setDestinationInput(typeof defaultDest === 'string' ? defaultDest : '');
    }
  }, [isOpen, currentUser, selectedPackage, selectedDestination, setValue]);

  // Fetch activities matching destination
  useEffect(() => {
    if (!isOpen) {
      setSelectedAddOns([]);
      return;
    }
    const queryDest = destText || destinationInput;
    if (!queryDest) {
      setLocationActivities([]);
      return;
    }

    let isMounted = true;
    setLoadingActivities(true);

    apiClient.get('/activities', { params: { destination: queryDest, limit: 20 } })
      .then((res) => {
        if (isMounted) {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setLocationActivities(res.data.data);
          } else {
            setLocationActivities([]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to fetch destination activities', err);
          setLocationActivities([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingActivities(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, destText, destinationInput]);

  const toggleAddOn = (actId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  };

  const selectedAddOnObjects = locationActivities.filter((act) =>
    selectedAddOns.includes(act._id || act.id)
  );

  const addOnsTotal = selectedAddOnObjects.reduce((acc, act) => {
    const price = Number(act.startingPrice || act.price || 0);
    return acc + (price * adultsCount);
  }, 0);

  // Pricing calculation
  const startingPrice = Number(selectedPackage?.startingPrice || selectedPackage?.price || 25000);
  const tierMultiplier = selectedTier === 'Luxury' ? 1.6 : selectedTier === 'Deluxe' ? 1.25 : 1.0;
  const activeTierPrice = Math.round(startingPrice * tierMultiplier);
  const estimatedTotal = (activeTierPrice * adultsCount) + Math.round(activeTierPrice * 0.5 * childrenCount) + addOnsTotal;

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const addOnNotes = selectedAddOnObjects.length > 0
        ? `\nAdd-ons Selected (${selectedAddOnObjects.length}): ${selectedAddOnObjects.map((a) => `${a.title} (+₹${(a.startingPrice || 0).toLocaleString()}/person)`).join(', ')}`
        : '';
      const combinedNotes = `${data.message || ''}${addOnNotes}`.trim();

      if (mode === 'booking') {
        const bookingPayload = {
          package: selectedPackage?._id || selectedPackage?.id,
          packageId: selectedPackage?._id || selectedPackage?.id,
          packageName: selectedPackage?.title || 'Tour Booking',
          customerName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          adults: adultsCount,
          children: childrenCount,
          travelers: { adults: adultsCount, children: childrenCount },
          travelDate: travelDate || 'Flexible',
          pricingTier: selectedTier,
          selectedAddOns: selectedAddOnObjects.map((a) => ({
            id: a._id || a.id,
            title: a.title,
            price: a.startingPrice || a.price
          })),
          totalPrice: estimatedTotal,
          specialRequests: combinedNotes
        };
        try {
          await apiClient.post('/bookings', bookingPayload);
        } catch (_) {
          await apiClient.post('/enquiries', {
            ...data,
            package: selectedPackage?._id,
            destination: selectedDestination?._id || selectedPackage?.destination?._id,
            source: 'PackageBooking',
            message: `[BOOKING REQUEST] Tier: ${selectedTier}, Adults: ${adultsCount}, Children: ${childrenCount}, Date: ${travelDate || 'Flexible'}, Est: ₹${estimatedTotal}. Notes: ${combinedNotes}`
          });
        }
        toast.success('Tour booking request submitted! Our team will contact you shortly.');
      } else {
        const payload = {
          ...data,
          message: combinedNotes,
          package: selectedPackage?._id,
          destination: selectedDestination?._id || selectedPackage?.destination?._id,
          source: selectedPackage ? 'PackagePage' : 'HomePageEnquiry',
          adults: adultsCount,
          children: childrenCount,
          travelers: adultsCount + childrenCount,
          preferredDestination: destinationInput || undefined,
          travelDate: travelDate || undefined,
          selectedAddOns: selectedAddOnObjects.map((a) => ({
            id: a._id || a.id,
            title: a.title,
            price: a.startingPrice || a.price
          }))
        };
        const res = await apiClient.post('/enquiries', payload);
        toast.success(res.data.message || 'Enquiry submitted successfully! We will contact you soon.');
      }
      reset();
      setSelectedAddOns([]);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMsg = encodeURIComponent(
    `Hi HolidayCity Team, I would like to inquire about tour packages${
      selectedPackage ? ` for ${selectedPackage.title}` : destinationInput ? ` for ${destinationInput}` : ''
    }.`
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-y-auto min-h-screen w-full text-slate-800 animate-fadeIn">

      {/* Top Navigation Bar - Sleek Modern Light Theme with Top Left Back Button */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        
        {/* Left Side: Back Button + Clean Title & Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200/80 shrink-0 active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-ocean-600" />
            <span>Back</span>
          </button>

          <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h2 className="font-poppins font-bold text-base sm:text-lg text-slate-900 leading-tight">
              {mode === 'booking' ? 'Tour Package Reservation' : 'Plan Your Trip - Package Enquiry'}
            </h2>
            <span className="text-[0.625rem] font-extrabold uppercase tracking-wider text-ocean-700 bg-ocean-50 px-2.5 py-0.5 rounded-full border border-ocean-200/80 inline-block self-start sm:self-auto">
              {mode === 'booking' ? 'Official Reservation' : 'Consultant Quote'}
            </span>
          </div>
        </div>

        {/* Right side: Clean Security Info Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure & Confidential</span>
        </div>

      </div>

      {/* Selected Package Banner Context */}
      {selectedPackage && (
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {selectedPackage.coverImage && (
                <img
                  src={selectedPackage.coverImage}
                  alt={selectedPackage.title}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="overflow-hidden">
                <span className="text-[0.65rem] font-bold uppercase text-ocean-600 tracking-wider block">Selected Tour Package</span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{selectedPackage.title}</h4>
              </div>
            </div>
            {selectedPackage.startingPrice && (
              <div className="text-right shrink-0">
                <span className="text-[0.6875rem] text-slate-500 font-medium block">Starting From</span>
                <span className="text-xs sm:text-sm font-extrabold text-ocean-700">₹{selectedPackage.startingPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Page Responsive Form Container */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex-1">

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Contact Information & Travel Details (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ocean-600 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Traveler Details & Dates
            </h3>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Full Name *</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all"
                />
              </div>
              {errors.fullName && <p className="text-rose-600 text-[0.6875rem] mt-1 font-semibold">{errors.fullName.message as string}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all"
                  />
                </div>
                {errors.email && <p className="text-rose-600 text-[0.6875rem] mt-1 font-semibold">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Phone / Mobile *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    {...register('mobile')}
                    type="text"
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all"
                  />
                </div>
                {errors.mobile && <p className="text-rose-600 text-[0.6875rem] mt-1 font-semibold">{errors.mobile.message as string}</p>}
              </div>
            </div>

            {/* Destination & Travel Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Destination</label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={destText || destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    placeholder="e.g. Kerala, Kashmir, Bali"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Travel Date / Month</label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    placeholder="e.g. Nov 2026 / Diwali"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Message / Preferences */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                {mode === 'booking' ? 'Special Requests / Notes' : 'Preferences / Travel Notes (Optional)'}
              </label>
              <div className="relative flex items-start">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <textarea
                  {...register('message')}
                  rows={4}
                  placeholder="e.g. 4-star resort, flight inclusion, veg meal preferences..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:bg-white focus:ring-2 focus:ring-ocean-600/10 transition-all resize-none"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Package Tiers, Travelers, Add-Ons & Total (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ocean-600 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 2. Configuration & Summary
            </h3>

            {/* Mode-specific Configuration */}
            {mode === 'enquiry' ? (
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                {/* Adults Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Adults (12+)</span>
                    <span className="text-[0.6875rem] text-slate-500 font-semibold">Full Fare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100 shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-poppins font-black text-xs text-slate-900 w-3 text-center">
                      {adultsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdultsCount(adultsCount + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Kids Stepper */}
                <div className="flex items-center justify-between pl-2 border-l border-slate-200/80">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Kids (5-11)</span>
                    <span className="text-[0.6875rem] text-slate-500 font-semibold">Child Fare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100 shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-poppins font-black text-xs text-slate-900 w-3 text-center">
                      {childrenCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChildrenCount(childrenCount + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">Package Tier / Class:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Standard', price: startingPrice },
                      { name: 'Deluxe', price: Math.round(startingPrice * 1.25) },
                      { name: 'Luxury', price: Math.round(startingPrice * 1.6) },
                    ].map((tierItem) => {
                      const isSelected = selectedTier === tierItem.name;
                      return (
                        <button
                          key={tierItem.name}
                          type="button"
                          onClick={() => setSelectedTier(tierItem.name as any)}
                          className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-ocean-600 border-ocean-600 text-white font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <p className="text-[0.6875rem] font-bold">{tierItem.name}</p>
                          <p className={`font-extrabold text-xs mt-0.5 ${isSelected ? 'text-white' : 'text-ocean-600'}`}>
                            ₹{tierItem.price.toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.6875rem] font-extrabold text-slate-800">Adults (12+)</p>
                      <p className="text-[0.6875rem] text-slate-500 font-semibold">Full Fare</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-xs text-slate-900 w-3 text-center">{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => setAdultsCount(adultsCount + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.6875rem] font-extrabold text-slate-800">Children (5-11)</p>
                      <p className="text-[0.6875rem] text-slate-500 font-semibold">50% Fare</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-xs text-slate-900 w-3 text-center">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount(childrenCount + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-50/80 rounded-xl p-3.5 border border-sky-200/90 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Indicative Total</span>
                    <span className="font-poppins font-bold text-base text-ocean-700">₹{estimatedTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[0.6875rem] text-slate-500 font-medium">
                    A guide price. Your consultant confirms final price with your itinerary.
                  </p>
                </div>
              </div>
            )}

            {/* Location Activity Add-Ons Section */}
            {(loadingActivities || locationActivities.length > 0) && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
                    <span className="text-xs font-extrabold text-slate-800">
                      Location Add-Ons {destText ? `(${destText})` : ''}
                    </span>
                  </div>
                  <span className="text-[0.625rem] font-bold uppercase text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-md border border-ocean-200/60">
                    Optional
                  </span>
                </div>

                {loadingActivities ? (
                  <p className="text-[0.6875rem] text-slate-500 font-medium py-1 pl-1">Loading activities...</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {locationActivities.map((act) => {
                      const actId = act._id || act.id;
                      const isSelected = selectedAddOns.includes(actId);
                      const actPrice = Number(act.startingPrice || act.price || 0);

                      return (
                        <div
                          key={actId}
                          onClick={() => toggleAddOn(actId)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-ocean-600 shadow-xs'
                              : 'bg-white/90 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-ocean-600 border-ocean-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="overflow-hidden pr-2">
                              <p className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-tight">{act.title}</p>
                              <p className="text-[0.625rem] text-slate-500 font-medium mt-0.5">{act.duration || act.category}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className="text-xs font-bold text-ocean-700">+₹{actPrice.toLocaleString()}</span>
                            <span className="text-[0.625rem] text-slate-400 block font-medium">/person</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Submit Action (Right Column) */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              {submitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{mode === 'booking' ? 'Submit Booking Request' : 'Submit Quick Enquiry'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[0.6875rem] font-medium text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Details stay private
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Free custom quote
              </span>
            </div>

          </div>
        </form>
      </div>

      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          loadUser();
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
};
