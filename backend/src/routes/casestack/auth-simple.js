const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// SIMPLE AUTHENTICATION - NO DEPENDENCIES
// Works immediately without complex setup
// ============================================

// ============================================
// 1. REGISTER
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    console.log('Register attempt:', { email, firstName, lastName });

    // Validate
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'All fields required',
        received: { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName }
      });
    }

    // Check existing
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

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'OWNER',
        isActive: true
      }
    }).catch(err => {
      console.error('User creation error:', err);
      throw err;
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'casestack-secret-2024',
      { expiresIn: '7d' }
    );

    console.log('User created successfully:', user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
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
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'casestack-secret-2024',
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
        firmId: user.firmId
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
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'casestack-secret-2024');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================
// 4. TEST ENDPOINT
// ============================================
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
