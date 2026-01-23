const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for LegalStack API
 * Provides comprehensive input validation and sanitization
 */

// ============================================
// VALIDATION RESULT HANDLER
// ============================================

/**
 * Check validation results and return errors if any
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// ============================================
// AUTH VALIDATION
// ============================================

const validateRegister = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name is too long'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name is too long'),
  
  body('firmName')
    .trim()
    .notEmpty().withMessage('Firm name is required')
    .isLength({ max: 200 }).withMessage('Firm name is too long'),
  
  body('country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ min: 2, max: 2 }).withMessage('Invalid country code'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

// ============================================
// CASE VALIDATION
// ============================================

const validateCreateCase = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  
  body('clientId')
    .notEmpty().withMessage('Client is required')
    .isUUID().withMessage('Invalid client ID'),
  
  body('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('budget')
    .optional()
    .isFloat({ min: 0, max: 100000000 }).withMessage('Invalid budget amount'),
  
  handleValidationErrors
];

const validateUpdateCase = [
  param('id')
    .isUUID().withMessage('Invalid case ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  
  body('clientId')
    .optional()
    .isUUID().withMessage('Invalid client ID'),
  
  body('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  
  handleValidationErrors
];

// ============================================
// CLIENT VALIDATION
// ============================================

const validateCreateClient = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number'),
  
  body('type')
    .optional()
    .isIn(['INDIVIDUAL', 'COMPANY']).withMessage('Invalid client type'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name is too long'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address is too long'),
  
  handleValidationErrors
];

// ============================================
// DOCUMENT VALIDATION
// ============================================

const validateUploadDocument = [
  body('caseId')
    .notEmpty().withMessage('Case ID is required')
    .isUUID().withMessage('Invalid case ID'),
  
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title is too long'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description is too long'),
  
  handleValidationErrors
];

// ============================================
// TASK VALIDATION
// ============================================

const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description is too long'),
  
  body('caseId')
    .optional()
    .isUUID().withMessage('Invalid case ID'),
  
  body('assignedTo')
    .optional()
    .isUUID().withMessage('Invalid user ID'),
  
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  
  handleValidationErrors
];

// ============================================
// TIME ENTRY VALIDATION
// ============================================

const validateCreateTimeEntry = [
  body('caseId')
    .notEmpty().withMessage('Case ID is required')
    .isUUID().withMessage('Invalid case ID'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 1000 }).withMessage('Description must be 5-1000 characters'),
  
  body('hours')
    .isFloat({ min: 0.1, max: 24 }).withMessage('Hours must be between 0.1 and 24'),
  
  body('rate')
    .isFloat({ min: 0, max: 10000 }).withMessage('Rate must be between 0 and 10000'),
  
  body('date')
    .isISO8601().withMessage('Invalid date format'),
  
  body('billable')
    .optional()
    .isBoolean().withMessage('Billable must be true or false'),
  
  handleValidationErrors
];

// ============================================
// INVOICE VALIDATION
// ============================================

const validateCreateInvoice = [
  body('caseId')
    .notEmpty().withMessage('Case ID is required')
    .isUUID().withMessage('Invalid case ID'),
  
  body('clientId')
    .notEmpty().withMessage('Client ID is required')
    .isUUID().withMessage('Invalid client ID'),
  
  body('invoiceNumber')
    .trim()
    .notEmpty().withMessage('Invoice number is required')
    .isLength({ max: 50 }).withMessage('Invoice number is too long'),
  
  body('issueDate')
    .isISO8601().withMessage('Invalid issue date'),
  
  body('dueDate')
    .isISO8601().withMessage('Invalid due date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.issueDate)) {
        throw new Error('Due date must be after issue date');
      }
      return true;
    }),
  
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  
  body('items.*.description')
    .trim()
    .notEmpty().withMessage('Item description is required'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be positive'),
  
  body('items.*.rate')
    .isFloat({ min: 0 }).withMessage('Rate must be positive'),
  
  handleValidationErrors
];

// ============================================
// QUERY VALIDATION
// ============================================

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Search query must be 1-200 characters'),
  
  handleValidationErrors
];

// ============================================
// ID VALIDATION
// ============================================

const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

module.exports = {
  // Auth
  validateRegister,
  validateLogin,
  
  // Cases
  validateCreateCase,
  validateUpdateCase,
  
  // Clients
  validateCreateClient,
  
  // Documents
  validateUploadDocument,
  
  // Tasks
  validateCreateTask,
  
  // Time entries
  validateCreateTimeEntry,
  
  // Invoices
  validateCreateInvoice,
  
  // Query
  validatePagination,
  validateSearch,
  
  // ID
  validateUUID,
  
  // Handler
  handleValidationErrors,
};
