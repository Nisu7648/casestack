// Role-Based Access Control Middleware

const ROLE_HIERARCHY = {
  ADMIN: 4,
  PARTNER: 3,
  MANAGER: 2,
  CONSULTANT: 1
};

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const hasPermission = allowedRoles.some(role => {
      const requiredLevel = ROLE_HIERARCHY[role];
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Specific role checks
const requireAdmin = requireRole('ADMIN');
const requirePartner = requireRole('PARTNER', 'ADMIN');
const requireManager = requireRole('MANAGER', 'PARTNER', 'ADMIN');
const requireConsultant = requireRole('CONSULTANT', 'MANAGER', 'PARTNER', 'ADMIN');

module.exports = {
  requireRole,
  requireAdmin,
  requirePartner,
  requireManager,
  requireConsultant
};
