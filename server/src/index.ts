import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import mongoSanitize from 'express-mongo-sanitize';
import { configureSecurityHeaders, configureCORS, globalErrorHandler } from './middleware/security.js';
import apiRouter from './routes/api.js';

import compression from 'compression';
import { getCacheStatus } from './config/redis.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT: number = Number(process.env.PORT) || 5000;

// Initialize Socket.io with permissive CORS for mobile apps, admin panel, and local network clients
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make Socket.io instance globally accessible
(global as any).io = io;
(global as any).socketConnectedUsers = new Map();

// Compression Middleware for fast payloads
app.use(compression());

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

// Health Check Route with Cache Status
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is reachable',
    status: 'OK',
    service: 'HolidayCity API Backend Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: getCacheStatus(),
  });
});

import { getSitemapXML } from './controllers/sitemapController.js';

// Root XML Sitemap Route matching seo.md Section 5.1
app.get('/sitemap.xml', getSitemapXML);

// API v1 Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(globalErrorHandler);

import fs from 'fs';
import path from 'path';

try {
  const rootDir = process.cwd();
  const clientPublic = path.join(rootDir, '../client/public');
  const mobileAssets = path.join(rootDir, '../mobile/assets/images');
  if (!fs.existsSync(mobileAssets)) {
    fs.mkdirSync(mobileAssets, { recursive: true });
  }
  if (fs.existsSync(path.join(clientPublic, 'logo.png'))) {
    fs.copyFileSync(path.join(clientPublic, 'logo.png'), path.join(mobileAssets, 'logo.png'));
  }
  if (fs.existsSync(path.join(clientPublic, 'favicon.png'))) {
    fs.copyFileSync(path.join(clientPublic, 'favicon.png'), path.join(mobileAssets, 'logo_icon.png'));
  }
  console.log('✅ Synchronized frontend logos to mobile/assets/images/');
} catch (err) {
  console.error('Logo sync error:', err);
}

import os from 'os';

function getLocalNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

import { initFirebase } from './config/firebase.js';

// Database Connection & Server Start
connectDB().then(() => {
  initFirebase();
  const HOST = process.env.HOST || '0.0.0.0';
  const networkIp = process.env.NETWORK_IP || getLocalNetworkIp();
  
  // Socket.io connection handlers
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    
    socket.on('join_updates', (data) => {
      const room = data?.room || 'general_updates';
      socket.join(room);
      console.log(`📡 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('join_user', (email) => {
      if (email && typeof email === 'string') {
        const userRoom = `user_${email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
        socket.join(userRoom);
        console.log(`👤 Socket ${socket.id} joined user room: ${userRoom}`);
      }
    });

    socket.on('join_chat_topic', (topicId) => {
      if (topicId) {
        const roomName = `chat_${topicId}`;
        socket.join(roomName);
        console.log(`💬 Socket ${socket.id} joined chat room: ${roomName}`);
      }
    });

    socket.on('leave_chat_topic', (topicId) => {
      if (topicId) {
        socket.leave(`chat_${topicId}`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
  
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`=======================================================`);
    console.log(`🌴 HolidayCity API Service Running on Port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Local Host:    http://localhost:${PORT}/api/v1`);
    console.log(`📲 Network Access: http://${networkIp}:${PORT}/api/v1`);
    console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
});

