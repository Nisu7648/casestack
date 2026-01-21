const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { deleteFile, getDownloadUrl, getSecureUrl } = require('../config/cloudinary');

/**
 * Upload document to Cloudinary
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

    // Cloudinary file data
    const cloudinaryData = {
      publicId: file.filename,
      url: file.path,
      secureUrl: file.secure_url || file.path,
      format: file.format,
      resourceType: file.resource_type,
      bytes: file.bytes,
    };

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        fileName: file.filename,
        fileUrl: cloudinaryData.secureUrl,
        fileSize: file.bytes || file.size,
        mimeType: file.mimetype,
        type: category || 'OTHER',
        description,
        caseId,
        uploadedById: req.user.id,
        version: 1,
        // Store Cloudinary metadata as JSON string
        metadata: JSON.stringify(cloudinaryData)
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
        action: 'UPLOADED',
        entity: 'document',
        entityId: document.id,
        description: `Uploaded document "${file.originalname}"`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'Document', document.id, { 
      name: file.originalname,
      size: file.bytes || file.size
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
      message: 'Failed to upload document',
      error: error.message
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
      files.map(file => {
        const cloudinaryData = {
          publicId: file.filename,
          url: file.path,
          secureUrl: file.secure_url || file.path,
          format: file.format,
          resourceType: file.resource_type,
          bytes: file.bytes,
        };

        return prisma.document.create({
          data: {
            name: file.originalname,
            fileName: file.filename,
            fileUrl: cloudinaryData.secureUrl,
            fileSize: file.bytes || file.size,
            mimeType: file.mimetype,
            type: category || 'OTHER',
            caseId,
            uploadedById: req.user.id,
            version: 1,
            metadata: JSON.stringify(cloudinaryData)
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
      })
    );

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPLOADED',
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
      message: 'Failed to upload documents',
      error: error.message
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
    
    if (category) where.type = category;
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total size
    const totalSize = documents.reduce((sum, doc) => sum + parseInt(doc.fileSize), 0);

    // Group by category
    const byCategory = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
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
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
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

    // Parse metadata to get publicId
    const metadata = JSON.parse(document.metadata || '{}');
    const publicId = metadata.publicId || document.fileName;

    // Generate download URL
    const downloadUrl = getDownloadUrl(publicId, document.name);

    // Log activity
    await prisma.caseActivity.create({
      data: {
        action: 'DOWNLOADED',
        entity: 'document',
        entityId: document.id,
        description: `Downloaded document "${document.name}"`,
        userId: req.user.id,
        caseId: document.caseId
      }
    });

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: document.name,
        fileSize: document.fileSize,
        mimeType: document.mimeType
      }
    });
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link'
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

    // Parse metadata
    const metadata = JSON.parse(document.metadata || '{}');
    const publicId = metadata.publicId || document.fileName;

    // Generate secure preview URL
    const previewUrl = getSecureUrl(publicId, {
      transformation: [
        { width: 800, crop: 'limit' }
      ]
    });

    res.json({
      success: true,
      data: {
        previewUrl,
        fileName: document.name,
        mimeType: document.mimeType
      }
    });
  } catch (error) {
    console.error('Preview document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview'
    });
  }
};

/**
 * Update document
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        name,
        description,
        type
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

    await req.logActivity('UPDATE', 'Document', id, { name, description, type });

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

    // Parse metadata to get publicId
    const metadata = JSON.parse(document.metadata || '{}');
    const publicId = metadata.publicId || document.fileName;

    // Delete from Cloudinary
    try {
      await deleteFile(publicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'DELETED',
        entity: 'document',
        entityId: id,
        description: `Deleted document "${document.name}"`,
        userId: req.user.id,
        caseId: document.caseId
      }
    });

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
 * Share document (placeholder)
 */
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, expiresAt } = req.body;

    // TODO: Implement document sharing logic
    // This could create share links or grant access to specific users

    res.json({
      success: true,
      message: 'Document sharing feature coming soon'
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
 * Get document versions (placeholder)
 */
const getDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement versioning logic
    // Could track versions in metadata or separate table

    res.json({
      success: true,
      message: 'Document versioning feature coming soon',
      data: []
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
 * Upload new version (placeholder)
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

    // TODO: Implement versioning logic
    // Could increment version number and keep old file

    res.json({
      success: true,
      message: 'Document versioning feature coming soon'
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
