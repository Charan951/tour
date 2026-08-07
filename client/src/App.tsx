import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileStickyBar } from './components/common/MobileStickyBar';
import { FloatingActionWidget } from './components/common/FloatingActionWidget';

// Route-Level Lazy Loading matching optimisation.md Section 3.1
const HomePage = lazy(() => import('./pages/Home/HomePage').then(m => ({ default: m.HomePage })));
const PackageCatalogPage = lazy(() => import('./pages/Packages/PackageCatalogPage').then(m => ({ default: m.PackageCatalogPage })));
const PackageDetailPage = lazy(() => import('./pages/Packages/PackageDetailPage').then(m => ({ default: m.PackageDetailPage })));
const DestinationsLandingPage = lazy(() => import('./pages/Destinations/DestinationsLandingPage').then(m => ({ default: m.DestinationsLandingPage })));
const DestinationDetailPage = lazy(() => import('./pages/Destinations/DestinationDetailPage').then(m => ({ default: m.DestinationDetailPage })));
const AboutPage = lazy(() => import('./pages/About/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogsPage = lazy(() => import('./pages/Blogs/BlogsPage').then(m => ({ default: m.BlogsPage })));
const ThemeCatalogPage = lazy(() => import('./pages/Themes/ThemeCatalogPage').then(m => ({ default: m.ThemeCatalogPage })));

const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./admin/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const LeadManagementPage = lazy(() => import('./admin/pages/LeadManagementPage').then(m => ({ default: m.LeadManagementPage })));
const PackageManagerPage = lazy(() => import('./admin/pages/PackageManagerPage').then(m => ({ default: m.PackageManagerPage })));
const DestinationManagerPage = lazy(() => import('./admin/pages/DestinationManagerPage').then(m => ({ default: m.DestinationManagerPage })));
const BannerManagerPage = lazy(() => import('./admin/pages/BannerManagerPage').then(m => ({ default: m.BannerManagerPage })));
const CMSManagerPage = lazy(() => import('./admin/pages/CMSManagerPage').then(m => ({ default: m.CMSManagerPage })));

import { SplashScreen } from './components/common/SplashScreen';

const PageFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
        <img src="/favicon.png" alt="HolidayCity Emblem" className="h-16 w-auto object-contain" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-[#0A6FB5] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading HolidayCity...</span>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FCFCFC] text-[#1F2937]">
      {!isAdminRoute && <SplashScreen />}
      {!isAdminRoute && <Navbar />}

      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/packages" element={<PackageCatalogPage />} />
            <Route path="/package/:slug" element={<PackageDetailPage />} />
            <Route path="/destinations" element={<DestinationsLandingPage />} />
            <Route path="/destination/:slug" element={<DestinationDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/stories" element={<BlogsPage />} />
            <Route path="/themes" element={<ThemeCatalogPage />} />

            {/* Admin Back-Office Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/leads" element={<LeadManagementPage />} />
            <Route path="/admin/packages" element={<PackageManagerPage />} />
            <Route path="/admin/destinations" element={<DestinationManagerPage />} />
            <Route path="/admin/banners" element={<BannerManagerPage />} />
            <Route path="/admin/cms" element={<CMSManagerPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingActionWidget />}
      {!isAdminRoute && <MobileStickyBar />}
    </div>
  );
};
