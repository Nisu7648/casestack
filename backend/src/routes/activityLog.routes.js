const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLog.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication - only ADMIN and PARTNER can view logs
router.use(authenticate);
router.use(authorize('ADMIN', 'PARTNER'));

// Routes
router.get('/', activityLogController.getActivityLogs);
router.get('/user/:userId', activityLogController.getUserActivityLogs);
router.get('/entity/:entity/:entityId', activityLogController.getEntityActivityLogs);
router.get('/export', activityLogController.exportActivityLogs);

module.exports = router;
