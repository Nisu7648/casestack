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

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CaseStack API',
    version: '2.0.0',
    modules: [
      'Foundation',
      'Case Canvas',
      'Task Management',
      'Time Tracking',
      'Workflow Templates',
      'Milestones',
      'Risk Management',
      'Analytics & Reporting'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CaseStack API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n✅ Active Modules:`);
  console.log(`   • Foundation (Auth, Users, Firms)`);
  console.log(`   • Case Canvas (Cases, Clients, Documents)`);
  console.log(`   • Task Management (Tasks, Subtasks, Comments)`);
  console.log(`   • Time Tracking (Timer, Entries, Billing)`);
  console.log(`   • Workflow Templates (Automation)`);
  console.log(`   • Milestones (Project Tracking)`);
  console.log(`   • Risk Management (Risk Register)`);
  console.log(`   • Analytics & Reporting (Insights, Export)`);
  console.log(`\n📊 Total API Endpoints: 60+`);
});

module.exports = app;
