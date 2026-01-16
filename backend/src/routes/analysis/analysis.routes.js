// ============================================
// ANALYSIS ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const analysisController = require('../../controllers/analysis/analysis.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Analysis CRUD
router.post('/', analysisController.createAnalysis);
router.get('/case/:caseId', analysisController.getAnalysesByCase);
router.get('/:id', analysisController.getAnalysisById);
router.put('/:id', analysisController.updateAnalysis);
router.delete('/:id', analysisController.deleteAnalysis);

// Document linking
router.post('/:id/documents', analysisController.linkDocument);
router.delete('/:id/documents/:documentId', analysisController.unlinkDocument);

module.exports = router;
