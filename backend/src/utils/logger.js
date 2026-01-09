const winston = require('winston');
const path = require('path');

// ============================================
// WINSTON LOGGER - PRODUCTION-GRADE LOGGING
// ============================================

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'casestack' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Audit logs (separate)
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create specialized loggers
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'casestack-audit' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

const emailLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'casestack-email' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'email.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

const fileLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'casestack-files' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'files.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Helper functions
const logRequest = (req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId,
    firmId: req.firmId
  });
  next();
};

const logError = (err, req, res, next) => {
  logger.error('HTTP Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId,
    firmId: req.firmId
  });
  next(err);
};

const logAudit = (action, entityType, entityId, userId, firmId, metadata = {}) => {
  auditLogger.info('Audit Event', {
    action,
    entityType,
    entityId,
    userId,
    firmId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

const logEmail = (to, subject, status, error = null) => {
  emailLogger.info('Email Event', {
    to,
    subject,
    status,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
};

const logFile = (action, fileName, fileSize, userId, firmId, metadata = {}) => {
  fileLogger.info('File Event', {
    action,
    fileName,
    fileSize,
    userId,
    firmId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

module.exports = {
  logger,
  auditLogger,
  emailLogger,
  fileLogger,
  logRequest,
  logError,
  logAudit,
  logEmail,
  logFile
};
