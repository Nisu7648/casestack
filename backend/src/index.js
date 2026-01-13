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

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'CASESTACK API',
    version: '2.0.0',
    status: 'running',
    features: 16,
    endpoints: 67,
    health: '/health',
    documentation: 'https://github.com/Nisu7648/casestack'
  });
});

// ============================================
// ROUTES
// ============================================

// Core routes (load if they exist)
const routes = [
  { path: '/api/auth', file: './routes/casestack/auth' },
  { path: '/api/cases', file: './routes/casestack/cases' },
  { path: '/api/clients', file: './routes/casestack/clients' },
  { path: '/api/firm', file: './routes/casestack/firm' },
  { path: '/api/templates', file: './routes/casestack/templates' },
  { path: '/api/tasks', file: './routes/casestack/tasks' },
  { path: '/api/calendar', file: './routes/casestack/calendar' },
  { path: '/api/client-portal', file: './routes/casestack/client-portal' },
  { path: '/api/reports', file: './routes/casestack/reports' },
  { path: '/api/ai-analysis', file: './routes/casestack/ai-analysis' },
  { path: '/api/google-auth', file: './routes/casestack/google-auth' }
];

routes.forEach(({ path, file }) => {
  try {
    const route = require(file);
    app.use(path, route);
    console.log(`✅ Loaded route: ${path}`);
  } catch (e) {
    console.log(`⚠️  Route not found: ${path}`);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/cases',
      'POST /api/cases',
      'GET /api/firm/details',
      'POST /api/templates',
      'GET /api/tasks',
      'POST /api/calendar/events',
      'GET /api/reports/overview'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// IMPORTANT: Bind to 0.0.0.0 for Render.com
// ============================================

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🚀 CASESTACK API SERVER');
  console.log('🚀 ============================================');
  console.log('');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📊 Features: 16 advanced features');
  console.log('📊 Endpoints: 67+ API endpoints');
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
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
