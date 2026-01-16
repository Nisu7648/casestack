// ============================================
// ANALYSIS CONTROLLER
// Handles case analysis operations
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// CREATE ANALYSIS
// ============================================

exports.createAnalysis = async (req, res) => {
  try {
    const { caseId, type, title, content, findings, documentIds } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Verify case belongs to organization
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, organizationId }
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Create analysis
    const analysis = await prisma.analysis.create({
      data: {
        type,
        title,
        content,
        findings,
        status: 'DRAFT',
        caseId,
        analystId: userId,
        ...(documentIds && documentIds.length > 0 && {
          documents: {
            create: documentIds.map(docId => ({
              documentId: docId
            }))
          }
        })
      },
      include: {
        analyst: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Create analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create analysis',
      error: error.message
    });
  }
};

// ============================================
// GET ANALYSES FOR CASE
// ============================================

exports.getAnalysesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const organizationId = req.user.organizationId;
    const { type, status } = req.query;

    // Verify case belongs to organization
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, organizationId }
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Build filter
    const where = {
      caseId,
      ...(type && { type }),
      ...(status && { status })
    };

    const analyses = await prisma.analysis.findMany({
      where,
      include: {
        analyst: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                fileType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message
    });
  }
};

// ============================================
// GET ANALYSIS BY ID
// ============================================

exports.getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        case: {
          organizationId
        }
      },
      include: {
        analyst: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis',
      error: error.message
    });
  }
};

// ============================================
// UPDATE ANALYSIS
// ============================================

exports.updateAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { title, content, findings, status } = req.body;

    // Verify analysis exists and belongs to organization
    const existingAnalysis = await prisma.analysis.findFirst({
      where: {
        id,
        case: {
          organizationId
        }
      }
    });

    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Update analysis
    const updatedAnalysis = await prisma.analysis.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(findings && { findings }),
        ...(status && { status }),
        ...(status === 'PUBLISHED' && !existingAnalysis.publishedAt && {
          publishedAt: new Date()
        })
      },
      include: {
        analyst: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedAnalysis
    });
  } catch (error) {
    console.error('Update analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update analysis',
      error: error.message
    });
  }
};

// ============================================
// DELETE ANALYSIS
// ============================================

exports.deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify analysis exists and belongs to organization
    const existingAnalysis = await prisma.analysis.findFirst({
      where: {
        id,
        case: {
          organizationId
        }
      }
    });

    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Delete analysis
    await prisma.analysis.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message
    });
  }
};

// ============================================
// LINK DOCUMENT TO ANALYSIS
// ============================================

exports.linkDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentId, highlights, notes } = req.body;
    const organizationId = req.user.organizationId;

    // Verify analysis exists
    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        case: {
          organizationId
        }
      }
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Verify document exists and belongs to same case
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        caseId: analysis.caseId
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or does not belong to this case'
      });
    }

    // Create link
    const link = await prisma.documentAnalysis.create({
      data: {
        documentId,
        analysisId: id,
        highlights,
        notes
      },
      include: {
        document: true
      }
    });

    res.status(201).json({
      success: true,
      data: link
    });
  } catch (error) {
    console.error('Link document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link document',
      error: error.message
    });
  }
};

// ============================================
// UNLINK DOCUMENT FROM ANALYSIS
// ============================================

exports.unlinkDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify analysis exists
    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        case: {
          organizationId
        }
      }
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Delete link
    await prisma.documentAnalysis.deleteMany({
      where: {
        analysisId: id,
        documentId
      }
    });

    res.json({
      success: true,
      message: 'Document unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink document',
      error: error.message
    });
  }
};
