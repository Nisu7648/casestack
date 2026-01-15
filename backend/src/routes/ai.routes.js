// AI Routes
// Endpoints for AI-powered features

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// ============================================
// AI ENDPOINTS
// ============================================

// GET /api/ai/dashboard - AI Dashboard
router.get('/dashboard', aiController.getAIDashboard);

// GET /api/ai/recommendations - Smart Recommendations
router.get('/recommendations', aiController.getSmartRecommendations);

// POST /api/ai/cases/:caseId/predict - Predict Case Outcome
router.post('/cases/:caseId/predict', aiController.predictCaseOutcome);

// POST /api/ai/cases/:caseId/risk - Assess Case Risk
router.post('/cases/:caseId/risk', aiController.assessCaseRisk);

// GET /api/ai/cases/:caseId/summary - Generate Case Summary
router.get('/cases/:caseId/summary', aiController.generateCaseSummary);

// GET /api/ai/cases/:caseId/insights - Get All AI Insights
router.get('/cases/:caseId/insights', aiController.getCaseInsights);

// POST /api/ai/documents/:documentId/analyze - Analyze Document
router.post('/documents/:documentId/analyze', aiController.analyzeDocument);

module.exports = router;
