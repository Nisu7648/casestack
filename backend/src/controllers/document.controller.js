const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const path = require('path');

/**
 * Upload document
 */
const uploadDocument = async (req, res) => {
  try {
    const { caseId, category, description, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: category || 'OTHER',
        description,
        tags: tags ? tags.split(',') : [],
        caseId,
        uploadedById: req.user.id,
        version: 1
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'document',
        entityId: document.id,
        description: `Uploaded document "${file.originalname}"`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'Document', document.id, { 
      name: file.originalname,
      size: file.size 
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

/**
 * Upload multiple documents
 */
const uploadMultipleDocuments = async (req, res) => {
  try {
    const { caseId, category } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const documents = await Promise.all(
      files.map(file =>
        prisma.document.create({
          data: {
            name: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            category: category || 'OTHER',
            caseId,
            uploadedById: req.user.id,
            version: 1
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })
      )
    );

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'document',
        description: `Uploaded ${files.length} documents`,
        userId: req.user.id,
        caseId
      }
    });

    res.status(201).json({
      success: true,
      message: `${files.length} documents uploaded successfully`,
      data: documents
    });
  } catch (error) {
    console.error('Upload multiple documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents'
    });
  }
};

/**
 * Get documents by case
 */
const getDocumentsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { category, search } = req.query;

    const where = { caseId };
    
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total size
    const totalSize = documents.reduce((sum, doc) => sum + parseInt(doc.fileSize), 0);

    // Group by category
    const byCategory = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        documents,
        stats: {
          total: documents.length,
          totalSize,
          byCategory
        }
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

/**
 * Get document by ID
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        shares: {
          include: {
            sharedWith: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
};

/**
 * Download document
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Increment download count
    await prisma.document.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    // Send file
    res.download(document.filePath, document.name);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
};

/**
 * Preview document
 */
const previewDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update last accessed
    await prisma.document.update({
      where: { id },
      data: { lastAccessedAt: new Date() }
    });

    // Send file for preview
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error('Preview document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview document'
    });
  }
};

/**
 * Update document
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, tags } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        name,
        description,
        category,
        tags: tags ? tags.split(',') : undefined
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
};

/**
 * Delete document
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete document record
    await prisma.document.delete({ where: { id } });

    await req.logActivity('DELETE', 'Document', id, { name: document.name });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

/**
 * Share document
 */
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, expiresAt, canDownload, canEdit } = req.body;

    const shares = await Promise.all(
      userIds.map(userId =>
        prisma.documentShare.create({
          data: {
            documentId: id,
            sharedWithId: userId,
            sharedById: req.user.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            canDownload: canDownload !== false,
            canEdit: canEdit || false
          }
        })
      )
    );

    res.json({
      success: true,
      message: 'Document shared successfully',
      data: shares
    });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document'
    });
  }
};

/**
 * Get document versions
 */
const getDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { version: 'desc' }
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch versions'
    });
  }
};

/**
 * Upload new version
 */
const uploadNewVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Create version record for old file
    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: document.version,
        fileName: document.fileName,
        filePath: document.filePath,
        fileSize: document.fileSize,
        uploadedById: document.uploadedById
      }
    });

    // Update document with new file
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        version: { increment: 1 },
        uploadedById: req.user.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'New version uploaded successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Upload version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload new version'
    });
  }
};

module.exports = {
  uploadDocument,
  uploadMultipleDocuments,
  getDocumentsByCase,
  getDocumentById,
  downloadDocument,
  previewDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  getDocumentVersions,
  uploadNewVersion
};
