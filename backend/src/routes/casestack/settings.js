const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// FIRM SETTINGS MODULE
// Firm-wide configuration and preferences
// ============================================

// Get firm settings
router.get('/', async (req, res) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.firmId },
      include: {
        settings: true
      }
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
router.put('/firm', requireAdmin, auditLogger('FIRM_UPDATED', 'FIRM'), async (req, res) => {
  try {
    const { name, industry } = req.body;

    const firm = await prisma.firm.update({
      where: { id: req.firmId },
      data: {
        ...(name && { name }),
        ...(industry && { industry })
      }
    });

    res.json({ firm });
  } catch (error) {
    console.error('Update firm error:', error);
    res.status(500).json({ error: 'Failed to update firm' });
  }
});

// Update firm settings (Admin only)
router.put('/settings', requireAdmin, auditLogger('SETTINGS_UPDATED', 'SETTINGS'), async (req, res) => {
  try {
    const {
      requirePartnerForFinalization,
      requireTwoApprovers,
      enableDownloadTracking,
      enableAuditExport,
      autoArchiveAfterYears
    } = req.body;

    const settings = await prisma.firmSettings.upsert({
      where: { firmId: req.firmId },
      update: {
        ...(typeof requirePartnerForFinalization === 'boolean' && { requirePartnerForFinalization }),
        ...(typeof requireTwoApprovers === 'boolean' && { requireTwoApprovers }),
        ...(typeof enableDownloadTracking === 'boolean' && { enableDownloadTracking }),
        ...(typeof enableAuditExport === 'boolean' && { enableAuditExport }),
        ...(autoArchiveAfterYears && { autoArchiveAfterYears: parseInt(autoArchiveAfterYears) })
      },
      create: {
        firmId: req.firmId,
        requirePartnerForFinalization: requirePartnerForFinalization ?? true,
        requireTwoApprovers: requireTwoApprovers ?? false,
        enableDownloadTracking: enableDownloadTracking ?? true,
        enableAuditExport: enableAuditExport ?? true,
        autoArchiveAfterYears: autoArchiveAfterYears ?? 7
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get subscription info
router.get('/subscription', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        firmId: req.firmId,
        status: 'ACTIVE'
      }
    });

    const firm = await prisma.firm.findUnique({
      where: { id: req.firmId },
      select: {
        seatsLicensed: true,
        seatsUsed: true,
        pricePerSeat: true,
        billingCurrency: true
      }
    });

    res.json({
      subscription,
      firm,
      usage: {
        seatsUsed: firm.seatsUsed,
        seatsLicensed: firm.seatsLicensed,
        seatsAvailable: firm.seatsLicensed - firm.seatsUsed,
        utilizationPercent: ((firm.seatsUsed / firm.seatsLicensed) * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Update license seats (Admin only)
router.put('/license', requireAdmin, auditLogger('LICENSE_UPDATED', 'FIRM'), async (req, res) => {
  try {
    const { seatsLicensed } = req.body;

    if (!seatsLicensed || seatsLicensed < 1) {
      return res.status(400).json({ error: 'Invalid seat count' });
    }

    const firm = await prisma.firm.findUnique({
      where: { id: req.firmId }
    });

    if (seatsLicensed < firm.seatsUsed) {
      return res.status(400).json({
        error: `Cannot reduce seats below current usage (${firm.seatsUsed} users active)`
      });
    }

    const updated = await prisma.firm.update({
      where: { id: req.firmId },
      data: { seatsLicensed: parseInt(seatsLicensed) }
    });

    res.json({
      message: 'License updated successfully',
      firm: updated
    });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

module.exports = router;
