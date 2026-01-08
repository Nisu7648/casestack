const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { firm: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    req.userId = user.id;
    req.firmId = user.firmId;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate JWT Token
const generateToken = (userId, role, firmId) => {
  return jwt.sign(
    { userId, role, firmId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authenticate, generateToken };
