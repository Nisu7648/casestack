const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');
const deviceSessionService = require('../../services/deviceSession.service');
const { logger } = require('../../utils/logger');

const prisma = new PrismaClient();

// ============================================
// AUTH & FIRM MANAGEMENT MODULE
// WITH DEVICE SESSION MANAGEMENT (MAX 3 DEVICES)
// ============================================

// Register new firm (creates firm + first admin user)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const {
      // Firm details
      firmName,
      country,
      industry,
      
      // First user (admin)
      email,
      password,
      firstName,
      lastName
    } = req.body;

    // Validation
    if (!firmName || !country || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Determine pricing based on country
    let pricePerSeat = 1399; // Default India
    let billingCurrency = 'INR';

    if (country === 'Switzerland') {
      pricePerSeat = 75;
      billingCurrency = 'CHF';
    } else if (['Germany', 'France', 'UK', 'Netherlands', 'Belgium', 'Austria'].includes(country)) {
      pricePerSeat = 35;
      billingCurrency = 'EUR';
    } else if (country === 'USA') {
      pricePerSeat = 40;
      billingCurrency = 'USD';
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create firm + first user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create firm
      const firm = await tx.firm.create({
        data: {
          name: firmName,
          country,
          industry,
          licenseType: 'ENTERPRISE',
          seatsLicensed: 10, // Default 10 seats
          seatsUsed: 1,
          pricePerSeat,
          billingCurrency
        }
      });

      // Create firm settings (with maxDevicesPerUser = 3)
      await tx.firmSettings.create({
        data: {
          firmId: firm.id,
          requirePartnerForFinalization: true,
          requireTwoApprovers: false,
          enableDownloadTracking: true,
          enableAuditExport: true,
          maxDevicesPerUser: 3, // NEW: Max 3 devices per user
          autoArchiveAfterYears: 7
        }
      });

      // Create first user (admin)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          firmId: firm.id,
          isActive: true
        }
      });

      // Create subscription
      await tx.subscription.create({
        data: {
          firmId: firm.id,
          pricePerUser: pricePerSeat,
          currency: billingCurrency,
          billingCycle: 'MONTHLY',
          activeUsers: 1,
          status: 'ACTIVE'
        }
      });

      return { firm, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        firmId: result.firm.id,
        role: result.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create device session
    try {
      await deviceSessionService.createSession(result.user.id, token, req);
    } catch (deviceError) {
      logger.error('Failed to create device session on registration', deviceError);
      // Continue anyway - don't block registration
    }

    logger.info('Firm registered', { firmId: result.firm.id, userId: result.user.id });

    res.status(201).json({
      message: 'Firm and admin account created successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        firmId: result.firm.id,
        firmName: result.firm.name
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (with device session management)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user with firm
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        firm: {
          select: { id: true, name: true, country: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        firmId: user.firmId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create device session (with max 3 devices check)
    try {
      await deviceSessionService.createSession(user.id, token, req);
    } catch (deviceError) {
      // Device limit exceeded
      if (deviceError.message.includes('Device limit exceeded')) {
        logger.warn('Device limit exceeded on login', { userId: user.id, email: user.email });
        
        // Get active sessions
        const sessions = await deviceSessionService.getUserSessions(user.id);
        
        return res.status(403).json({
          error: 'Device limit exceeded',
          message: deviceError.message,
          activeSessions: sessions.map(s => ({
            id: s.id,
            deviceName: s.deviceName,
            deviceType: s.deviceType,
            lastActivityAt: s.lastActivityAt,
            createdAt: s.createdAt
          }))
        });
      }
      
      logger.error('Failed to create device session on login', deviceError);
      // Continue anyway - don't block login
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        firmId: user.firmId,
        userId: user.id,
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        firmName: user.firm.name,
        country: user.firm.country
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout (from current device)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find and deactivate session
    const session = await prisma.deviceSession.findUnique({
      where: { token }
    });

    if (session) {
      await deviceSessionService.logoutDevice(decoded.userId, session.id);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        firmId: decoded.firmId,
        userId: decoded.userId,
        action: 'USER_LOGOUT',
        resourceType: 'DEVICE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('User logged out', { userId: decoded.userId });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Logout from all devices
router.post('/logout-all', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Logout from all devices
    await deviceSessionService.logoutAllDevices(decoded.userId);

    logger.info('User logged out from all devices', { userId: decoded.userId });

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get active device sessions
router.get('/sessions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get sessions
    const sessions = await deviceSessionService.getUserSessions(decoded.userId);

    // Get device limit info
    const deviceLimit = await deviceSessionService.checkDeviceLimit(decoded.userId);

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        lastActivityAt: s.lastActivityAt,
        createdAt: s.createdAt,
        isCurrent: s.token === token
      })),
      deviceLimit: {
        current: deviceLimit.current,
        max: deviceLimit.max,
        available: deviceLimit.max - deviceLimit.current
      }
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Remove specific device session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { sessionId } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Logout device
    await deviceSessionService.logoutDevice(decoded.userId, sessionId);

    logger.info('Device session removed', { userId: decoded.userId, sessionId });

    res.json({ message: 'Device session removed successfully' });
  } catch (error) {
    logger.error('Remove session error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove session' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        firm: {
          select: { id: true, name: true, country: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        firmName: user.firm.name,
        country: user.firm.country
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
