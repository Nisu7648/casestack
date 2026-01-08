const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get all evidence for engagement
router.get('/engagement/:engagementId', auditLogger('VIEW', 'EVIDENCE'), async (req, res) => {
  try {
    const evidence = await prisma.evidence.findMany({
      where: {
        engagementId: req.params.engagementId,
        engagement: {
          firmId: req.firmId
        }
      },
      include: {
        addedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ evidence });
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// Add evidence reference
router.post('/', auditLogger('CREATE', 'EVIDENCE'), async (req, res) => {
  try {
    const { engagementId, fileName, sourceSystem, sourceUrl, linkedSection } = req.body;

    if (!engagementId || !fileName || !sourceSystem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify engagement exists
    const engagement = await prisma.engagement.findFirst({
      where: {
        id: engagementId,
        firmId: req.firmId
      }
    });

    if (!engagement) {
      return res.status(404).json({ error: 'Engagement not found' });
    }

    const evidence = await prisma.evidence.create({
      data: {
        engagementId,
        fileName,
        sourceSystem,
        sourceUrl: sourceUrl || null,
        linkedSection: linkedSection || null,
        addedById: req.userId
      },
      include: {
        addedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({ evidence });
  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({ error: 'Failed to add evidence' });
  }
});

// Update evidence
router.put('/:id', auditLogger('UPDATE', 'EVIDENCE'), async (req, res) => {
  try {
    const { fileName, sourceSystem, sourceUrl, linkedSection } = req.body;

    const evidence = await prisma.evidence.findFirst({
      where: {
        id: req.params.id,
        engagement: {
          firmId: req.firmId
        }
      }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const updated = await prisma.evidence.update({
      where: { id: req.params.id },
      data: {
        ...(fileName && { fileName }),
        ...(sourceSystem && { sourceSystem }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(linkedSection !== undefined && { linkedSection })
      }
    });

    res.json({ evidence: updated });
  } catch (error) {
    console.error('Update evidence error:', error);
    res.status(500).json({ error: 'Failed to update evidence' });
  }
});

// Delete evidence
router.delete('/:id', auditLogger('DELETE', 'EVIDENCE'), async (req, res) => {
  try {
    const evidence = await prisma.evidence.findFirst({
      where: {
        id: req.params.id,
        engagement: {
          firmId: req.firmId
        }
      }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    await prisma.evidence.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Evidence deleted successfully' });
  } catch (error) {
    console.error('Delete evidence error:', error);
    res.status(500).json({ error: 'Failed to delete evidence' });
  }
});

module.exports = router;
