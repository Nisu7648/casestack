const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossier.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// MODULE F1 - Dossier PDF Generator
router.post('/generate/:reportId', dossierController.generateDossier);
router.get('/preview/:reportId', dossierController.previewDossier);

// MODULE F2 - Download/Print Action
router.get('/download/:dossierId', dossierController.downloadDossier);
router.post('/print/:reportId', dossierController.printDossier);

// Dossier Templates
router.get('/templates', dossierController.getTemplates);
router.post('/templates', dossierController.createTemplate);

// Dossier History
router.get('/history/:reportId', dossierController.getDossierHistory);

// Cleanup
router.delete('/cleanup', dossierController.cleanupTempFiles);

module.exports = router;
