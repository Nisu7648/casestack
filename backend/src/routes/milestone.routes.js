const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestone.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// Routes
router.get('/case/:caseId', milestoneController.getMilestonesByCase);
router.post('/', milestoneController.createMilestone);
router.put('/:id', milestoneController.updateMilestone);
router.delete('/:id', milestoneController.deleteMilestone);
router.patch('/:id/complete', milestoneController.completeMilestone);

module.exports = router;
