require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Enterprise Routes
const authRoutes = require('./routes/enterprise/auth');
const clientsRoutes = require('./routes/enterprise/clients');
const engagementsRoutes = require('./routes/enterprise/engagements');
const reportsRoutes = require('./routes/enterprise/reports');
const evidenceRoutes = require('./routes/enterprise/evidence');
const auditRoutes = require('./routes/enterprise/audit');
const searchRoutes = require('./routes/enterprise/search');
const usersRoutes = require('./routes/enterprise/users');
const settingsRoutes = require('./routes/enterprise/settings');
const dossiersRoutes = require('./routes/enterprise/dossiers');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/engagements', engagementsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dossiers', dossiersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CaseStack Enterprise API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CaseStack Enterprise API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
