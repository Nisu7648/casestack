require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const firmRoutes = require('./routes/firm.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const clientRoutes = require('./routes/client.routes');
const caseRoutes = require('./routes/case.routes');
const taskRoutes = require('./routes/task.routes');
const timeRoutes = require('./routes/time.routes');
const workflowRoutes = require('./routes/workflow.routes');
const milestoneRoutes = require('./routes/milestone.routes');
const riskRoutes = require('./routes/risk.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const billingRoutes = require('./routes/billing.routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (important for deployment behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration - MUST BE BEFORE OTHER MIDDLEWARE
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for API
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check (BEFORE /api routes)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CaseStack API',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    modules: [
      'Foundation',
      'Case Canvas',
      'Task Management',
      'Time Tracking',
      'Workflow Templates',
      'Milestones',
      'Risk Management',
      'Analytics & Reporting',
      'Billing & Subscriptions'
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/firms', firmRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.warn(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 CaseStack API v3.0 - Production Ready`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 Server: http://0.0.0.0:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`\n✅ Active Modules:`);
  console.log(`   • Foundation (Auth, Users, Firms)`);
  console.log(`   • Case Canvas (Cases, Clients, Documents)`);
  console.log(`   • Task Management (Tasks, Subtasks, Comments)`);
  console.log(`   • Time Tracking (Timer, Entries, Billing)`);
  console.log(`   • Workflow Templates (Automation)`);
  console.log(`   • Milestones (Project Tracking)`);
  console.log(`   • Risk Management (Risk Register)`);
  console.log(`   • Analytics & Reporting (Insights, Export)`);
  console.log(`   • Billing & Subscriptions (Geo-Pricing)`);
  console.log(`\n📊 Total API Endpoints: 70+`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting`);
  console.log(`💰 Pricing: Geo-based (90+ countries)`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;
