import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

const LAST_UPDATED = 'Last updated: August 2026';

/**
 * Static Privacy Policy / Terms & Conditions content.
 * Kept in sync with the Flutter app's `mobile/lib/views/legal/legal_screen.dart`.
 */
const PRIVACY: LegalSection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      'HolidayCity Pvt. Ltd. is a travel-planning service. This policy explains what personal information we collect when you use the HolidayCity website and app, why we collect it, and the choices you have.',
    ],
  },
  {
    heading: 'Information we collect',
    paragraphs: [
      'Details you give us — name, email, phone number, city, and the trip details in an enquiry or booking.',
      'Account data — your login credentials and profile preferences (language, currency).',
      'Usage data — pages viewed, packages opened, and diagnostics, used only to keep the service working and improve it.',
    ],
  },
  {
    heading: 'How we use it',
    paragraphs: [
      'To respond to your enquiries and manage your bookings and payments.',
      'To let a travel consultant contact you by phone, WhatsApp or email about your trip.',
      'To operate, secure and improve the service. We do not sell your personal data.',
    ],
  },
  {
    heading: 'Sharing',
    paragraphs: [
      'We share information only with the consultants and operators handling your trip, our payment and messaging providers, and where the law requires it.',
    ],
  },
  {
    heading: 'Data retention & security',
    paragraphs: [
      'We keep enquiry and booking records for as long as needed to serve you and meet legal obligations, then delete or anonymise them. Data is transmitted over encrypted connections.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'You can view and edit your profile at any time, ask us to correct or delete your data, and opt out of marketing messages.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Questions about this policy? Reach us through the in-app support chat or the contact details on our Contact page.',
    ],
  },
];

const TERMS: LegalSection[] = [
  {
    heading: 'Using HolidayCity',
    paragraphs: [
      'By creating an account or continuing as a guest you agree to these terms. If you do not agree, please do not use the website or app.',
    ],
  },
  {
    heading: 'Enquiries and quotes',
    paragraphs: [
      'Submitting an enquiry is free and places you under no obligation. Prices shown are indicative; a travel consultant confirms the final itinerary and price in your quote.',
    ],
  },
  {
    heading: 'Bookings and payments',
    paragraphs: [
      'A booking is confirmed only after a consultant accepts it and any advance payment is received. Balance payments, changes and cancellations follow the terms stated in your confirmed quote.',
    ],
  },
  {
    heading: 'Your responsibilities',
    paragraphs: [
      'Provide accurate traveller information, hold valid travel documents and visas, and follow the operator’s instructions during the trip.',
    ],
  },
  {
    heading: 'Content',
    paragraphs: [
      'Package, destination and imagery are for general guidance and may change. We try to keep information accurate but do not warrant that it is always complete or current.',
    ],
  },
  {
    heading: 'Liability',
    paragraphs: [
      'HolidayCity arranges travel services provided by third-party operators. Our liability is limited to the extent permitted by applicable law; we are not liable for events outside our reasonable control.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'We may update these terms; continued use after an update means you accept the revised terms.',
    ],
  },
];

const DOCS = {
  terms: {
    title: 'Terms & Conditions',
    icon: FileText,
    sections: TERMS,
    seoTitle: 'Terms & Conditions | HolidayCity',
    seoDesc: 'The terms that apply when you use HolidayCity to plan, enquire about or book a trip.',
  },
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    sections: PRIVACY,
    seoTitle: 'Privacy Policy | HolidayCity',
    seoDesc: 'What personal information HolidayCity collects, how it is used, and the choices you have.',
  },
} as const;

export const LegalPage: React.FC<{ doc: 'terms' | 'privacy' }> = ({ doc }) => {
  const { title, icon: Icon, sections, seoTitle, seoDesc } = DOCS[doc];
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO title={seoTitle} description={seoDesc} />

      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-ocean-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mt-6 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-ocean-50 text-ocean-600">
            <Icon className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{LAST_UPDATED}</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display font-extrabold text-lg text-slate-900">{s.heading}</h2>
              <div className="mt-2 space-y-2.5">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-slate-400">
          See also{' '}
          <Link
            to={doc === 'terms' ? '/privacy' : '/terms'}
            className="font-bold text-ocean-600 hover:underline"
          >
            {doc === 'terms' ? 'Privacy Policy' : 'Terms & Conditions'}
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
