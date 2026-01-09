const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { logger, logRequest, logError } = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler.middleware');
const { apiLimiter, authLimiter, uploadLimiter, exportLimiter } = require('./middleware/rateLimiter.middleware');

// ============================================
// CASESTACK SERVER - FULLY INTEGRATED
// All services, middleware, and routes connected
// ============================================

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SECURITY & MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (Morgan + Winston)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(logRequest);

// Trust proxy (for Railway, Heroku, etc.)
app.set('trust proxy', 1);

// ============================================
// HEALTH CHECK ROUTES (NO RATE LIMITING)
// ============================================

const healthRoutes = require('./routes/health');
app.use('/', healthRoutes);

// ============================================
// API ROUTES WITH RATE LIMITING
// ============================================

// Auth routes (strict rate limiting)
const authRoutes = require('./routes/casestack/auth');
app.use('/api/auth', authLimiter, authRoutes);

// Apply general rate limiting to all other API routes
app.use('/api', apiLimiter);

// Case management routes (with email integration)
const casesRoutes = require('./routes/casestack/cases');
app.use('/api/cases', casesRoutes);

// File bundle routes (with upload/download/export)
const bundlesRoutes = require('./routes/casestack/bundles');
app.use('/api/bundles', uploadLimiter, bundlesRoutes);

// Export routes (with rate limiting)
app.use('/api/bundles/*/download*', exportLimiter);

// Search routes (basic + advanced)
const searchRoutes = require('./routes/casestack/search');
const advancedSearchRoutes = require('./routes/casestack/search.advanced');
app.use('/api/search', searchRoutes);
app.use('/api/search/advanced', advancedSearchRoutes);

// Audit log routes
const auditRoutes = require('./routes/casestack/audit');
app.use('/api/audit', auditRoutes);

// Client management routes
const clientsRoutes = require('./routes/casestack/clients');
app.use('/api/clients', clientsRoutes);

// User management routes
const usersRoutes = require('./routes/casestack/users');
app.use('/api/users', usersRoutes);

// Firm settings routes
const settingsRoutes = require('./routes/casestack/settings');
app.use('/api/settings', settingsRoutes);

// ============================================
// STATIC FILE SERVING (for local storage)
// ============================================

if (process.env.STORAGE_TYPE === 'local') {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
  app.use('/files', express.static(uploadDir));
  logger.info('Serving static files from: ' + uploadDir);
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(logError);
app.use(errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    // Exit process
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, async () => {
  logger.info('========================================');
  logger.info('CASESTACK SERVER STARTED');
  logger.info('========================================');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`Storage: ${process.env.STORAGE_TYPE || 'local'}`);
  logger.info(`CORS: ${corsOptions.origin}`);
  logger.info('========================================');
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✓ Database connected');
  } catch (error) {
    logger.error('✗ Database connection failed:', error.message);
  }
  
  // Test email service
  const emailService = require('./services/email.service');
  const emailReady = await emailService.testConnection();
  if (emailReady) {
    logger.info('✓ Email service ready');
  } else {
    logger.warn('✗ Email service not configured (optional)');
  }
  
  // Log startup metrics
  const memUsage = process.memoryUsage();
  logger.info('Memory usage', {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
  });
  
  logger.info('========================================');
  logger.info('✓ All services initialized');
  logger.info('✓ Server ready to accept requests');
  logger.info('========================================');
});

module.exports = app;
