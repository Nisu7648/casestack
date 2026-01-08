const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireManager } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get all engagements for firm
router.get('/', auditLogger('VIEW', 'ENGAGEMENT'), async (req, res) => {
  try {
    const { clientId, year, type, status } = req.query;

    const where = {
      firmId: req.firmId,
      ...(clientId && { clientId }),
      ...(year && { year: parseInt(year) }),
      ...(type && { type }),
      ...(status && { status })
    };

    const engagements = await prisma.engagement.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, industry: true }
        },
        leadPartner: {
          select: { id: true, firstName: true, lastName: true }
        },
        managers: {
          select: { id: true, firstName: true, lastName: true }
        },
        report: {
          select: { id: true, status: true, isLocked: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ engagements });
  } catch (error) {
    console.error('Get engagements error:', error);
    res.status(500).json({ error: 'Failed to fetch engagements' });
  }
});

// Get single engagement
router.get('/:id', auditLogger('VIEW', 'ENGAGEMENT'), async (req, res) => {
  try {
    const engagement = await prisma.engagement.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        client: true,
        leadPartner: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        managers: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        report: {
          include: {
            sections: {
              select: { id: true, type: true, isLocked: true, updatedAt: true }
            },
            comments: {
              where: { isResolved: false },
              select: { id: true }
            }
          }
        },
        evidence: {
          select: { id: true, fileName: true, sourceSystem: true, createdAt: true }
        }
      }
    });

    if (!engagement) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    res.json({ engagement });
  } catch (error) {
    console.error('Get engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement' });
  }
});

// Create new engagement
router.post('/', auditLogger('CREATE', 'ENGAGEMENT'), async (req, res) => {
  try {
    const { clientId, year, type, leadPartnerId, managerIds } = req.body;

    if (!clientId || !year || !type || !leadPartnerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: req.firmId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create engagement and report in transaction
    const result = await prisma.$transaction(async (tx) => {
      const engagement = await tx.engagement.create({
        data: {
          clientId,
          year: parseInt(year),
          type,
          leadPartnerId,
          firmId: req.firmId,
          managers: managerIds ? {
            connect: managerIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          client: true,
          leadPartner: {
            select: { firstName: true, lastName: true }
          },
          managers: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Create report with default sections
      const report = await tx.report.create({
        data: {
          engagementId: engagement.id,
          sections: {
            create: [
              { type: 'SCOPE', content: '', order: 1 },
              { type: 'METHODOLOGY', content: '', order: 2 },
              { type: 'FINDINGS', content: '', order: 3 },
              { type: 'OBSERVATIONS', content: '', order: 4 },
              { type: 'CONCLUSIONS', content: '', order: 5 },
              { type: 'RECOMMENDATIONS', content: '', order: 6 }
            ]
          }
        }
      });

      return { engagement, report };
    });

    res.status(201).json({ 
      engagement: result.engagement,
      reportId: result.report.id
    });
  } catch (error) {
    console.error('Create engagement error:', error);
    res.status(500).json({ error: 'Failed to create engagement' });
  }
});

// Update engagement
router.put('/:id', requireManager, auditLogger('UPDATE', 'ENGAGEMENT'), async (req, res) => {
  try {
    const { year, type, leadPartnerId, managerIds, status } = req.body;

    const engagement = await prisma.engagement.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      }
    });

    if (!engagement) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    const updated = await prisma.engagement.update({
      where: { id: req.params.id },
      data: {
        ...(year && { year: parseInt(year) }),
        ...(type && { type }),
        ...(leadPartnerId && { leadPartnerId }),
        ...(status && { status }),
        ...(managerIds && {
          managers: {
            set: managerIds.map(id => ({ id }))
          }
        })
      },
      include: {
        client: true,
        leadPartner: {
          select: { firstName: true, lastName: true }
        },
        managers: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.json({ engagement: updated });
  } catch (error) {
    console.error('Update engagement error:', error);
    res.status(500).json({ error: 'Failed to update engagement' });
  }
});

// Finalize engagement (Partner only)
router.post('/:id/finalize', requireManager, auditLogger('FINALIZE', 'ENGAGEMENT'), async (req, res) => {
  try {
    const engagement = await prisma.engagement.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        report: {
          include: {
            comments: {
              where: { isResolved: false }
            }
          }
        }
      }
    });

    if (!engagement) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    if (engagement.report.comments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot finalize with unresolved comments',
        unresolvedCount: engagement.report.comments.length
      });
    }

    const updated = await prisma.engagement.update({
      where: { id: req.params.id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        report: {
          update: {
            status: 'FINALIZED',
            isLocked: true,
            approvedAt: new Date()
          }
        }
      }
    });

    res.json({ 
      message: 'Engagement finalized successfully',
      engagement: updated
    });
  } catch (error) {
    console.error('Finalize engagement error:', error);
    res.status(500).json({ error: 'Failed to finalize engagement' });
  }
});

module.exports = router;
