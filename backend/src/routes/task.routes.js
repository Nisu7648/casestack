const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const { body } = require('express-validator');

router.use(authenticate);
router.use(activityLogger);

// Validation
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('caseId').isUUID().withMessage('Valid case ID is required'),
  body('type').optional().isIn(['TASK', 'DELIVERABLE', 'MILESTONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
];

// Routes
router.get('/case/:caseId', taskController.getTasksByCase);
router.get('/:id', taskController.getTaskById);
router.post('/', createTaskValidation, taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.post('/:id/comments', taskController.addComment);
router.get('/:id/comments', taskController.getComments);

module.exports = router;
