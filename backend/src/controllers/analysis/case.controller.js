// ============================================
// CASE CONTROLLER
// Handles all case-related operations
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// CREATE CASE
// ============================================

exports.createCase = async (req, res) => {
  try {
    const { title, description, category, priority, tags } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Generate case number
    const caseCount = await prisma.case.count({
      where: { organizationId }
    });
    const caseNumber = `CASE-${String(caseCount + 1).padStart(6, '0')}`;

    // Create case
    const newCase = await prisma.case.create({
      data: {
        title,
        description,
        caseNumber,
        category,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        organizationId,
        createdById: userId,
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map(tagId => ({
              tagId
            }))
          }
        })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: error.message
    });
  }
};

// ============================================
// GET ALL CASES
// ============================================

exports.getAllCases = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;

    // Build filter
    const where = {
      organizationId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { caseNumber: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Get total count
    const total = await prisma.case.count({ where });

    // Get cases
    const cases = await prisma.case.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            documents: true,
            analyses: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: cases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cases',
      error: error.message
    });
  }
};

// ============================================
// GET CASE BY ID
// ============================================

exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const caseData = await prisma.case.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        analyses: {
          include: {
            analyst: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        timeline: {
          orderBy: {
            eventDate: 'desc'
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case',
      error: error.message
    });
  }
};

// ============================================
// UPDATE CASE
// ============================================

exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { title, description, status, priority, category } = req.body;

    // Check if case exists
    const existingCase = await prisma.case.findFirst({
      where: { id, organizationId }
    });

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category !== undefined && { category }),
        ...(status === 'CLOSED' && !existingCase.closedAt && {
          closedAt: new Date()
        })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: error.message
    });
  }
};

// ============================================
// DELETE CASE
// ============================================

exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Check if case exists
    const existingCase = await prisma.case.findFirst({
      where: { id, organizationId }
    });

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Delete case (cascade will handle related records)
    await prisma.case.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete case',
      error: error.message
    });
  }
};

// ============================================
// GET CASE STATISTICS
// ============================================

exports.getCaseStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalCases,
      openCases,
      inProgressCases,
      closedCases,
      criticalCases
    ] = await Promise.all([
      prisma.case.count({ where: { organizationId } }),
      prisma.case.count({ where: { organizationId, status: 'OPEN' } }),
      prisma.case.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
      prisma.case.count({ where: { organizationId, status: 'CLOSED' } }),
      prisma.case.count({ where: { organizationId, priority: 'CRITICAL' } })
    ]);

    res.json({
      success: true,
      data: {
        total: totalCases,
        byStatus: {
          open: openCases,
          inProgress: inProgressCases,
          closed: closedCases
        },
        critical: criticalCases
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
