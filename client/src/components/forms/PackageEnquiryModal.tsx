import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { X, Phone, Mail, Award, Users, ThumbsUp } from 'lucide-react';

interface PackageEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: any;
  selectedDestination?: any;
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
  selectedDestination
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
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

  const phone = settings?.phones?.primary || '+91 98765 43210';
  const email = settings?.emails?.primary || 'info@holidaycity.com';
  const whatsappNumber = settings?.phones?.whatsapp
    ? settings.phones.whatsapp.replace(/\D/g, '')
    : (settings?.phones?.primary ? settings.phones.primary.replace(/\D/g, '') : '919876543210');

  const {
    register,
    handleSubmit,
    reset,
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

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        package: selectedPackage?._id,
        destination: selectedDestination?._id || selectedPackage?.destination?._id,
        source: selectedPackage ? 'PackagePage' : 'PopupModal'
      };

      const res = await apiClient.post('/enquiries', payload);
      toast.success(res.data.message || 'Enquiry submitted successfully!');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[28px] overflow-hidden shadow-2xl relative border border-slate-200 grid grid-cols-1 md:grid-cols-12 text-slate-800 my-auto">
        
        {/* LEFT COLUMN: Trust Metrics & Contact Info (#F8F7F3 Warm Sand Neutral) */}
        <div className="md:col-span-6 bg-[#F8F7F3] p-6 sm:p-8 flex flex-col justify-between space-y-6 border-b md:border-b-0 md:border-r border-slate-200/80">
          
          {/* Top Banner Image with HolidayCity Ocean Gradient Overlay */}
          <div className="relative rounded-2xl overflow-hidden shadow-md h-36 bg-gradient-to-r from-[#0A6FB5] via-[#57D0C9] to-[#063B6D] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop"
              alt="HolidayCity Luxury Tour Packages"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
            />
            <div className="relative z-10 text-center text-white p-3">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider mb-1 text-white border border-white/30">
                Booking Open For 2026
              </span>
              <h3 className="font-poppins font-black text-xl drop-shadow-md text-white">
                {selectedPackage ? selectedPackage.title : 'Char Dham & Luxury Holiday Packages'}
              </h3>
            </div>
          </div>

          {/* 3 Trust Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-300/60">
            <div className="border-r border-slate-300/60 pr-1">
              <div className="w-8 h-8 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-poppins font-extrabold text-lg text-slate-900 leading-tight">25k</div>
              <div className="text-[11px] font-semibold text-slate-500">Happy Traveler</div>
            </div>

            <div className="border-r border-slate-300/60 px-1">
              <div className="w-8 h-8 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1">
                <Award className="w-4 h-4" />
              </div>
              <div className="font-poppins font-extrabold text-lg text-slate-900 leading-tight">45k</div>
              <div className="text-[11px] font-semibold text-slate-500">Tours Success</div>
            </div>

            <div className="pl-1">
              <div className="w-8 h-8 rounded-full bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center mx-auto mb-1">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div className="font-poppins font-extrabold text-lg text-slate-900 leading-tight">30k</div>
              <div className="text-[11px] font-semibold text-slate-500">Positives Review</div>
            </div>
          </div>

          {/* Trustpilot-style Rating Badge */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#57D0C9] font-black text-sm">
              <span className="text-[#0A6FB5] font-extrabold">Excellent!</span>
              <div className="flex gap-0.5 ml-1">
                <span className="w-3 h-3 rounded-full bg-[#57D0C9] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#57D0C9] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#57D0C9] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#57D0C9] inline-block" />
                <span className="w-3 h-3 rounded-full border-2 border-[#57D0C9] inline-block" />
              </div>
            </div>
            <div className="text-[11px] text-slate-600 font-semibold leading-tight">
              <div><strong className="text-slate-900">4.5 Rating</strong> Out of 5.0</div>
              <div className="text-slate-400">Based On 526 reviews</div>
            </div>
          </div>

          {/* Direct Contact Info */}
          <div className="space-y-2 text-xs text-slate-700 font-bold">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2 hover:text-[#0A6FB5] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#0A6FB5]" />
              <span>Call Us : <span className="text-slate-900 font-extrabold">{phone}</span></span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 hover:text-[#0A6FB5] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#0A6FB5]" />
              <span>Send Us Mail : <span className="text-slate-900 font-extrabold">{email}</span></span>
            </a>
          </div>

        </div>

        {/* RIGHT COLUMN: Form & WhatsApp CTA (HolidayCity Deep Sea Navy #063B6D) */}
        <div className="md:col-span-6 bg-[#063B6D] p-6 sm:p-8 text-white relative flex flex-col justify-between">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer z-10"
            aria-label="Close Enquiry Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h3 className="font-poppins font-extrabold text-2xl text-white mb-6 pr-8">
              Get in touch with us
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Enter Full Name *"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                />
                {errors.fullName && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.fullName.message as string}</p>}
              </div>

              <div>
                <input
                  {...register('mobile')}
                  type="text"
                  placeholder="Enter Phone No. *"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                />
                {errors.mobile && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.mobile.message as string}</p>}
              </div>

              <div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Enter Email Id *"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner"
                />
                {errors.email && <p className="text-rose-300 text-[10px] mt-1 font-semibold">{errors.email.message as string}</p>}
              </div>

              <div>
                <textarea
                  {...register('message')}
                  rows={3}
                  placeholder="Leave a comment here"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#57D0C9] shadow-inner resize-none"
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

          {/* WhatsApp Direct Link CTA */}
          <div className="pt-6 border-t border-white/10 mt-6 text-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 text-white font-extrabold text-sm hover:text-[#57D0C9] transition-colors py-1 cursor-pointer group"
            >
              <WhatsAppIcon className="w-6 h-6 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span>Get Itinerary On Whatsapp</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
