import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Sun, Calendar, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { PackageCard } from '../../components/cards/PackageCard';
import { PackageEnquiryModal } from '../../components/forms/PackageEnquiryModal';
import { SEO } from '../../components/common/SEO';

export const DestinationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [dest, setDest] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch destination details
        const destRes = await apiClient.get(`/destinations/${slug}`);
        const currentDest = destRes.data.data;
        setDest(currentDest);

        // Fetch packages for this destination
        if (currentDest?._id) {
          const pkgRes = await apiClient.get(`/packages?destination=${currentDest._id}`);
          setPackages(pkgRes.data.data || []);
        } else {
          const pkgRes = await apiClient.get(`/packages?destination=${slug}`);
          setPackages(pkgRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch destination details', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-12 h-12 border-4 border-[#0A6FB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading destination guide & tour packages...</p>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto">
        <h2 className="font-poppins font-bold text-2xl text-slate-800">Destination Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">Could not find tour itineraries for this destination.</p>
        <Link to="/destinations" className="mt-4 inline-block px-4 py-2 bg-[#0A6FB5] text-white rounded-xl text-xs font-bold">
          Explore All Destinations
        </Link>
      </div>
    );
  }

  const countryDisplay = dest.countryName || (typeof dest.country === 'object' ? dest.country?.name : (dest.category === 'Domestic' ? 'India' : 'International'));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://holidaycity.com' },
      { '@type': 'ListItem', position: 2, name: 'Destinations', item: 'https://holidaycity.com/destinations' },
      { '@type': 'ListItem', position: 3, name: dest.name, item: `https://holidaycity.com/destination/${dest.slug}` }
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the best time to visit ${dest.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The best time to visit ${dest.name} is ${dest.bestTime || 'Nov - Feb'} when weather conditions are ideal for sightseeing.`
        }
      },
      {
        '@type': 'Question',
        name: `Are holiday packages for ${dest.name} customizable?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, all ${dest.name} tour packages offered by HolidayCity can be fully customized for couples, families, and group travel.`
        }
      }
    ]
  };

  return (
    <>
      <SEO
        title={`Explore ${dest.name} Tour Packages | HolidayCity`}
        description={dest.shortDescription || `Browse hand-crafted holiday packages for ${dest.name}. Best time to visit, top attractions, and custom itineraries.`}
        ogImage={dest.banner}
        schemaMarkup={[breadcrumbSchema, faqSchema]}
      />

      {/* Clean Hero Banner */}
      <div className="relative h-80 sm:h-96 pt-20 flex items-center justify-center text-center text-white overflow-hidden">
        <img src={dest.banner} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
        <div className="relative z-10 max-w-3xl px-4 space-y-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F6C65B] bg-slate-900/60 px-3.5 py-1 rounded-full border border-white/20">
            TRAVEL GUIDE & PACKAGES
          </span>
          <h1 className="font-poppins font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">{dest.name}</h1>
        </div>
      </div>

      <div className="py-12 px-4 max-w-7xl mx-auto space-y-12">
        {/* Destination Guide Overview & Dynamic Quick Facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 glass-card rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="font-poppins font-bold text-2xl text-slate-900">About {dest.name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{dest.overview || dest.shortDescription}</p>
          </div>

          {/* DYNAMIC QUICK FACTS CARD */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-slate-200/80">
            <h3 className="font-poppins font-bold text-lg text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0A6FB5]" /> Quick Facts
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <p><strong className="text-slate-800 font-bold">Best Season:</strong> {dest.bestTime || 'Nov - Feb'}</p>
              <p><strong className="text-slate-800 font-bold">Weather:</strong> {dest.weather || 'Pleasant Tropical Breezes'}</p>
              <p><strong className="text-slate-800 font-bold">Country:</strong> {countryDisplay}</p>
            </div>
          </div>
        </div>

        {/* SECTION: ALL PACKAGES FOR THIS DESTINATION */}
        <div id="packages-section" className="scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0A6FB5] bg-[#0A6FB5]/10 px-3 py-1 rounded-full">
                Customized Itineraries
              </span>
              <h2 className="font-poppins font-bold text-3xl text-slate-900 mt-2">
                All {dest.name} Tour Packages
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold mt-2 sm:mt-0">
              Showing {packages.length} {packages.length === 1 ? 'Package' : 'Packages'}
            </span>
          </div>

          {packages.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-600 space-y-3 max-w-md mx-auto">
              <Compass className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800">No Packages Currently Found</h3>
              <p className="text-xs text-slate-500">Contact our travel consultants to get a custom quote for {dest.name}.</p>
              <button
                onClick={() => { setSelectedPackage(null); setEnquiryModalOpen(true); }}
                className="px-5 py-2.5 rounded-xl bg-[#0A6FB5] text-white font-bold text-xs shadow-md"
              >
                Request Custom Quote
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id || pkg.slug}
                  pkg={pkg}
                  onEnquire={(p) => {
                    setSelectedPackage(p);
                    setEnquiryModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PackageEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        selectedPackage={selectedPackage}
      />
    </>
  );
};
