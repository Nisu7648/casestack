const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// SIMPLE FIRM MANAGEMENT
// Create and manage firms
// ============================================

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'casestack-secret-2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// 1. CREATE FIRM
// ============================================
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, website } = req.body;
    const userId = req.user.userId;

    console.log('Create firm attempt:', { name, userId });

    // Validate
    if (!name) {
      return res.status(400).json({ error: 'Firm name is required' });
    }

    // Check if user already has a firm
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.firmId) {
      return res.status(400).json({ error: 'User already belongs to a firm' });
    }

    // Generate firm code
    const firmCode = `FIRM-${Date.now().toString(36).toUpperCase()}`;

    // Create firm
    const firm = await prisma.firm.create({
      data: {
        id: uuidv4(),
        name,
        code: firmCode,
        email: email || user.email,
        phone: phone || '',
        address: address || '',
        website: website || '',
        ownerId: userId
      }
    }).catch(err => {
      console.error('Firm creation error:', err);
      throw err;
    });

    // Update user with firmId
    await prisma.user.update({
      where: { id: userId },
      data: { firmId: firm.id }
    });

    console.log('Firm created successfully:', firm.id);

    res.json({
      success: true,
      firm: {
        id: firm.id,
        name: firm.name,
        code: firm.code,
        email: firm.email,
        phone: firm.phone,
        address: firm.address,
        website: firm.website
      }
    });
  } catch (error) {
    console.error('Create firm error:', error);
    res.status(500).json({ 
      error: 'Failed to create firm',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// 2. GET FIRM DETAILS
// ============================================
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        firm: true
      }
    });

    if (!user.firm) {
      return res.status(404).json({ error: 'No firm found' });
    }

    res.json({
      success: true,
      firm: {
        id: user.firm.id,
        name: user.firm.name,
        code: user.firm.code,
        email: user.firm.email,
        phone: user.firm.phone,
        address: user.firm.address,
        website: user.firm.website
      }
    });
  } catch (error) {
    console.error('Get firm error:', error);
    res.status(500).json({ error: 'Failed to get firm details' });
  }
});

// ============================================
// 3. UPDATE FIRM
// ============================================
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, website } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user.firmId) {
      return res.status(404).json({ error: 'No firm found' });
    }

    const firm = await prisma.firm.update({
      where: { id: user.firmId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(website && { website })
      }
    });

    res.json({
      success: true,
      firm: {
        id: firm.id,
        name: firm.name,
        code: firm.code,
        email: firm.email,
        phone: firm.phone,
        address: firm.address,
        website: firm.website
      }
    });
  } catch (error) {
    console.error('Update firm error:', error);
    res.status(500).json({ error: 'Failed to update firm' });
  }
});

// ============================================
// 4. TEST ENDPOINT
// ============================================
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Firm routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
