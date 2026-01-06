const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to automatically log activities
 * Attaches logActivity function to req object
 */
const activityLogger = (req, res, next) => {
  req.logActivity = async (action, entity, entityId = null, details = null) => {
    try {
      if (!req.user) {
        console.warn('Activity logging attempted without authenticated user');
        return;
      }

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          userRole: req.user.role,
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null,
          firmId: req.user.firmId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Activity logging failed:', error);
    }
  };

  next();
};

/**
 * Standalone function to log activities
 * Use when not in request context
 */
const logActivity = async (userId, action, entity, entityId = null, details = null) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found for activity logging');
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        firmId: user.firmId,
        ipAddress: null,
        userAgent: null
      }
    });
  } catch (error) {
    console.error('Activity logging failed:', error);
    throw error;
  }
};

module.exports = {
  activityLogger,
  logActivity
};
