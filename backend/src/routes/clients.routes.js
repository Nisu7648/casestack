const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// MODULE B1 - Client Records
router.post('/', clientController.createClient);
router.get('/', clientController.listClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// MODULE B2 - Client Search
router.get('/search/text', clientController.searchClients);
router.get('/search/advanced', clientController.advancedSearch);
router.get('/filter/year', clientController.filterByYear);
router.get('/filter/engagement', clientController.filterByEngagement);

// MODULE B3 - Engagement History
router.get('/:id/engagements', clientController.getEngagementHistory);
router.get('/:id/reports', clientController.getClientReports);
router.get('/:id/summary', clientController.getClientSummary);

// Client Contacts
router.post('/:id/contacts', clientController.addContact);
router.get('/:id/contacts', clientController.getContacts);
router.put('/:id/contacts/:contactId', clientController.updateContact);
router.delete('/:id/contacts/:contactId', clientController.deleteContact);

// Client Notes
router.post('/:id/notes', clientController.addNote);
router.get('/:id/notes', clientController.getNotes);

// Client Documents
router.post('/:id/documents', clientController.uploadDocument);
router.get('/:id/documents', clientController.getDocuments);

module.exports = router;
