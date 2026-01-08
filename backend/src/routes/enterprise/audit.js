const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get audit logs (Admin only or own logs)
router.get('/', async (req, res) => {
  try {
    const { entityType, entityId, userId, startDate, endDate, action, page = 1, limit = 50 } = req.query;

    const where = {
      ...(req.userRole !== 'ADMIN' && { userId: req.userId }), // Non-admins see only their logs
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && req.userRole === 'ADMIN' && { userId }), // Only admins can filter by userId
      ...(action && { action }),
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
        skip: (parseInt(page) - 1) * parseInt(limit),
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

// Export audit logs (Admin only)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const where = {
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

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        'Timestamp,User,Email,Role,Action,Entity Type,Entity ID,IP Address',
        ...logs.map(log => 
          `${log.createdAt.toISOString()},${log.user.firstName} ${log.user.lastName},${log.user.email},${log.user.role},${log.action},${log.entityType},${log.entityId},${log.ipAddress || 'N/A'}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({ logs });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Get audit log statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [totalLogs, actionCounts, entityCounts, userCounts] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      totalLogs,
      actionCounts,
      entityCounts,
      topUsers: userCounts
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

module.exports = router;
