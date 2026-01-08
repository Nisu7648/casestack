const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Audit Logging Middleware - Automatically logs all actions
const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.userId,
              action: action,
              entityType: entityType,
              entityId: req.params.id || data?.id || 'N/A',
              details: JSON.stringify({
                method: req.method,
                path: req.path,
                body: req.body,
                query: req.query
              }),
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent']
            }
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// Manual audit log creation
const createAuditLog = async (userId, action, entityType, entityId, details, req) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent']
      }
    });
  } catch (error) {
    console.error('Manual audit log failed:', error);
  }
};

module.exports = { auditLogger, createAuditLog };
