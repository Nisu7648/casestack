const express = require('express');
const router = express.Router();
const firmController = require('../controllers/firm.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// Apply authentication and activity logging
router.use(authenticate);
router.use(activityLogger);

// Routes
router.get('/me', firmController.getCurrentFirm);
router.put('/me', authorize('ADMIN'), firmController.updateFirm);
router.get('/stats', authorize('ADMIN', 'PARTNER'), firmController.getFirmStats);

module.exports = router;
