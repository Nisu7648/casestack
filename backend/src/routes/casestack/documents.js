const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT'));
    }
  }
});

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

// Get all documents for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const documents = await prisma.document.findMany({
      where: {
        caseId,
        isDeleted: false
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      documents,
      total: documents.length
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caseId, folderId, description, tags } = req.body;

    // Verify case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId }
    });

    if (!caseExists) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Case not found' });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        caseId,
        folderId: folderId || null,
        description: description || null,
        tags: tags ? JSON.parse(tags) : [],
        uploadedById: req.userId,
        version: 1
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('Document uploaded:', document.id);

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up file if database operation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/download/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set headers for download
    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);

    // Stream file
    const fileStream = require('fs').createReadStream(document.filePath);
    fileStream.pipe(res);

    // Log download
    console.log('Document downloaded:', document.id);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Update document metadata
router.put('/:id', async (req, res) => {
  try {
    const { fileName, description, tags, folderId } = req.body;

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        ...(fileName && { fileName }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(folderId !== undefined && { folderId })
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        folder: true
      }
    });

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Soft delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Create folder
router.post('/folders', async (req, res) => {
  try {
    const { name, caseId, parentId } = req.body;

    if (!name || !caseId) {
      return res.status(400).json({ error: 'Name and caseId required' });
    }

    const folder = await prisma.documentFolder.create({
      data: {
        id: uuidv4(),
        name,
        caseId,
        parentId: parentId || null
      }
    });

    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get folders for a case
router.get('/folders/case/:caseId', async (req, res) => {
  try {
    const folders = await prisma.documentFolder.findMany({
      where: {
        caseId: req.params.caseId
      },
      include: {
        documents: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            createdAt: true
          }
        },
        subfolders: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Search documents
router.get('/search', async (req, res) => {
  try {
    const { query, caseId, fileType, startDate, endDate } = req.query;

    const where = {
      isDeleted: false,
      ...(caseId && { caseId }),
      ...(fileType && { fileType }),
      ...(query && {
        OR: [
          { fileName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            id: true,
            caseName: true,
            caseNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json({
      success: true,
      documents,
      total: documents.length
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

module.exports = router;
