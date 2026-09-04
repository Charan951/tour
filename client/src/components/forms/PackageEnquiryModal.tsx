import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { 
  X, Phone, Mail, UserCheck, 
  MapPin, User, Calendar, 
  Minus, Plus, Info, Sparkles, Send, MessageSquare, ShieldCheck, Clock
} from 'lucide-react';
import { UserAuthModal } from '../auth/UserAuthModal';
import { Modal } from '../common/Modal';

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

  // Pricing calculation
  const startingPrice = Number(selectedPackage?.startingPrice || selectedPackage?.price || 25000);
  const tierMultiplier = selectedTier === 'Luxury' ? 1.6 : selectedTier === 'Deluxe' ? 1.25 : 1.0;
  const activeTierPrice = Math.round(startingPrice * tierMultiplier);
  const estimatedTotal = (activeTierPrice * adultsCount) + Math.round(activeTierPrice * 0.5 * childrenCount);

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (mode === 'booking') {
        const bookingPayload = {
          packageId: selectedPackage?._id || selectedPackage?.id,
          packageTitle: selectedPackage?.title || 'Tour Booking',
          customerName: data.fullName,
          contactName: data.fullName,
          email: data.email,
          contactEmail: data.email,
          mobile: data.mobile,
          contactPhone: data.mobile,
          adults: adultsCount,
          children: childrenCount,
          travelers: { adults: adultsCount, children: childrenCount },
          travelDate: travelDate || 'Flexible',
          pricingTier: selectedTier,
          totalPrice: estimatedTotal,
          userNotes: data.message,
          specialRequests: data.message
        };
        try {
          await apiClient.post('/bookings', bookingPayload);
        } catch (_) {
          await apiClient.post('/enquiries', {
            ...data,
            package: selectedPackage?._id,
            destination: selectedDestination?._id || selectedPackage?.destination?._id,
            source: 'PackageBooking',
            message: `[BOOKING REQUEST] Tier: ${selectedTier}, Adults: ${adultsCount}, Children: ${childrenCount}, Date: ${travelDate || 'Flexible'}, Est: ₹${estimatedTotal}. Notes: ${data.message || ''}`
          });
        }
        toast.success('Tour booking request submitted! Our team will contact you shortly.');
      } else {
        const payload = {
          ...data,
          package: selectedPackage?._id,
          destination: selectedDestination?._id || selectedPackage?.destination?._id,
          source: selectedPackage ? 'PackagePage' : 'HomePageEnquiry',
          adults: adultsCount,
          children: childrenCount,
          travelers: adultsCount + childrenCount,
          preferredDestination: destinationInput || undefined,
          travelDate: travelDate || undefined
        };
        const res = await apiClient.post('/enquiries', payload);
        toast.success(res.data.message || 'Enquiry submitted successfully! We will contact you soon.');
      }
      reset();
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

  if (mode === 'booking' && !currentUser) {
    return (
      <UserAuthModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => {
          loadUser();
        }}
      />
    );
  }

  const destText = typeof selectedPackage?.destination === 'object'
    ? selectedPackage.destination?.name
    : (selectedPackage?.destination || selectedDestination?.name || destinationInput);

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="enquiry-modal-title" panelClassName="max-w-lg" disableBackdropClose>
      <div className="bg-white rounded-3xl overflow-hidden relative text-slate-800 border border-slate-200/80 shadow-raised">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-ocean-800 via-ocean-600 to-ocean-800 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer shadow-sm active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Send className="w-5 h-5 text-aqua-500" />
            </div>
            <div>
              <span className="text-[0.6875rem] font-black uppercase tracking-wider text-aqua-500 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 inline-block">
                A consultant replies personally
              </span>
              <h2 id="enquiry-modal-title" className="font-display font-black text-xl text-white leading-tight mt-0.5">
                {mode === 'booking' ? 'Start your booking request' : 'Plan your trip with us'}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-200/90 font-medium pl-13">
            {mode === 'booking'
              ? 'Provide traveler details to finalize package reservation'
              : 'Fill in details below for a free custom itinerary & instant quote'}
          </p>

          {/* Mode Segmented Switch (if package is selected) */}
          {selectedPackage && (
            <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/15 mt-4">
              <button
                type="button"
                onClick={() => setMode('enquiry')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'enquiry'
                    ? 'bg-aqua-500 text-slate-950 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Send Enquiry
              </button>
              <button
                type="button"
                onClick={() => setMode('booking')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'booking'
                    ? 'bg-aqua-500 text-slate-950 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Book Package
              </button>
            </div>
          )}
        </div>

        {/* Selected Package Banner Context (Compact pill if selected) */}
        {selectedPackage && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {selectedPackage.coverImage && (
                <img
                  src={selectedPackage.coverImage}
                  alt={selectedPackage.title}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="overflow-hidden">
                <span className="text-[0.6875rem] font-black uppercase text-ocean-600 tracking-wider block">Selected Tour</span>
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{selectedPackage.title}</h4>
              </div>
            </div>
            {selectedPackage.startingPrice && (
              <div className="text-right shrink-0">
                <span className="text-[0.6875rem] text-slate-500 font-bold block">Starting From</span>
                <span className="text-xs font-black text-ocean-800">₹{selectedPackage.startingPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">Full Name *</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all"
                />
              </div>
              {errors.fullName && <p className="text-rose-600 text-[0.6875rem] mt-1 font-semibold">{errors.fullName.message as string}</p>}
            </div>

            {/* Email & Phone 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all"
                  />
                </div>
                {errors.email && <p className="text-rose-600 text-[0.6875rem] mt-1 font-semibold">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Phone / Mobile *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    {...register('mobile')}
                    type="text"
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all"
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
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={destText || destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    placeholder="e.g. Kerala, Kashmir, Bali"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Travel Date / Month</label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    placeholder="e.g. Nov 2026 / Diwali"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Mode-specific Fields */}
            {mode === 'enquiry' ? (
              /* ENQUIRY MODE: Adults & Kids Stepper Counters */
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
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
              /* BOOKING MODE: Tier Selection & Adults/Children Counter */
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
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
                              ? 'bg-ocean-600 border-ocean-600 text-white font-bold shadow-md'
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

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.6875rem] font-extrabold text-slate-800">Adults (12+)</p>
                      <p className="text-[0.6875rem] text-slate-500 font-semibold">Full Fare</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-extrabold text-xs text-slate-900 w-3 text-center">{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => setAdultsCount(adultsCount + 1)}
                        className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
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
                        className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-extrabold text-xs text-slate-900 w-3 text-center">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount(childrenCount + 1)}
                        className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-ocean-100/70 rounded-xl2 p-3 border border-ocean-300 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Indicative total</span>
                    <span className="font-display font-black text-base text-ocean-800">₹{estimatedTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[0.6875rem] text-slate-muted font-medium">
                    A guide only. Your consultant confirms the final price with the itinerary.
                  </p>
                </div>
              </div>
            )}

            {/* Additional Message / Preferences */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                {mode === 'booking' ? 'Special Requests / Notes' : 'Preferences / Travel Notes (Optional)'}
              </label>
              <div className="relative flex items-start">
                <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <textarea
                  {...register('message')}
                  rows={2}
                  placeholder="e.g. 4-star resort, flight inclusion, veg meal preferences..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-500 text-xs font-semibold outline-none border border-slate-200 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-600 text-white font-extrabold text-sm shadow-lg hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer border-0 flex items-center justify-center gap-2 mt-2"
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
          </form>

          {/* Direct WhatsApp Option */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-black text-xs transition-colors cursor-pointer w-full group"
            >
              <WhatsAppIcon className="w-4 h-4 text-whatsapp group-hover:scale-110 transition-transform" />
              <span>Prefer WhatsApp? Message us instead</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 text-[0.6875rem] font-bold text-slate-muted pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Your details stay private
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Custom quote, no charge
            </span>
          </div>
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
    </Modal>
  );
};
