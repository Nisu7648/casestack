require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// ============================================
// CASESTACK - FINALIZATION & DEFENSIBILITY SYSTEM
// Server Configuration
// ============================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '100mb' })); // Large files
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Logging
app.use(morgan('combined'));

// ============================================
// CASESTACK ROUTES
// ============================================

const authRoutes = require('./routes/casestack/auth');
const casesRoutes = require('./routes/casestack/cases');
const bundlesRoutes = require('./routes/casestack/bundles');
const searchRoutes = require('./routes/casestack/search');
const auditRoutes = require('./routes/casestack/audit');
const clientsRoutes = require('./routes/casestack/clients');
const usersRoutes = require('./routes/casestack/users');
const settingsRoutes = require('./routes/casestack/settings');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/bundles', bundlesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CASESTACK - Finalization & Defensibility System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    service: 'CASESTACK',
    tagline: 'Finalization, Accountability, Archival & Defensibility',
    description: 'Enterprise-grade system for consulting, audit, tax, and advisory firms',
    features: [
      'Case Finalization System',
      'File Bundle & Archival Engine',
      'Firm Memory & Search',
      'Responsibility & Defensibility Layer',
      'Immutable Audit Logging',
      'Download Tracking'
    ],
    status: 'operational',
    documentation: '/api/docs'
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Maximum file size is 100MB'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  // Generic error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║                      CASESTACK                            ║');
  console.log('║     Finalization & Defensibility System                  ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API Base: http://localhost:${PORT}/api`);
  console.log('');
  console.log('Core Features:');
  console.log('  ✅ Case Finalization System');
  console.log('  ✅ File Bundle & Archival Engine');
  console.log('  ✅ Firm Memory & Search');
  console.log('  ✅ Responsibility & Defensibility Layer');
  console.log('  ✅ Immutable Audit Logging');
  console.log('  ✅ Download Tracking');
  console.log('');
  console.log('🎯 Target: Consulting, Audit, Tax & Advisory Firms');
  console.log('💰 Pricing: Per employee/month (₹1,399 India, €25-50 Europe)');
  console.log('');
});

module.exports = app;
