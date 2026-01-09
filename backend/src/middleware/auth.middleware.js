const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const deviceSessionService = require('../services/deviceSession.service');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

// ============================================
// AUTHENTICATION MIDDLEWARE
// WITH DEVICE SESSION VERIFICATION
// ============================================

/**
 * Verify JWT token and device session
 * Ensures user is authenticated and device is authorized (max 3 devices)
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify device session (NEW)
    const sessionVerification = await deviceSessionService.verifySession(token);
    
    if (!sessionVerification.valid) {
      logger.warn('Invalid device session', {
        userId: decoded.userId,
        reason: sessionVerification.reason
      });
      
      return res.status(401).json({
        error: 'Session invalid',
        reason: sessionVerification.reason,
        message: sessionVerification.reason === 'Session expired' 
          ? 'Your session has expired. Please login again.'
          : 'Your session is no longer valid. Please login again.'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        firm: {
          select: {
            id: true,
            name: true,
            country: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Attach user info to request
    req.userId = user.id;
    req.firmId = user.firmId;
    req.userRole = user.role;
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      firmId: user.firmId,
      firmName: user.firm.name
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for public endpoints that have optional auth features
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify device session
      const sessionVerification = await deviceSessionService.verifySession(token);
      
      if (sessionVerification.valid) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            firm: {
              select: { id: true, name: true }
            }
          }
        });

        if (user && user.isActive) {
          req.userId = user.id;
          req.firmId = user.firmId;
          req.userRole = user.role;
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            firmId: user.firmId,
            firmName: user.firm.name
          };
        }
      }
    } catch (error) {
      // Ignore errors for optional auth
      logger.debug('Optional auth failed (ignored):', error.message);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
