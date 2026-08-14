import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const ContactPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema)
  });

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
      console.error('Failed to fetch contact page settings', err);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await apiClient.post('/contact', data);
      toast.success('Your message has been sent successfully! Our consultants will reply shortly.');
      reset();
    } catch (err: any) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const phone = settings?.phones?.primary || '+91 98765 43210';
  const email = settings?.emails?.primary || 'info@holidaycity.com';
  const address = settings?.address || 'Kochi & Bangalore, India';

  return (
    <>
      <SEO title="Contact Us | HolidayCity" description="Get in touch with HolidayCity travel experts." />

      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3.5 py-1.5 rounded-full inline-block">
            Get In Touch
          </span>
          <h1 className="font-poppins font-bold text-4xl text-slate-900 mt-3">Contact HolidayCity</h1>
          <p className="text-slate-600 text-sm mt-2">Have questions about a holiday package? Our consultants are here to help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A6FB5] flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Call Us</h3>
              <p className="text-sm font-semibold text-slate-700">{phone}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A6FB5] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Email Us</h3>
              <p className="text-sm font-semibold text-slate-700">{email}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A6FB5] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Headquarters</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{address}</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-poppins font-bold text-2xl text-slate-900 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Your Name *</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{String(errors.name.message)}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Email *</label>
                  <input
                    {...register('email')}
                    placeholder="rahul@example.com"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                  {errors.email && <p className="text-rose-500 text-[11px] mt-1">{String(errors.email.message)}</p>}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Phone *</label>
                  <input
                    {...register('phone')}
                    placeholder="+91 9876543210"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                  {errors.phone && <p className="text-rose-500 text-[11px] mt-1">{String(errors.phone.message)}</p>}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Message *</label>
                <textarea
                  {...register('message')}
                  rows={4}
                  placeholder="How can we help you..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
                {errors.message && <p className="text-rose-500 text-[11px] mt-1">{String(errors.message.message)}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
