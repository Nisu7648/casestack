const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// Workflow templates
router.get('/templates', workflowController.getTemplates);
router.get('/templates/:id', workflowController.getTemplateById);
router.post('/templates', workflowController.createTemplate);
router.put('/templates/:id', workflowController.updateTemplate);
router.delete('/templates/:id', workflowController.deleteTemplate);

// Apply template to case
router.post('/apply', workflowController.applyTemplate);

// Workflow instances
router.get('/case/:caseId', workflowController.getCaseWorkflows);
router.put('/instance/:id', workflowController.updateWorkflowInstance);

module.exports = router;
