import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, MessageSquare, HelpCircle } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';

interface Faq {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
}

const FALLBACK: Faq[] = [
  {
    category: 'Planning',
    question: 'Do I have to pay to get a quote?',
    answer:
      'No. Browsing and enquiring are always free. You only pay once a consultant has built your itinerary and you have confirmed it.',
  },
  {
    category: 'Planning',
    question: 'How long until someone gets back to me?',
    answer:
      'Usually the same day. A named consultant picks up your enquiry and stays with your trip from the first call to the last day.',
  },
  {
    category: 'Booking',
    question: 'How does payment work?',
    answer:
      'Once your itinerary is confirmed you pay an advance to lock it in, and the balance closer to travel. Your consultant shares the exact schedule with the quote.',
  },
  {
    category: 'Booking',
    question: 'Can I change the plan after I have enquired?',
    answer:
      'Yes — adjust dates, hotels, activities or budget as many times as you need before you confirm. Nothing is fixed until you say so.',
  },
  {
    category: 'On the trip',
    question: 'Who do I contact while I am travelling?',
    answer:
      'The same consultant who planned your trip. You can reach them by call, email or WhatsApp throughout.',
  },
];

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/faq')
      .then((res) => {
        const data: Faq[] = res.data?.data || [];
        setFaqs(data.length ? data : FALLBACK);
      })
      .catch(() => setFaqs(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Faq[]>();
    faqs.forEach((f) => {
      const k = f.category || 'General';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    });
    return Array.from(m.entries());
  }, [faqs]);

  return (
    <>
      <SEO
        title="FAQ"
        description="Answers to common questions about planning, quotes, payment and support with HolidayCity."
      />

      <div className="pt-4 sm:pt-20 pb-28 sm:pb-16 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6 lg:hidden">
          <Link
            to="/"
            aria-label="Back to home"
            className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-black text-lg text-ink">FAQ</span>
        </div>

        <div className="hidden lg:block mb-8">
          <h1 className="font-display font-black text-4xl text-ink">Questions, answered</h1>
          <p className="text-slate-body text-sm mt-2">
            The things people ask most before planning a trip with us.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-2xl2 bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, list]) => (
              <section key={category}>
                <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600 mb-2.5">
                  {category}
                </h2>
                <div className="rounded-3xl border border-line overflow-hidden bg-white">
                  {list.map((f, i) => {
                    const id = `${category}-${i}`;
                    const isOpen = open === id;
                    return (
                      <div key={id} className={i > 0 ? 'border-t border-line' : ''}>
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between gap-3 text-left px-4 py-4 active:bg-slate-50"
                        >
                          <span className="font-black text-sm text-ink leading-snug">{f.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <p className="px-4 pb-4 -mt-1 text-sm text-slate-body leading-relaxed">
                            {f.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-ocean-800 to-ocean-600 p-6 text-white">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display font-black text-lg">Still not sure?</h2>
              <p className="text-sm text-white/85 mt-1">
                Ask a consultant directly — no account needed.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 mt-3 px-4 h-10 rounded-2xl2 bg-white text-ocean-800 text-xs font-black uppercase tracking-wider"
              >
                <MessageSquare className="w-4 h-4" /> Ask a question
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FaqPage;
