const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Case analytics
router.get('/case/:caseId', analyticsController.getCaseAnalytics);

// Time analytics
router.get('/time', analyticsController.getTimeAnalytics);

// Budget analytics
router.get('/budget', analyticsController.getBudgetAnalytics);

// Team performance
router.get('/team', analyticsController.getTeamPerformance);

// Export data
router.post('/export', analyticsController.exportData);

module.exports = router;
