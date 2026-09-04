import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Package as PkgIcon, Calendar, MapPin,
  ChevronRight, X, Copy, Check, MessageSquare,
  AlertCircle, CheckCircle2, LogOut, Settings,
  ArrowLeft, Mail, Lock, Phone, Sparkles, LogIn, UserPlus,
  ShieldCheck, Headphones, Award, Eye, EyeOff,
  Bell, Pencil, Camera, ArrowRight
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SEO } from '../../components/common/SEO';
import { ChatModal } from '../../components/chat/ChatModal';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';

/* Rotating travel imagery behind the sign-in header */
const AUTH_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
];

const AuthHeroCarousel: React.FC = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % AUTH_IMAGES.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 -z-0" aria-hidden="true">
      {AUTH_IMAGES.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            idx === i ? 'opacity-100' : 'opacity-0'
          }`}
          loading={idx === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
      ))}
      {/* ocean tint so it still reads as the blue band + keeps text legible */}
      <div className="absolute inset-0 bg-gradient-to-br from-ocean-900/85 via-ocean-800/80 to-cyan-700/75" />
    </div>
  );
};

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

const getEnquiryCardDetails = (e: any) => {
  const hasPkgObj = typeof e.package === 'object' && e.package !== null && e.package.title;
  const pkgTitle = hasPkgObj
    ? e.package.title
    : (typeof e.package === 'string' && e.package.length > 5 && !e.package.startsWith('6') ? e.package : e.packageName);

  const destName = typeof e.destination === 'object' && e.destination !== null
    ? e.destination.name
    : (e.destinationName || e.preferredDestination || (typeof e.destination === 'string' && e.destination !== 'null' ? e.destination : ''));

  const isPkgEnquiry = Boolean(pkgTitle && pkgTitle !== 'null');

  const title = isPkgEnquiry
    ? pkgTitle
    : (destName ? `Custom Trip Request (${destName})` : 'General Custom Trip Enquiry');

  const badgeText = isPkgEnquiry ? '📦 Package Enquiry' : '🌐 General Trip Enquiry';
  const badgeCls = isPkgEnquiry ? 'bg-ocean-600/10 text-ocean-600 border border-ocean-600/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

  const adults = e.adults || (typeof e.travelers === 'object' ? e.travelers.adults : e.travelers) || 1;
  const children = e.children || (typeof e.travelers === 'object' ? e.travelers.children : 0) || 0;
  const travelersText = `${adults} Adults, ${children} Kids`;

  return { isPkgEnquiry, title, destName, badgeText, badgeCls, travelersText };
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
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Multi-step login: identifier → (password | otp)
  const [loginStep, setLoginStep] = useState<'identifier' | 'password' | 'otp'>('identifier');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpResendIn, setOtpResendIn] = useState(0);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const [regName, setRegName] = useState('');
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
  const [screen, setScreen] = useState<'profile' | 'bookings' | 'enquiries' | 'editProfile' | 'changePassword'>('profile');

  // Edit-profile form (seeded from currentUser when the screen opens)
  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', city: '', language: 'English', currency: 'INR' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [cpForm, setCpForm] = useState({ current: '', next: '', confirm: '' });
  const [cpBusy, setCpBusy] = useState(false);
  const [cpShow, setCpShow] = useState(false);

  const [bookingFilter, setBookingFilter] = useState('All');
  const [enquiryFilter, setEnquiryFilter] = useState('All');

  const [bookings, setBookings] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Chat Topic Modal State
  const [activeChatTopic, setActiveChatTopic] = useState<{
    topicId: string;
    topicType: 'Booking' | 'Enquiry' | 'General';
    topicTitle?: string;
  } | null>(null);

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
        sessionToken = res.data.data.accessToken || res.data.data.token || res.data.accessToken || res.data.token || '';
      } else if (res.data && res.data.user) {
        loggedInUser = res.data.user;
        sessionToken = res.data.accessToken || res.data.token || '';
      }
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err?.response?.data?.message || 'Invalid email or password.');
      return;
    }

    if (loggedInUser && sessionToken) {
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
        navigate('/');
      }
    } else {
      setAuthError('Login failed. Please check your credentials.');
      setAuthLoading(false);
    }
  };

  // Always start the login flow at the identifier step
  useEffect(() => {
    if (!showAuthForm || authMode !== 'login') {
      setLoginStep('identifier');
      setLoginOtp('');
    }
  }, [showAuthForm, authMode]);

  // OTP resend countdown
  useEffect(() => {
    if (otpResendIn <= 0) return;
    const t = setTimeout(() => setOtpResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendIn]);

  const startOtp = (phone: string) => {
    setLoginPhone(phone);
    setLoginOtp('');
    setLoginStep('otp');
    setOtpResendIn(30);
    toast.success(`We sent a 6-digit code to ${phone}`);
  };

  // Step 1 — decide whether the identifier is an email or a phone number
  const handleIdentifierContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const value = loginIdentifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const digits = value.replace(/[\s\-()]/g, '');
    const isPhone = /^\+?\d{8,15}$/.test(digits);

    if (isEmail) {
      setLoginEmail(value);
      setLoginPassword('');
      setLoginStep('password');
    } else if (isPhone) {
      startOtp(digits);
    } else {
      setAuthError('Enter a valid email address or phone number.');
    }
  };

  // Step 2b — verify the OTP (front-end only: no SMS backend yet, any 6 digits pass)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!/^\d{6}$/.test(loginOtp)) {
      setAuthError('Enter the 6-digit code.');
      return;
    }
    setAuthLoading(true);
    const user = {
      id: `usr_${Date.now()}`,
      firstName: 'Traveler',
      lastName: '',
      email: `${loginPhone}@phone.holidaycity`,
      mobile: loginPhone,
      role: 'user',
    };
    const sessionToken = `hc_jwt_${Date.now()}`;
    localStorage.setItem('hc_user', JSON.stringify(user));
    localStorage.setItem('hc_user_email', user.email);
    localStorage.setItem('hc_token', sessionToken);
    localStorage.setItem('hc_access_token', sessionToken);
    window.dispatchEvent(new Event('hc_user_updated'));
    setCurrentUser(user);
    setAuthLoading(false);
    setAuthSuccess('Phone verified — signed in!');
    toast.success('Signed in!');
    navigate('/');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    let registeredUser: any = null;
    let sessionToken: string = '';

    const parts = regName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');

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
        sessionToken = res.data.data.accessToken || res.data.data.token || res.data.accessToken || res.data.token || '';
      }
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err?.response?.data?.message || 'Registration failed. Try again.');
      return;
    }

    if (registeredUser && sessionToken) {
      localStorage.setItem('hc_user', JSON.stringify(registeredUser));
      localStorage.setItem('hc_user_email', registeredUser.email);
      localStorage.setItem('hc_token', sessionToken);
      localStorage.setItem('hc_access_token', sessionToken);

      window.dispatchEvent(new Event('hc_user_updated'));
      setCurrentUser(registeredUser);
      setAuthSuccess('Account created successfully!');
      toast.success(`Welcome to HolidayCity, ${firstName}!`);
      setAuthLoading(false);
      navigate('/');
    } else {
      setAuthError('Registration failed. Try again.');
      setAuthLoading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    const resolvedEmail = currentUser?.email || email || localStorage.getItem('hc_user_email') || '';
    const isStaff = isAdminRole(currentUser?.role);

    // Nothing to fetch for a signed-out visitor — the `my`-scoped endpoints
    // require an identity and would 400. Bail before hitting the network.
    if (!resolvedEmail && !isStaff) {
      setEnquiries([]);
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
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

  // Real-time socket updates listener for instant live sync when Admin updates booking / enquiry
  useRealtimeUpdates({
    onEnquiryUpdate: () => fetchUserData(),
    onDataUpdate: () => fetchUserData()
  });

  // Auto-refresh & live sync listener
  useEffect(() => {
    const handleDataUpdate = () => fetchUserData();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(() => fetchUserData(), 20000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
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

  // Seed the edit form and open the Edit Profile screen.
  const openEditProfile = () => {
    const u = currentUser || {};
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    setEditForm({
      fullName: full || displayName || '',
      mobile: u.mobile || '',
      city: u.city || '',
      language: u.preferences?.language || 'English',
      currency: u.preferences?.currency || 'INR',
    });
    setScreen('editProfile');
  };

  const persistUser = (next: any) => {
    localStorage.setItem('hc_user', JSON.stringify(next));
    if (next.email) localStorage.setItem('hc_user_email', next.email);
    setCurrentUser(next);
    setEmail(next.email || email);
    window.dispatchEvent(new Event('hc_user_updated'));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const parts = editForm.fullName.trim().split(/\s+/).filter(Boolean);
    const payload = {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
      mobile: editForm.mobile.trim(),
      city: editForm.city.trim(),
      language: editForm.language,
      currency: editForm.currency,
    };
    try {
      const res = await apiClient.patch('/auth/me', payload);
      const u = res.data?.data?.user;
      if (u) {
        persistUser({ ...currentUser, ...u });
        toast.success('Profile updated');
        setScreen('profile');
      } else {
        toast.error('Could not update profile');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const up = await apiClient.post('/upload/single', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = up.data?.data?.url || up.data?.url || up.data?.secure_url;
      if (!url) throw new Error('no url');
      const res = await apiClient.patch('/auth/me', { avatar: url });
      const u = res.data?.data?.user;
      persistUser({ ...currentUser, ...(u || { avatar: url }) });
      toast.success('Photo updated');
    } catch {
      toast.error('Could not upload photo');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpForm.next.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (cpForm.next !== cpForm.confirm) { toast.error('Passwords do not match'); return; }
    setCpBusy(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword: cpForm.current, newPassword: cpForm.next });
      toast.success('Password changed');
      setCpForm({ current: '', next: '', confirm: '' });
      setScreen('editProfile');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not change password');
    } finally {
      setCpBusy(false);
    }
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
    const isLogin = authMode === 'login';
    const inputCls =
      'w-full h-12 pl-11 pr-4 rounded-2xl2 bg-white border border-line text-sm text-ink placeholder:text-slate-muted outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition';
    const iconCls = 'w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2';
    const labelCls = 'block text-[0.6875rem] font-black uppercase tracking-wider text-slate-body mb-1.5';

    /* ── MENU VIEW — plain white, shown until the user taps "Login" ── */
    if (!showAuthForm) {
      return (
        <div className="min-h-screen bg-white flex flex-col">
          <SEO title="Account | HolidayCity" description="Sign in or register to view tour bookings, custom quotes and manage your HolidayCity account." />

          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur px-4 h-14 flex items-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to home"
              className="-ml-1.5 w-9 h-9 rounded-full flex items-center justify-center text-slate-body active:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-4 pt-3 pb-28">
            <div className="w-full max-w-md mx-auto space-y-6">

              {/* Hero + primary actions */}
              <div className="rounded-3xl2 bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 text-white p-6 shadow-card">
                <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-black uppercase tracking-widest bg-white/15 rounded-full px-2.5 py-1">
                  <Sparkles className="w-3 h-3" /> HolidayCity
                </span>
                <h1 className="font-display font-black text-2xl leading-tight mt-3">
                  Plan trips. Track quotes.
                </h1>
                <p className="text-sm text-white/85 mt-1.5 leading-relaxed">
                  Sign in to see your bookings, custom itineraries and consultant messages in one place.
                </p>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setShowAuthForm(true); }}
                    className="w-full h-12 rounded-2xl2 bg-white text-ocean-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-raised"
                  >
                    <LogIn className="w-4 h-4" /> Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setShowAuthForm(true); }}
                    className="w-full h-12 rounded-2xl2 bg-white/10 border border-white/25 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
                  >
                    <UserPlus className="w-4 h-4" /> Create account
                  </button>
                </div>
              </div>

              {/* Explore grid */}
              <div>
                <p className="text-[0.6875rem] font-black uppercase tracking-widest text-slate-muted mb-2.5 px-1">Explore HolidayCity</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Offers', desc: 'Curated tour packages', to: '/packages', icon: PkgIcon },
                    { label: 'Destinations', desc: 'Where to go next', to: '/destinations', icon: MapPin },
                    { label: 'Blogs', desc: 'Travel guides & tips', to: '/blogs', icon: MessageSquare },
                    { label: 'About us', desc: 'How we work', to: '/about', icon: Sparkles },
                  ].map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="rounded-2xl2 border border-line p-4 flex flex-col gap-2 active:bg-slate-50 active:scale-[0.98] transition"
                    >
                      <span className="w-9 h-9 rounded-xl2 bg-ocean-600/10 text-ocean-600 flex items-center justify-center">
                        <l.icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-black text-ink">{l.label}</span>
                      <span className="text-[0.6875rem] text-slate-muted font-medium leading-snug">{l.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Help strip */}
              <Link
                to="/contact"
                className="flex items-center gap-3 rounded-2xl2 bg-fill p-4 active:scale-[0.98] transition"
              >
                <span className="w-9 h-9 rounded-xl2 bg-white text-ocean-600 flex items-center justify-center shrink-0 shadow-card">
                  <Headphones className="w-4 h-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-black text-ink">Need help planning?</span>
                  <span className="block text-[0.6875rem] text-slate-muted font-medium">Talk to a travel consultant — no account needed</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-muted shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    /* ── AUTH VIEW — blue hero + white sheet, shown after tapping "Login" ── */
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SEO title="Sign In & Account | HolidayCity" description="Sign in or register to view tour bookings, custom quotes and manage your HolidayCity account." />

        {/* Blue top — travel image carousel behind an ocean tint */}
        <div className="relative overflow-hidden text-white px-6 pt-8 pb-28 min-h-[52vh] flex flex-col">
          <AuthHeroCarousel />

          <button
            type="button"
            onClick={() => {
              setAuthError(''); setAuthSuccess('');
              if (isLogin && loginStep !== 'identifier') { setLoginStep('identifier'); setLoginOtp(''); }
              else { setShowAuthForm(false); }
            }}
            className="relative z-10 self-start inline-flex items-center gap-1.5 h-9 -ml-2 px-2 rounded-full text-white/90 hover:text-white text-xs font-black uppercase tracking-wider active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="relative z-10 mt-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-3xl2 px-6 py-4 shadow-raised">
                <img
                  src="/logo.png"
                  alt="HolidayCity"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="font-display font-black text-[2rem] leading-[1.15] drop-shadow-md">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-white/85 mt-2 max-w-xs">
              {!isLogin ? 'A few details and you’re in.' : ''}
            </p>
          </div>
        </div>

        {/* White body — curved sheet lifting over the blue */}
        <div className="relative flex-1 bg-white -mt-8 rounded-t-[36px] px-6 pt-3 pb-28 sm:pb-10 shadow-[0_-16px_36px_-14px_rgba(6,59,109,0.28)]">
          {/* grab handle */}
          <div className="mx-auto mb-7 h-1.5 w-11 rounded-full bg-slate-200" />

          <div className="w-full max-w-md mx-auto">
            <p className="text-[0.6875rem] font-black uppercase tracking-widest text-ocean-600 mb-5">
              {!isLogin
                ? 'Your details'
                : loginStep === 'password'
                ? 'Enter your password'
                : loginStep === 'otp'
                ? 'Verify your phone'
                : 'Sign in to your account'}
            </p>
            {authError && (
              <div className="mb-4 p-3 rounded-2xl2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-3 rounded-2xl2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {isLogin ? (
              loginStep === 'identifier' ? (
                <form onSubmit={handleIdentifierContinue} className="space-y-5">
                  <div>
                    <label htmlFor="lg-id" className={labelCls}>Phone number or email</label>
                    <div className="relative">
                      <User className={iconCls} />
                      <input id="lg-id" type="text" autoComplete="username" value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)} className={inputCls}
                        required autoFocus />
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full h-12 rounded-2xl2 bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised active:scale-[0.98] transition flex items-center justify-center gap-2">
                    <span>Continue</span><ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-slate-body font-medium text-center pt-2">
                    New here?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-ocean-600 font-black underline underline-offset-2">Create an account</button>
                  </p>
                </form>
              ) : loginStep === 'password' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <input type="text" name="username" autoComplete="username" value={loginEmail} readOnly hidden />
                  <div className="flex items-center gap-2 w-full rounded-2xl2 bg-fill px-3.5 h-12 text-xs font-bold text-ink">
                    <Mail className="w-4 h-4 text-ocean-600 shrink-0" />
                    <span className="flex-1 text-left truncate">{loginEmail}</span>
                    <button type="button"
                      onClick={() => {
                        setLoginIdentifier(loginEmail);
                        setLoginPassword('');
                        setAuthError(''); setAuthSuccess('');
                        setLoginStep('identifier');
                      }}
                      className="text-ocean-600 font-black uppercase tracking-wider px-1 py-1">
                      Edit
                    </button>
                  </div>
                  <div>
                    <label htmlFor="lg-pass" className={labelCls}>Password</label>
                    <div className="relative">
                      <Lock className={iconCls} />
                      <input id="lg-pass" type={showLoginPass ? 'text' : 'password'} autoComplete="current-password" value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)} className={`${inputCls} pr-11`} required autoFocus />
                      <button type="button" onClick={() => setShowLoginPass((v) => !v)}
                        aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-ocean-600 transition">
                        {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={authLoading}
                    className="w-full h-12 rounded-2xl2 bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {authLoading
                      ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in…</span></>)
                      : (<><LogIn className="w-4 h-4" /><span>Sign in</span></>)}
                  </button>
                  <p className="text-xs text-slate-body font-medium text-center pt-2">
                    No account for this email?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setRegEmail(loginEmail); setAuthError(''); setAuthSuccess(''); }}
                      className="text-ocean-600 font-black underline underline-offset-2">Create one</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <input type="text" name="username" autoComplete="username" value={loginPhone} readOnly hidden />
                  <div className="flex items-center gap-2 w-full rounded-2xl2 bg-fill px-3.5 h-12 text-xs font-bold text-ink">
                    <Phone className="w-4 h-4 text-ocean-600 shrink-0" />
                    <span className="flex-1 text-left truncate">{loginPhone}</span>
                    <button type="button"
                      onClick={() => {
                        setLoginIdentifier(loginPhone);
                        setLoginOtp('');
                        setAuthError(''); setAuthSuccess('');
                        setLoginStep('identifier');
                      }}
                      className="text-ocean-600 font-black uppercase tracking-wider px-1 py-1">
                      Change
                    </button>
                  </div>
                  <div>
                    <label htmlFor="lg-otp" className={labelCls}>6-digit code</label>
                    <input id="lg-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full h-14 rounded-2xl2 bg-white border border-line text-center text-2xl font-black tracking-[0.5em] text-ink outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/20 transition"
                      placeholder="••••••" required autoFocus />
                  </div>
                  <button type="submit" disabled={authLoading}
                    className="w-full h-12 rounded-2xl2 bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {authLoading
                      ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying…</span></>)
                      : (<><ShieldCheck className="w-4 h-4" /><span>Verify &amp; sign in</span></>)}
                  </button>
                  <p className="text-xs text-slate-body font-medium text-center pt-2">
                    Didn’t get it?{' '}
                    {otpResendIn > 0 ? (
                      <span className="text-slate-muted font-bold">Resend in {otpResendIn}s</span>
                    ) : (
                      <button type="button" onClick={() => startOtp(loginPhone)}
                        className="text-ocean-600 font-black underline underline-offset-2">Resend code</button>
                    )}
                  </p>
                </form>
              )
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <input type="text" name="username" autoComplete="username" value={regEmail} readOnly hidden />
                <div>
                  <label htmlFor="rg-name" className={labelCls}>Full name</label>
                  <div className="relative">
                    <User className={iconCls} />
                    <input id="rg-name" type="text" autoComplete="name" value={regName}
                      onChange={(e) => setRegName(e.target.value)} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="rg-email" className={labelCls}>Email address</label>
                  <div className="relative">
                    <Mail className={iconCls} />
                    <input id="rg-email" type="email" autoComplete="email" value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="rg-mobile" className={labelCls}>Mobile number</label>
                  <div className="relative">
                    <Phone className={iconCls} />
                    <input id="rg-mobile" type="tel" autoComplete="tel" value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="rg-pass" className={labelCls}>Password</label>
                  <div className="relative">
                    <Lock className={iconCls} />
                    <input id="rg-pass" type={showRegPass ? 'text' : 'password'} autoComplete="new-password" value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)} className={`${inputCls} pr-11`} required />
                    <button type="button" onClick={() => setShowRegPass((v) => !v)}
                      aria-label={showRegPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-ocean-600 transition">
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={authLoading}
                  className="w-full h-12 rounded-2xl2 bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-card hover:shadow-raised active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {authLoading
                    ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Creating…</span></>)
                    : (<><UserPlus className="w-4 h-4" /><span>Create account</span></>)}
                </button>
                <p className="text-xs text-slate-body font-medium text-center pt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className="text-ocean-600 font-black underline underline-offset-2">Sign in</button>
                </p>
              </form>
            )}

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

          {/* ── SCREEN: PROFILE ── */}
          {screen === 'profile' && (
            <div className="flex-1 overflow-y-auto bg-canvas">
              {/* Blue header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-5 pt-12 pb-14 rounded-b-[32px] shadow-[0_20px_40px_-18px_rgba(6,59,109,0.5)] text-white">
                <div aria-hidden className="pointer-events-none absolute -top-16 -right-12 w-52 h-52 rounded-full bg-aqua-500/25 blur-3xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-display font-black text-2xl leading-tight">My Profile &amp; Account</h1>
                    <p className="text-sm text-white/75 mt-1">Manage your account, bookings and preferences.</p>
                  </div>
                </div>
              </div>

              <div className="px-4 -mt-8 pb-6 space-y-4">
                {/* Identity card — matching exact design system spec */}
                <div className="animate-fade-up bg-white rounded-3xl overflow-hidden shadow-card border border-slate-200/60" style={{ animationDelay: '0ms' }}>
                  {/* Top soft blue gradient header */}
                  <div className="relative bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-blue-100/40 p-5 overflow-hidden">
                    {/* Background subtle curve graphic */}
                    <div aria-hidden="true" className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-sky-200/30 blur-2xl pointer-events-none" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {currentUser?.avatar ? (
                          <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-4 border-white shadow-md" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-sky-100 text-ocean-600 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="font-display font-black text-xl text-slate-900 truncate tracking-tight">{displayName}</h2>
                          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{email || 'No email set'}</p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 text-emerald-700 px-3 py-1 text-[0.6875rem] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white shrink-0" />
                            <span>VERIFIED</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit Profile CTA Button */}
                      <button
                        onClick={openEditProfile}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-ocean-600 px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-ocean-600" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom details section (Phone & Address) */}
                  <div className="bg-white p-4 space-y-3">
                    <div onClick={openEditProfile} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 text-ocean-600 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
                        <Phone className="w-5 h-5 text-ocean-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-400">Phone Number</p>
                        <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">{currentUser?.mobile || '9515694155'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="border-t border-slate-100" />

                    <div onClick={openEditProfile} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 text-ocean-600 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
                        <MapPin className="w-5 h-5 text-ocean-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-400">Address</p>
                        <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">{currentUser?.city || 'Add address'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Enquiries', n: enquiries.length, icon: MessageSquare, tint: 'bg-ocean-600/10 text-ocean-600', go: () => setScreen('enquiries'), cta: 'View Enquiries' },
                    { label: 'Bookings', n: bookings.length, icon: PkgIcon, tint: 'bg-emerald-500/10 text-emerald-600', go: () => setScreen('bookings'), cta: 'View Bookings' },
                  ].map((s, i) => (
                    <div key={s.label} className="animate-fade-up bg-white rounded-2xl2 shadow-card p-4" style={{ animationDelay: `${70 + i * 60}ms` }}>
                      <span className={`w-9 h-9 rounded-xl2 grid place-items-center ${s.tint}`}>
                        <s.icon className="w-4 h-4" />
                      </span>
                      <div className="mt-3 font-display font-black text-3xl text-ink leading-none tabular-nums">{s.n}</div>
                      <div className="mt-1 text-[0.625rem] font-black uppercase tracking-widest text-slate-muted">{s.label}</div>
                      <button onClick={s.go} className="mt-2.5 inline-flex items-center gap-1 text-ocean-600 text-xs font-black">
                        {s.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* My Travel Activity */}
                <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                  <h2 className="px-1 mb-2.5 font-display font-black text-[0.9375rem] text-ink">My Travel Activity</h2>
                  <div className="bg-white rounded-2xl2 shadow-card divide-y divide-line overflow-hidden">
                    {[
                      { label: 'My Enquiries & Custom Quotes', desc: 'Trip quotes, responses & status', icon: MessageSquare, tint: 'bg-ocean-600/10 text-ocean-600', go: () => setScreen('enquiries') },
                      { label: 'My Bookings & Payments', desc: 'Active bookings, payment status & balance', icon: PkgIcon, tint: 'bg-emerald-500/10 text-emerald-600', go: () => setScreen('bookings') },
                    ].map((t) => (
                      <button
                        key={t.label} onClick={t.go}
                        className="group w-full flex items-center gap-3.5 px-4 py-4 text-left transition active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-600/40 focus-visible:bg-slate-50"
                      >
                        <span className={`w-11 h-11 rounded-2xl2 grid place-items-center shrink-0 ${t.tint}`}>
                          <t.icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-display font-black text-sm text-ink">{t.label}</span>
                          <span className="block text-[0.6875rem] text-slate-muted truncate mt-0.5">{t.desc}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-faint shrink-0 transition-transform group-active:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div className="animate-fade-up" style={{ animationDelay: '260ms' }}>
                  <h2 className="px-1 mb-2.5 font-display font-black text-[0.9375rem] text-ink">Account</h2>
                  <div className="bg-white rounded-2xl2 shadow-card divide-y divide-line overflow-hidden">
                    <Link to="/contact" className="w-full flex items-center gap-3.5 px-4 py-4 transition active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-600/40 focus-visible:bg-slate-50">
                      <span className="w-11 h-11 rounded-2xl2 bg-ocean-600/10 text-ocean-600 grid place-items-center shrink-0">
                        <Headphones className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-display font-black text-sm text-ink">Customer Support</span>
                        <span className="block text-[0.6875rem] text-slate-muted mt-0.5">Help center &amp; WhatsApp assistance</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-faint shrink-0" />
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3.5 px-4 py-4 text-left transition active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-600/40 focus-visible:bg-slate-50">
                      <span className="w-11 h-11 rounded-2xl2 bg-rose-50 text-rose-600 grid place-items-center shrink-0">
                        <LogOut className="w-5 h-5" />
                      </span>
                      <span className="flex-1 font-display font-black text-sm text-rose-600">{currentUser ? 'Log out' : 'Log in / Register'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SCREEN: EDIT PROFILE ── */}
          {screen === 'editProfile' && (
            <div className="flex-1 overflow-y-auto bg-canvas">
              <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 pt-12 pb-6 rounded-b-[28px] text-white flex items-center gap-3">
                <button onClick={() => setScreen('profile')} aria-label="Back" className="w-9 h-9 rounded-xl bg-white/15 grid place-items-center active:bg-white/25 transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-black text-lg">Edit Profile</h1>
              </div>

              <form onSubmit={handleUpdateProfile} className="px-4 py-5 space-y-7 pb-28">
                {/* Photo */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-ocean-100 text-ocean-500 grid place-items-center">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <label htmlFor="ep-avatar" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ink text-white grid place-items-center cursor-pointer shadow-card">
                      {avatarBusy
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera className="w-3.5 h-3.5" />}
                    </label>
                    <input id="ep-avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-black text-sm text-ink">Profile Photo</p>
                    <p className="text-[0.6875rem] text-slate-muted">JPG, PNG up to 5MB</p>
                    <label htmlFor="ep-avatar" className="mt-2 inline-flex items-center rounded-2xl2 bg-ocean-600 text-white px-4 h-9 text-xs font-black cursor-pointer active:scale-95 transition">
                      Change Photo
                    </label>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h2 className="font-display font-black text-[0.9375rem] text-ink mb-3">Personal Information</h2>
                  <div className="space-y-3">
                    <div className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                      <label htmlFor="ep-name" className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">Full Name</label>
                      <input id="ep-name" type="text" value={editForm.fullName} onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                        className="w-full bg-transparent outline-none text-sm text-ink py-0.5" required />
                    </div>

                    <div className="rounded-2xl2 border border-line bg-fill px-4 pt-2 pb-2.5">
                      <label className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">Email</label>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-slate-body py-0.5 truncate">{email || '—'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[0.5625rem] font-black uppercase tracking-wider shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" /> Verified
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                      <label htmlFor="ep-phone" className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">Phone Number</label>
                      <input id="ep-phone" type="tel" value={editForm.mobile} onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                        className="w-full bg-transparent outline-none text-sm text-ink py-0.5" />
                    </div>

                    <div className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                      <label htmlFor="ep-city" className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">City</label>
                      <input id="ep-city" type="text" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="Enter your city" className="w-full bg-transparent outline-none text-sm text-ink py-0.5 placeholder:text-slate-faint" />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h2 className="font-display font-black text-[0.9375rem] text-ink mb-3">Security</h2>
                  <button type="button" onClick={() => setScreen('changePassword')}
                    className="w-full bg-white rounded-2xl2 shadow-card px-4 py-4 flex items-center gap-3 text-left active:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-600/40">
                    <span className="w-10 h-10 rounded-2xl2 bg-ocean-600/10 text-ocean-600 grid place-items-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-display font-black text-sm text-ink">Change Password</span>
                      <span className="block text-[0.6875rem] text-slate-muted mt-0.5">Update your account password</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-faint shrink-0" />
                  </button>
                </div>

                {/* Preferences */}
                <div>
                  <h2 className="font-display font-black text-[0.9375rem] text-ink mb-3">Preferences</h2>
                  <div className="space-y-3">
                    <div className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                      <label htmlFor="ep-lang" className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">Preferred Language</label>
                      <select id="ep-lang" value={editForm.language} onChange={(e) => setEditForm(f => ({ ...f, language: e.target.value }))}
                        className="w-full bg-transparent outline-none text-sm text-ink py-0.5 -ml-0.5">
                        {['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                      <label htmlFor="ep-cur" className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">Currency</label>
                      <select id="ep-cur" value={editForm.currency} onChange={(e) => setEditForm(f => ({ ...f, currency: e.target.value }))}
                        className="w-full bg-transparent outline-none text-sm text-ink py-0.5 -ml-0.5">
                        {[['INR', 'INR - Indian Rupee (₹)'], ['USD', 'USD - US Dollar ($)'], ['EUR', 'EUR - Euro (€)'], ['GBP', 'GBP - Pound (£)'], ['AED', 'AED - Dirham (د.إ)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <button type="submit" disabled={savingProfile}
                    className="w-full h-12 rounded-2xl2 bg-ocean-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50">
                    {savingProfile
                      ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>)
                      : (<><Check className="w-4 h-4" /><span>Save Changes</span></>)}
                  </button>
                  <button type="button" onClick={() => setScreen('profile')}
                    className="w-full h-12 rounded-2xl2 border border-line text-ocean-600 font-black text-xs uppercase tracking-wider active:scale-[0.98] transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SCREEN: CHANGE PASSWORD ── */}
          {screen === 'changePassword' && (
            <div className="flex-1 overflow-y-auto bg-canvas">
              <div className="bg-gradient-to-br from-ocean-800 via-ocean-700 to-cyan-700 px-4 pt-12 pb-6 rounded-b-[28px] text-white flex items-center gap-3">
                <button onClick={() => setScreen('editProfile')} aria-label="Back" className="w-9 h-9 rounded-xl bg-white/15 grid place-items-center active:bg-white/25 transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-black text-lg">Change Password</h1>
              </div>

              <form onSubmit={handleChangePassword} className="px-4 py-5 space-y-3 pb-28">
                {([
                  ['current', 'Current Password', 'current-password'],
                  ['next', 'New Password', 'new-password'],
                  ['confirm', 'Confirm New Password', 'new-password'],
                ] as const).map(([key, label, ac]) => (
                  <div key={key} className="rounded-2xl2 border border-line bg-white px-4 pt-2 pb-2.5 focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-600/15 transition">
                    <label htmlFor={`cp-${key}`} className="block text-[0.625rem] font-black uppercase tracking-wider text-slate-muted">{label}</label>
                    <div className="flex items-center gap-2">
                      <input id={`cp-${key}`} type={cpShow ? 'text' : 'password'} autoComplete={ac}
                        value={cpForm[key]} onChange={(e) => setCpForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-transparent outline-none text-sm text-ink py-0.5" required />
                      {key === 'current' && (
                        <button type="button" onClick={() => setCpShow(v => !v)} aria-label={cpShow ? 'Hide' : 'Show'} className="text-slate-muted shrink-0">
                          {cpShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-[0.6875rem] text-slate-muted px-1">Use at least 6 characters.</p>

                <div className="space-y-2.5 pt-1">
                  <button type="submit" disabled={cpBusy}
                    className="w-full h-12 rounded-2xl2 bg-ocean-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50">
                    {cpBusy
                      ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Updating…</span></>)
                      : (<><ShieldCheck className="w-4 h-4" /><span>Update Password</span></>)}
                  </button>
                  <button type="button" onClick={() => setScreen('editProfile')}
                    className="w-full h-12 rounded-2xl2 border border-line text-ocean-600 font-black text-xs uppercase tracking-wider active:scale-[0.98] transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SCREEN: MY BOOKINGS (matches Flutter my_bookings_screen.dart) ── */}
          {screen === 'bookings' && (
            <div className="flex-1 overflow-y-auto">
              {/* AppBar */}
              <div className="bg-ocean-600 px-4 pt-12 pb-5 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => setScreen('profile')} className="p-1.5 rounded-xl bg-white/15 active:bg-white/25 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="font-poppins font-bold text-lg">My Bookings & Payments</h1>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">
                {/* Metrics Row Card */}
                <div className="bg-gradient-to-r from-ocean-600 to-[#1280CC] rounded-2xl p-4 text-white">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-poppins font-extrabold text-xl">{bookings.length}</div>
                      <div className="text-[0.6875rem] text-white/80 font-bold">Bookings</div>
                    </div>
                    <div className="border-x border-white/20">
                      <div className="font-poppins font-extrabold text-xl text-green-300">
                        {bookings.filter(b => b.advancePaid || b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Full Paid').length}
                      </div>
                      <div className="text-[0.6875rem] text-white/80 font-bold">Advance Paid</div>
                    </div>
                    <div>
                      <div className="font-poppins font-extrabold text-xl text-amber-300">
                        ₹{bookings.reduce((s, b) => {
                          if (b.paymentStatus === 'Full Paid') return s;
                          return s + (Number(b.remainingBalance) || 0);
                        }, 0).toLocaleString()}
                      </div>
                      <div className="text-[0.6875rem] text-white/80 font-bold">Balance Due</div>
                    </div>
                  </div>
                </div>

                {/* Section title */}
                <div>
                  <h2 className="font-poppins font-bold text-base text-slate-900">My Package Orders</h2>
                  <p className="text-[0.6875rem] text-slate-500">Live status updates from admin & pay remaining balance due</p>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['All', 'Pending', 'Approved', 'Paid'].map(f => (
                    <button
                      key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        bookingFilter === f ? 'bg-ocean-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
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
                            <span className="font-poppins font-bold text-sm text-ocean-600">{b.bookingId || 'BK-CONFIRMED'}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[0.6875rem] font-bold ${st.cls}`}>{st.label}</span>
                          </div>
                          <h4 className="font-poppins font-bold text-slate-900 text-sm line-clamp-1">{b.packageName || 'Tour Package'}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : 'Flexible'}
                            </span>
                            <span className="font-bold text-slate-900">₹{Number(b.totalPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[0.6875rem]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveChatTopic({
                                  topicId: b.bookingId || 'BK-CONFIRMED',
                                  topicType: 'Booking',
                                  topicTitle: b.packageName || ''
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-ocean-600 font-extrabold flex items-center gap-1 transition-colors cursor-pointer border border-sky-100"
                            >
                              <MessageSquare className="w-3 h-3 text-ocean-600" />
                              <span>Chat Admin</span>
                            </button>

                            <span className="text-ocean-600 font-bold flex items-center gap-0.5">Details <ChevronRight className="w-3 h-3" /></span>
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
              <div className="bg-ocean-600 px-4 pt-12 pb-5 text-white">
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
                        enquiryFilter === f ? 'bg-ocean-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
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
                      const { isPkgEnquiry, title, badgeText, badgeCls, travelersText } = getEnquiryCardDetails(e);
                      const isResponded = ['responded', 'quoted', 'replied', 'confirmed'].includes((e.status || '').toLowerCase());
                      return (
                        <div key={e._id || e.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[0.6875rem] font-extrabold mb-1 ${badgeCls}`}>
                                {badgeText}
                              </span>
                              <h4 className="font-poppins font-bold text-slate-900 text-sm leading-snug">
                                {title}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[0.6875rem] font-bold shrink-0 ${isResponded ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                              {isResponded ? '🟢 Responded' : '🟡 Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {e.travelDate ? (new Date(e.travelDate).toString() !== 'Invalid Date' ? new Date(e.travelDate).toLocaleDateString() : e.travelDate) : 'Flexible'}
                            </span>
                            <span>• {travelersText}</span>
                          </div>

                          {e.message && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">"{e.message}"</p>
                          )}

                          {(e.adminResponse || e.adminNotes) && (
                            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900">
                              <strong className="block text-[0.6875rem] text-ocean-600 uppercase font-black">Admin Response / Quote:</strong>
                              <span>{e.adminResponse || e.adminNotes}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChatTopic({
                                  topicId: e.enquiryId || e.id || 'HC-ENQUIRY',
                                  topicType: 'Enquiry',
                                  topicTitle: title
                                });
                              }}
                              className="px-3 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-ocean-600 font-extrabold text-[0.6875rem] flex items-center gap-1.5 transition-colors cursor-pointer border border-cyan-100"
                            >
                              <MessageSquare className="w-3 h-3 text-ocean-600" />
                              <span>Chat with Admin</span>
                            </button>
                          </div>
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
                      <span className="font-poppins font-bold text-lg text-ocean-600">{selectedBooking.bookingId || 'BK-CONFIRMED'}</span>
                      <button onClick={() => copyToClipboard(selectedBooking.bookingId || '')} className="text-slate-400">
                        {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full bg-slate-100 text-slate-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[0.6875rem] text-slate-400 mb-4">Booked on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'Recently'}</p>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-poppins font-bold text-sm text-slate-900 mb-1">{selectedBooking.packageName}</h4>
                      <p className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-ocean-600" />{selectedBooking.destinationName || 'Destination'}</p>
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
        <div className="bg-gradient-to-r from-ocean-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white text-ocean-600 flex items-center justify-center font-poppins font-bold text-3xl shadow-xl border-4 border-white/20">
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
              <button onClick={() => setScreen('enquiries')} className={`p-4 rounded-2xl border text-center cursor-pointer ${screen === 'enquiries' ? 'bg-white text-ocean-600 border-white shadow-lg' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'}`}>
                <span className="text-[0.6875rem] font-bold uppercase block opacity-90">Enquiries</span>
                <span className="font-poppins font-extrabold text-2xl">{enquiries.length}</span>
              </button>
              <button onClick={() => setScreen('bookings')} className={`p-4 rounded-2xl border text-center cursor-pointer ${screen === 'bookings' ? 'bg-white text-ocean-600 border-white shadow-lg' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'}`}>
                <span className="text-[0.6875rem] font-bold uppercase block opacity-90">Bookings</span>
                <span className="font-poppins font-extrabold text-2xl">{bookings.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Tiles */}
        <div className="mb-6">
          <h2 className="font-poppins font-bold text-lg text-slate-900 mb-3">My Travel Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div onClick={() => setScreen('enquiries')} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between group ${screen === 'enquiries' ? 'bg-white border-ocean-600 shadow-md ring-2 ring-ocean-600/20' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-ocean-600" /></div>
                <div>
                  <h4 className="font-poppins font-bold text-sm text-slate-900">My Enquiries & Custom Quotes</h4>
                  <p className="text-[0.6875rem] text-slate-500">Track custom trip quotes, responses & status</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div onClick={() => setScreen('bookings')} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between group ${screen === 'bookings' ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><PkgIcon className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h4 className="font-poppins font-bold text-sm text-slate-900">My Bookings & Payments</h4>
                  <p className="text-[0.6875rem] text-slate-500">Track active bookings, payment status & pay balance</p>
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
                <button key={f} onClick={() => setBookingFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${bookingFilter === f ? 'bg-ocean-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {f === 'All' ? 'All Bookings' : f === 'Pending' ? 'Pending Approval' : f === 'Approved' ? 'Approved / Pay Adv' : 'Fully Paid'}
                </button>
              ))}
            </div>
            {loading ? <div className="text-center py-12 text-slate-400 text-sm">Loading bookings...</div> : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <PkgIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-poppins font-bold text-lg text-slate-800">No Bookings Found</h3>
                <Link to="/packages" className="inline-block mt-4 px-6 py-2.5 bg-ocean-600 text-white rounded-xl text-xs font-bold">Browse Tour Packages</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map(b => {
                  const st = getBookingStatus(b);
                  return (
                    <div key={b._id} onClick={() => setSelectedBooking(b)} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-poppins font-bold text-sm text-ocean-600">{b.bookingId || 'BK-CONFIRMED'}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-bold ${st.cls}`}>{st.label}</span>
                        </div>
                        <h4 className="font-poppins font-bold text-slate-900 text-base line-clamp-1">{b.packageName || 'Tour Package'}</h4>
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{b.travelDate ? new Date(b.travelDate).toLocaleDateString() : 'Flexible'}</span>
                          <span className="font-bold text-slate-900 text-sm">₹{Number(b.totalPrice || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatTopic({
                              topicId: b.bookingId || 'BK-CONFIRMED',
                              topicType: 'Booking',
                              topicTitle: b.packageName || ''
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-ocean-600 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-sky-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-ocean-600" />
                          <span>Chat with Admin</span>
                        </button>
                        <span className="text-ocean-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">Details <ChevronRight className="w-3.5 h-3.5" /></span>
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
                <button key={f} onClick={() => setEnquiryFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${enquiryFilter === f ? 'bg-ocean-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
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
                  const { isPkgEnquiry, title, badgeText, badgeCls, travelersText } = getEnquiryCardDetails(e);
                  const isResponded = ['responded', 'quoted', 'replied', 'confirmed'].includes((e.status || '').toLowerCase());
                  return (
                    <div key={e._id || e.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[0.6875rem] font-extrabold mb-1.5 ${badgeCls}`}>
                            {badgeText}
                          </span>
                          <h4 className="font-poppins font-bold text-slate-900 text-base leading-snug">
                            {title}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-bold shrink-0 ${isResponded ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                          {isResponded ? '🟢 Responded' : '🟡 Pending Response'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {e.travelDate ? (new Date(e.travelDate).toString() !== 'Invalid Date' ? new Date(e.travelDate).toLocaleDateString() : e.travelDate) : 'Flexible'}
                        </span>
                        <span>• {travelersText}</span>
                      </div>

                      {e.message && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">"{e.message}"</p>
                      )}

                      {(e.adminResponse || e.adminNotes) && (
                        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900">
                          <strong className="block text-[0.6875rem] text-ocean-600 uppercase font-black mb-0.5">Admin Response / Quote:</strong>
                          <span>{e.adminResponse || e.adminNotes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatTopic({
                              topicId: e.enquiryId || e.id || 'HC-ENQUIRY',
                              topicType: 'Enquiry',
                              topicTitle: title
                            });
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-ocean-600 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-cyan-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-ocean-600" />
                          <span>Chat with Admin</span>
                        </button>
                      </div>
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
                <span className="font-poppins font-bold text-xl text-ocean-600">{selectedBooking.bookingId || 'BK-CONFIRMED'}</span>
                <button onClick={() => copyToClipboard(selectedBooking.bookingId || '')} className="p-1 text-slate-400">
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Booked on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'Recent'}</p>
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-poppins font-bold text-base text-slate-900">{selectedBooking.packageName}</h4>
                  <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-ocean-600" />{selectedBooking.destinationName || 'Destination'}</p>
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
        {/* Chat Modal Renderer */}
        <ChatModal
          isOpen={!!activeChatTopic}
          onClose={() => setActiveChatTopic(null)}
          topicId={activeChatTopic?.topicId || ''}
          topicType={activeChatTopic?.topicType || 'Booking'}
          topicTitle={activeChatTopic?.topicTitle || ''}
          customerName={displayName || currentUser?.firstName || currentUser?.name || 'Naveen Kumar'}
          customerEmail={email || currentUser?.email || 'naveenkumar@gmail.com'}
        />
      </div>
    </>
  );
};
