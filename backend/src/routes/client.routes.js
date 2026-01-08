const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const { body } = require('express-validator');

// Apply authentication and activity logging
router.use(authenticate);
router.use(activityLogger);

// Validation
const createClientValidation = [
  body('name').trim().notEmpty().withMessage('Client name is required'),
  body('country').optional().isString(),
  body('industry').optional().isString(),
  body('contactEmail').optional().isEmail()
];

// Routes
router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.post('/', createClientValidation, clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', authorize('ADMIN', 'PARTNER'), clientController.deleteClient);

// Client contacts
router.post('/:id/contacts', clientController.addContact);
router.put('/:id/contacts/:contactId', clientController.updateContact);
router.delete('/:id/contacts/:contactId', clientController.deleteContact);

module.exports = router;
