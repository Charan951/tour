import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/db.js';
import mongoSanitize from 'express-mongo-sanitize';
import { configureSecurityHeaders, configureCORS, globalErrorHandler } from './middleware/security.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Global Middleware
app.use(configureSecurityHeaders);
app.use(configureCORS);
app.options('*', configureCORS);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Query Injection Protection matching security.md Section 5.2
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'HolidayCity API Backend Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

import { getSitemapXML } from './controllers/sitemapController.js';

// Root XML Sitemap Route matching seo.md Section 5.1
app.get('/sitemap.xml', getSitemapXML);

// API v1 Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Database Connection & Server Start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌴 HolidayCity API Service Running on Port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
    console.log(`=======================================================`);
  });
});
