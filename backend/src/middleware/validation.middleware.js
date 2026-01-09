const { body, param, query, validationResult } = require('express-validator');

// ============================================
// INPUT VALIDATION RULES
// Express-validator for all API endpoints
// ============================================

// Helper to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation
const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('firmName').trim().notEmpty().withMessage('Firm name required'),
    body('country').isIn(['INDIA', 'EUROPE', 'SWITZERLAND', 'USA']).withMessage('Valid country required'),
    validate
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate
  ]
};

// Case validation
const caseValidation = {
  create: [
    body('caseName').trim().notEmpty().isLength({ max: 200 }).withMessage('Case name required (max 200 chars)'),
    body('caseType').isIn(['AUDIT', 'TAX', 'ADVISORY', 'COMPLIANCE', 'OTHER']).withMessage('Valid case type required'),
    body('clientId').isUUID().withMessage('Valid client ID required'),
    body('periodStart').isISO8601().withMessage('Valid start date required'),
    body('periodEnd').isISO8601().withMessage('Valid end date required'),
    body('fiscalYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid fiscal year required'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description too long (max 2000 chars)'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Valid case ID required'),
    body('caseName').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('tags').optional().isArray(),
    validate
  ],
  review: [
    param('id').isUUID().withMessage('Valid case ID required'),
    body('approved').isBoolean().withMessage('Approved status required'),
    body('comments').optional().isLength({ max: 1000 }).withMessage('Comments too long (max 1000 chars)'),
    validate
  ],
  finalize: [
    param('id').isUUID().withMessage('Valid case ID required'),
    body('finalComments').optional().isLength({ max: 1000 }).withMessage('Comments too long (max 1000 chars)'),
    validate
  ]
};

// Client validation
const clientValidation = {
  create: [
    body('name').trim().notEmpty().isLength({ max: 200 }).withMessage('Client name required (max 200 chars)'),
    body('industry').trim().notEmpty().isLength({ max: 100 }).withMessage('Industry required (max 100 chars)'),
    body('contactPerson').optional().trim().isLength({ max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim().isLength({ max: 500 }),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Valid client ID required'),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('industry').optional().trim().notEmpty().isLength({ max: 100 }),
    body('contactPerson').optional().trim().isLength({ max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim().isLength({ max: 500 }),
    validate
  ]
};

// User validation
const userValidation = {
  create: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('firstName').trim().notEmpty().isLength({ max: 50 }).withMessage('First name required (max 50 chars)'),
    body('lastName').trim().notEmpty().isLength({ max: 50 }).withMessage('Last name required (max 50 chars)'),
    body('role').isIn(['STAFF', 'MANAGER', 'PARTNER', 'ADMIN']).withMessage('Valid role required'),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Valid user ID required'),
    body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
    body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
    body('role').optional().isIn(['STAFF', 'MANAGER', 'PARTNER', 'ADMIN']),
    body('isActive').optional().isBoolean(),
    validate
  ]
};

// Bundle validation
const bundleValidation = {
  create: [
    param('caseId').isUUID().withMessage('Valid case ID required'),
    body('bundleName').trim().notEmpty().isLength({ max: 200 }).withMessage('Bundle name required (max 200 chars)'),
    validate
  ]
};

// Search validation
const searchValidation = {
  search: [
    query('q').trim().notEmpty().isLength({ min: 2, max: 200 }).withMessage('Search query required (2-200 chars)'),
    query('fiscalYear').optional().isInt({ min: 2000, max: 2100 }),
    query('caseType').optional().isIn(['AUDIT', 'TAX', 'ADVISORY', 'COMPLIANCE', 'OTHER']),
    validate
  ]
};

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validate
];

// UUID param validation
const uuidValidation = [
  param('id').isUUID().withMessage('Valid ID required'),
  validate
];

module.exports = {
  validate,
  authValidation,
  caseValidation,
  clientValidation,
  userValidation,
  bundleValidation,
  searchValidation,
  paginationValidation,
  uuidValidation
};
