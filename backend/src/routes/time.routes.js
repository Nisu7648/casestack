const express = require('express');
const router = express.Router();
const timeController = require('../controllers/time.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// Routes
router.get('/case/:caseId', timeController.getTimeEntriesByCase);
router.get('/active', timeController.getActiveTimer);
router.post('/start', timeController.startTimer);
router.post('/stop', timeController.stopTimer);
router.post('/', timeController.createTimeEntry);
router.put('/:id', timeController.updateTimeEntry);
router.delete('/:id', timeController.deleteTimeEntry);

module.exports = router;
