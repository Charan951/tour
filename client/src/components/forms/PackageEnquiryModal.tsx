import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { 
  X, Phone, Mail, Award, Users, ThumbsUp, LogIn, UserCheck, 
  MapPin, AlignLeft, User, Home, Building, Map, Calendar, 
  Edit3, Minus, Plus, Info, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import { UserAuthModal } from '../auth/UserAuthModal';

interface PackageEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: any;
  selectedDestination?: any;
  initialMode?: 'enquiry' | 'booking';
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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

  // Steppers & Booking form state
  const [travelersCount, setTravelersCount] = useState(2);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Deluxe' | 'Luxury'>('Standard');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [travelDate, setTravelDate] = useState('Tue, 25 Aug 2026');

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
      console.error('Failed to fetch modal contact settings', err);
    }
  };

  const phone = settings?.phones?.primary || '+91 88005 42270';
  const email = settings?.emails?.primary || 'info@mintoholidays.com';
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
  }, [isOpen, currentUser, setValue]);

  // Pricing calculation matching Image 3
  const startingPrice = Number(selectedPackage?.startingPrice || selectedPackage?.price || 48500);
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
          travelers: { adults: adultsCount, children: childrenCount },
          travelDate,
          pricingTier: selectedTier,
          totalPrice: estimatedTotal,
          userNotes: data.message,
          contactName: data.fullName,
          contactEmail: data.email,
          contactPhone: data.mobile,
          billingAddress,
          city,
          state: stateName,
          pincode
        };
        try {
          await apiClient.post('/bookings', bookingPayload);
        } catch (_) {
          await apiClient.post('/enquiries', {
            ...data,
            package: selectedPackage?._id,
            destination: selectedDestination?._id || selectedPackage?.destination?._id,
            source: 'PackagePage',
            message: `[BOOKING REQUEST] Tier: ${selectedTier}, Adults: ${adultsCount}, Children: ${childrenCount}, Date: ${travelDate}, Est: ₹${estimatedTotal}. Notes: ${data.message || ''}`
          });
        }
        toast.success('Tour booking request submitted successfully! Admin will review and confirm.');
      } else {
        const payload = {
          ...data,
          package: selectedPackage?._id,
          destination: selectedDestination?._id || selectedPackage?.destination?._id,
          source: selectedPackage ? 'PackagePage' : 'PopupModal',
          travelers: travelersCount
        };
        const res = await apiClient.post('/enquiries', payload);
        toast.success(res.data.message || 'Enquiry submitted successfully!');
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
      selectedPackage ? ` for ${selectedPackage.title}` : ''
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

  const pkgTitle = selectedPackage?.title || 'Singapore City & Sentosa Universal Studios Extravaganza';
  const destText = typeof selectedPackage?.destination === 'object' ? selectedPackage.destination?.name : (selectedPackage?.destination || selectedDestination?.name || 'Singapore & Sentosa Island');
  const pkgCode = selectedPackage?.packageCode || selectedPackage?.code || 'PKG-SIN-001';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      
      {/* ── MOBILE SHEET ── */}
      <div className="md:hidden bg-white w-full max-h-[90vh] rounded-3xl overflow-y-auto flex flex-col relative text-slate-800 border border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Top Header Navigation Bar with Back Arrow & Close Button */}
        <div className="pt-3 px-5 pb-2 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-slate-900" />
              <span>Back</span>
            </button>

            <div className="w-10 h-1 bg-slate-300 rounded-full" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 mb-1">
            <button
              type="button"
              onClick={() => setMode('enquiry')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'enquiry'
                  ? 'bg-[#0A6FB5] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plan Trip (Enquiry)
            </button>
            <button
              type="button"
              onClick={() => setMode('booking')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'booking'
                  ? 'bg-[#0A6FB5] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Book Package
            </button>
          </div>
        </div>

        {/* Scrollable Form Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {mode === 'enquiry' ? (
            /* ─────────────────────────────────────────────────────────────
               MODE 1: ENQUIRY SHEET ("Plan Your Trip With Us" - Guest or User)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-poppins font-black text-2xl text-slate-900 leading-tight">
                    Plan Your Trip With Us
                  </h2>
                  {currentUser ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <UserCheck className="w-3 h-3" /> Logged In
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="text-[11px] font-extrabold text-[#0A6FB5] hover:underline cursor-pointer shrink-0"
                    >
                      Sign In
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  Fill in details to get custom quote & best pricing
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Full Name *</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="e.g. Naveen Kumar"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                    />
                  </div>
                  {errors.fullName && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{errors.fullName.message as string}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Email Address *</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                    />
                  </div>
                  {errors.email && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{errors.email.message as string}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Phone Number *</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      {...register('mobile')}
                      type="text"
                      placeholder="+91 98765 43210"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                    />
                  </div>
                  {errors.mobile && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{errors.mobile.message as string}</p>}
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Destination</label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      readOnly
                      value={destText}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 text-xs font-semibold outline-none cursor-default"
                    />
                  </div>
                </div>

                {/* Number of Travelers Counter */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-extrabold text-slate-800">Number of Travelers</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-poppins font-extrabold text-sm text-slate-900 w-4 text-center">
                      {travelersCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTravelersCount(travelersCount + 1)}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Preferences (Optional) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Additional Preferences (Optional)</label>
                  <div className="relative flex items-start">
                    <AlignLeft className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <textarea
                      {...register('message')}
                      rows={3}
                      placeholder="e.g. 4-star hotel, veg meal preference..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all cursor-pointer border border-white/20"
                >
                  {submitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </form>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               MODE 2: BOOKING SHEET ("Book [Package Title]" - Guest or User)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-poppins font-black text-xl text-slate-900 leading-tight">
                    Book {pkgTitle}
                  </h2>
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="text-[11px] font-extrabold text-[#0A6FB5] hover:underline cursor-pointer shrink-0"
                    >
                      Sign In
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                  Destination: {destText} • Code: {pkgCode}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Full Name *</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="Enter Full Name"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                    />
                  </div>
                  {errors.fullName && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{errors.fullName.message as string}</p>}
                </div>

                {/* Email Address & Mobile Number 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Email Address *</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="Email"
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Mobile Number *</label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        {...register('mobile')}
                        type="text"
                        placeholder="Mobile"
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address (Optional) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Billing / House Address (Optional)</label>
                  <div className="relative flex items-center">
                    <Home className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="e.g. 123 Beach Road, Flat 402"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5]"
                    />
                  </div>
                </div>

                {/* City, State, Pincode 3-Column Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">City</label>
                    <div className="relative flex items-center">
                      <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full pl-8 pr-2 py-2 rounded-xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">State</label>
                    <div className="relative flex items-center">
                      <Map className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="State"
                        className="w-full pl-8 pr-2 py-2 rounded-xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">Pincode</label>
                    <div className="relative flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="400001"
                        className="w-full pl-8 pr-2 py-2 rounded-xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Travel Date */}
                <div>
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F1F5F9] rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#0A6FB5]" />
                      <span className="text-xs font-extrabold text-slate-800">
                        Travel Date: {travelDate}
                      </span>
                    </div>
                    <Edit3 className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Select Tier / Class */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">Select Tier / Class:</label>
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
                          className={`py-3 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A6FB5] border-[#0A6FB5] text-white shadow-md'
                              : 'bg-[#F8FAFC] border-slate-200 text-slate-800'
                          }`}
                        >
                          <p className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {tierItem.name}
                          </p>
                          <p className={`font-extrabold text-[11px] mt-0.5 ${isSelected ? 'text-white' : 'text-[#0A6FB5]'}`}>
                            ₹{tierItem.price.toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Adults Counter */}
                <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Adults (12+ yrs)</p>
                    <p className="text-[10px] font-semibold text-slate-400">Full Fare</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-poppins font-extrabold text-sm text-slate-900 w-4 text-center">
                      {adultsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdultsCount(adultsCount + 1)}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Children Counter */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Children (5-11 yrs)</p>
                    <p className="text-[10px] font-semibold text-slate-400">50% Fare</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-poppins font-extrabold text-sm text-slate-900 w-4 text-center">
                      {childrenCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChildrenCount(childrenCount + 1)}
                      className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 cursor-pointer hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Estimated Package Price Card (Matches Image 3 exact sky blue box) */}
                <div className="bg-[#E0F2FE]/70 rounded-2xl p-4 border border-[#BAE6FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Estimated Package Price:</span>
                    <span className="font-poppins font-black text-xl text-[#0369A1]">
                      ₹{estimatedTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-[#0369A1] font-medium leading-snug pt-1 border-t border-[#BAE6FD]/80">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>No payment required now. Submit request & await admin approval.</span>
                  </div>
                </div>

                {/* Special Requests / Notes (Optional) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Special Requests / Notes (Optional)</label>
                  <div className="relative flex items-start">
                    <AlignLeft className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <textarea
                      {...register('message')}
                      rows={3}
                      placeholder="e.g. Flight timing, vegetarian food..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F1F5F9] text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6FB5] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all cursor-pointer border border-white/20"
                >
                  {submitting ? 'Submitting...' : 'Submit Tour Booking Request'}
                </button>
              </form>
            </div>
          )}

          {/* WhatsApp Direct CTA */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 text-slate-700 font-extrabold text-xs hover:text-[#0A6FB5] transition-colors py-1 cursor-pointer group"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span>Get Itinerary On Whatsapp</span>
            </a>
          </div>
        </div>

      </div>

      {/* ── DESKTOP DUAL COLUMN MODAL ── */}
      <div className="hidden md:grid bg-white max-w-5xl w-full max-h-[90vh] rounded-3xl overflow-hidden relative border border-slate-200 shadow-2xl grid-cols-12 text-slate-800 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Left Column: Banner & Metrics */}
        <div className="col-span-6 bg-[#F8F7F3] p-8 flex flex-col justify-between space-y-6 border-r border-slate-200/80 overflow-y-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-md h-56 bg-gradient-to-r from-[#0A6FB5] via-[#57D0C9] to-[#063B6D] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop"
              alt="HolidayCity Luxury Tour Packages"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
            />
            <div className="relative z-10 text-center text-white p-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider mb-2 text-white border border-white/30">
                Booking Open For 2026
              </span>
              <h3 className="font-poppins font-black text-3xl drop-shadow-md text-white leading-snug">
                {selectedPackage ? selectedPackage.title : 'Char Dham & Luxury Holiday Packages'}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-4 border-y border-slate-300/60">
            <div className="border-r border-slate-300/60 pr-2">
              <div className="w-10 h-10 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1.5">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-poppins font-extrabold text-2xl text-slate-900 leading-tight">25k</div>
              <div className="text-xs font-semibold text-slate-500">Happy Traveler</div>
            </div>

            <div className="border-r border-slate-300/60 px-2">
              <div className="w-10 h-10 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1.5">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-poppins font-extrabold text-2xl text-slate-900 leading-tight">45k</div>
              <div className="text-xs font-semibold text-slate-500">Tours Success</div>
            </div>

            <div className="pl-2">
              <div className="w-10 h-10 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1.5">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div className="font-poppins font-extrabold text-2xl text-slate-900 leading-tight">30k</div>
              <div className="text-xs font-semibold text-slate-500">Positives Review</div>
            </div>
          </div>

          {/* Reviews Rating Badge */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[#57D0C9]">
              <div className="w-3.5 h-3.5 rounded-full bg-[#57D0C9]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#57D0C9]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#57D0C9]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#57D0C9]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#57D0C9]" />
            </div>
            <div className="text-xs text-slate-600 font-semibold leading-tight">
              <div><strong className="text-slate-900 font-bold text-sm">4.5 Rating</strong> Out of 5.0</div>
              <div className="text-slate-400 text-xs">Based On 526 reviews</div>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 font-bold pt-2">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2.5 hover:text-[#0A6FB5] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#0A6FB5]" />
              <span>Call Us : <span className="text-slate-900 font-extrabold">{phone}</span></span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2.5 hover:text-[#0A6FB5] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#0A6FB5]" />
              <span>Send Us Mail : <span className="text-slate-900 font-extrabold">{email}</span></span>
            </a>
          </div>
        </div>

        {/* Right Column: Mode Switch Tabs & Dual-Mode Forms */}
        <div className="col-span-6 bg-[#063B6D] p-8 sm:p-12 text-white relative flex flex-col justify-between overflow-y-auto min-h-screen">
          {/* Close Button cleanly positioned on top right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer z-30 shadow-lg active:scale-95"
            aria-label="Close Enquiry Modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div>
            {/* Top Bar: Auth Status & Sign In Button (Padded right to avoid close button overlap) */}
            <div className="flex items-center justify-between mb-4 pr-14">
              <div className="flex items-center gap-2 text-[#57D0C9]">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#57D0C9]">
                  {currentUser ? 'Logged In' : 'Guest User'}
                </span>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="ml-2 text-xs font-black text-slate-950 bg-[#57D0C9] hover:bg-[#43c4bd] px-3 py-1 rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20 mb-5">
              <button
                type="button"
                onClick={() => setMode('enquiry')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'enquiry'
                    ? 'bg-[#57D0C9] text-slate-950 shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Plan Trip (Enquiry)
              </button>
              <button
                type="button"
                onClick={() => setMode('booking')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'booking'
                    ? 'bg-[#57D0C9] text-slate-950 shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Book Package
              </button>
            </div>

            {mode === 'enquiry' ? (
              /* ── DESKTOP ENQUIRY MODE ── */
              <div className="space-y-3.5">
                <h3 className="font-poppins font-extrabold text-2xl text-white mb-1 pr-8">
                  Plan Your Trip With Us
                </h3>
                <p className="text-xs text-slate-200 mb-3">
                  Fill in details below to get instant quote & custom pricing.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Full Name *</label>
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="Enter Full Name *"
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                    />
                    {errors.fullName && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.fullName.message as string}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Phone Number *</label>
                    <input
                      {...register('mobile')}
                      type="text"
                      placeholder="Enter Phone No. *"
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                    />
                    {errors.mobile && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.mobile.message as string}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Email Id *</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Enter Email Id *"
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                    />
                    {errors.email && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.email.message as string}</p>}
                  </div>

                  <div className="flex items-center justify-between py-1 border-y border-white/10">
                    <span className="text-xs font-bold text-slate-200">Number of Travelers</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-poppins font-extrabold text-sm text-white w-4 text-center">{travelersCount}</span>
                      <button
                        type="button"
                        onClick={() => setTravelersCount(travelersCount + 1)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Preferences (Optional)</label>
                    <textarea
                      {...register('message')}
                      rows={2}
                      placeholder="Leave a comment here"
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] hover:from-[#085a94] hover:to-[#4bb8b1] text-white font-extrabold text-base shadow-xl hover:scale-[1.02] transition-all cursor-pointer border border-white/20"
                  >
                    {submitting ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </form>
              </div>
            ) : (
              /* ── DESKTOP BOOKING MODE ── */
              <div className="space-y-4">
                <div>
                  <h3 className="font-poppins font-extrabold text-2xl text-white mb-1.5 pr-10">
                    Book {pkgTitle}
                  </h3>
                  <p className="text-xs text-[#57D0C9] font-bold">
                    Destination: {destText} • Code: {pkgCode}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Full Name *</label>
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="Enter Full Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                    />
                    {errors.fullName && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.fullName.message as string}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1.5">Email *</label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="Email Address"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1.5">Mobile *</label>
                      <input
                        {...register('mobile')}
                        type="text"
                        placeholder="Mobile Number"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Billing / House Address (Optional)</label>
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="e.g. 123 Beach Road, Flat 402"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold outline-none"
                    />
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold outline-none"
                    />
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
                      className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Select Tier / Class:</label>
                    <div className="grid grid-cols-3 gap-2.5">
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
                                ? 'bg-[#57D0C9] border-[#57D0C9] text-slate-950 font-bold shadow-md'
                                : 'bg-white/10 border-white/20 text-white'
                            }`}
                          >
                            <p className="text-[10px] font-bold">{tierItem.name}</p>
                            <p className="font-extrabold text-xs mt-0.5">₹{tierItem.price.toLocaleString()}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-white/10">
                    <span className="text-xs font-bold text-slate-200">Adults (12+ yrs)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm text-white w-4 text-center">{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => setAdultsCount(adultsCount + 1)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-200">Children (5-11 yrs)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm text-white w-4 text-center">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount(childrenCount + 1)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Estimated Price Box */}
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Estimated Price:</span>
                    <span className="font-poppins font-extrabold text-lg text-[#57D0C9]">
                      ₹{estimatedTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-slate-950 font-black text-base shadow-xl active:scale-95 transition-all cursor-pointer border border-white/30"
                  >
                    {submitting ? 'Submitting...' : 'Submit Tour Booking Request'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 mt-3 text-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 text-white font-extrabold text-xs hover:text-[#57D0C9] transition-colors py-0.5 cursor-pointer group"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span>Get Itinerary On Whatsapp</span>
            </a>
          </div>
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
  );
};
