import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Hotel, Utensils, Car, Check, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { FALLBACK_PACKAGES } from '../../utils/mobileDataFallback';

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.title || val.state || val.country || '';
  return String(val);
};

const safeDuration = (dur: any): string => {
  if (!dur) return '';
  if (typeof dur === 'string') return dur;
  if (typeof dur === 'object') {
    const n = dur.nights ?? '';
    const d = dur.days ?? '';
    return n || d ? `${d} Days / ${n} Nights` : '';
  }
  return String(dur);
};

import { formatImageUrl } from '../../utils/imageUrl';

export const MobilePackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<'inclusions' | 'exclusions'>('inclusions');
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

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

  const [modalMode, setModalMode] = useState<'enquiry' | 'booking'>('enquiry');

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/packages/${slug}`);
        if (res.data?.data) {
          setPkg(res.data.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
      
      // Fallback matching Flutter package_service.dart getPackageBySlug()
      const fb = FALLBACK_PACKAGES.find(p => p.slug === slug || p._id === slug || p.id === slug) || null;
      setPkg(fb);
      setLoading(false);
    };
    if (slug) fetchPackage();
  }, [slug]);

  useEffect(() => {
    if (localStorage.getItem('hc_open_booking_modal') === 'true') {
      localStorage.removeItem('hc_open_booking_modal');
      const savedMode = (localStorage.getItem('hc_booking_mode') as 'booking' | 'enquiry') || 'booking';
      localStorage.removeItem('hc_booking_mode');
      setModalMode(savedMode);
      setEnquiryOpen(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-white p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800">Package Not Found</h2>
        <button onClick={handleBack} className="mt-4 px-4 py-2 bg-ocean-600 text-white rounded-xl text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Tiers (Standard, Deluxe, Luxury)
  const defaultTiers = [
    { category: 'Standard', price: Number(pkg.startingPrice || pkg.price || 16500) },
    { category: 'Deluxe', price: Math.round(Number(pkg.startingPrice || pkg.price || 16500) * 1.25) },
    { category: 'Luxury', price: Math.round(Number(pkg.startingPrice || pkg.price || 16500) * 1.6) },
  ];
  const tiers = (pkg.pricingTiers && pkg.pricingTiers.length > 0) ? pkg.pricingTiers : defaultTiers;
  const activeTier = tiers[selectedTierIndex] || tiers[0];

  const rawImg = pkg.coverImage || pkg.mainImage || pkg.images?.[0];
  const imgUrl = formatImageUrl(rawImg, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800');
  const categoryLabel = safeStr(pkg.category || pkg.theme) || 'Domestic Packages';
  const destName = safeStr(pkg.destination) || 'Himachal & Manali';
  const durationText = safeDuration(pkg.duration) || '5 Days / 4 Nights';
  const rating = pkg.rating || 4.92;

  // Highlights
  const highlights = pkg.highlights && pkg.highlights.length > 0 ? pkg.highlights : [
    'Solang Valley Snow Sports',
    'Rohtang Pass Day Trip',
    'Private Mountain View Resort'
  ];

  // Inclusions
  const inclusions = pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [
    'Breakfast & Dinner',
    'Private Cab Sightseeing'
  ];

  const exclusions = pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : [
    'Personal Expenses & Hard Drinks',
    'Flight / Train Airfare'
  ];

  return (
    <div className="min-h-screen bg-white relative pb-28">
      {/* ── TOP HERO COVER IMAGE WITH FLOATING BACK BUTTON ── */}
      <div className="h-64 relative bg-slate-900">
        <img src={imgUrl} alt={pkg.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
        {/* Floating Back Button */}
        <button
          type="button"
          onClick={(e) => handleBack(e)}
          className="absolute top-4 left-4 z-50 w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-900 active:scale-90 transition-all shadow-xl cursor-pointer pointer-events-auto border border-slate-200/50"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900 stroke-[2.5]" />
        </button>
      </div>

      {/* ── MAIN CONTENT (Matches Images 1 & 2) ── */}
      <div className="px-5 pt-4 space-y-5">
        {/* Badges Row: [Category Pill] + Rating */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-ocean-600 text-white text-xs font-bold">
            {categoryLabel}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{rating} Rating</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-extrabold text-xl text-slate-900 leading-snug">
          {pkg.title}
        </h1>

        {/* Location & Duration Row */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-ocean-600 shrink-0" />
            <span className="truncate">{destName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{durationText}</span>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* ── 1. CHOOSE YOUR TRAVEL PLAN ── (Matches Image 1) */}
        <div>
          <h2 className="font-bold text-base text-slate-900">
            Choose Your Travel Plan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Select package tier based on hotel style & comfort</p>

          {/* Tier Cards Row */}
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            {tiers.map((tier: any, idx: number) => {
              const isSelected = selectedTierIndex === idx;
              return (
                <button
                  key={tier.category || idx}
                  onClick={() => setSelectedTierIndex(idx)}
                  className={`py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                    isSelected
                      ? 'bg-ocean-600 border-ocean-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <p className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {tier.category}
                  </p>
                  <p className={`font-extrabold text-xs mt-1 ${isSelected ? 'text-white' : 'text-ocean-600'}`}>
                    ₹{Number(tier.price).toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Plan Inclusions Card (Matches Image 1) */}
          <div className="mt-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                {activeTier.category} Plan Inclusions
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[0.6875rem] font-bold">
                Available
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-ocean-600 shrink-0" />
                <span>Stay: {selectedTierIndex === 2 ? '5 Star Luxury Resort' : selectedTierIndex === 1 ? '4 Star Deluxe Hotel' : '3 Star Deluxe Hotel'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Meals: Daily Breakfast & Dinner</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transfer: AC Private Car Transfers</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* ── 2. PACKAGE OVERVIEW ── (Matches Image 1 & 2) */}
        <div>
          <h2 className="font-bold text-base text-slate-900 mb-1">
            Package Overview
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {pkg.overview || 'Explore Hadimba Temple, Mall Road shopping, Solang Valley ATV rides & Rohtang snow point.'}
          </p>
        </div>

        {/* ── 3. HIGHLIGHTS ── (Matches Image 2 green checkmarks) */}
        <div>
          <h2 className="font-bold text-base text-slate-900 mb-2">
            Highlights
          </h2>
          <div className="space-y-2">
            {highlights.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-100" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. TOUR DETAILS (INCLUSIONS / EXCLUSIONS TABS) ── (Matches Image 2) */}
        <div>
          <h2 className="font-bold text-base text-slate-900 mb-2">
            Tour Details
          </h2>
          {/* Tab buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setActiveInfoTab('inclusions')}
              className={`py-3 rounded-2xl font-bold text-xs transition-colors ${
                activeInfoTab === 'inclusions'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Inclusions
            </button>
            <button
              onClick={() => setActiveInfoTab('exclusions')}
              className={`py-3 rounded-2xl font-bold text-xs transition-colors ${
                activeInfoTab === 'exclusions'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Exclusions
            </button>
          </div>

          {/* Inclusions Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
            {(activeInfoTab === 'inclusions' ? inclusions : exclusions).map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                {activeInfoTab === 'inclusions' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-100" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. ITINERARY ACCORDION ── */}
        {pkg.itinerary && pkg.itinerary.length > 0 && (
          <div>
            <h2 className="font-bold text-base text-slate-900 mb-2">
              Day Wise Itinerary
            </h2>
            <div className="space-y-2">
              {pkg.itinerary.map((dayItem: any) => {
                const isOpen = expandedDay === dayItem.day;
                return (
                  <div key={dayItem.day} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedDay(isOpen ? null : dayItem.day)}
                      className="w-full p-3.5 text-left flex items-center justify-between font-bold text-xs text-slate-900 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-ocean-600 text-white flex items-center justify-center text-[0.6875rem] font-extrabold shrink-0">
                          D{dayItem.day}
                        </span>
                        <span>{dayItem.title}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-ocean-600" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 pt-1 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/60 leading-relaxed">
                        {dayItem.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM BAR ── (Matches Flutter mobile app package detail action bar) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.6875rem] text-slate-500 font-bold uppercase tracking-wider">{activeTier.category} Plan</p>
          <p className="font-poppins font-extrabold text-ocean-600 text-lg leading-tight">₹{Number(activeTier.price).toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setModalMode('enquiry'); setEnquiryOpen(true); }}
            className="px-4 py-2.5 rounded-xl border-2 border-ocean-600 text-ocean-600 text-xs font-extrabold active:scale-95 transition-all hover:bg-ocean-600/5 cursor-pointer"
          >
            Enquire
          </button>
          <button
            type="button"
            onClick={() => { setModalMode('booking'); setEnquiryOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all hover:opacity-95 cursor-pointer"
          >
            Book Package Now
          </button>
        </div>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        selectedPackage={pkg}
        initialMode={modalMode}
      />
    </div>
  );
};
