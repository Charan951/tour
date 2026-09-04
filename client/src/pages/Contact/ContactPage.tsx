import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '../../validators/index';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const ContactPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    apiClient
      .get('/settings')
      .then((res) => {
        if (res.data?.success && res.data.data) setSettings(res.data.data);
      })
      .catch((err) => console.error('Failed to fetch contact page settings', err));
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await apiClient.post('/contact', data);
      toast.success('Message sent. A consultant will get back to you shortly.');
      reset();
    } catch {
      toast.error('That didn’t send. Please try again, or reach us on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const phone: string | undefined = settings?.phones?.primary;
  const whatsapp: string | undefined = settings?.phones?.whatsapp || settings?.phones?.primary;
  const email: string | undefined = settings?.emails?.primary || settings?.emails?.support;
  const address: string | undefined = settings?.address;

  const channels = [
    phone && { icon: Phone, label: 'Call', value: phone, href: `tel:${phone.replace(/\s+/g, '')}` },
    whatsapp && {
      icon: Phone,
      label: 'WhatsApp',
      value: whatsapp,
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
    },
    email && { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
    address && { icon: MapPin, label: 'Office', value: address },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string; href?: string }>;

  return (
    <>
      <SEO
        title="Contact HolidayCity"
        description="Send an enquiry and a HolidayCity travel consultant will come back with a custom itinerary and price."
      />

      <div className="pt-4 sm:pt-20 pb-28 sm:pb-16 px-4 max-w-5xl mx-auto space-y-8 sm:space-y-12">
        <Link
          to="/"
          aria-label="Back to home"
          className="lg:hidden -ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <header className="max-w-2xl space-y-3">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">Tell us about the trip</h1>
          <p className="text-slate-body text-sm leading-relaxed">
            Send a few details and a consultant will reply with a real itinerary and an itemised
            price — usually the same day. No account needed, no obligation.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {channels.length > 0 && (
            <div className="space-y-4">
              {channels.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <div className="glass-card-solid rounded-3xl p-6 space-y-2">
                    <div className="w-10 h-10 rounded-2xl2 bg-ocean-600/10 text-ocean-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-black text-ink text-base">{c.label}</h2>
                    <p className="text-sm font-semibold text-slate-body break-words">{c.value}</p>
                  </div>
                );
                return c.href ? (
                  <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block">
                    {inner}
                  </a>
                ) : (
                  <div key={c.label}>{inner}</div>
                );
              })}
            </div>
          )}

          <div className={channels.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3 max-w-2xl'}>
            <div className="glass-card-solid rounded-3xl p-6 sm:p-8">
              <h2 className="font-display font-black text-2xl text-ink mb-6">Send an enquiry</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs" noValidate>
                <div>
                  <label htmlFor="contact-name" className="block text-slate-body font-black mb-1.5 uppercase tracking-wider text-[0.6875rem]">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    {...register('name')}
                    placeholder="e.g. Rahul Sharma"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'contact-name-err' : undefined}
                    className="w-full p-3 rounded-xl2 bg-white border border-line outline-none text-ink focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20"
                  />
                  {errors.name && (
                    <p id="contact-name-err" role="alert" className="text-rose-600 text-[0.6875rem] mt-1 font-bold">
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-email" className="block text-slate-body font-black mb-1.5 uppercase tracking-wider text-[0.6875rem]">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      {...register('email')}
                      placeholder="rahul@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'contact-email-err' : undefined}
                      className="w-full p-3 rounded-xl2 bg-white border border-line outline-none text-ink focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20"
                    />
                    {errors.email && (
                      <p id="contact-email-err" role="alert" className="text-rose-600 text-[0.6875rem] mt-1 font-bold">
                        {String(errors.email.message)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-slate-body font-black mb-1.5 uppercase tracking-wider text-[0.6875rem]">
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="+91 98765 43210"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'contact-phone-err' : undefined}
                      className="w-full p-3 rounded-xl2 bg-white border border-line outline-none text-ink focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20"
                    />
                    {errors.phone && (
                      <p id="contact-phone-err" role="alert" className="text-rose-600 text-[0.6875rem] mt-1 font-bold">
                        {String(errors.phone.message)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-slate-body font-black mb-1.5 uppercase tracking-wider text-[0.6875rem]">
                    What are you planning?
                  </label>
                  <textarea
                    id="contact-message"
                    {...register('message')}
                    rows={4}
                    placeholder="Destination, rough dates, how many travelling, anything that matters to you."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'contact-message-err' : undefined}
                    className="w-full p-3 rounded-xl2 bg-white border border-line outline-none text-ink focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 resize-none"
                  />
                  {errors.message && (
                    <p id="contact-message-err" role="alert" className="text-rose-600 text-[0.6875rem] mt-1 font-bold">
                      {String(errors.message.message)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl2 bg-ocean-600 hover:bg-ocean-700 text-white font-black text-xs uppercase tracking-wider shadow-card transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending…' : 'Send enquiry'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
