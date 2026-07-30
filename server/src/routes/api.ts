import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { createEnquiry, getEnquiries, updateEnquiryStatus, addEnquiryNote, deleteEnquiry } from '../controllers/enquiryController.js';
import { getPackages, getPackageBySlug, createPackage, updatePackage, deletePackage } from '../controllers/packageController.js';
import { getDestinations, getDestinationBySlug, createDestination, updateDestination, deleteDestination } from '../controllers/destinationController.js';
import { 
  getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, 
  getTestimonials, createTestimonial, 
  getFAQs, createFAQ, 
  subscribeNewsletter, 
  createContactMessage, 
  getSettings, updateSettings 
} from '../controllers/cmsController.js';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { getThemeBanners, upsertThemeBanner, deleteThemeBanner } from '../controllers/themeBannerController.js';
import { getSitemapXML } from '../controllers/sitemapController.js';
import uploadRoutes from './uploadRoutes.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { authRateLimiter, enquiryRateLimiter, contactRateLimiter } from '../middleware/security.js';
import { cacheMiddleware, clearApiCache } from '../middleware/cacheMiddleware.js';

const router = Router();

const invalidateCache = (_req: any, _res: any, next: any) => {
  clearApiCache();
  next();
};

// Dynamic XML Sitemap Endpoint
router.get('/sitemap.xml', cacheMiddleware(300), getSitemapXML);

// Image Upload Endpoint (Cloudinary)
router.use('/upload', uploadRoutes);

// --- PUBLIC ROUTES ---
router.post('/auth/login', authRateLimiter, login);

router.get('/packages', cacheMiddleware(120), getPackages);
router.get('/packages/:slug', cacheMiddleware(120), getPackageBySlug);

router.get('/destinations', cacheMiddleware(120), getDestinations);
router.get('/destinations/:slug', cacheMiddleware(120), getDestinationBySlug);

router.get('/banners', cacheMiddleware(120), getBanners);
router.get('/themes', cacheMiddleware(120), getThemeBanners);

router.get('/blogs', cacheMiddleware(120), getBlogs);
router.get('/blogs/:slug', cacheMiddleware(120), getBlogBySlug);

router.get('/testimonials', cacheMiddleware(120), getTestimonials);
router.get('/faq', cacheMiddleware(120), getFAQs);
router.get('/settings', cacheMiddleware(300), getSettings);

router.post('/enquiries', enquiryRateLimiter, invalidateCache, createEnquiry);
router.post('/contact', enquiryRateLimiter, invalidateCache, createContactMessage);
router.post('/newsletter', invalidateCache, subscribeNewsletter);

// --- PROTECTED ADMIN ROUTES ---
router.use('/admin', invalidateCache, authenticateToken);

router.get('/admin/auth/me', getMe);

// Enquiries (CRM) CRUD
router.get('/admin/enquiries', getEnquiries);
router.patch('/admin/enquiries/:id/status', updateEnquiryStatus);
router.post('/admin/enquiries/:id/notes', addEnquiryNote);
router.delete('/admin/enquiries/:id', requireRole(['Super Admin', 'Admin']), deleteEnquiry);

// Packages CRUD
router.post('/admin/packages', requireRole(['Super Admin', 'Admin', 'Content Manager']), createPackage);
router.patch('/admin/packages/:id', requireRole(['Super Admin', 'Admin', 'Content Manager']), updatePackage);
router.delete('/admin/packages/:id', requireRole(['Super Admin', 'Admin']), deletePackage);

// Destinations CRUD
router.post('/admin/destinations', requireRole(['Super Admin', 'Admin', 'Content Manager']), createDestination);
router.patch('/admin/destinations/:id', requireRole(['Super Admin', 'Admin', 'Content Manager']), updateDestination);
router.delete('/admin/destinations/:id', requireRole(['Super Admin', 'Admin']), deleteDestination);

// CMS CRUD (Blogs, Testimonials, FAQs, Settings)
router.post('/admin/blogs', requireRole(['Super Admin', 'Admin', 'Content Manager']), createBlog);
router.patch('/admin/blogs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager']), updateBlog);
router.delete('/admin/blogs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager']), deleteBlog);

// Banners CRUD
router.post('/admin/banners', requireRole(['Super Admin', 'Admin', 'Content Manager']), createBanner);
router.patch('/admin/banners/:id', requireRole(['Super Admin', 'Admin', 'Content Manager']), updateBanner);
router.delete('/admin/banners/:id', requireRole(['Super Admin', 'Admin']), deleteBanner);

// Theme Banners CRUD
router.post('/admin/themes', requireRole(['Super Admin', 'Admin', 'Content Manager']), upsertThemeBanner);
router.delete('/admin/themes/:id', requireRole(['Super Admin', 'Admin']), deleteThemeBanner);

router.post('/admin/testimonials', requireRole(['Super Admin', 'Admin', 'Content Manager']), createTestimonial);
router.post('/admin/faqs', requireRole(['Super Admin', 'Admin', 'Content Manager']), createFAQ);
router.patch('/admin/settings', requireRole(['Super Admin', 'Admin']), updateSettings);

export default router;
