const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * Advanced search across cases, clients, documents
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTypes = type ? [type] : ['cases', 'clients', 'documents', 'tasks'];
    const results = {};

    // Search cases
    if (searchTypes.includes('cases')) {
      results.cases = await prisma.case.findMany({
        where: {
          firmId: req.user.firmId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { caseNumber: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          title: true,
          caseNumber: true,
          status: true,
          priority: true,
          createdAt: true
        }
      });
    }

    // Search clients
    if (searchTypes.includes('clients')) {
      results.clients = await prisma.client.findMany({
        where: {
          firmId: req.user.firmId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          type: true,
          createdAt: true
        }
      });
    }

    // Search documents
    if (searchTypes.includes('documents')) {
      results.documents = await prisma.document.findMany({
        where: {
          case: { firmId: req.user.firmId },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          type: true,
          fileSize: true,
          createdAt: true,
          case: {
            select: {
              id: true,
              title: true,
              caseNumber: true
            }
          }
        }
      });
    }

    // Search tasks
    if (searchTypes.includes('tasks')) {
      results.tasks = await prisma.task.findMany({
        where: {
          case: { firmId: req.user.firmId },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          case: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      success: true,
      data: {
        query: q,
        totalResults,
        results
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

/**
 * Bulk delete cases
 */
router.post('/bulk/delete-cases', async (req, res) => {
  try {
    const { caseIds } = req.body;

    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'caseIds must be a non-empty array'
      });
    }

    // Verify all cases belong to user's firm
    const cases = await prisma.case.findMany({
      where: {
        id: { in: caseIds },
        firmId: req.user.firmId
      }
    });

    if (cases.length !== caseIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some cases do not belong to your firm'
      });
    }

    // Delete cases
    const result = await prisma.case.deleteMany({
      where: {
        id: { in: caseIds },
        firmId: req.user.firmId
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Case',
        description: `Bulk deleted ${result.count} cases`,
        metadata: JSON.stringify({ caseIds })
      }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.count} cases`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk delete failed'
    });
  }
});

/**
 * Bulk delete documents
 */
router.post('/bulk/delete-documents', async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'documentIds must be a non-empty array'
      });
    }

    // Delete documents
    const result = await prisma.document.deleteMany({
      where: {
        id: { in: documentIds },
        case: { firmId: req.user.firmId }
      }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.count} documents`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Bulk delete documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk delete failed'
    });
  }
});

/**
 * Export cases to CSV
 */
router.get('/export/cases', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where = { firmId: req.user.firmId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const cases = await prisma.case.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Convert to CSV
    const headers = ['Case Number', 'Title', 'Status', 'Priority', 'Client', 'Assigned To', 'Created Date'];
    const rows = cases.map(c => [
      c.caseNumber,
      c.title,
      c.status,
      c.priority || 'Normal',
      c.client?.name || 'N/A',
      c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : 'Unassigned',
      new Date(c.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cases-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

/**
 * Export time entries to CSV
 */
router.get('/export/time-entries', async (req, res) => {
  try {
    const { caseId, startDate, endDate } = req.query;

    const where = {
      case: { firmId: req.user.firmId }
    };
    if (caseId) where.caseId = caseId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        case: {
          select: {
            caseNumber: true,
            title: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Convert to CSV
    const headers = ['Date', 'Case', 'User', 'Hours', 'Rate', 'Amount', 'Description'];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString(),
      `${e.case.caseNumber} - ${e.case.title}`,
      `${e.user.firstName} ${e.user.lastName}`,
      e.hours,
      e.rate,
      e.amount,
      e.description || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="time-entries-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

/**
 * Get activity feed
 */
router.get('/activity-feed', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const activities = await prisma.activityLog.findMany({
      where: {
        user: { firmId: req.user.firmId }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.activityLog.count({
      where: {
        user: { firmId: req.user.firmId }
      }
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity feed'
    });
  }
});

/**
 * Get notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const { unreadOnly = false } = req.query;

    // For now, return activity logs as notifications
    // In production, you'd have a separate notifications table
    const where = {
      user: { firmId: req.user.firmId },
      action: { in: ['CREATED', 'UPDATED', 'ASSIGNED'] }
    };

    const notifications = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.length
      }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

module.exports = router;
