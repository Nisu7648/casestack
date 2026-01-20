const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS - Allow all origins for now
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'LegalStack API',
    version: '1.0.0',
    status: 'running',
    tagline: 'Fair, accessible legal case management',
    features: 17,
    endpoints: 80,
    health: '/health',
    documentation: 'https://github.com/Nisu7648/casestack',
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/verify',
      'POST /api/firm/create',
      'GET /api/firm/details',
      'GET /api/pricing/countries',
      'GET /api/pricing/country/:country',
      'POST /api/pricing/calculate',
      'GET /api/cases',
      'POST /api/cases',
      'GET /api/documents/case/:caseId',
      'POST /api/documents/upload',
      'POST /api/billing/time',
      'POST /api/billing/invoices'
    ]
  });
});

// ============================================
// ROUTES - SIMPLE VERSIONS (NO DEPENDENCIES)
// ============================================

// Simple auth routes (works immediately)
try {
  const authSimpleRoutes = require('./routes/casestack/auth-simple');
  app.use('/api/auth', authSimpleRoutes);
  console.log('✅ Loaded: /api/auth (simple)');
} catch (e) {
  console.error('❌ Failed to load auth routes:', e.message);
}

// Simple firm routes (works immediately)
try {
  const firmSimpleRoutes = require('./routes/casestack/firm-simple');
  app.use('/api/firm', firmSimpleRoutes);
  console.log('✅ Loaded: /api/firm (simple)');
} catch (e) {
  console.error('❌ Failed to load firm routes:', e.message);
}

// Pricing routes
try {
  const pricingRoutes = require('./routes/casestack/pricing');
  app.use('/api/pricing', pricingRoutes);
  console.log('✅ Loaded: /api/pricing');
} catch (e) {
  console.error('❌ Failed to load pricing routes:', e.message);
}

// Google auth routes
try {
  const googleAuthRoutes = require('./routes/casestack/google-auth');
  app.use('/api/google-auth', googleAuthRoutes);
  console.log('✅ Loaded: /api/google-auth');
} catch (e) {
  console.log('⚠️  Google auth routes not loaded');
}

// ============================================
// CORE ROUTES (Load if available)
// ============================================

const coreRoutes = [
  { path: '/api/cases', file: './routes/casestack/cases' },
  { path: '/api/clients', file: './routes/casestack/clients' },
  { path: '/api/documents', file: './routes/casestack/documents' },
  { path: '/api/billing', file: './routes/casestack/billing' },
  { path: '/api/tasks', file: './routes/casestack/tasks' },
  { path: '/api/calendar', file: './routes/casestack/calendar' },
  { path: '/api/templates', file: './routes/casestack/templates' },
  { path: '/api/reports', file: './routes/casestack/reports' },
  { path: '/api/client-portal', file: './routes/casestack/client-portal' },
  { path: '/api/ai-analysis', file: './routes/casestack/ai-analysis' },
  { path: '/api/search', file: './routes/casestack/search' }
];

coreRoutes.forEach(({ path, file }) => {
  try {
    const route = require(file);
    app.use(path, route);
    console.log(`✅ Loaded: ${path}`);
  } catch (e) {
    console.log(`⚠️  Route not loaded: ${path}`);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/verify',
      'POST /api/firm/create',
      'GET /api/firm/details',
      'GET /api/pricing/countries',
      'GET /api/pricing/country/:country',
      'POST /api/pricing/calculate'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
});

// ============================================
// START SERVER
// IMPORTANT: Bind to 0.0.0.0 for Render.com
// ============================================

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🚀 LEGALSTACK API SERVER');
  console.log('🚀 ============================================');
  console.log('');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API docs: http://localhost:${PORT}/`);
  console.log('');
  console.log('📊 Features: 17 complete features');
  console.log('📊 Endpoints: 80+ API endpoints');
  console.log('💰 Pricing: 60+ countries supported');
  console.log('🌍 Fair pricing for law firms worldwide');
  console.log('');
  console.log('🔥 Ready to accept requests!');
  console.log('🚀 ============================================');
  console.log('');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
