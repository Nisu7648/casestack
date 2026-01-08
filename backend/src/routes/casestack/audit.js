const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// IMMUTABLE AUDIT LOG (DEFENSIBILITY)
// Cannot be edited or deleted - EVER
// ============================================

// Get audit logs with filters
router.get('/', async (req, res) => {
  try {
    const {
      action,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      firmId: req.firmId,
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && req.userRole === 'ADMIN' && { userId }), // Only admins can filter by user
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for specific case
router.get('/case/:caseId', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        firmId: req.firmId,
        entityType: 'CASE',
        entityId: req.params.caseId
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get case audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch case audit logs' });
  }
});

// Get download logs (defensibility tracking)
router.get('/downloads', async (req, res) => {
  try {
    const { caseId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      case: {
        firmId: req.firmId
      },
      ...(caseId && { caseId }),
      ...(userId && req.userRole === 'ADMIN' && { userId }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [downloads, total] = await Promise.all([
      prisma.downloadLog.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, role: true }
          },
          case: {
            select: { caseNumber: true, caseName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.downloadLog.count({ where })
    ]);

    res.json({
      downloads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get download logs error:', error);
    res.status(500).json({ error: 'Failed to fetch download logs' });
  }
});

// Export audit logs to CSV (Admin only)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, action, entityType } = req.query;

    const where = {
      firmId: req.firmId,
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV
    const csv = [
      'Timestamp,User,Email,Role,Action,Entity Type,Entity ID,IP Address,Details',
      ...logs.map(log => 
        `${log.createdAt.toISOString()},"${log.user.firstName} ${log.user.lastName}",${log.user.email},${log.user.role},${log.action},${log.entityType},${log.entityId},${log.ipAddress || 'N/A'},"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=casestack-audit-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Get audit statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      firmId: req.firmId,
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [
      totalLogs,
      actionCounts,
      entityCounts,
      topUsers,
      recentActivity
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        orderBy: { _count: { entityType: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    res.json({
      totalLogs,
      actionCounts: actionCounts.map(a => ({
        action: a.action,
        count: a._count
      })),
      entityCounts: entityCounts.map(e => ({
        entityType: e.entityType,
        count: e._count
      })),
      topUsers: await Promise.all(
        topUsers.map(async (u) => {
          const user = await prisma.user.findUnique({
            where: { id: u.userId },
            select: { firstName: true, lastName: true, role: true }
          });
          return {
            user: `${user.firstName} ${user.lastName}`,
            role: user.role,
            count: u._count
          };
        })
      ),
      recentActivity
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get compliance report (Admin only)
router.get('/compliance-report', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [
      totalCases,
      finalizedCases,
      totalDownloads,
      totalUsers,
      activeUsers,
      casesByStatus,
      downloadsByType
    ] = await Promise.all([
      prisma.case.count({
        where: { firmId: req.firmId, ...dateFilter }
      }),
      prisma.case.count({
        where: { firmId: req.firmId, status: 'FINALIZED', ...dateFilter }
      }),
      prisma.downloadLog.count({
        where: {
          case: { firmId: req.firmId },
          ...dateFilter
        }
      }),
      prisma.user.count({
        where: { firmId: req.firmId }
      }),
      prisma.user.count({
        where: { firmId: req.firmId, isActive: true }
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: { firmId: req.firmId, ...dateFilter },
        _count: true
      }),
      prisma.downloadLog.groupBy({
        by: ['downloadType'],
        where: {
          case: { firmId: req.firmId },
          ...dateFilter
        },
        _count: true
      })
    ]);

    res.json({
      period: {
        from: startDate || 'All time',
        to: endDate || 'Present'
      },
      summary: {
        totalCases,
        finalizedCases,
        finalizationRate: totalCases > 0 ? ((finalizedCases / totalCases) * 100).toFixed(2) + '%' : '0%',
        totalDownloads,
        totalUsers,
        activeUsers
      },
      casesByStatus: casesByStatus.map(s => ({
        status: s.status,
        count: s._count
      })),
      downloadsByType: downloadsByType.map(d => ({
        type: d.downloadType,
        count: d._count
      }))
    });
  } catch (error) {
    console.error('Get compliance report error:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

module.exports = router;
