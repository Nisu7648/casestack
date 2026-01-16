// ============================================
// CASE ANALYSIS API - Express Server
// Clean parallel implementation
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Different port from main app

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Security
app.use(helmet());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('dev'));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Case Analysis API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/analysis/auth.routes'));
app.use('/api/organizations', require('./routes/analysis/organization.routes'));
app.use('/api/cases', require('./routes/analysis/case.routes'));
app.use('/api/documents', require('./routes/analysis/document.routes'));
app.use('/api/analyses', require('./routes/analysis/analysis.routes'));
app.use('/api/timeline', require('./routes/analysis/timeline.routes'));
app.use('/api/comments', require('./routes/analysis/comment.routes'));
app.use('/api/tags', require('./routes/analysis/tag.routes'));
app.use('/api/search', require('./routes/analysis/search.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Case Analysis API`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n✅ Active Features:`);
  console.log(`   • Case Storage & Management`);
  console.log(`   • Document Upload & Processing`);
  console.log(`   • Analysis Engine`);
  console.log(`   • Timeline Tracking`);
  console.log(`   • Collaboration (Comments)`);
  console.log(`   • Tagging System`);
  console.log(`   • Full-Text Search`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;
