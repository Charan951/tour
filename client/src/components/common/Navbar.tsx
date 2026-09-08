import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, LogOut } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadUser = () => {
    try {
      const u = localStorage.getItem('hc_user');
      const token = localStorage.getItem('hc_token');
      if (u && token) {
        setCurrentUser(JSON.parse(u));
      } else {
        setCurrentUser(null);
      }
    } catch (_) {
      setCurrentUser(null);
    }
  };

  // Hide Navbar on unauthenticated login screen
  const isAuthPath = ['/my-bookings', '/profile', '/dashboard', '/my-enquiries', '/login'].some(p => location.pathname.startsWith(p));

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    loadUser();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 40) {
        setIsScrolled(true);
        if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 6) {
          setIsVisible(false); // Hide header when scrolling down
        } else if (lastScrollY - currentScrollY > 6) {
          setIsVisible(true); // Show header when scrolling up
        }
      } else {
        setIsScrolled(false);
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hc_user_updated', loadUser);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hc_user_updated', loadUser);
    };
  }, [lastScrollY]);

  if (isAuthPath && !currentUser) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('hc_user');
    localStorage.removeItem('hc_user_email');
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_guest_mode');
    localStorage.removeItem('hc_guest');
    setCurrentUser(null);
    window.dispatchEvent(new Event('hc_user_updated'));
    navigate('/login');
  };

  // "My Bookings" is included ONLY when logged in
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'India Tour', path: '/destinations?category=Domestic' },
    { label: 'International Tour', path: '/destinations?category=International' },
    { label: 'Theme Based', path: '/themes' },
    { label: 'Tour Packages', path: '/packages' },
    { label: 'Activities', path: '/activities' },
    { label: 'Blogs', path: '/blogs' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Main Sleek Compact Header */}
      <div
        className={`transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-1 border-b border-slate-200/80 text-slate-900'
            : 'bg-white/90 backdrop-blur-md shadow-2xs py-1.5 border-b border-slate-200/60 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 sm:h-14">
            
            {/* Brand Logo (Big Prominent Logo inside Sleek Compact Navbar) */}
            <Link to="/" className="flex items-center group flex-shrink-0">
              <img
                src="/logo.png"
                alt="HolidayCity Pvt. Ltd. - YOUR RELIABLE TRAVEL PARTNER"
                className="h-10 sm:h-12 md:h-13 w-auto max-w-[240px] sm:max-w-[320px] object-contain transition-transform duration-200 ease-out group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links with Animated Underline */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-4 font-black text-xs xl:text-sm">
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
                    className={`whitespace-nowrap transition-all duration-200 relative group py-1 ${
                      isActive
                        ? 'text-ocean-600 font-black bg-ocean-600/10 px-3 py-1 rounded-full border border-ocean-600/20 shadow-2xs scale-105'
                        : 'text-slate-900 hover:text-ocean-600 px-2 font-extrabold'
                    }`}
                  >
                    <span>{link.label}</span>
                    {!isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-ocean-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-left" />
                    )}
                  </Link>
                );
              })}

              {/* Sign In / Account CTA -> Admin Panel for admins, My Profile for users */}
              {!currentUser ? (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-600 text-white text-xs xl:text-sm font-extrabold shadow-md shadow-ocean-600/20 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 ml-3 lg:ml-4 shrink-0 whitespace-nowrap overflow-hidden border-0"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>Sign In</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 ml-3 lg:ml-4 shrink-0">
                  <NotificationBell />
                  {(currentUser.email?.toLowerCase().startsWith('admin@') || currentUser.email?.toLowerCase() === 'admin@holidaycity.com') ? (
                    <Link
                      to="/admin/dashboard"
                      className="px-4 py-2 rounded-full bg-ocean-800 hover:bg-ocean-900 text-white text-xs xl:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-card whitespace-nowrap overflow-hidden"
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>Admin Panel</span>
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="px-4 py-2 rounded-full bg-slate-100 text-ocean-600 hover:bg-slate-200 text-xs xl:text-sm font-extrabold transition-all flex items-center gap-1.5 border border-slate-200 whitespace-nowrap overflow-hidden"
                    >
                      <User className="w-4 h-4 text-ocean-600 shrink-0" />
                      <span className="max-w-[110px] truncate">{currentUser.fullName?.split(' ')[0] || currentUser.name || 'My Profile'}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Actions & Hamburger Button */}
            <div className="lg:hidden flex items-center gap-2">
              {currentUser && <NotificationBell />}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-transform active:scale-95"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
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
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-slate-800 hover:text-ocean-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {!currentUser ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Register
                </Link>
              ) : (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 truncate">Hi, {currentUser.firstName || currentUser.email}</span>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
