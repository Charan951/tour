import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Users, ShieldCheck, MessageSquare, Mail, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

const STEPS = [
  {
    icon: Compass,
    title: 'You tell us the trip',
    body: 'Where you want to go, roughly when, who is travelling and the sort of budget you have in mind. A form or a phone call — whichever you prefer.',
  },
  {
    icon: Users,
    title: 'One consultant takes it on',
    body: 'A named person owns your trip end to end. They know the destinations, the operators and what a fair price looks like.',
  },
  {
    icon: MessageSquare,
    title: 'You get a real itinerary and quote',
    body: 'A firm, day-by-day plan with an itemised price — usually back to you the same day. You can adjust it as many times as you need.',
  },
  {
    icon: ShieldCheck,
    title: 'You pay only when it is right',
    body: 'Nothing changes hands until you have confirmed the plan. No upfront wall to browse or enquire.',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <>
      <SEO
        title="About HolidayCity"
        description="HolidayCity plans custom domestic and international holidays, with a personal travel consultant handling every trip end to end."
      />

      <div className="pt-4 sm:pt-20 pb-28 sm:pb-16 px-4 max-w-5xl mx-auto space-y-10 sm:space-y-16">
        <Link
          to="/"
          aria-label="Back to home"
          className="lg:hidden -ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <header className="max-w-2xl space-y-4">
          <h1 className="font-display font-black text-3xl sm:text-5xl text-ink leading-tight text-balance">
            We plan the trip. A real person owns it.
          </h1>
          <p className="text-slate-body text-base leading-relaxed">
            HolidayCity is a travel-planning service, not a self-service booking site. You browse
            destinations and packages here to get a sense of what is possible — then a travel
            consultant takes over, builds the itinerary around you, and stays with it from the first
            call to the last day of the trip.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">How working with us goes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-card-solid rounded-3xl p-6 space-y-3">
                <div className="w-11 h-11 rounded-2xl2 bg-ocean-600/10 text-ocean-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-black text-lg text-ink">{title}</h3>
                <p className="text-slate-body text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card-solid rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="font-display font-black text-2xl text-ink">What we believe</h2>
          <ul className="text-slate-body text-sm leading-relaxed space-y-2">
            <li>A good holiday is worth a conversation. Software should get you to that conversation faster, not replace it.</li>
            <li>Prices should be itemised and explained, not buried in a total.</li>
            <li>The person who quotes your trip should be the person you call when you are on it.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-ocean-800 to-ocean-600 p-6 sm:p-10 text-white">
          <h2 className="font-display font-black text-2xl sm:text-3xl">Ready to talk it through?</h2>
          <p className="text-white/85 text-sm mt-2 max-w-xl">
            Send an enquiry with your rough plan and a consultant will come back with a real itinerary
            and price. No account needed, no obligation.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl2 bg-white text-ocean-800 text-xs font-black uppercase tracking-wider"
            >
              <Mail className="w-4 h-4" /> Start an enquiry
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl2 bg-white/10 border border-white/25 text-white text-xs font-black uppercase tracking-wider"
            >
              <Compass className="w-4 h-4" /> Browse packages
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};
