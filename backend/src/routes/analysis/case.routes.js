// ============================================
// CASE ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const caseController = require('../../controllers/analysis/case.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Case CRUD
router.post('/', caseController.createCase);
router.get('/', caseController.getAllCases);
router.get('/statistics', caseController.getCaseStatistics);
router.get('/:id', caseController.getCaseById);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);

module.exports = router;
