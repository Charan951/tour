import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Phone, Clock, MapPin, Zap, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

interface ActivityBookingModalProps {
  activity: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'booking' | 'enquiry';
}

export const ActivityBookingModal: React.FC<ActivityBookingModalProps> = ({
  activity,
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'booking'
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'booking' | 'enquiry'>(initialMode);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [travelDate, setTravelDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const u = localStorage.getItem('hc_user');
      const token = localStorage.getItem('hc_token');
      if (!u || !token) {
        toast.error('Please log in to book or enquire activities');
        localStorage.setItem('hc_redirect_after_login', window.location.pathname + window.location.search);
        localStorage.setItem('hc_open_activity_modal', 'true');
        localStorage.setItem('hc_activity_mode', initialMode || 'booking');
        onClose();
        navigate('/profile');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      const u = localStorage.getItem('hc_user');
      if (u) {
        const user = JSON.parse(u);
        if (user.fullName || user.firstName) {
          setCustomerName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
        }
        if (user.email) setEmail(user.email);
        if (user.mobile || user.phone) setMobile(user.mobile || user.phone);
      }
    } catch (_) {}
  }, [isOpen]);

  if (!isOpen || !activity) return null;

  const unitPrice = Number(activity.startingPrice || activity.price || 1500);
  const totalPrice = unitPrice * adults + Math.round(unitPrice * 0.5 * children);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !email || !mobile) {
      toast.error('Please complete name, email, and mobile number.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'enquiry') {
        const payload = {
          enquiryType: 'activity',
          activity: activity._id || activity.id,
          activityTitle: activity.title,
          fullName: customerName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          travelDate,
          adults,
          children,
          message: specialRequests || `Enquiry regarding activity: ${activity.title} (${activity.location || ''})`,
          source: 'ActivityPage'
        };
        const res = await apiClient.post('/enquiries', payload);
        toast.success('Activity enquiry submitted successfully!');
        setBookingSuccessData(res.data?.data || payload);
      } else {
        const payload = {
          bookingType: 'activity',
          activity: activity._id || activity.id,
          activityName: activity.title,
          activityCode: activity.activityCode || 'ACT-HC',
          destinationName: activity.location || activity.destinationName || '',
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          travelDate,
          adults,
          children,
          totalPrice,
          advanceAmount: 0,
          advancePaid: false,
          paymentStatus: 'Pending Advance',
          specialRequests
        };

        const res = await apiClient.post('/bookings', payload);
        toast.success('Activity booking request submitted successfully!');
        setBookingSuccessData(res.data?.data || payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={() => { setBookingSuccessData(null); onClose(); }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {bookingSuccessData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-black text-2xl text-slate-900">Request Received!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking Reference: <span className="font-mono font-bold text-ocean-600">{bookingSuccessData.bookingId || 'BK-ACT'}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> {activity.title}
              </div>
              <div className="text-slate-600">📍 {activity.location || activity.destinationName} • ⏱️ {activity.duration || '2 Hours'}</div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                <span>Estimated Total:</span>
                <span className="text-ocean-600 text-sm">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200">
                ⏳ Status: Pending Approval. Our consultant will reach out via WhatsApp/Phone to confirm timings and payment.
              </div>
            </div>

            <button
              onClick={() => { setBookingSuccessData(null); onClose(); }}
              className="w-full py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-extrabold text-sm shadow-md cursor-pointer transition-all"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('booking')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'booking' ? 'bg-white text-ocean-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ⚡ Book Activity
                </button>
                <button
                  type="button"
                  onClick={() => setMode('enquiry')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'enquiry' ? 'bg-white text-ocean-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💬 Send Enquiry
                </button>
              </div>
              <h3 className="font-['Outfit'] font-extrabold text-xl text-slate-900 line-clamp-1">{activity.title}</h3>
              <p className="text-xs text-slate-500">📍 {activity.location || activity.destinationName} • ⏱️ {activity.duration || '2 Hours'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-ocean-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-ocean-600 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-ocean-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Activity Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-ocean-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="block font-bold text-slate-800">Adults (12+ yrs)</span>
                  <span className="text-[10px] text-slate-400">Full Fare (₹{unitPrice.toLocaleString()})</span>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-slate-900">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block font-bold text-slate-800">Children (5-11 yrs)</span>
                  <span className="text-[10px] text-slate-400">50% Fare (₹{Math.round(unitPrice * 0.5).toLocaleString()})</span>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-slate-900">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Indicative Activity Total</span>
                  <span className="text-xs text-slate-400">Includes safety gear & guide</span>
                </div>
                <span className="font-extrabold text-xl text-ocean-600">₹{totalPrice.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Special Requests / Notes (Optional)</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="e.g. Preferred time slot, pick up location..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-ocean-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md shadow-ocean-600/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Request...' : mode === 'enquiry' ? 'Submit Activity Enquiry' : 'Submit Activity Booking Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
