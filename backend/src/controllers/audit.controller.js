const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * MODULE H2 - Get Audit Logs (Partner/Admin view)
 * Timestamped, immutable logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      entity,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const where = {
      firmId: req.user.firmId
    };

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
        },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.activityLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

/**
 * Get audit log for specific entity
 */
const getEntityAuditLog = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const where = {
      firmId: req.user.firmId,
      entity,
      entityId
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
        },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.activityLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        entity,
        entityId,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get entity audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity audit log'
    });
  }
};

/**
 * Get audit log for specific user
 */
const getUserAuditLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const where = {
      firmId: req.user.firmId,
      userId
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
        },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.activityLog.count({ where })
    ]);

    // Get action breakdown
    const actionBreakdown = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: true
    });

    res.json({
      success: true,
      data: {
        userId,
        logs,
        stats: {
          totalActions: total,
          actionBreakdown: actionBreakdown.reduce((acc, item) => {
            acc[item.action] = item._count;
            return acc;
          }, {})
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get user audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit log'
    });
  }
};

/**
 * Get audit log for specific report
 */
const getReportAuditLog = async (req, res) => {
  try {
    const { reportId } = req.params;

    const logs = await prisma.activityLog.findMany({
      where: {
        firmId: req.user.firmId,
        entity: 'Report',
        entityId: reportId
      },
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
      },
      orderBy: { timestamp: 'asc' } // Chronological for report history
    });

    // Build timeline
    const timeline = logs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      description: log.description,
      user: `${log.user.firstName} ${log.user.lastName}`,
      userRole: log.user.role,
      metadata: log.metadata
    }));

    res.json({
      success: true,
      data: {
        reportId,
        timeline,
        totalEvents: logs.length
      }
    });
  } catch (error) {
    console.error('Get report audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report audit log'
    });
  }
};

/**
 * Get audit statistics
 */
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      firmId: req.user.firmId
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Total actions
    const totalActions = await prisma.activityLog.count({ where });

    // Actions by type
    const actionsByType = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    // Actions by entity
    const actionsByEntity = await prisma.activityLog.groupBy({
      by: ['entity'],
      where,
      _count: true,
      orderBy: {
        _count: {
          entity: 'desc'
        }
      }
    });

    // Most active users
    const mostActiveUsers = await prisma.activityLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    // Get user details
    const userIds = mostActiveUsers.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const mostActiveUsersWithDetails = mostActiveUsers.map(item => ({
      user: userMap[item.userId],
      actionCount: item._count
    }));

    res.json({
      success: true,
      data: {
        totalActions,
        actionsByType: actionsByType.map(item => ({
          action: item.action,
          count: item._count
        })),
        actionsByEntity: actionsByEntity.map(item => ({
          entity: item.entity,
          count: item._count
        })),
        mostActiveUsers: mostActiveUsersWithDetails
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics'
    });
  }
};

/**
 * Get audit timeline
 */
const getAuditTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await prisma.activityLog.findMany({
      where: {
        firmId: req.user.firmId,
        timestamp: {
          gte: startDate
        }
      },
      select: {
        timestamp: true,
        action: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // Group by day
    const timeline = {};
    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = 0;
      }
      timeline[date]++;
    });

    res.json({
      success: true,
      data: {
        days: parseInt(days),
        timeline: Object.keys(timeline).map(date => ({
          date,
          count: timeline[date]
        }))
      }
    });
  } catch (error) {
    console.error('Get audit timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit timeline'
    });
  }
};

/**
 * Export audit log
 */
const exportAuditLog = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.body;

    const where = {
      firmId: req.user.firmId
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (format === 'csv') {
      const csv = [
        ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'Description'].join(','),
        ...logs.map(log => [
          log.timestamp.toISOString(),
          `${log.user.firstName} ${log.user.lastName}`,
          log.user.role,
          log.action,
          log.entity,
          log.entityId,
          log.description || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-log-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: logs
      });
    }
  } catch (error) {
    console.error('Export audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit log'
    });
  }
};

/**
 * Get security events
 */
const getSecurityEvents = async (req, res) => {
  try {
    const securityActions = [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_CREATED',
      'USER_DEACTIVATED',
      'USER_ROLE_CHANGED',
      'PERMISSION_CHANGED',
      'SETTINGS_CHANGED'
    ];

    const logs = await prisma.activityLog.findMany({
      where: {
        firmId: req.user.firmId,
        action: {
          in: securityActions
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      data: {
        events: logs,
        count: logs.length
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events'
    });
  }
};

module.exports = {
  getAuditLogs,
  getEntityAuditLog,
  getUserAuditLog,
  getReportAuditLog,
  getAuditStats,
  getAuditTimeline,
  exportAuditLog,
  getSecurityEvents
};
