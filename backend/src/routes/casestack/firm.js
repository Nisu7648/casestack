const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ============================================
// FIRM MANAGEMENT ROUTES
// Create firm, invite users, manage team
// ============================================

// Generate unique firm code
function generateFirmCode(firmName) {
  const prefix = firmName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 3);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

// ============================================
// 1. CREATE FIRM (During signup)
// ============================================
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      firmName,
      industry,
      address,
      city,
      country,
      phone,
      email,
      website
    } = req.body;

    // Check if user already has a firm
    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { firm: true }
    });

    if (existingUser.firmId) {
      return res.status(400).json({
        error: 'User already belongs to a firm'
      });
    }

    // Generate unique firm code
    let firmCode = generateFirmCode(firmName);
    let codeExists = await prisma.firm.findUnique({ where: { firmCode } });
    
    while (codeExists) {
      firmCode = generateFirmCode(firmName);
      codeExists = await prisma.firm.findUnique({ where: { firmCode } });
    }

    // Create firm
    const firm = await prisma.firm.create({
      data: {
        firmName,
        firmCode,
        industry,
        address,
        city,
        country,
        phone,
        email,
        website,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'TRIAL',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        maxUsers: 5,
        maxCases: 50,
        maxStorage: 5368709120, // 5GB
        currentStorage: 0,
        isActive: true
      }
    });

    // Create firm settings
    await prisma.firmSettings.create({
      data: {
        firmId: firm.id,
        caseNumberPrefix: 'CASE',
        caseNumberFormat: '{PREFIX}-{YEAR}-{NUMBER}',
        fiscalYearStart: 4, // April
        requireReview: true,
        requirePartnerApproval: true,
        allowClientPortal: false,
        twoFactorRequired: false,
        sessionTimeoutMinutes: 480
      }
    });

    // Update user as firm owner
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firmId: firm.id,
        isOwner: true,
        role: 'ADMIN',
        joinedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        firmId: firm.id,
        action: 'FIRM_CREATED',
        entityType: 'FIRM',
        entityId: firm.id,
        details: `Firm created: ${firmName}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      firm,
      message: 'Firm created successfully'
    });
  } catch (error) {
    console.error('Create firm error:', error);
    res.status(500).json({ error: 'Failed to create firm' });
  }
});

// ============================================
// 2. GET FIRM DETAILS
// ============================================
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        firm: {
          include: {
            settings: true,
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isOwner: true,
                isActive: true,
                joinedAt: true
              }
            }
          }
        }
      }
    });

    if (!user.firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Get usage stats
    const caseCount = await prisma.case.count({
      where: { firmId: user.firmId }
    });

    const clientCount = await prisma.client.count({
      where: { firmId: user.firmId }
    });

    res.json({
      firm: user.firm,
      stats: {
        users: user.firm.users.length,
        cases: caseCount,
        clients: clientCount,
        storage: user.firm.currentStorage,
        maxStorage: user.firm.maxStorage,
        storagePercent: (user.firm.currentStorage / user.firm.maxStorage * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get firm error:', error);
    res.status(500).json({ error: 'Failed to get firm details' });
  }
});

// ============================================
// 3. INVITE USER TO FIRM
// ============================================
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user is admin/owner
    const inviter = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { firm: true }
    });

    if (!inviter.firmId) {
      return res.status(400).json({ error: 'You are not part of a firm' });
    }

    if (inviter.role !== 'ADMIN' && !inviter.isOwner) {
      return res.status(403).json({ error: 'Only admins can invite users' });
    }

    // Check if firm has reached max users
    const userCount = await prisma.user.count({
      where: { firmId: inviter.firmId }
    });

    if (userCount >= inviter.firm.maxUsers) {
      return res.status(400).json({
        error: `Maximum users (${inviter.firm.maxUsers}) reached. Upgrade your plan.`
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.firmId === inviter.firmId) {
        return res.status(400).json({ error: 'User already in your firm' });
      }
      if (existingUser.firmId) {
        return res.status(400).json({ error: 'User already belongs to another firm' });
      }
    }

    // Check for pending invitation
    const pendingInvite = await prisma.firmInvitation.findFirst({
      where: {
        email,
        firmId: inviter.firmId,
        status: 'PENDING'
      }
    });

    if (pendingInvite) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invitation = await prisma.firmInvitation.create({
      data: {
        firmId: inviter.firmId,
        email,
        role: role || 'STAFF',
        invitedBy: req.user.userId,
        invitationToken,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        firmId: inviter.firmId,
        action: 'USER_INVITED',
        entityType: 'FIRM',
        entityId: inviter.firmId,
        details: `Invited ${email} as ${role}`,
        ipAddress: req.ip
      }
    });

    // TODO: Send invitation email
    // For now, return invitation link
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}`;

    res.json({
      success: true,
      invitation,
      invitationLink,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// ============================================
// 4. ACCEPT INVITATION
// ============================================
router.post('/accept-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { firstName, lastName, password } = req.body;

    // Find invitation
    const invitation = await prisma.firmInvitation.findUnique({
      where: { invitationToken: token },
      include: { firm: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation already used' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (user) {
      // User exists, just add to firm
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firmId: invitation.firmId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
          joinedAt: new Date()
        }
      });
    } else {
      // Create new user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName,
          lastName,
          firmId: invitation.firmId,
          role: invitation.role,
          isOwner: false,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
          joinedAt: new Date(),
          isActive: true
        }
      });
    }

    // Update invitation
    await prisma.firmInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        firmId: invitation.firmId,
        action: 'USER_JOINED',
        entityType: 'FIRM',
        entityId: invitation.firmId,
        details: `${user.firstName} ${user.lastName} joined the firm`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId
      },
      message: 'Successfully joined firm'
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// ============================================
// 5. LIST TEAM MEMBERS
// ============================================
router.get('/team', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user.firmId) {
      return res.status(400).json({ error: 'You are not part of a firm' });
    }

    const teamMembers = await prisma.user.findMany({
      where: { firmId: user.firmId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isOwner: true,
        isActive: true,
        joinedAt: true,
        lastLogin: true
      },
      orderBy: [
        { isOwner: 'desc' },
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({
      teamMembers,
      count: teamMembers.length
    });
  } catch (error) {
    console.error('List team error:', error);
    res.status(500).json({ error: 'Failed to list team members' });
  }
});

// ============================================
// 6. UPDATE USER ROLE
// ============================================
router.put('/team/:userId/role', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (requester.role !== 'ADMIN' && !requester.isOwner) {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        firmId: requester.firmId,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: userId,
        details: `Changed role to ${role}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      user: updatedUser,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ============================================
// 7. REMOVE USER FROM FIRM
// ============================================
router.delete('/team/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (requester.role !== 'ADMIN' && !requester.isOwner) {
      return res.status(403).json({ error: 'Only admins can remove users' });
    }

    // Check if user is owner
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (userToRemove.isOwner) {
      return res.status(400).json({ error: 'Cannot remove firm owner' });
    }

    // Remove user from firm
    await prisma.user.update({
      where: { id: userId },
      data: {
        firmId: null,
        isActive: false
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        firmId: requester.firmId,
        action: 'USER_REMOVED',
        entityType: 'USER',
        entityId: userId,
        details: `Removed ${userToRemove.firstName} ${userToRemove.lastName} from firm`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'User removed from firm'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// ============================================
// 8. UPDATE FIRM SETTINGS
// ============================================
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const {
      caseNumberPrefix,
      caseNumberFormat,
      fiscalYearStart,
      requireReview,
      requirePartnerApproval,
      autoArchiveAfterDays,
      allowClientPortal,
      twoFactorRequired,
      passwordExpiryDays,
      sessionTimeoutMinutes
    } = req.body;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (user.role !== 'ADMIN' && !user.isOwner) {
      return res.status(403).json({ error: 'Only admins can update settings' });
    }

    // Update settings
    const settings = await prisma.firmSettings.update({
      where: { firmId: user.firmId },
      data: {
        caseNumberPrefix,
        caseNumberFormat,
        fiscalYearStart,
        requireReview,
        requirePartnerApproval,
        autoArchiveAfterDays,
        allowClientPortal,
        twoFactorRequired,
        passwordExpiryDays,
        sessionTimeoutMinutes
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        firmId: user.firmId,
        action: 'SETTINGS_UPDATED',
        entityType: 'FIRM',
        entityId: user.firmId,
        details: 'Firm settings updated',
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
