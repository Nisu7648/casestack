const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// Routes
router.get('/case/:caseId', riskController.getRisksByCase);
router.post('/', riskController.createRisk);
router.put('/:id', riskController.updateRisk);
router.delete('/:id', riskController.deleteRisk);
router.patch('/:id/close', riskController.closeRisk);

module.exports = router;
