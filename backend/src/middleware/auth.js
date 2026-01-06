const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { firm: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Role-based authorization
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Permission matrix
const PERMISSIONS = {
  ADMIN: ['*'], // Full access
  PARTNER: [
    'view_all_reports',
    'view_activity_logs',
    'manage_users',
    'view_firm_data',
    'export_data'
  ],
  MANAGER: [
    'view_team_reports',
    'manage_team',
    'create_reports',
    'edit_reports',
    'view_clients'
  ],
  CONSULTANT: [
    'view_own_reports',
    'create_reports',
    'edit_own_reports',
    'track_time',
    'view_assigned_clients'
  ],
  VIEWER: [
    'view_reports',
    'view_clients'
  ]
};

// Check specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permission denied: ${permission}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  hasPermission,
  PERMISSIONS
};
