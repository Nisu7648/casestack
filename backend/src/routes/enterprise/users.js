const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get all users in firm (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { firmId: req.firmId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        firm: {
          select: { id: true, name: true, industry: true }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create new user (Admin only)
router.post('/', requireAdmin, auditLogger('CREATE', 'USER'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        firmId: req.firmId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', requireAdmin, auditLogger('UPDATE', 'USER'), async (req, res) => {
  try {
    const { firstName, lastName, role, isActive } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.json({ user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user (Admin only)
router.post('/:id/deactivate', requireAdmin, auditLogger('DEACTIVATE', 'USER'), async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ 
      message: 'User deactivated successfully',
      user: updated
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get users by role (for dropdowns)
router.get('/by-role/:role', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        firmId: req.firmId,
        role: req.params.role.toUpperCase(),
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
