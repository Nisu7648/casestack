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
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'CASESTACK API',
    version: '2.0.0',
    status: 'running',
    features: 16,
    endpoints: 67
  });
});

// ============================================
// ROUTES
// ============================================

// Core routes (if they exist)
try {
  const authRoutes = require('./routes/casestack/auth');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.log('Auth routes not found');
}

try {
  const caseRoutes = require('./routes/casestack/cases');
  app.use('/api/cases', caseRoutes);
} catch (e) {
  console.log('Case routes not found');
}

try {
  const clientRoutes = require('./routes/casestack/clients');
  app.use('/api/clients', clientRoutes);
} catch (e) {
  console.log('Client routes not found');
}

// Advanced features
try {
  const firmRoutes = require('./routes/casestack/firm');
  app.use('/api/firm', firmRoutes);
} catch (e) {
  console.log('Firm routes not found');
}

try {
  const templateRoutes = require('./routes/casestack/templates');
  app.use('/api/templates', templateRoutes);
} catch (e) {
  console.log('Template routes not found');
}

try {
  const taskRoutes = require('./routes/casestack/tasks');
  app.use('/api/tasks', taskRoutes);
} catch (e) {
  console.log('Task routes not found');
}

try {
  const calendarRoutes = require('./routes/casestack/calendar');
  app.use('/api/calendar', calendarRoutes);
} catch (e) {
  console.log('Calendar routes not found');
}

try {
  const clientPortalRoutes = require('./routes/casestack/client-portal');
  app.use('/api/client-portal', clientPortalRoutes);
} catch (e) {
  console.log('Client portal routes not found');
}

try {
  const reportsRoutes = require('./routes/casestack/reports');
  app.use('/api/reports', reportsRoutes);
} catch (e) {
  console.log('Reports routes not found');
}

// New features
try {
  const aiAnalysisRoutes = require('./routes/casestack/ai-analysis');
  app.use('/api/ai-analysis', aiAnalysisRoutes);
} catch (e) {
  console.log('AI analysis routes not found');
}

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
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🚀 CASESTACK API SERVER');
  console.log('🚀 ============================================');
  console.log('');
  console.log(`✅ Server running on port ${PORT}`);
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

module.exports = app;
