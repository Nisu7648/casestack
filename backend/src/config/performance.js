// Performance Optimization Configuration
// Production-ready settings for maximum performance

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');

// ============================================
// COMPRESSION MIDDLEWARE
// ============================================
const compressionConfig = compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// ============================================
// SECURITY HEADERS (HELMET)
// ============================================
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// ============================================
// RATE LIMITING
// ============================================

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// AI endpoints rate limit (more expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour
  message: 'AI request limit exceeded. Upgrade your plan for more.',
});

// ============================================
// CORS CONFIGURATION
// ============================================
const corsConfig = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// ============================================
// SANITIZATION
// ============================================
const sanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in request`);
  },
});

// ============================================
// HPP (HTTP Parameter Pollution)
// ============================================
const hppConfig = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit']
});

// ============================================
// CACHING CONFIGURATION
// ============================================
const cacheConfig = {
  // Cache durations in seconds
  static: 31536000,      // 1 year for static assets
  api: 300,              // 5 minutes for API responses
  user: 900,             // 15 minutes for user data
  cases: 60,             // 1 minute for case data
  ai: 3600,              // 1 hour for AI predictions
};

// Cache middleware
const cacheMiddleware = (duration) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  
  res.set('Cache-Control', `public, max-age=${duration}`);
  next();
};

// ============================================
// DATABASE CONNECTION POOLING
// ============================================
const dbPoolConfig = {
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  acquire: 30000,             // Max time to acquire connection
  idle: 10000,                // Max idle time
  evict: 1000,                // Eviction run interval
  handleDisconnects: true,    // Auto-reconnect
};

// ============================================
// LOGGING CONFIGURATION
// ============================================
const loggingConfig = {
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: 'json',
  timestamp: true,
  colorize: process.env.NODE_ENV !== 'production',
};

// ============================================
// PERFORMANCE MONITORING
// ============================================
const performanceMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Add performance header
    res.set('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// ============================================
// REQUEST SIZE LIMITS
// ============================================
const requestLimits = {
  json: '10mb',              // JSON body limit
  urlencoded: '10mb',        // URL-encoded body limit
  raw: '50mb',               // Raw body limit (for file uploads)
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (server, prisma) => {
  const shutdown = async (signal) => {
    console.log(`${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
      console.log('HTTP server closed');
      
      // Close database connections
      try {
        await prisma.$disconnect();
        console.log('Database connections closed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
const healthCheck = async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
  
  try {
    // Check database connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'Connected';
  } catch (error) {
    health.database = 'Disconnected';
    health.status = 'ERROR';
  }
  
  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  compressionConfig,
  helmetConfig,
  apiLimiter,
  authLimiter,
  aiLimiter,
  corsConfig,
  sanitizeConfig,
  hppConfig,
  cacheConfig,
  cacheMiddleware,
  dbPoolConfig,
  loggingConfig,
  performanceMonitoring,
  requestLimits,
  gracefulShutdown,
  healthCheck,
};
