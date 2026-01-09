const { logger } = require('../utils/logger');

// ============================================
// ERROR HANDLING MIDDLEWARE
// Production-grade error handling
// ============================================

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logger.error('Error occurred', {
    message: error.message,
    statusCode: error.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
    firmId: req.firmId,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Prisma errors
  if (err.code === 'P2002') {
    error.message = 'Duplicate entry. This record already exists.';
    error.statusCode = 409;
  }

  if (err.code === 'P2025') {
    error.message = 'Record not found.';
    error.statusCode = 404;
  }

  if (err.code === 'P2003') {
    error.message = 'Invalid reference. Related record not found.';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please login again.';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired. Please login again.';
    error.statusCode = 401;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File too large. Maximum size is 100MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Too many files. Maximum is 10 files per upload.';
    } else {
      error.message = 'File upload error: ' + err.message;
    }
    error.statusCode = 400;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed: ' + err.message;
    error.statusCode = 400;
  }

  // MongoDB/Mongoose errors (if using)
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format.';
    error.statusCode = 400;
  }

  // Send error response
  const response = {
    error: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(error.statusCode).json(response);
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  formatValidationErrors
};
