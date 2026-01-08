const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

// ============================================
// FILE BUNDLE & ARCHIVAL ENGINE
// Files are uploaded ONLY for finalization
// ============================================

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max per file
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, XLSX, DOCX, and ZIP allowed.'));
    }
  }
});

router.use(authenticate);

// Get all bundles for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const bundles = await prisma.caseBundle.findMany({
      where: {
        caseId: req.params.caseId,
        case: {
          firmId: req.firmId
        }
      },
      include: {
        files: {
          include: {
            uploadedBy: {
              select: { firstName: true, lastName: true }
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
    const { bundleName } = req.body;

    if (!bundleName) {
      return res.status(400).json({ error: 'Bundle name is required' });
    }

    // Verify case exists and is not finalized
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.caseId,
        firmId: req.firmId
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Cannot add bundles to finalized case' });
    }

    const bundle = await prisma.caseBundle.create({
      data: {
        bundleName,
        caseId: req.params.caseId,
        version: 1
      }
    });

    res.status(201).json({ bundle });
  } catch (error) {
    console.error('Create bundle error:', error);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

// Upload files to bundle
router.post('/:bundleId/upload', upload.array('files', 20), auditLogger('FILE_UPLOADED', 'FILE'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify bundle exists and case is not finalized
    const bundle = await prisma.caseBundle.findFirst({
      where: {
        id: req.params.bundleId,
        case: {
          firmId: req.firmId
        }
      },
      include: {
        case: true
      }
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (bundle.case.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Cannot upload files to finalized case' });
    }

    if (bundle.isFinalized) {
      return res.status(400).json({ error: 'Bundle is finalized' });
    }

    // Process each file
    const uploadedFiles = [];

    for (const file of req.files) {
      // Calculate file hash for integrity
      const fileHash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Determine file type
      let fileType = 'OTHER';
      if (file.mimetype === 'application/pdf') fileType = 'PDF';
      else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) fileType = 'XLSX';
      else if (file.mimetype.includes('word')) fileType = 'DOCX';
      else if (file.mimetype.includes('zip')) fileType = 'ZIP';

      // In production, upload to S3/Azure Blob
      // For now, store metadata only
      const storageUrl = `file://storage/${bundle.caseId}/${req.params.bundleId}/${file.originalname}`;
      const storagePath = `/storage/${bundle.caseId}/${req.params.bundleId}/${file.originalname}`;

      const uploadedFile = await prisma.caseFile.create({
        data: {
          fileName: file.originalname,
          fileType,
          fileSize: file.size,
          fileHash,
          bundleId: req.params.bundleId,
          storageUrl,
          storagePath,
          uploadedById: req.userId
        },
        include: {
          uploadedBy: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      uploadedFiles.push(uploadedFile);
    }

    res.status(201).json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Download single file (with tracking)
router.get('/file/:fileId/download', auditLogger('FILE_DOWNLOADED', 'FILE'), async (req, res) => {
  try {
    const file = await prisma.caseFile.findFirst({
      where: {
        id: req.params.fileId,
        bundle: {
          case: {
            firmId: req.firmId
          }
        }
      },
      include: {
        bundle: {
          include: {
            case: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Log download
    await prisma.downloadLog.create({
      data: {
        caseId: file.bundle.caseId,
        userId: req.userId,
        downloadType: 'SINGLE_FILE',
        fileIds: [file.id],
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // In production, generate signed URL from S3/Azure
    // For now, return file metadata
    res.json({
      message: 'File download initiated',
      file: {
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        downloadUrl: file.storageUrl // In production, this would be a signed URL
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download full bundle (with tracking)
router.get('/:bundleId/download', auditLogger('BUNDLE_DOWNLOADED', 'BUNDLE'), async (req, res) => {
  try {
    const bundle = await prisma.caseBundle.findFirst({
      where: {
        id: req.params.bundleId,
        case: {
          firmId: req.firmId
        }
      },
      include: {
        files: true,
        case: true
      }
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (bundle.files.length === 0) {
      return res.status(400).json({ error: 'Bundle has no files' });
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

    // In production, create ZIP and return signed URL
    res.json({
      message: 'Bundle download initiated',
      bundle: {
        bundleName: bundle.bundleName,
        fileCount: bundle.files.length,
        totalSize: bundle.files.reduce((sum, f) => sum + f.fileSize, 0),
        files: bundle.files.map(f => ({
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize
        }))
      }
    });
  } catch (error) {
    console.error('Download bundle error:', error);
    res.status(500).json({ error: 'Failed to download bundle' });
  }
});

// Download full case (all bundles) - Audit-ready export
router.get('/case/:caseId/download-all', auditLogger('CASE_EXPORTED', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.caseId,
        firmId: req.firmId
      },
      include: {
        client: true,
        preparedBy: {
          select: { firstName: true, lastName: true }
        },
        reviewedBy: {
          select: { firstName: true, lastName: true }
        },
        approvedBy: {
          select: { firstName: true, lastName: true }
        },
        bundles: {
          include: {
            files: true
          }
        },
        approvalChain: {
          include: {
            actionBy: {
              select: { firstName: true, lastName: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const allFiles = caseData.bundles.flatMap(b => b.files);

    if (allFiles.length === 0) {
      return res.status(400).json({ error: 'Case has no files' });
    }

    // Log download
    await prisma.downloadLog.create({
      data: {
        caseId: req.params.caseId,
        userId: req.userId,
        downloadType: 'AUDIT_EXPORT',
        fileIds: allFiles.map(f => f.id),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Generate audit-ready export package
    const exportPackage = {
      caseNumber: caseData.caseNumber,
      caseName: caseData.caseName,
      client: caseData.client.name,
      fiscalYear: caseData.fiscalYear,
      status: caseData.status,
      
      responsibilityChain: {
        preparedBy: `${caseData.preparedBy.firstName} ${caseData.preparedBy.lastName}`,
        reviewedBy: caseData.reviewedBy ? `${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName}` : null,
        approvedBy: caseData.approvedBy ? `${caseData.approvedBy.firstName} ${caseData.approvedBy.lastName}` : null,
        finalizedAt: caseData.finalizedAt
      },
      
      approvalHistory: caseData.approvalChain.map(a => ({
        action: a.action,
        by: `${a.actionBy.firstName} ${a.actionBy.lastName} (${a.actionBy.role})`,
        at: a.createdAt,
        comments: a.comments
      })),
      
      bundles: caseData.bundles.map(b => ({
        bundleName: b.bundleName,
        version: b.version,
        isFinalized: b.isFinalized,
        fileCount: b.files.length,
        files: b.files.map(f => ({
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          fileHash: f.fileHash,
          isLocked: f.isLocked
        }))
      })),
      
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, f) => sum + f.fileSize, 0)
    };

    res.json({
      message: 'Audit-ready export package generated',
      export: exportPackage
    });
  } catch (error) {
    console.error('Export case error:', error);
    res.status(500).json({ error: 'Failed to export case' });
  }
});

// Delete file (only if case not finalized)
router.delete('/file/:fileId', auditLogger('FILE_DELETED', 'FILE'), async (req, res) => {
  try {
    const file = await prisma.caseFile.findFirst({
      where: {
        id: req.params.fileId,
        bundle: {
          case: {
            firmId: req.firmId
          }
        }
      },
      include: {
        bundle: {
          include: {
            case: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.isLocked) {
      return res.status(403).json({ error: 'Cannot delete locked file' });
    }

    if (file.bundle.case.status === 'FINALIZED') {
      return res.status(403).json({ error: 'Cannot delete files from finalized case' });
    }

    await prisma.caseFile.delete({
      where: { id: req.params.fileId }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
