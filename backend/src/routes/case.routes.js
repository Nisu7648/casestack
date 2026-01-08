const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const { authenticate, authorize, hasPermission } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const { body, query } = require('express-validator');

// Apply authentication and activity logging
router.use(authenticate);
router.use(activityLogger);

// Validation
const createCaseValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('clientId').isUUID().withMessage('Valid client ID is required'),
  body('caseType').isIn(['STRATEGY', 'OPERATIONS', 'TECHNOLOGY', 'FINANCIAL', 'HR', 'MARKETING', 'SALES', 'LEGAL', 'OTHER']),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('budgetTotal').optional().isDecimal(),
  body('currency').optional().isString(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
];

const updateCaseValidation = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('status').optional().isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW', 'COMPLETED', 'CANCELLED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('budgetTotal').optional().isDecimal(),
  body('progressPercentage').optional().isInt({ min: 0, max: 100 })
];

// Routes

// Get all cases with search and filters
router.get('/', caseController.getAllCases);

// Get case statistics/dashboard
router.get('/stats', caseController.getCaseStats);

// Get single case by ID
router.get('/:id', caseController.getCaseById);

// Create new case
router.post('/', createCaseValidation, caseController.createCase);

// Update case
router.put('/:id', updateCaseValidation, caseController.updateCase);

// Delete case (Admin only)
router.delete('/:id', authorize('ADMIN', 'PARTNER'), caseController.deleteCase);

// Archive/Unarchive case
router.patch('/:id/archive', caseController.archiveCase);
router.patch('/:id/unarchive', caseController.unarchiveCase);

// Case team management
router.post('/:id/members', caseController.addCaseMember);
router.delete('/:id/members/:userId', caseController.removeCaseMember);

// Case activity feed
router.get('/:id/activities', caseController.getCaseActivities);

module.exports = router;
