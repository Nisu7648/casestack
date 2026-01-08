const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// USER MANAGEMENT MODULE
// Firm-level user control with role enforcement
// ============================================

// Get all users in firm
router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;

    const where = {
      firmId: req.firmId,
      ...(role && { role }),
      ...(status && { isActive: status === 'active' })
    };

    const users = await prisma.user.findMany({
      where,
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

// Get users by role
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
        email: true,
        role: true
      },
      orderBy: { firstName: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (Admin only)
router.post('/', requireAdmin, auditLogger('USER_CREATED', 'USER'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check license limit
    const firm = await prisma.firm.findUnique({
      where: { id: req.firmId }
    });

    if (firm.seatsUsed >= firm.seatsLicensed) {
      return res.status(403).json({ error: 'License limit reached. Please upgrade your plan.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and update firm seats
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          firmId: req.firmId,
          isActive: true
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

      // Update firm seats used
      await tx.firm.update({
        where: { id: req.firmId },
        data: { seatsUsed: { increment: 1 } }
      });

      // Update subscription active users
      await tx.subscription.updateMany({
        where: { firmId: req.firmId, status: 'ACTIVE' },
        data: { activeUsers: { increment: 1 } }
      });

      return newUser;
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', requireAdmin, auditLogger('USER_UPDATED', 'USER'), async (req, res) => {
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

    // Cannot deactivate yourself
    if (req.params.id === req.userId && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive })
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

// Change password
router.post('/change-password', auditLogger('PASSWORD_CHANGED', 'USER'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
