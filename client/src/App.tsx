import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileStickyBar } from './components/common/MobileStickyBar';
import { FloatingActionWidget } from './components/common/FloatingActionWidget';
import { SplashScreen } from './components/common/SplashScreen';

// Lazy-loaded Desktop Pages
const HomePage = lazy(() => import('./pages/Home/HomePage').then(m => ({ default: m.HomePage })));
const PackageCatalogPage = lazy(() => import('./pages/Packages/PackageCatalogPage').then(m => ({ default: m.PackageCatalogPage })));
const PackageDetailPage = lazy(() => import('./pages/Packages/PackageDetailPage').then(m => ({ default: m.PackageDetailPage })));
const DestinationsLandingPage = lazy(() => import('./pages/Destinations/DestinationsLandingPage').then(m => ({ default: m.DestinationsLandingPage })));
const DestinationDetailPage = lazy(() => import('./pages/Destinations/DestinationDetailPage').then(m => ({ default: m.DestinationDetailPage })));
const AboutPage = lazy(() => import('./pages/About/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogsPage = lazy(() => import('./pages/Blogs/BlogsPage').then(m => ({ default: m.BlogsPage })));
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
        <div className="w-4 h-4 border-2 border-[#0A6FB5] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading HolidayCity...</span>
      </div>
    </div>
  </div>
);

// User dashboard routes — show full-screen app on mobile
const USER_ROUTES = ['/dashboard', '/profile', '/my-bookings', '/my-enquiries'];

export const App: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Real-time mobile detection (< 1024px = lg)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // On mobile → hide ALL website chrome (navbar, footer, FAB, splash)
  // Mobile navigates entirely via bottom tab bar — matches Flutter app
  const isAuthPath = ['/my-bookings', '/profile', '/dashboard', '/my-enquiries', '/login'].some(p => location.pathname.startsWith(p));
  const isUserLoggedIn = (() => {
    try { return !!localStorage.getItem('hc_user') && !!localStorage.getItem('hc_token'); } catch { return false; }
  })();
  const isLoginPage = isAuthPath && !isUserLoggedIn;
  const hideWebChrome = isMobile;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC] text-[#1F2937]">
      {!isAdminRoute && !hideWebChrome && <SplashScreen />}
      {!isAdminRoute && !hideWebChrome && <Navbar />}

      <main className={`flex-1 ${!isAdminRoute && !hideWebChrome && !isLoginPage ? 'pt-[64px]' : ''}`}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ── PUBLIC ROUTES — desktop always, mobile shows mobile-optimised version ── */}
            <Route path="/" element={<HomePage />} />

            {/* Packages */}
            <Route path="/packages" element={isMobile ? <MobilePackagesPage /> : <PackageCatalogPage />} />
            <Route path="/package/:slug" element={isMobile ? <MobilePackageDetailPage /> : <PackageDetailPage />} />

            {/* Destinations */}
            <Route path="/destinations" element={isMobile ? <MobileDestinationsPage /> : <DestinationsLandingPage />} />
            <Route path="/destination/:slug" element={isMobile ? <MobileDestinationDetailPage /> : <DestinationDetailPage />} />

            {/* Themes */}
            <Route path="/themes" element={isMobile ? <MobileThemesPage /> : <ThemeCatalogPage />} />
            <Route path="/theme/:slug" element={isMobile ? <MobileThemeDetailPage /> : <ThemeCatalogPage />} />
            <Route path="/themes/:slug" element={isMobile ? <MobileThemeDetailPage /> : <ThemeCatalogPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/stories" element={<BlogsPage />} />

            {/* ── USER DASHBOARD — full-screen app on mobile, normal page on desktop ── */}
            <Route path="/login" element={<UserDashboardPage />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/profile" element={<UserDashboardPage />} />
            <Route path="/my-bookings" element={<UserDashboardPage />} />
            <Route path="/my-enquiries" element={<UserDashboardPage />} />

            {/* ── ADMIN BACK-OFFICE ── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/admin/bookings" element={<BookingsManagerPage />} />
            <Route path="/admin/leads" element={<LeadManagementPage />} />
            <Route path="/admin/packages" element={<PackageManagerPage />} />
            <Route path="/admin/destinations" element={<DestinationManagerPage />} />
            <Route path="/admin/banners" element={<BannerManagerPage />} />
            <Route path="/admin/cms" element={<CMSManagerPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && !hideWebChrome && <Footer />}
      {!isAdminRoute && !hideWebChrome && <FloatingActionWidget />}

      {/* Bottom tab bar — always visible on mobile non-admin */}
      {!isAdminRoute && <MobileStickyBar />}
    </div>
  );
};
