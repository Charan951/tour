import React from 'react';
import { Compass, Award, ShieldCheck, Heart, Users } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const AboutPage: React.FC = () => {
  return (
    <>
      <SEO title="About Us | HolidayCity" description="Learn about HolidayCity's mission to deliver memorable holiday experiences." />

      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3 py-1 rounded-full">
            Our Story
          </span>
          <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-slate-900">
            About HolidayCity
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            HolidayCity is one of India's premier travel platforms, delivering exceptional holiday experiences through technology, personalized service, and hand-crafted travel itineraries.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card rounded-3xl p-8 border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0A6FB5]/10 text-[#0A6FB5] flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-poppins font-bold text-2xl text-slate-900">Our Vision</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To become India's most trusted travel brand by combining technology-driven travel discovery with experienced human holiday consulting.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#57D0C9]/10 text-[#57D0C9] flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-poppins font-bold text-2xl text-slate-900">Our Mission</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Make travel planning simple and enjoyable, deliver memorable customer service, and empower holiday experts with modern lead tools.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
