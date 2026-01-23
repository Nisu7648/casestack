const sanitizeHtml = require('sanitize-html');

/**
 * Input sanitization middleware
 * Prevents XSS attacks by sanitizing all user inputs
 */

/**
 * Sanitize HTML content - removes dangerous tags and attributes
 */
const sanitizeHtmlContent = (dirty) => {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'code': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto']
    },
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer',
            target: '_blank'
          }
        };
      }
    }
  });
};

/**
 * Sanitize plain text - removes all HTML tags
 */
const sanitizePlainText = (dirty) => {
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj, sanitizeFunc = sanitizePlainText) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizeFunc));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFunc(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizeFunc);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Middleware to sanitize request body
 */
const sanitizeBody = (options = {}) => {
  const { allowHtml = false } = options;
  const sanitizeFunc = allowHtml ? sanitizeHtmlContent : sanitizePlainText;

  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, sanitizeFunc);
    }
    next();
  };
};

/**
 * Middleware to sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query, sanitizePlainText);
  }
  next();
};

/**
 * Middleware to sanitize URL parameters
 */
const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params, sanitizePlainText);
  }
  next();
};

/**
 * Combined sanitization middleware
 */
const sanitizeAll = (options = {}) => {
  return (req, res, next) => {
    sanitizeBody(options)(req, res, () => {
      sanitizeQuery(req, res, () => {
        sanitizeParams(req, res, next);
      });
    });
  };
};

/**
 * Sanitize specific fields in request body
 */
const sanitizeFields = (fields = {}) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    for (const [field, options] of Object.entries(fields)) {
      if (req.body[field] !== undefined) {
        const { allowHtml = false, maxLength = null } = options;
        const sanitizeFunc = allowHtml ? sanitizeHtmlContent : sanitizePlainText;
        
        let value = req.body[field];
        
        // Sanitize
        if (typeof value === 'string') {
          value = sanitizeFunc(value);
          
          // Trim
          value = value.trim();
          
          // Max length
          if (maxLength && value.length > maxLength) {
            value = value.substring(0, maxLength);
          }
          
          req.body[field] = value;
        }
      }
    }

    next();
  };
};

/**
 * Remove null bytes from strings (security)
 */
const removeNullBytes = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\0/g, '');
};

/**
 * Escape special characters for SQL (additional layer)
 */
const escapeSql = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
};

/**
 * Validate and sanitize email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Remove whitespace
  email = email.trim().toLowerCase();
  
  // Remove null bytes
  email = removeNullBytes(email);
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '';
  }
  
  return email;
};

/**
 * Validate and sanitize URL
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  // Remove whitespace
  url = url.trim();
  
  // Remove null bytes
  url = removeNullBytes(url);
  
  // Only allow http and https
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

module.exports = {
  sanitizeHtmlContent,
  sanitizePlainText,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  sanitizeFields,
  removeNullBytes,
  escapeSql,
  sanitizeEmail,
  sanitizeUrl,
};
