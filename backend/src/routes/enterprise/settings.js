const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get firm settings
router.get('/', async (req, res) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.firmId },
      include: { settings: true }
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    res.json({ firm });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update firm info (Admin only)
router.put('/firm', requireAdmin, auditLogger('UPDATE', 'FIRM'), async (req, res) => {
  try {
    const { name, industry, retentionYears, lockAfterDays } = req.body;

    const firm = await prisma.firm.update({
      where: { id: req.firmId },
      data: {
        ...(name && { name }),
        ...(industry !== undefined && { industry }),
        ...(retentionYears && { retentionYears: parseInt(retentionYears) }),
        ...(lockAfterDays && { lockAfterDays: parseInt(lockAfterDays) })
      }
    });

    res.json({ firm });
  } catch (error) {
    console.error('Update firm error:', error);
    res.status(500).json({ error: 'Failed to update firm' });
  }
});

// Update firm settings (Admin only)
router.put('/settings', requireAdmin, auditLogger('UPDATE', 'FIRM_SETTINGS'), async (req, res) => {
  try {
    const { autoLockReports, requirePartnerApproval, enableAuditExport } = req.body;

    // Get or create settings
    let settings = await prisma.firmSettings.findUnique({
      where: { firmId: req.firmId }
    });

    if (!settings) {
      settings = await prisma.firmSettings.create({
        data: { firmId: req.firmId }
      });
    }

    const updated = await prisma.firmSettings.update({
      where: { firmId: req.firmId },
      data: {
        ...(autoLockReports !== undefined && { autoLockReports }),
        ...(requirePartnerApproval !== undefined && { requirePartnerApproval }),
        ...(enableAuditExport !== undefined && { enableAuditExport })
      }
    });

    res.json({ settings: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get firm statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalClients,
      totalEngagements,
      engagementsByStatus,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({ where: { firmId: req.firmId } }),
      prisma.user.count({ where: { firmId: req.firmId, isActive: true } }),
      prisma.client.count({ where: { firmId: req.firmId } }),
      prisma.engagement.count({ where: { firmId: req.firmId } }),
      prisma.engagement.groupBy({
        by: ['status'],
        where: { firmId: req.firmId },
        _count: true
      }),
      prisma.auditLog.findMany({
        where: {
          user: { firmId: req.firmId }
        },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers },
      clients: totalClients,
      engagements: {
        total: totalEngagements,
        byStatus: engagementsByStatus
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
