const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// SIMPLE AUTHENTICATION - WITH FIRM CREATION
// ============================================

// ============================================
// 1. REGISTER (with firm)
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, firmName, country } = req.body;

    console.log('Register attempt:', { email, firstName, lastName, firmName, country });

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !firmName || !country) {
      return res.status(400).json({ 
        error: 'All fields required',
        required: ['email', 'password', 'firstName', 'lastName', 'firmName', 'country'],
        received: { 
          email: !!email, 
          password: !!password, 
          firstName: !!firstName, 
          lastName: !!lastName,
          firmName: !!firmName,
          country: !!country
        }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    }).catch(err => {
      console.error('Database check error:', err);
      return null;
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create firm and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create firm
      const firm = await tx.firm.create({
        data: {
          id: uuidv4(),
          name: firmName,
          country: country,
          billingEnabled: false
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          id: uuidv4(),
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          firmId: firm.id,
          isActive: true
        }
      });

      return { firm, user };
    });

    // Generate token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        email: result.user.email, 
        role: result.user.role,
        firmId: result.firm.id
      },
      process.env.JWT_SECRET || 'legalstack-secret-2024',
      { expiresIn: '7d' }
    );

    console.log('User and firm created successfully:', result.user.id, result.firm.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        firmId: result.firm.id,
        firm: {
          id: result.firm.id,
          name: result.firm.name,
          country: result.firm.country
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// 2. LOGIN
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user with firm
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        firm: true
      }
    }).catch(err => {
      console.error('Database query error:', err);
      throw err;
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        firmId: user.firmId
      },
      process.env.JWT_SECRET || 'legalstack-secret-2024',
      { expiresIn: '7d' }
    );

    console.log('Login successful:', user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        firm: user.firm ? {
          id: user.firm.id,
          name: user.firm.name,
          country: user.firm.country
        } : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// 3. VERIFY TOKEN
// ============================================
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'legalstack-secret-2024'
    );

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        firm: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        firm: user.firm ? {
          id: user.firm.id,
          name: user.firm.name,
          country: user.firm.country
        } : null
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
});

module.exports = router;
