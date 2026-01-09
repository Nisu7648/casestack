const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// ============================================
// RATE LIMITING MIDDLEWARE
// Protect API from abuse
// ============================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Email rate limiter
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 emails per hour
  message: {
    error: 'Too many emails sent, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Email rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many emails sent, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Export rate limiter
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    error: 'Too many exports, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Export rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many exports, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  emailLimiter,
  exportLimiter
};
