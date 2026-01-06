const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all activity logs for the firm
 */
const getActivityLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entity, 
      userId,
      startDate,
      endDate 
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      firmId: req.user.firmId
    };

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          userEmail: true,
          userName: true,
          userRole: true,
          action: true,
          entity: true,
          entityId: true,
          details: true,
          timestamp: true,
          ipAddress: true
        }
      }),
      prisma.activityLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity logs' 
    });
  }
};

/**
 * Get activity logs for a specific user
 */
const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId,
          firmId: req.user.firmId
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.activityLog.count({
        where: {
          userId,
          firmId: req.user.firmId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user activity logs' 
    });
  }
};

/**
 * Get activity logs for a specific entity
 */
const getEntityActivityLogs = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          entity,
          entityId,
          firmId: req.user.firmId
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.activityLog.count({
        where: {
          entity,
          entityId,
          firmId: req.user.firmId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get entity activity logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch entity activity logs' 
    });
  }
};

/**
 * Export activity logs as CSV
 */
const exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate, action, entity } = req.query;

    const where = {
      firmId: req.user.firmId
    };

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    // Convert to CSV
    const csvHeader = 'Timestamp,User,Email,Role,Action,Entity,Entity ID,Details,IP Address\n';
    const csvRows = logs.map(log => {
      const details = log.details ? JSON.parse(log.details) : {};
      return [
        log.timestamp.toISOString(),
        log.userName,
        log.userEmail,
        log.userRole,
        log.action,
        log.entity,
        log.entityId || '',
        JSON.stringify(details).replace(/"/g, '""'),
        log.ipAddress || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export activity logs' 
    });
  }
};

module.exports = {
  getActivityLogs,
  getUserActivityLogs,
  getEntityActivityLogs,
  exportActivityLogs
};
