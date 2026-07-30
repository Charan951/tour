import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Helmet Security Headers Configuration matching security.md specs
export const configureSecurityHeaders = helmet({
  contentSecurityPolicy: false, // Disabled for inline scripts/styles in dev, enabled via Helmet default headers
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Enterprise CORS Configuration with dynamic origin reflection matching production specs
export const configureCORS = cors({
  origin: true, // Dynamically reflects request origin in Access-Control-Allow-Origin header
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
});

// Auth Rate Limiter: 15 mins, max 5 attempts
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public Lead Enquiries Rate Limiter: 30 mins, max 5 submissions
export const enquiryRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many enquiry submissions from this IP. Please try again after 30 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Contact Form Rate Limiter: 1 hour, max 10 submissions
export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many contact messages from this IP. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Global API Read Rate Limiter: 15 mins, max 100 requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many API requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Global Express Error Handler
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Express Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined
  });
};
