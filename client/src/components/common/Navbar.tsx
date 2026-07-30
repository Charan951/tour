import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, Menu, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    fetchSettings();

    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch navbar settings', err);
    }
  };

  const phone = settings?.phones?.primary || '+91 98765 43210';
  const email = settings?.emails?.primary || 'info@holidaycity.com';

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'India Tour', path: '/destinations?category=Domestic' },
    { label: 'International Tour', path: '/destinations?category=International' },
    { label: 'Theme Based', path: '/themes' },
    { label: 'Tour Packages', path: '/packages' },
    { label: 'Blogs', path: '/blogs' },
    { label: 'Contact', path: '/contact' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Header Utility Bar: Left (Mobile Number) & Right (Email) */}
      <div className="bg-[#063B6D] text-white text-xs font-semibold py-1.5 px-4 sm:px-8 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Mobile Number */}
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 text-slate-200 hover:text-[#57D0C9] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#57D0C9]" />
            <span className="tracking-wide">{phone}</span>
          </a>

          {/* Right: Email Address */}
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1.5 text-slate-200 hover:text-[#57D0C9] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#57D0C9]" />
            <span className="tracking-wide">{email}</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-2 border-b border-slate-200/80 text-slate-900'
            : 'bg-white/90 backdrop-blur-md shadow-md py-2.5 border-b border-slate-200/60 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Big Prominent Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0 py-0.5">
              <img
                src="/logo.png"
                alt="HolidayCity Pvt. Ltd. - YOUR RELIABLE TRAVEL PARTNER"
                className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto max-w-[240px] sm:max-w-[340px] md:max-w-[420px] object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 font-extrabold text-sm">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? location.pathname === '/'
                    : link.path.includes('?')
                    ? location.search.includes(link.path.split('?')[1])
                    : location.pathname.startsWith(link.path);

                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={`whitespace-nowrap transition-colors duration-200 hover:text-[#0A6FB5] ${
                      isActive
                        ? 'text-[#0A6FB5] font-extrabold border-b-2 border-[#0A6FB5] pb-1'
                        : 'text-slate-800 hover:text-[#0A6FB5]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-2xl">
            <nav className="flex flex-col gap-3 font-extrabold text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-slate-800 hover:text-[#0A6FB5] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
