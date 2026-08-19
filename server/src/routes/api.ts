import { Router } from 'express';
import { login, register, forgotPassword, getMe } from '../controllers/authController.js';
import { createEnquiry, getEnquiries, getMyEnquiries, updateEnquiryStatus, addEnquiryNote, deleteEnquiry } from '../controllers/enquiryController.js';
import { getPackages, getPackageBySlug, createPackage, updatePackage, deletePackage } from '../controllers/packageController.js';
import { getDestinations, getDestinationBySlug, createDestination, updateDestination, deleteDestination } from '../controllers/destinationController.js';
import { 
  getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, 
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  subscribeNewsletter, 
  createContactMessage, 
  getSettings, updateSettings 
} from '../controllers/cmsController.js';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { getThemeBanners, upsertThemeBanner, deleteThemeBanner } from '../controllers/themeBannerController.js';
import { getSitemapXML } from '../controllers/sitemapController.js';
import { createBooking, getAdminBookings, getUserBookings, updateBookingStatus, deleteBooking, payRemainingBalance } from '../controllers/bookingController.js';
import { sendChatMessage, getTopicMessages, getAdminConversations, markTopicAsRead } from '../controllers/chatController.js';
import uploadRoutes from './uploadRoutes.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { authRateLimiter, enquiryRateLimiter, contactRateLimiter } from '../middleware/security.js';
import { cacheMiddleware, clearApiCache } from '../middleware/cacheMiddleware.js';

const router = Router();

// Optional auth: attaches req.user from Bearer token if present, never blocks
const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'holidaycity_super_secret_jwt_access_key_2026';
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(token, secret);
    } catch (_) { /* invalid token — ignore, allow unauthenticated */ }
  }
  next();
};

const invalidateCache = (req: any, res: any, next: any) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearApiCache()
          .then(() => {
            console.log(`🧹 [Cache] Cleared API cache after successful ${req.method} ${req.originalUrl}`);
          })
          .catch((err) => {
            console.warn('⚠️ [Cache] Invalidation error:', err);
          });
      }
    });
  }
  next();
};

// Global Cache Invalidation on all POST/PUT/PATCH/DELETE requests
router.use(invalidateCache);

// Dynamic XML Sitemap Endpoint
router.get('/sitemap.xml', cacheMiddleware(300), getSitemapXML);

// Image Upload Endpoint (Cloudinary)
router.use('/upload', uploadRoutes);

// --- PUBLIC ROUTES ---
router.post('/auth/login', authRateLimiter, login);
router.post('/auth/register', authRateLimiter, register);
router.post('/auth/forgot-password', authRateLimiter, forgotPassword);

// Packages Catalog & Detail (Live MongoDB Queries with No-Cache Headers)
router.get('/packages', getPackages);
router.get('/packages/:slug', getPackageBySlug);

// Destinations Landing & Detail (Live MongoDB Queries with No-Cache Headers)
router.get('/destinations', getDestinations);
router.get('/destinations/:slug', getDestinationBySlug);

// Banners & Themes (Live MongoDB Queries with No-Cache Headers)
router.get('/banners', getBanners);
router.get('/themes', getThemeBanners);

// Blogs, Testimonials, FAQ & Settings (Live MongoDB Queries with No-Cache Headers)
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.get('/testimonials', getTestimonials);
router.get('/faq', getFAQs);
router.get('/settings', getSettings);

router.post('/enquiries', enquiryRateLimiter, createEnquiry);
router.get('/enquiries/my', optionalAuth, getMyEnquiries);
router.post('/bookings', enquiryRateLimiter, createBooking);
router.get('/bookings/my', optionalAuth, getUserBookings);
router.patch('/bookings/:id/pay-remaining', payRemainingBalance);
router.post('/bookings/:id/pay-remaining', payRemainingBalance);
router.post('/contact', enquiryRateLimiter, createContactMessage);
router.post('/newsletter', subscribeNewsletter);

// Chat / Support Messaging Endpoints
router.post('/chat/messages', sendChatMessage);
router.get('/chat/messages/:topicId', getTopicMessages);
router.get('/chat/conversations', getAdminConversations);
router.patch('/chat/read/:topicId', markTopicAsRead);

// --- PROTECTED ADMIN ROUTES ---
router.use('/admin', authenticateToken);

router.get('/admin/auth/me', getMe);
router.get('/admin/chat/conversations', getAdminConversations);

// Bookings CRUD
router.get('/admin/bookings', getAdminBookings);
router.post('/admin/bookings', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createBooking);
router.patch('/admin/bookings/:id', updateBookingStatus);
router.delete('/admin/bookings/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteBooking);

// Enquiries (CRM) CRUD
router.get('/admin/enquiries', getEnquiries);
router.post('/admin/enquiries', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createEnquiry);
router.patch('/admin/enquiries/:id', updateEnquiryStatus);
router.patch('/admin/enquiries/:id/status', updateEnquiryStatus);
router.post('/admin/enquiries/:id/notes', addEnquiryNote);
router.delete('/admin/enquiries/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteEnquiry);

// Packages CRUD
router.post('/admin/packages', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createPackage);
router.patch('/admin/packages/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updatePackage);
router.delete('/admin/packages/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deletePackage);

// Destinations CRUD
router.post('/admin/destinations', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createDestination);
router.patch('/admin/destinations/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updateDestination);
router.delete('/admin/destinations/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteDestination);

// CMS CRUD (Blogs, Testimonials, FAQs, Settings)
router.post('/admin/blogs', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createBlog);
router.patch('/admin/blogs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updateBlog);
router.delete('/admin/blogs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteBlog);

// Banners CRUD
router.post('/admin/banners', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createBanner);
router.patch('/admin/banners/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updateBanner);
router.delete('/admin/banners/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteBanner);

// Theme Banners CRUD
router.post('/admin/themes', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), upsertThemeBanner);
router.delete('/admin/themes/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteThemeBanner);

router.post('/admin/testimonials', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createTestimonial);
router.patch('/admin/testimonials/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updateTestimonial);
router.delete('/admin/testimonials/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteTestimonial);

router.post('/admin/faqs', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), createFAQ);
router.patch('/admin/faqs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), updateFAQ);
router.delete('/admin/faqs/:id', requireRole(['Super Admin', 'Admin', 'Content Manager', 'Sales Executive']), deleteFAQ);

router.patch('/admin/settings', requireRole(['Super Admin', 'Admin']), updateSettings);

export default router;
