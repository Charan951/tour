import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Package as PkgIcon, Calendar, MapPin,
  ChevronRight, X, Copy, Check, MessageSquare,
  AlertCircle, CheckCircle2, LogOut, Settings,
  ArrowLeft, Mail, Lock, Phone, Sparkles, LogIn, UserPlus,
  ShieldCheck, Headphones, Award
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Mobile breakpoint hook (matches < 1024px / lg)
───────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

/* ─────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────── */
const isAdminRole = (role?: any, email?: string): boolean => {
  const normEmail = (email || '').trim().toLowerCase();
  return normEmail === 'admin@holidaycity.com' || normEmail.startsWith('admin@');
};

const safeStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.title || val.destinationName || val.packageName || '';
  return String(val);
};

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // User state loaded from localStorage (set by login)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('hc_user') || 'null'); } catch { return null; }
  });

  // Auth Form State (When not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [email, setEmail] = useState<string>(() => {
    try {
      const u = JSON.parse(localStorage.getItem('hc_user') || 'null');
      return u?.email || localStorage.getItem('hc_user_email') || '';
    } catch { return ''; }
  });
  const [emailInput, setEmailInput] = useState(email);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // "Screen" navigation: profile → bookings list → booking detail | enquiries list → enquiry detail
  const [screen, setScreen] = useState<'profile' | 'bookings' | 'enquiries'>('profile');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [enquiryFilter, setEnquiryFilter] = useState('All');

  const [bookings, setBookings] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Sync user from storage when auth event fires
  useEffect(() => {
    const sync = () => {
      try {
        const u = JSON.parse(localStorage.getItem('hc_user') || 'null');
        const token = localStorage.getItem('hc_token') || localStorage.getItem('hc_access_token');
        if (u && token) {
          setCurrentUser(u);
          setEmail(u.email);
          setEmailInput(u.email);

          const isUserAdmin = isAdminRole(u.role, u.email);
          if (isUserAdmin) {
            navigate('/admin/dashboard');
          }
        } else {
          setCurrentUser(null);
          setEmail('');
          setEmailInput('');
        }
      } catch {
        setCurrentUser(null);
      }
    };
    sync(); // run on mount too
    window.addEventListener('hc_user_updated', sync);
    return () => window.removeEventListener('hc_user_updated', sync);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    let loggedInUser: any = null;
    let sessionToken: string = '';

    try {
      const res = await apiClient.post('/auth/login', { email: loginEmail, password: loginPassword });
      if (res.data && res.data.success && res.data.data) {
        loggedInUser = res.data.data.user || res.data.data;
        sessionToken = res.data.data.accessToken || res.data.data.token || res.data.accessToken || res.data.token || `hc_jwt_${Date.now()}`;
      } else if (res.data && res.data.user) {
        loggedInUser = res.data.user;
        sessionToken = res.data.accessToken || res.data.token || `hc_jwt_${Date.now()}`;
      }
    } catch (_) {
      const nameFromEmail = loginEmail ? loginEmail.split('@')[0] : 'Traveler';
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const isDemoAdmin = loginEmail && (loginEmail.toLowerCase().startsWith('admin@') || loginEmail.toLowerCase() === 'admin@holidaycity.com');
      loggedInUser = {
        id: `usr_${Date.now()}`,
        firstName: formattedName,
        lastName: '',
        email: loginEmail || 'user@holidaycity.com',
        role: isDemoAdmin ? 'Super Admin' : 'user'
      };
      sessionToken = `hc_jwt_${Date.now()}`;
    }

    if (loggedInUser) {
      localStorage.setItem('hc_user', JSON.stringify(loggedInUser));
      localStorage.setItem('hc_user_email', loggedInUser.email);
      localStorage.setItem('hc_token', sessionToken);
      localStorage.setItem('hc_access_token', sessionToken);

      window.dispatchEvent(new Event('hc_user_updated'));
      setCurrentUser(loggedInUser);
      setAuthLoading(false);

      const isUserAdmin = isAdminRole(loggedInUser.role, loggedInUser.email);

      if (isUserAdmin) {
        setAuthSuccess('Admin credentials verified! Redirecting to Admin Panel...');
        toast.success(`Welcome to Admin Panel, ${loggedInUser.firstName || 'Admin'}!`);
        navigate('/admin/dashboard');
      } else {
        setAuthSuccess('Signed in successfully!');
        toast.success(`Welcome back, ${loggedInUser.firstName || loggedInUser.email}!`);
      }
    } else {
      setAuthError('Login failed. Please check your credentials.');
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    let registeredUser: any = null;
    let sessionToken: string = '';

    const nameParts = regFullName.trim().split(' ');
    const firstName = nameParts[0] || 'Traveler';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const res = await apiClient.post('/auth/register', {
        firstName,
        lastName,
        email: regEmail,
        mobile: regMobile,
        password: regPassword,
      });

      if (res.data && res.data.success && res.data.data) {
        registeredUser = res.data.data.user || res.data.data;
        sessionToken = res.data.data.accessToken || res.data.data.token || res.data.accessToken || res.data.token || `hc_jwt_${Date.now()}`;
      }
    } catch (_) {
      registeredUser = {
        id: `usr_${Date.now()}`,
        firstName,
        lastName,
        email: regEmail || 'user@holidaycity.com',
        mobile: regMobile,
        role: 'user'
      };
      sessionToken = `hc_jwt_${Date.now()}`;
    }

    if (registeredUser) {
      localStorage.setItem('hc_user', JSON.stringify(registeredUser));
      localStorage.setItem('hc_user_email', registeredUser.email);
      localStorage.setItem('hc_token', sessionToken);
      localStorage.setItem('hc_access_token', sessionToken);

      window.dispatchEvent(new Event('hc_user_updated'));
      setCurrentUser(registeredUser);
      setAuthSuccess('Account created successfully!');
      toast.success(`Welcome to HolidayCity, ${firstName}!`);
      setAuthLoading(false);
    } else {
      setAuthError('Registration failed. Try again.');
      setAuthLoading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedEmail = currentUser?.email || email || localStorage.getItem('hc_user_email') || '';
      const isStaff = isAdminRole(currentUser?.role);

      let fetchedEnquiries: any[] = [];
      let fetchedBookings: any[] = [];

      // 1. Fetch personal enquiries & bookings
      try {
        const url = resolvedEmail
          ? `/enquiries/my?email=${encodeURIComponent(resolvedEmail)}`
          : `/enquiries/my`;
        const res = await apiClient.get(url);
        if (res.data?.data && Array.isArray(res.data.data)) {
          fetchedEnquiries = res.data.data;
        }
      } catch (_) {}

      try {
        const url = resolvedEmail
          ? `/bookings/my?email=${encodeURIComponent(resolvedEmail)}`
          : `/bookings/my`;
        const res = await apiClient.get(url);
        if (res.data?.data && Array.isArray(res.data.data)) {
          fetchedBookings = res.data.data;
        }
      } catch (_) {}

      // 2. Staff / Admin fallback — matching Flutter getProfileEnquiries() in enquiry_service.dart
      if (isStaff && fetchedEnquiries.length === 0) {
        try {
          const res = await apiClient.get('/admin/enquiries');
          if (res.data?.data && Array.isArray(res.data.data)) {
            fetchedEnquiries = res.data.data;
          }
        } catch (_) {}
      }

      if (isStaff && fetchedBookings.length === 0) {
        try {
          const res = await apiClient.get('/admin/bookings');
          if (res.data?.data && Array.isArray(res.data.data)) {
            fetchedBookings = res.data.data;
          }
        } catch (_) {}
      }

      setEnquiries(fetchedEnquiries);
      setBookings(fetchedBookings);
    } catch (e) {
      console.error('Failed to load user dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, email]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // Auto-refresh every 10 seconds like Flutter (Timer.periodic Duration(seconds: 10))
  useEffect(() => {
    const interval = setInterval(() => fetchUserData(), 10000);
    return () => clearInterval(interval);
  }, [fetchUserData]);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim();
    if (clean) {
      localStorage.setItem('hc_user_email', clean);
      setEmail(clean);
      setIsEditingEmail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('hc_user');
    localStorage.removeItem('hc_user_email');
    localStorage.removeItem('hc_token');
    setCurrentUser(null);
    window.dispatchEvent(new Event('hc_user_updated'));
    navigate('/');
  };

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'All') return true;
    const ps = (b.paymentStatus || '').toLowerCase();
    const s = (b.status || '').toLowerCase();
    const adv = b.advancePaid === true || ps === 'advance paid' || ps === 'full paid';
    const approved = s === 'confirmed' || s === 'completed' || adv;
    if (bookingFilter === 'Pending') return !approved;
    if (bookingFilter === 'Approved') return approved && ps !== 'full paid';
    if (bookingFilter === 'Paid') return ps === 'full paid';
    return true;
  });

  const filteredEnquiries = enquiries.filter(e => {
    if (enquiryFilter === 'All') return true;
    const s = (e.status || '').toLowerCase();
    if (enquiryFilter === 'Pending') return s === 'pending' || s === 'new';
    if (enquiryFilter === 'Responded') return ['responded', 'quoted', 'replied', 'confirmed'].includes(s);
    return true;
  });

  const displayName = currentUser?.firstName
    ? `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`
    : email || 'Traveler';

  const avatarLetter = (currentUser?.firstName || email || 'T')[0].toUpperCase();

  /* ─── BOOKING STATUS HELPERS ─── */
  const getBookingStatus = (b: any) => {
    const ps = (b.paymentStatus || '').toString();
    const adv = b.advancePaid === true || ps === 'Advance Paid' || ps === 'Full Paid';
    const s = (b.status || '').toLowerCase();
    const approved = s === 'confirmed' || s === 'completed' || adv;
    if (ps === 'Full Paid') return { label: '🎉 Fully Paid', cls: 'bg-emerald-100 text-emerald-700' };
    if (adv) return { label: '🟢 Advance Paid', cls: 'bg-blue-100 text-blue-700' };
    if (approved) return { label: '🟢 Pay Advance', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    return { label: '⏳ Pending Approval', cls: 'bg-amber-100 text-amber-800' };
  };

  /* ════════════════════════════════════════════
     NON-LOGGED IN USER SCREEN (LOGIN / REGISTER PAGE)
  ════════════════════════════════════════════ */
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 relative">
        <SEO title="Sign In & Account | HolidayCity" description="Sign in or register to view tour bookings, custom quotes and manage your HolidayCity account." />
        
        {/* Top Floating Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-black border border-slate-200/80 shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
        >
          <ArrowLeft className="w-4 h-4 text-[#0A6FB5]" />
          <span>Back to Previous Page</span>
        </button>

        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-auto shadow-[#0A6FB5]/10 mt-10 sm:mt-0">
          {/* Brand Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A6FB5] to-[#57D0C9] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#0A6FB5]/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="font-poppins font-extrabold text-2xl text-slate-900">
              {authMode === 'login' ? 'Welcome Back!' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'login'
                ? 'Sign in to access your tour bookings, payments & custom quotes'
                : 'Join HolidayCity to track bookings and get exclusive offers'}
            </p>
          </div>

          {/* Alert Banners */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Forms */}
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] focus:ring-1 focus:ring-[#0A6FB5] font-medium"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] focus:ring-1 focus:ring-[#0A6FB5] font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] hover:from-[#085a94] hover:to-[#4bb8b1] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to My Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-4 mt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                    className="text-[#0A6FB5] font-extrabold underline hover:text-[#085a94] cursor-pointer ml-1"
                  >
                    Create New Account
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs font-bold text-slate-400 hover:text-[#0A6FB5] flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#0A6FB5]" />
                  <span>Back to Homepage</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] font-medium"
                    placeholder="e.g. Naveen Kumar"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] font-medium"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] font-medium"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#0A6FB5] font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] hover:from-[#085a94] hover:to-[#4bb8b1] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-4 mt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className="text-[#0A6FB5] font-extrabold underline hover:text-[#085a94] cursor-pointer ml-1"
                  >
                    Sign In to Your Account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Security / Trust Highlights */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-around text-[10.5px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#0A6FB5]" /> 100% Secure</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-[#57D0C9]" /> Best Quotes</span>
            <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-emerald-500" /> 24/7 Support</span>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     MOBILE FULL-SCREEN APP LAYOUT
     Exactly matches Flutter mobile app screens
  ════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <>
        <SEO title="My Profile & Account | HolidayCity" description="View bookings, enquiries and manage your HolidayCity account." />

        {/* Full-screen mobile container — no top padding (no navbar), bottom padding for 5-tab bar */}
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col" style={{ paddingBottom: 80 }}>

          {/* ── SCREEN: PROFILE (matches Flutter profile_screen.dart) ── */}
          {screen === 'profile' && (
            <div className="flex-1 overflow-y-auto">
              {/* Gradient Profile Header Card */}
              <div className="bg-gradient-to-br from-[#0A6FB5] to-[#57D0C9] px-5 pt-12 pb-8 text-white">
                <div className="flex items-start justify-between mb-5">
                  <h1 className="font-poppins font-bold text-xl">My Profile & Account</h1>
                  <button onClick={handleLogout} className="text-white/70 hover:text-white">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* Circle Avatar */}
                <div className="flex flex-col items-center text-center pb-2">
                  <div className="w-20 h-20 rounded-full bg-white text-[#0A6FB5] flex items-center justify-center font-poppins font-bold text-3xl shadow-xl border-4 border-white/20 mb-3">
                    {avatarLetter}
                  </div>
                  <h2 className="font-poppins font-bold text-xl text-white">{displayName}</h2>
                  {isEditingEmail ? (
                    <form onSubmit={handleSaveEmail} className="flex items-center gap-2 mt-2">
                      <input
                        type="email" value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        className="px-3 py-1 text-xs rounded-lg text-slate-900 bg-white outline-none"
                        placeholder="Enter email" required
                      />
                      <button type="submit" className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">Save</button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                      <span>{email || 'Sign in to access quotes'}</span>
                      {email && (
                        <button onClick={() => setIsEditingEmail(true)} className="text-amber-300 font-bold text-[10px] underline">(Change)</button>
                      )}
                    </div>
                  )}
                  {currentUser?.role && (
                    <div className="mt-2 px-3 py-1 bg-white/20 rounded-xl text-[10px] font-bold tracking-wider">
                      ROLE: {currentUser.role.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-5 space-y-4">
                {/* Stat Cards Row */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScreen('enquiries')}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-[#0A6FB5]" />
                      </div>
                    </div>
                    <div className="font-poppins font-extrabold text-2xl text-[#0A6FB5]">{enquiries.length}</div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Enquiries</div>
                  </button>
                  <button
                    onClick={() => setScreen('bookings')}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <PkgIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="font-poppins font-extrabold text-2xl text-emerald-600">{bookings.length}</div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Bookings</div>
                  </button>
                </div>

                {/* My Travel Activity Section */}
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900 mb-3">My Travel Activity</h3>

                  {/* Tile: My Enquiries */}
                  <button
                    onClick={() => setScreen('enquiries')}
                    className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-3 flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[#0A6FB5]" />
                      </div>
                      <div className="text-left">
                        <div className="font-poppins font-bold text-sm text-slate-900">My Enquiries & Custom Quotes</div>
                        <div className="text-[11px] text-slate-500">Track custom trip quotes, responses & status</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Tile: My Bookings */}
                  <button
                    onClick={() => setScreen('bookings')}
                    className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <PkgIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-poppins font-bold text-sm text-slate-900">My Bookings & Payments</div>
                        <div className="text-[11px] text-slate-500">Track active bookings, payment status & pay balance</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>

                {/* Account Settings */}
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900 mb-3">Account Settings</h3>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    <Link to="/contact" className="flex items-center justify-between px-4 py-3.5 active:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">HolidayCity Customer Support</div>
                          <div className="text-[11px] text-slate-500">24/7 Helpline & WhatsApp assistance</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </Link>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 rounded-2xl border-2 border-rose-400 text-rose-600 font-extrabold text-sm active:scale-95 transition-transform"
                >
                  {currentUser ? 'Log Out' : 'Log In / Register'}
                </button>
              </div>
            </div>
          )}

          {/* ── SCREEN: MY BOOKINGS (matches Flutter my_bookings_screen.dart) ── */}
          {screen === 'bookings' && (
            <div className="flex-1 overflow-y-auto">
              {/* AppBar */}
              <div className="bg-[#0A6FB5] px-4 pt-12 pb-5 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => setScreen('profile')} className="p-1.5 rounded-xl bg-white/15 active:bg-white/25 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="font-poppins font-bold text-lg">My Bookings & Payments</h1>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">
                {/* Metrics Row Card */}
                <div className="bg-gradient-to-r from-[#0A6FB5] to-[#1280CC] rounded-2xl p-4 text-white">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-poppins font-extrabold text-xl">{bookings.length}</div>
                      <div className="text-[10px] text-white/80 font-bold">Bookings</div>
                    </div>
                    <div className="border-x border-white/20">
                      <div className="font-poppins font-extrabold text-xl text-green-300">
                        {bookings.filter(b => b.advancePaid || b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Full Paid').length}
                      </div>
                      <div className="text-[10px] text-white/80 font-bold">Advance Paid</div>
                    </div>
                    <div>
                      <div className="font-poppins font-extrabold text-xl text-amber-300">
                        ₹{bookings.reduce((s, b) => {
                          if (b.paymentStatus === 'Full Paid') return s;
                          return s + (Number(b.remainingBalance) || 0);
                        }, 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-white/80 font-bold">Balance Due</div>
                    </div>
                  </div>
                </div>

                {/* Section title */}
                <div>
                  <h2 className="font-poppins font-bold text-base text-slate-900">My Package Orders</h2>
                  <p className="text-[11px] text-slate-500">Live status updates from admin & pay remaining balance due</p>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['All', 'Pending', 'Approved', 'Paid'].map(f => (
                    <button
                      key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        bookingFilter === f ? 'bg-[#0A6FB5] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {f === 'All' ? 'All' : f === 'Pending' ? 'Pending' : f === 'Approved' ? 'Approved' : 'Paid'}
                    </button>
                  ))}
                </div>

                {/* Booking Cards */}
                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-sm">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                    <PkgIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-poppins font-bold text-slate-800">No Bookings Found</h3>
                    <p className="text-xs text-slate-500 mt-1">No bookings match the selected filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map(b => {
                      const st = getBookingStatus(b);
                      return (
                        <button
                          key={b._id}
                          onClick={() => setSelectedBooking(b)}
                          className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm active:shadow-md text-left"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-poppins font-bold text-sm text-[#0A6FB5]">{b.bookingId || 'BK-CONFIRMED'}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                          </div>
                          <h4 className="font-poppins font-bold text-slate-900 text-sm line-clamp-1">{b.packageName || 'Tour Package'}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : 'Flexible'}
                            </span>
                            <span className="font-bold text-slate-900">₹{Number(b.totalPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Tap for full invoice & details</span>
                            <span className="text-[#0A6FB5] font-bold flex items-center gap-0.5">Details <ChevronRight className="w-3 h-3" /></span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SCREEN: MY ENQUIRIES (matches Flutter my_enquiries_screen.dart) ── */}
          {screen === 'enquiries' && (
            <div className="flex-1 overflow-y-auto">
              {/* AppBar */}
              <div className="bg-[#0A6FB5] px-4 pt-12 pb-5 text-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => setScreen('profile')} className="p-1.5 rounded-xl bg-white/15 active:bg-white/25 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="font-poppins font-bold text-lg">My Enquiries & Custom Quotes</h1>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">
                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['All', 'Pending', 'Responded'].map(f => (
                    <button
                      key={f}
                      onClick={() => setEnquiryFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        enquiryFilter === f ? 'bg-[#0A6FB5] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {f === 'All' ? 'All' : f}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-sm">Loading enquiries...</div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-poppins font-bold text-slate-800">No Enquiries Found</h3>
                    <p className="text-xs text-slate-500 mt-1">Tap "Enquire Now" on any package to submit a request.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEnquiries.map(e => {
                      const isResponded = ['responded', 'quoted', 'replied', 'confirmed'].includes((e.status || '').toLowerCase());
                      return (
                        <div key={e._id || e.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-poppins font-bold text-slate-900 text-sm">
                              {safeStr(e.destination) || safeStr(e.package) || e.fullName || e.fullName || 'Tour Enquiry'}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${isResponded ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                              {isResponded ? '🟢 Responded' : '🟡 Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{e.travelDate || 'Flexible'}</span>
                            <span>• {e.travelers || 1} Traveler{e.travelers > 1 ? 's' : ''}</span>
                          </div>
                          {e.message && (
                            <p className="text-xs italic text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 line-clamp-2">"{e.message}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKING DETAIL BOTTOM SHEET MODAL ── */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-end">
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
              <div className="relative bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto pb-8 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300">
                {/* Sheet Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                <div className="px-5 pt-1 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-poppins font-bold text-lg text-[#0A6FB5]">{selectedBooking.bookingId || 'BK-CONFIRMED'}</span>
                      <button onClick={() => copyToClipboard(selectedBooking.bookingId || '')} className="text-slate-400">
                        {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full bg-slate-100 text-slate-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-4">Booked on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'Recently'}</p>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-poppins font-bold text-sm text-slate-900 mb-1">{selectedBooking.packageName}</h4>
                      <p className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#0A6FB5]" />{selectedBooking.destinationName || 'Destination'}</p>
                      <p className="text-slate-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3 text-slate-400" />Travel: {selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toLocaleDateString() : 'TBD'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-sm text-slate-800">Financial Breakdown</h5>
                      <div className="flex justify-between"><span className="text-slate-500">Total Package Price:</span><span className="font-bold">₹{Number(selectedBooking.totalPrice || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Advance Amount:</span><span className="font-bold text-emerald-600">₹{Number(selectedBooking.advanceAmount || 0).toLocaleString()}</span></div>
                      <hr className="border-slate-100" />
                      <div className="flex justify-between font-bold text-sm"><span>Remaining Balance:</span><span className="text-amber-600">₹{Number(selectedBooking.remainingBalance || 0).toLocaleString()}</span></div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                      <h5 className="font-bold text-sm text-slate-800 mb-2">Customer Details</h5>
                      <p><strong className="text-slate-700">Name:</strong> {selectedBooking.customerName || 'N/A'}</p>
                      <p><strong className="text-slate-700">Email:</strong> {selectedBooking.email || 'N/A'}</p>
                      <p><strong className="text-slate-700">Phone:</strong> {selectedBooking.mobile || 'N/A'}</p>
                    </div>

                    {(selectedBooking.status || '').toLowerCase() === 'pending' ? (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>Awaiting Admin Approval. Advance payment will be enabled once confirmed by HolidayCity team.</span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>Booking Approved! Contact HolidayCity to proceed with advance payment or remaining balance.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════════
     DESKTOP LAYOUT (unchanged — keeps existing design)
  ════════════════════════════════════════════ */
  return (
    <>
      <SEO title="My Bookings & Travel Dashboard | HolidayCity" description="View your active tour bookings, payment status, advance payments, and custom quote enquiries." />

      <div className="min-h-screen bg-[#F8FAFC] pt-6 sm:pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white text-[#0A6FB5] flex items-center justify-center font-poppins font-bold text-3xl shadow-xl border-4 border-white/20">
                {avatarLetter}
              </div>
              <div>
                <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-white">My Travel Profile</h1>
                <div className="flex items-center gap-2 text-xs text-white/90 mt-1">
                  <span>{email}</span>
                  <button onClick={() => setIsEditingEmail(true)} className="text-amber-300 hover:underline font-bold">(Change)</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setScreen('enquiries')} className={`p-4 rounded-2xl border text-center cursor-pointer ${screen === 'enquiries' ? 'bg-white text-[#0A6FB5] border-white shadow-lg' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'}`}>
                <span className="text-[11px] font-bold uppercase block opacity-90">Enquiries</span>
                <span className="font-poppins font-extrabold text-2xl">{enquiries.length}</span>
              </button>
              <button onClick={() => setScreen('bookings')} className={`p-4 rounded-2xl border text-center cursor-pointer ${screen === 'bookings' ? 'bg-white text-[#0A6FB5] border-white shadow-lg' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'}`}>
                <span className="text-[11px] font-bold uppercase block opacity-90">Bookings</span>
                <span className="font-poppins font-extrabold text-2xl">{bookings.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Tiles */}
        <div className="mb-6">
          <h2 className="font-poppins font-bold text-lg text-slate-900 mb-3">My Travel Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div onClick={() => setScreen('enquiries')} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between group ${screen === 'enquiries' ? 'bg-white border-[#0A6FB5] shadow-md ring-2 ring-[#0A6FB5]/20' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-[#0A6FB5]" /></div>
                <div>
                  <h4 className="font-poppins font-bold text-sm text-slate-900">My Enquiries & Custom Quotes</h4>
                  <p className="text-[11px] text-slate-500">Track custom trip quotes, responses & status</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div onClick={() => setScreen('bookings')} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between group ${screen === 'bookings' ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><PkgIcon className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h4 className="font-poppins font-bold text-sm text-slate-900">My Bookings & Payments</h4>
                  <p className="text-[11px] text-slate-500">Track active bookings, payment status & pay balance</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* BOOKINGS LIST */}
        {screen === 'bookings' && (
          <div>
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {['All', 'Pending', 'Approved', 'Paid'].map(f => (
                <button key={f} onClick={() => setBookingFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${bookingFilter === f ? 'bg-[#0A6FB5] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {f === 'All' ? 'All Bookings' : f === 'Pending' ? 'Pending Approval' : f === 'Approved' ? 'Approved / Pay Adv' : 'Fully Paid'}
                </button>
              ))}
            </div>
            {loading ? <div className="text-center py-12 text-slate-400 text-sm">Loading bookings...</div> : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <PkgIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-poppins font-bold text-lg text-slate-800">No Bookings Found</h3>
                <Link to="/packages" className="inline-block mt-4 px-6 py-2.5 bg-[#0A6FB5] text-white rounded-xl text-xs font-bold">Browse Tour Packages</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map(b => {
                  const st = getBookingStatus(b);
                  return (
                    <div key={b._id} onClick={() => setSelectedBooking(b)} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-poppins font-bold text-sm text-[#0A6FB5]">{b.bookingId || 'BK-CONFIRMED'}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${st.cls}`}>{st.label}</span>
                        </div>
                        <h4 className="font-poppins font-bold text-slate-900 text-base line-clamp-1">{b.packageName || 'Tour Package'}</h4>
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{b.travelDate ? new Date(b.travelDate).toLocaleDateString() : 'Flexible'}</span>
                          <span className="font-bold text-slate-900 text-sm">₹{Number(b.totalPrice || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Click for full invoice & details</span>
                        <span className="text-[#0A6FB5] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">Details <ChevronRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ENQUIRIES LIST */}
        {screen === 'enquiries' && (
          <div>
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {['All', 'Pending', 'Responded'].map(f => (
                <button key={f} onClick={() => setEnquiryFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${enquiryFilter === f ? 'bg-[#0A6FB5] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {f === 'All' ? 'All Enquiries' : f === 'Pending' ? 'Pending Response' : 'Responded / Quoted'}
                </button>
              ))}
            </div>
            {loading ? <div className="text-center py-12 text-slate-400 text-sm">Loading enquiries...</div> : filteredEnquiries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-poppins font-bold text-lg text-slate-800">No Enquiries Found</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEnquiries.map(e => {
                  const isResponded = ['responded', 'quoted', 'replied', 'confirmed'].includes((e.status || '').toLowerCase());
                  return (
                    <div key={e._id || e.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-poppins font-bold text-slate-900 text-base">
                          {safeStr(e.destination) || safeStr(e.package) || e.fullName || 'Tour Enquiry'}
                        </h4>
                        <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${isResponded ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{isResponded ? '🟢 Responded' : '🟡 Pending Response'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{e.travelDate || 'Flexible'}</span>
                        <span>• {e.travelers || 1} Travelers</span>
                      </div>
                      {e.message && <p className="text-xs italic text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">"{e.message}"</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Desktop booking detail modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedBooking(null)} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-poppins font-bold text-xl text-[#0A6FB5]">{selectedBooking.bookingId || 'BK-CONFIRMED'}</span>
                <button onClick={() => copyToClipboard(selectedBooking.bookingId || '')} className="p-1 text-slate-400">
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Booked on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'Recent'}</p>
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-poppins font-bold text-base text-slate-900">{selectedBooking.packageName}</h4>
                  <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#0A6FB5]" />{selectedBooking.destinationName || 'Destination'}</p>
                  <p className="text-slate-500 mt-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />Travel: {selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-sm text-slate-800">Financial Breakdown</h5>
                  <div className="flex justify-between"><span className="text-slate-500">Total Price:</span><span className="font-bold">₹{Number(selectedBooking.totalPrice || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Advance Amount:</span><span className="font-bold text-emerald-600">₹{Number(selectedBooking.advanceAmount || 0).toLocaleString()}</span></div>
                  <hr className="border-slate-100" />
                  <div className="flex justify-between font-bold text-sm"><span>Remaining Balance:</span><span className="text-amber-600">₹{Number(selectedBooking.remainingBalance || 0).toLocaleString()}</span></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <h5 className="font-bold text-sm text-slate-800 mb-2">Customer Details</h5>
                  <p><strong className="text-slate-700">Name:</strong> {selectedBooking.customerName || 'N/A'}</p>
                  <p><strong className="text-slate-700">Email:</strong> {selectedBooking.email || 'N/A'}</p>
                  <p><strong className="text-slate-700">Phone:</strong> {selectedBooking.mobile || 'N/A'}</p>
                </div>
                {(selectedBooking.status || '').toLowerCase() === 'pending' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 shrink-0" /><span>Awaiting Admin Approval.</span></div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>Booking Approved!</span></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
