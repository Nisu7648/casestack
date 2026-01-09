const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');
const fileStorageService = require('../../services/fileStorage.service');
const pdfExportService = require('../../services/pdfExport.service');
const archiver = require('archiver');
const fs = require('fs');

const prisma = new PrismaClient();
const upload = fileStorageService.getMulterConfig();

router.use(authenticate);

// ============================================
// FILE BUNDLE MODULE (ENHANCED)
// Upload, download, export with file integrity
// ============================================

// Get all bundles for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { firm: true }
    });

    if (!caseData || caseData.firmId !== req.firmId) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const bundles = await prisma.caseBundle.findMany({
      where: { caseId },
      include: {
        files: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bundles });
  } catch (error) {
    console.error('Get bundles error:', error);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

// Create new bundle
router.post('/case/:caseId', auditLogger('BUNDLE_CREATED', 'BUNDLE'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { bundleName } = req.body;

    const caseData = await prisma.case.findUnique({
      where: { id: caseId }
    });

    if (!caseData || caseData.firmId !== req.firmId) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Cannot create bundle for finalized case' });
    }

    const bundle = await prisma.caseBundle.create({
      data: {
        bundleName: bundleName || 'Document Bundle',
        caseId,
        version: 1
      }
    });

    res.json({ bundle });
  } catch (error) {
    console.error('Create bundle error:', error);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

// Upload files to bundle (ENHANCED WITH ACTUAL FILE STORAGE)
router.post('/:bundleId/upload', upload.array('files', 10), auditLogger('FILE_UPLOADED', 'FILE'), async (req, res) => {
  try {
    const { bundleId } = req.params;

    const bundle = await prisma.caseBundle.findUnique({
      where: { id: bundleId },
      include: {
        case: true
      }
    });

    if (!bundle || bundle.case.firmId !== req.firmId) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (bundle.case.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Cannot upload to finalized case' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Upload files and create records
    const uploadedFiles = [];

    for (const file of req.files) {
      // Upload file to storage (S3 or local)
      const fileData = await fileStorageService.uploadFile(
        file,
        req.firmId,
        bundle.caseId
      );

      // Determine file type
      let fileType = 'OTHER';
      if (file.mimetype === 'application/pdf') fileType = 'PDF';
      else if (file.mimetype.includes('spreadsheet')) fileType = 'XLSX';
      else if (file.mimetype.includes('wordprocessing')) fileType = 'DOCX';
      else if (file.mimetype === 'application/zip') fileType = 'ZIP';

      // Create file record
      const fileRecord = await prisma.caseFile.create({
        data: {
          fileName: fileData.fileName,
          fileType,
          fileSize: fileData.fileSize,
          fileHash: fileData.fileHash,
          bundleId,
          storageUrl: fileData.storageUrl,
          storagePath: fileData.storagePath,
          uploadedById: req.userId,
          isLocked: false
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      uploadedFiles.push(fileRecord);
    }

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// Download single file (ENHANCED WITH ACTUAL FILE DOWNLOAD)
router.get('/file/:fileId/download', auditLogger('FILE_DOWNLOADED', 'FILE'), async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.caseFile.findUnique({
      where: { id: fileId },
      include: {
        bundle: {
          include: {
            case: true
          }
        }
      }
    });

    if (!file || file.bundle.case.firmId !== req.firmId) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Log download
    await prisma.downloadLog.create({
      data: {
        caseId: file.bundle.caseId,
        userId: req.userId,
        downloadType: 'SINGLE_FILE',
        fileIds: [fileId],
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Get file stream
    const fileStream = await fileStorageService.getFileStream(file.storagePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download full bundle as ZIP
router.get('/:bundleId/download', auditLogger('BUNDLE_DOWNLOADED', 'BUNDLE'), async (req, res) => {
  try {
    const { bundleId } = req.params;

    const bundle = await prisma.caseBundle.findUnique({
      where: { id: bundleId },
      include: {
        files: true,
        case: true
      }
    });

    if (!bundle || bundle.case.firmId !== req.firmId) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Log download
    await prisma.downloadLog.create({
      data: {
        caseId: bundle.caseId,
        userId: req.userId,
        downloadType: 'FULL_BUNDLE',
        fileIds: bundle.files.map(f => f.id),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bundle.bundleName}-${Date.now()}.zip"`);
    
    archive.pipe(res);

    // Add files to archive
    for (const file of bundle.files) {
      const fileStream = await fileStorageService.getFileStream(file.storagePath);
      archive.append(fileStream, { name: file.fileName });
    }

    archive.finalize();
  } catch (error) {
    console.error('Bundle download error:', error);
    res.status(500).json({ error: 'Failed to download bundle' });
  }
});

// Download all case files (audit-ready export)
router.get('/case/:caseId/download-all', auditLogger('CASE_EXPORTED', 'CASE'), async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        preparedBy: true,
        reviewedBy: true,
        approvedBy: true,
        bundles: {
          include: {
            files: true
          }
        }
      }
    });

    if (!caseData || caseData.firmId !== req.firmId) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get approval chain
    const approvalChain = await prisma.approvalChain.findMany({
      where: { caseId },
      include: {
        actionBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Generate PDF export
    const pdfResult = await pdfExportService.generateCaseExportPDF(
      caseData,
      caseData.bundles,
      approvalChain
    );

    // Log download
    const allFileIds = caseData.bundles.flatMap(b => b.files.map(f => f.id));
    await prisma.downloadLog.create({
      data: {
        caseId,
        userId: req.userId,
        downloadType: 'AUDIT_EXPORT',
        fileIds: allFileIds,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Create ZIP with PDF + all files
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="CASE-${caseData.caseNumber}-EXPORT-${Date.now()}.zip"`);
    
    archive.pipe(res);

    // Add PDF export
    archive.file(pdfResult.filePath, { name: pdfResult.fileName });

    // Add all files organized by bundle
    for (const bundle of caseData.bundles) {
      for (const file of bundle.files) {
        const fileStream = await fileStorageService.getFileStream(file.storagePath);
        archive.append(fileStream, { name: `${bundle.bundleName}/${file.fileName}` });
      }
    }

    archive.finalize();

    // Clean up PDF after sending
    archive.on('end', () => {
      fs.unlinkSync(pdfResult.filePath);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export case' });
  }
});

// Delete file (only if not locked)
router.delete('/file/:fileId', auditLogger('FILE_DELETED', 'FILE'), async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.caseFile.findUnique({
      where: { id: fileId },
      include: {
        bundle: {
          include: {
            case: true
          }
        }
      }
    });

    if (!file || file.bundle.case.firmId !== req.firmId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.isLocked || file.bundle.case.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Cannot delete locked or finalized file' });
    }

    // Delete from storage
    await fileStorageService.deleteFile(file.storagePath);

    // Delete from database
    await prisma.caseFile.delete({
      where: { id: fileId }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
