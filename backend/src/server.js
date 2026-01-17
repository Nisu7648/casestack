const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const firmRoutes = require('./routes/firm');
const caseRoutes = require('./routes/case');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://casestack-frontend.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/firm', firmRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CASESTACK API',
    version: '2.0.0',
    status: 'running',
    features: [
      'Advanced Authentication',
      'Email Verification',
      'Password Reset',
      'Session Management',
      'Firm Management',
      'Case Management',
      'Country-based Subscriptions',
      'Multi-tier Pricing'
    ],
    endpoints: {
      auth: '/api/auth',
      firm: '/api/firm',
      cases: '/api/cases',
      subscription: '/api/subscription',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 CASESTACK API SERVER');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  console.log('📋 Available Routes:');
  console.log('   - POST   /api/auth/register');
  console.log('   - POST   /api/auth/login');
  console.log('   - POST   /api/auth/verify-email');
  console.log('   - POST   /api/auth/forgot-password');
  console.log('   - POST   /api/auth/reset-password');
  console.log('   - POST   /api/firm/create');
  console.log('   - GET    /api/cases');
  console.log('   - POST   /api/cases');
  console.log('   - GET    /api/subscription/pricing/:countryCode');
  console.log('   - POST   /api/subscription/calculate');
  console.log('   - GET    /api/subscription/plans');
  console.log('   - POST   /api/subscription/create');
  console.log('   - GET    /api/subscription/active');
  console.log('='.repeat(50));
});

module.exports = app;
