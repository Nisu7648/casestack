const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const { body } = require('express-validator');

// Apply authentication and activity logging to all routes
router.use(authenticate);
router.use(activityLogger);

// Validation
const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['ADMIN', 'PARTNER', 'MANAGER', 'CONSULTANT', 'VIEWER'])
];

const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('role').optional().isIn(['ADMIN', 'PARTNER', 'MANAGER', 'CONSULTANT', 'VIEWER'])
];

// Routes
router.get('/me', userController.getCurrentUser);
router.get('/', authorize('ADMIN', 'PARTNER', 'MANAGER'), userController.getAllUsers);
router.get('/:id', authorize('ADMIN', 'PARTNER', 'MANAGER'), userController.getUserById);
router.post('/', authorize('ADMIN', 'PARTNER'), createUserValidation, userController.createUser);
router.put('/:id', authorize('ADMIN', 'PARTNER'), updateUserValidation, userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);
router.patch('/:id/deactivate', authorize('ADMIN', 'PARTNER'), userController.deactivateUser);
router.patch('/:id/activate', authorize('ADMIN', 'PARTNER'), userController.activateUser);

module.exports = router;
