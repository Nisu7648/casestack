const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// MODULE H1 - Action Logging (automatic via middleware)
// No manual endpoints - logging happens automatically

// MODULE H2 - Viewable Log
router.get('/', authorize(['ADMIN', 'PARTNER']), auditController.getAuditLogs);
router.get('/entity/:entity/:entityId', authorize(['ADMIN', 'PARTNER', 'MANAGER']), auditController.getEntityAuditLog);
router.get('/user/:userId', authorize(['ADMIN', 'PARTNER']), auditController.getUserAuditLog);
router.get('/report/:reportId', authorize(['ADMIN', 'PARTNER', 'MANAGER']), auditController.getReportAuditLog);

// Analytics
router.get('/stats', authorize(['ADMIN', 'PARTNER']), auditController.getAuditStats);
router.get('/timeline', authorize(['ADMIN', 'PARTNER']), auditController.getAuditTimeline);

// Export
router.post('/export', authorize(['ADMIN', 'PARTNER']), auditController.exportAuditLog);

// Security Events
router.get('/security', authorize(['ADMIN']), auditController.getSecurityEvents);

module.exports = router;
