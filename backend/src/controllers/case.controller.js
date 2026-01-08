const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

/**
 * Get all cases with search, filters, and pagination
 * Main dashboard endpoint
 */
const getAllCases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      priority,
      caseType,
      clientId,
      leadId,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      isArchived = 'false'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      firmId: req.user.firmId,
      isArchived: isArchived === 'true'
    };

    // Search across title, caseNumber, client name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (caseType) where.caseType = caseType;
    if (clientId) where.clientId = clientId;
    if (leadId) where.leadId = leadId;

    // Role-based filtering
    if (req.user.role === 'CONSULTANT') {
      // Consultants only see cases they're involved in
      where.OR = [
        { leadId: req.user.id },
        { members: { some: { userId: req.user.id } } }
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          client: {
            select: {
              id: true,
              name: true,
              industry: true,
              contactName: true
            }
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
              documents: true,
              timeEntries: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.case.count({ where })
    ]);

    // Calculate additional metrics for each case
    const casesWithMetrics = await Promise.all(
      cases.map(async (caseItem) => {
        // Get task completion stats
        const taskStats = await prisma.task.groupBy({
          by: ['status'],
          where: { caseId: caseItem.id },
          _count: true
        });

        const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
        const completedTasks = taskStats.find(s => s.status === 'DONE')?._count || 0;

        // Get total time logged
        const timeSum = await prisma.timeEntry.aggregate({
          where: { caseId: caseItem.id },
          _sum: { duration: true, amount: true }
        });

        return {
          ...caseItem,
          metrics: {
            totalTasks,
            completedTasks,
            taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalHours: timeSum._sum.duration || 0,
            totalSpent: timeSum._sum.amount || caseItem.budgetSpent,
            budgetUtilization: caseItem.budgetTotal > 0 
              ? Math.round((parseFloat(timeSum._sum.amount || caseItem.budgetSpent) / parseFloat(caseItem.budgetTotal)) * 100)
              : 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        cases: casesWithMetrics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cases'
    });
  }
};

/**
 * Get case statistics for dashboard
 */
const getCaseStats = async (req, res) => {
  try {
    const where = {
      firmId: req.user.firmId,
      isArchived: false
    };

    // Role-based filtering
    if (req.user.role === 'CONSULTANT') {
      where.OR = [
        { leadId: req.user.id },
        { members: { some: { userId: req.user.id } } }
      ];
    }

    const [
      totalCases,
      casesByStatus,
      casesByPriority,
      recentCases,
      budgetStats
    ] = await Promise.all([
      prisma.case.count({ where }),
      prisma.case.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.case.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.case.findMany({
        where,
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: { select: { name: true } },
          lead: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.case.aggregate({
        where,
        _sum: { budgetTotal: true, budgetSpent: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCases,
        byStatus: casesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        byPriority: casesByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {}),
        recentCases,
        budget: {
          totalBudget: budgetStats._sum.budgetTotal || 0,
          totalSpent: budgetStats._sum.budgetSpent || 0,
          utilization: budgetStats._sum.budgetTotal > 0
            ? Math.round((parseFloat(budgetStats._sum.budgetSpent) / parseFloat(budgetStats._sum.budgetTotal)) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case statistics'
    });
  }
};

/**
 * Get single case by ID with full details
 */
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const caseItem = await prisma.case.findFirst({
      where: {
        id,
        firmId: req.user.firmId
      },
      include: {
        client: {
          include: {
            contacts: true
          }
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            _count: {
              select: { comments: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        documents: {
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
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            task: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { startTime: 'desc' },
          take: 20
        }
      }
    });

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check access for consultants
    if (req.user.role === 'CONSULTANT') {
      const hasAccess = caseItem.leadId === req.user.id ||
        caseItem.members.some(m => m.userId === req.user.id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this case'
        });
      }
    }

    // Calculate metrics
    const totalHours = caseItem.timeEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.duration), 0
    );

    const totalSpent = caseItem.timeEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.amount || 0), 0
    );

    await req.logActivity('VIEW', 'Case', id);

    res.json({
      success: true,
      data: {
        ...caseItem,
        metrics: {
          totalHours,
          totalSpent,
          budgetRemaining: parseFloat(caseItem.budgetTotal) - totalSpent,
          budgetUtilization: caseItem.budgetTotal > 0
            ? Math.round((totalSpent / parseFloat(caseItem.budgetTotal)) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get case by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case'
    });
  }
};

/**
 * Create new case
 */
const createCase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      clientId,
      caseType,
      priority = 'MEDIUM',
      startDate,
      endDate,
      budgetTotal = 0,
      currency = 'USD',
      hourlyRate,
      tags = [],
      memberIds = []
    } = req.body;

    // Verify client belongs to firm
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: req.user.firmId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Generate case number
    const year = new Date().getFullYear();
    const lastCase = await prisma.case.findFirst({
      where: {
        firmId: req.user.firmId,
        caseNumber: { startsWith: `CASE-${year}-` }
      },
      orderBy: { caseNumber: 'desc' }
    });

    let caseNumber;
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseNumber.split('-')[2]);
      caseNumber = `CASE-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      caseNumber = `CASE-${year}-001`;
    }

    // Create case with team members
    const caseItem = await prisma.case.create({
      data: {
        title,
        description,
        caseNumber,
        caseType,
        priority,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budgetTotal,
        currency,
        hourlyRate,
        tags,
        clientId,
        leadId: req.user.id,
        firmId: req.user.firmId,
        members: {
          create: memberIds.map(userId => ({
            userId
          }))
        }
      },
      include: {
        client: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
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

    // Log activity
    await req.logActivity('CREATE', 'Case', caseItem.id, {
      title,
      caseNumber,
      client: client.name
    });

    // Create activity in case feed
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'case',
        entityId: caseItem.id,
        description: `Created case "${title}"`,
        userId: req.user.id,
        caseId: caseItem.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: caseItem
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case'
    });
  }
};

/**
 * Update case
 */
const updateCase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check case exists and user has access
    const existingCase = await prisma.case.findFirst({
      where: { id, firmId: req.user.firmId }
    });

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Update case
    const caseItem = await prisma.case.update({
      where: { id },
      data: updates,
      include: {
        client: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    await req.logActivity('UPDATE', 'Case', id, { changes: updates });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPDATED',
        entity: 'case',
        entityId: id,
        description: `Updated case details`,
        metadata: JSON.stringify(updates),
        userId: req.user.id,
        caseId: id
      }
    });

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: caseItem
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case'
    });
  }
};

/**
 * Delete case (Admin/Partner only)
 */
const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCase = await prisma.case.findFirst({
      where: { id, firmId: req.user.firmId }
    });

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    await prisma.case.delete({ where: { id } });

    await req.logActivity('DELETE', 'Case', id, {
      title: existingCase.title,
      caseNumber: existingCase.caseNumber
    });

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete case'
    });
  }
};

/**
 * Archive case
 */
const archiveCase = async (req, res) => {
  try {
    const { id } = req.params;

    const caseItem = await prisma.case.update({
      where: { id },
      data: { isArchived: true }
    });

    await req.logActivity('UPDATE', 'Case', id, { action: 'archived' });

    res.json({
      success: true,
      message: 'Case archived successfully',
      data: caseItem
    });
  } catch (error) {
    console.error('Archive case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive case'
    });
  }
};

/**
 * Unarchive case
 */
const unarchiveCase = async (req, res) => {
  try {
    const { id } = req.params;

    const caseItem = await prisma.case.update({
      where: { id },
      data: { isArchived: false }
    });

    await req.logActivity('UPDATE', 'Case', id, { action: 'unarchived' });

    res.json({
      success: true,
      message: 'Case unarchived successfully',
      data: caseItem
    });
  } catch (error) {
    console.error('Unarchive case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unarchive case'
    });
  }
};

/**
 * Add team member to case
 */
const addCaseMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    // Verify user belongs to same firm
    const user = await prisma.user.findFirst({
      where: { id: userId, firmId: req.user.firmId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add member
    const member = await prisma.caseMember.create({
      data: {
        caseId: id,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'MEMBER_ADDED',
        entity: 'case',
        entityId: id,
        description: `Added ${user.firstName} ${user.lastName} to the team`,
        userId: req.user.id,
        caseId: id
      }
    });

    res.json({
      success: true,
      message: 'Team member added successfully',
      data: member
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this case'
      });
    }
    console.error('Add case member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add team member'
    });
  }
};

/**
 * Remove team member from case
 */
const removeCaseMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const member = await prisma.caseMember.findFirst({
      where: { caseId: id, userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    await prisma.caseMember.delete({
      where: { id: member.id }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'MEMBER_REMOVED',
        entity: 'case',
        entityId: id,
        description: `Removed ${member.user.firstName} ${member.user.lastName} from the team`,
        userId: req.user.id,
        caseId: id
      }
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove case member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team member'
    });
  }
};

/**
 * Get case activity feed
 */
const getCaseActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.caseActivity.findMany({
        where: { caseId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          mentions: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.caseActivity.count({ where: { caseId: id } })
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get case activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case activities'
    });
  }
};

module.exports = {
  getAllCases,
  getCaseStats,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  archiveCase,
  unarchiveCase,
  addCaseMember,
  removeCaseMember,
  getCaseActivities
};
