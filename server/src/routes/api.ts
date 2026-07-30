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

const router = Router();

// Dynamic XML Sitemap Endpoint
router.get('/sitemap.xml', getSitemapXML);

// Image Upload Endpoint (Cloudinary)
router.use('/upload', uploadRoutes);

// --- PUBLIC ROUTES ---
router.post('/auth/login', authRateLimiter, login);

router.get('/packages', getPackages);
router.get('/packages/:slug', getPackageBySlug);

router.get('/destinations', getDestinations);
router.get('/destinations/:slug', getDestinationBySlug);

router.get('/banners', getBanners);
router.get('/themes', getThemeBanners);

router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

router.get('/testimonials', getTestimonials);
router.get('/faq', getFAQs);
router.get('/settings', getSettings);

router.post('/enquiries', enquiryRateLimiter, createEnquiry);
router.post('/contact', enquiryRateLimiter, createContactMessage);
router.post('/newsletter', subscribeNewsletter);

// --- PROTECTED ADMIN ROUTES ---
router.use('/admin', authenticateToken);

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
