const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// MODULE C1 - Report Metadata
router.post('/', reportController.createReport);
router.get('/', reportController.listReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

// MODULE C2 - Report Status Flow
router.patch('/:id/status', reportController.updateStatus);
router.post('/:id/submit-review', reportController.submitForReview);
router.post('/:id/finalize', reportController.finalizeReport);
router.post('/:id/lock', reportController.lockReport);

// MODULE C3 - Structured Sections
router.post('/:id/sections', reportController.addSection);
router.get('/:id/sections', reportController.getSections);
router.put('/:id/sections/:sectionId', reportController.updateSection);
router.delete('/:id/sections/:sectionId', reportController.deleteSection);

// Report Team
router.post('/:id/team', reportController.addTeamMember);
router.get('/:id/team', reportController.getTeam);
router.delete('/:id/team/:userId', reportController.removeTeamMember);

// Report Export
router.get('/:id/export/pdf', reportController.exportPDF);
router.get('/:id/export/word', reportController.exportWord);

module.exports = router;
