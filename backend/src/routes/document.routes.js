const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const { upload } = require('../config/cloudinary');

// Apply authentication and activity logging to all routes
router.use(authenticate);
router.use(activityLogger);

// Routes
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.post('/upload-multiple', upload.array('files', 10), documentController.uploadMultipleDocuments);
router.get('/case/:caseId', documentController.getDocumentsByCase);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id/preview', documentController.previewDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/share', documentController.shareDocument);
router.get('/:id/versions', documentController.getDocumentVersions);
router.post('/:id/version', upload.single('file'), documentController.uploadNewVersion);

module.exports = router;
