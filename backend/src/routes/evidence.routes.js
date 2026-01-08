const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// MODULE D1 - Evidence Reference List
router.post('/', evidenceController.createEvidence);
router.get('/report/:reportId', evidenceController.getEvidenceByReport);
router.get('/:id', evidenceController.getEvidenceById);
router.put('/:id', evidenceController.updateEvidence);
router.delete('/:id', evidenceController.deleteEvidence);

// MODULE D2 - Evidence History
router.get('/:id/versions', evidenceController.getVersionHistory);
router.post('/:id/new-version', evidenceController.createNewVersion);

// Evidence Verification
router.post('/:id/verify', evidenceController.verifyEvidence);
router.post('/:id/reject', evidenceController.rejectEvidence);

// Evidence Comments
router.post('/:id/comments', evidenceController.addComment);
router.get('/:id/comments', evidenceController.getComments);

// Audit Trail
router.get('/:id/audit-trail', evidenceController.getAuditTrail);

module.exports = router;
