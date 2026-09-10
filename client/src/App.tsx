import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileStickyBar } from './components/common/MobileStickyBar';
import { FloatingActionWidget } from './components/common/FloatingActionWidget';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { NetworkErrorScreen } from './components/common/NetworkErrorScreen';

// Lazy-loaded Desktop Pages
const HomePage = lazy(() => import('./pages/Home/HomePage').then(m => ({ default: m.HomePage })));
const PackageCatalogPage = lazy(() => import('./pages/Packages/PackageCatalogPage').then(m => ({ default: m.PackageCatalogPage })));
const PackageDetailPage = lazy(() => import('./pages/Packages/PackageDetailPage').then(m => ({ default: m.PackageDetailPage })));
const ActivityCatalogPage = lazy(() => import('./pages/Activities/ActivityCatalogPage').then(m => ({ default: m.ActivityCatalogPage })));
const DestinationsLandingPage = lazy(() => import('./pages/Destinations/DestinationsLandingPage').then(m => ({ default: m.DestinationsLandingPage })));
const DestinationDetailPage = lazy(() => import('./pages/Destinations/DestinationDetailPage').then(m => ({ default: m.DestinationDetailPage })));
const AboutPage = lazy(() => import('./pages/About/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogsPage = lazy(() => import('./pages/Blogs/BlogsPage').then(m => ({ default: m.BlogsPage })));
const BlogDetailPage = lazy(() => import('./pages/Blogs/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const FaqPage = lazy(() => import('./pages/Faq/FaqPage').then(m => ({ default: m.FaqPage })));
const LegalPage = lazy(() => import('./pages/Legal/LegalPage').then(m => ({ default: m.LegalPage })));
const DeleteAccountPage = lazy(() => import('./pages/Legal/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })));
const ThemeCatalogPage = lazy(() => import('./pages/Themes/ThemeCatalogPage').then(m => ({ default: m.ThemeCatalogPage })));
const UserDashboardPage = lazy(() => import('./pages/User/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));

// Lazy-loaded Mobile Pages (Flutter-matched)
const MobilePackagesPage = lazy(() => import('./pages/Packages/MobilePackagesPage').then(m => ({ default: m.MobilePackagesPage })));
const MobilePackageDetailPage = lazy(() => import('./pages/Packages/MobilePackageDetailPage').then(m => ({ default: m.MobilePackageDetailPage })));
const MobileDestinationsPage = lazy(() => import('./pages/Destinations/MobileDestinationsPage').then(m => ({ default: m.MobileDestinationsPage })));
const MobileDestinationDetailPage = lazy(() => import('./pages/Destinations/MobileDestinationDetailPage').then(m => ({ default: m.MobileDestinationDetailPage })));
const MobileThemesPage = lazy(() => import('./pages/Themes/MobileThemesPage').then(m => ({ default: m.MobileThemesPage })));
const MobileThemeDetailPage = lazy(() => import('./pages/Themes/MobileThemeDetailPage').then(m => ({ default: m.MobileThemeDetailPage })));

// Admin Pages
const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./admin/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const LeadManagementPage = lazy(() => import('./admin/pages/LeadManagementPage').then(m => ({ default: m.LeadManagementPage })));
const BookingsManagerPage = lazy(() => import('./admin/pages/BookingsManagerPage').then(m => ({ default: m.BookingsManagerPage })));
const PackageManagerPage = lazy(() => import('./admin/pages/PackageManagerPage').then(m => ({ default: m.PackageManagerPage })));
const ActivityManagerPage = lazy(() => import('./admin/pages/ActivityManagerPage').then(m => ({ default: m.ActivityManagerPage })));
const CategoryManagerPage = lazy(() => import('./admin/pages/CategoryManagerPage').then(m => ({ default: m.CategoryManagerPage })));
const DestinationManagerPage = lazy(() => import('./admin/pages/DestinationManagerPage').then(m => ({ default: m.DestinationManagerPage })));
const BannerManagerPage = lazy(() => import('./admin/pages/BannerManagerPage').then(m => ({ default: m.BannerManagerPage })));
const CMSManagerPage = lazy(() => import('./admin/pages/CMSManagerPage').then(m => ({ default: m.CMSManagerPage })));
const AdminMessagesPage = lazy(() => import('./admin/pages/AdminMessagesPage').then(m => ({ default: m.AdminMessagesPage })));

const PageFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
        <img src="/favicon.png" alt="HolidayCity" className="h-16 w-auto object-contain" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading HolidayCity...</span>
      </div>
    </div>
  </div>
);

// User dashboard routes — show full-screen app on mobile
const USER_ROUTES = ['/dashboard', '/profile', '/my-bookings', '/my-enquiries'];

import { initWebPushNotifications } from './services/firebaseService';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { isOnline, isChecking, checkConnection } = useNetworkStatus();

  const [authVer, setAuthVer] = useState(0);

  useEffect(() => {
    initWebPushNotifications();
    const handleAuthChange = () => setAuthVer((v) => v + 1);
    window.addEventListener('hc_user_updated', handleAuthChange);
    return () => window.removeEventListener('hc_user_updated', handleAuthChange);
  }, []);



  // Real-time viewport width — the mobile page components render below 1024px (lg).
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setVw(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isMobile = vw < 1024;
  // On a tablet (640–1023px) the phone layout would stretch — sit it in a phone-width column.
  const tabletFrame = isMobile && vw >= 640;

  // On mobile → hide ALL website chrome (navbar, footer, FAB, splash)
  // Mobile navigates entirely via bottom tab bar — matches Flutter app
  const isAuthPath = ['/my-bookings', '/profile', '/dashboard', '/my-enquiries', '/login'].some(p => location.pathname.startsWith(p));
  const isUserLoggedIn = (() => {
    try {
      return (
        (!!localStorage.getItem('hc_user') && !!localStorage.getItem('hc_token')) ||
        localStorage.getItem('hc_guest_mode') === 'true' ||
        localStorage.getItem('hc_guest') === 'true'
      );
    } catch {
      return false;
    }
  })();
  const checkIsAdminUser = (): boolean => {
    try {
      const email = (
        localStorage.getItem('hc_user_email') ||
        (() => {
          const raw = localStorage.getItem('hc_user');
          if (!raw) return '';
          const u = JSON.parse(raw);
          return u.email || u.user?.email || '';
        })()
      ).trim().toLowerCase();

      const role = (() => {
        try {
          const raw = localStorage.getItem('hc_user');
          if (!raw) return '';
          const u = JSON.parse(raw);
          return (u.role || u.user?.role || '').toString().trim().toLowerCase();
        } catch { return ''; }
      })();

      return email === 'admin@holidaycity.com' || role === 'admin' || role === 'superadmin' || email.startsWith('admin@');
    } catch {
      return false;
    }
  };

  const isAdmin = checkIsAdminUser();
  const isLoginPage = isAuthPath && !isUserLoggedIn;
  const hideWebChrome = isMobile;
  // Marketing pages (home, packages, destinations, blog, …) are public — show
  // the site chrome for everyone, only hiding it on the bare login screen,
  // admin, and the mobile app shell.
  const showWebChrome = !isAdminRoute && !hideWebChrome && !isLoginPage;

  // Public marketing pages render for everyone. Signed-in admins are sent to
  // the back-office; nobody else is redirected.
  const getPublicRouteElement = (element: React.ReactNode) => {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return element;
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {!isOnline && (
        <NetworkErrorScreen onRetry={checkConnection} isChecking={isChecking} />
      )}
      {showWebChrome && <Navbar />}

      <main
        className={`flex-1 ${showWebChrome ? 'pt-[64px]' : ''} ${
          tabletFrame ? 'mx-auto w-full max-w-[480px] border-x border-line shadow-glass min-h-screen' : ''
        }`}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ── PUBLIC ROUTES — protected with zero-flash render-time redirect ── */}
            <Route path="/" element={getPublicRouteElement(<HomePage />)} />

            {/* Packages */}
            <Route path="/packages" element={getPublicRouteElement(isMobile ? <MobilePackagesPage /> : <PackageCatalogPage />)} />
            <Route path="/package/:slug" element={getPublicRouteElement(isMobile ? <MobilePackageDetailPage /> : <PackageDetailPage />)} />

            {/* Activities */}
            <Route path="/activities" element={getPublicRouteElement(<ActivityCatalogPage />)} />

            {/* Destinations */}
            <Route path="/destinations" element={getPublicRouteElement(isMobile ? <MobileDestinationsPage /> : <DestinationsLandingPage />)} />
            <Route path="/destination/:slug" element={getPublicRouteElement(isMobile ? <MobileDestinationDetailPage /> : <DestinationDetailPage />)} />

            {/* Themes */}
            <Route path="/themes" element={getPublicRouteElement(isMobile ? <MobileThemesPage /> : <ThemeCatalogPage />)} />
            <Route path="/theme/:slug" element={getPublicRouteElement(isMobile ? <MobileThemeDetailPage /> : <ThemeCatalogPage />)} />
            <Route path="/themes/:slug" element={getPublicRouteElement(isMobile ? <MobileThemeDetailPage /> : <ThemeCatalogPage />)} />

            <Route path="/about" element={getPublicRouteElement(<AboutPage />)} />
            <Route path="/contact" element={getPublicRouteElement(<ContactPage />)} />
            <Route path="/blogs" element={getPublicRouteElement(<BlogsPage />)} />
            <Route path="/stories" element={getPublicRouteElement(<BlogsPage />)} />
            <Route path="/blog/:slug" element={getPublicRouteElement(<BlogDetailPage />)} />
            <Route path="/blogs/:slug" element={getPublicRouteElement(<BlogDetailPage />)} />
            <Route path="/faq" element={getPublicRouteElement(<FaqPage />)} />
            {/* Legal pages must be reachable without auth (login link, app stores, Razorpay) */}
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/account-deletion" element={<DeleteAccountPage />} />

            {/* ── USER DASHBOARD — full-screen app on mobile, normal page on desktop ── */}
            <Route path="/login" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <UserDashboardPage />} />
            <Route path="/dashboard" element={getPublicRouteElement(<UserDashboardPage />)} />
            <Route path="/profile" element={getPublicRouteElement(<UserDashboardPage />)} />
            <Route path="/my-bookings" element={getPublicRouteElement(<UserDashboardPage />)} />
            <Route path="/my-enquiries" element={getPublicRouteElement(<UserDashboardPage />)} />

            {/* ── ADMIN BACK-OFFICE ── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/admin/bookings" element={<BookingsManagerPage />} />
            <Route path="/admin/leads" element={<LeadManagementPage />} />
            <Route path="/admin/packages" element={<PackageManagerPage />} />
            <Route path="/admin/activities" element={<ActivityManagerPage />} />
            <Route path="/admin/categories" element={<CategoryManagerPage />} />
            <Route path="/admin/destinations" element={<DestinationManagerPage />} />
            <Route path="/admin/banners" element={<BannerManagerPage />} />
            <Route path="/admin/cms" element={<CMSManagerPage />} />
          </Routes>
        </Suspense>
      </main>

      {showWebChrome && <Footer />}
      {showWebChrome && <FloatingActionWidget />}

      {/* Bottom tab bar — visible on mobile when logged in */}
      {!isAdminRoute && isUserLoggedIn && <MobileStickyBar />}
    </div>
  );
};
