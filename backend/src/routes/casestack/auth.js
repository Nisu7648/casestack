const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================
// AUTH & FIRM MANAGEMENT MODULE
// Firm creation, user roles, license enforcement
// ============================================

// Register new firm (creates firm + first admin user)
router.post('/register', async (req, res) => {
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

      // Create firm settings
      await tx.firmSettings.create({
        data: {
          firmId: firm.id,
          requirePartnerForFinalization: true,
          requireTwoApprovers: false,
          enableDownloadTracking: true,
          enableAuditExport: true,
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

      // Create audit log
      await tx.auditLog.create({
        data: {
          firmId: firm.id,
          userId: user.id,
          action: 'FIRM_CREATED',
          entityType: 'FIRM',
          entityId: firm.id,
          details: { firmName, country }
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
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
        entityType: 'USER',
        entityId: user.id
      }
    });

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        firm: {
          select: { id: true, name: true, country: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
