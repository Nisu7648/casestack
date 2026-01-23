const helmet = require('helmet');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

/**
 * Comprehensive security middleware for LegalStack
 */

/**
 * Enhanced Helmet configuration for security headers
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://api.cloudinary.com',
        process.env.FRONTEND_URL || 'http://localhost:5173'
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Hide X-Powered-By
  hidePoweredBy: true,
});

/**
 * CSRF Protection
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  },
});

/**
 * Get CSRF token endpoint
 */
const getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

/**
 * Enhanced rate limiting configurations
 */

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Moderate rate limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limit for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    message: 'Too many accounts created. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * IP-based rate limiting (more aggressive)
 */
const createIpLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For if behind proxy, otherwise use IP
      return req.headers['x-forwarded-for'] || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values (take first)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    }
  }
  next();
};

/**
 * Validate request origin
 */
const validateOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid origin',
    });
  }

  next();
};

/**
 * Prevent clickjacking
 */
const preventClickjacking = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
};

/**
 * Secure cookies configuration
 */
const secureCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

/**
 * Set secure headers manually
 */
const setSecureHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Validate content type for POST/PUT requests
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type header is required',
      });
    }
    
    const allowedTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded',
    ];
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Content-Type',
      });
    }
  }
  
  next();
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize);
      
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          success: false,
          message: `Request too large. Maximum size is ${maxSize}`,
        });
      }
    }
    
    next();
  };
};

module.exports = {
  // Helmet
  helmetConfig,
  
  // CSRF
  csrfProtection,
  getCsrfToken,
  
  // Rate limiting
  authLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  registerLimiter,
  createIpLimiter,
  
  // Other security
  preventParameterPollution,
  validateOrigin,
  preventClickjacking,
  secureCookieConfig,
  setSecureHeaders,
  validateContentType,
  requestSizeLimiter,
};
