const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get all clients for firm
router.get('/', auditLogger('VIEW', 'CLIENT'), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { firmId: req.firmId },
      include: {
        leadPartner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        engagements: {
          select: { id: true, year: true, type: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const clientsWithStats = clients.map(client => ({
      ...client,
      totalEngagements: client.engagements.length,
      lastEngagementYear: client.engagements.length > 0 
        ? Math.max(...client.engagements.map(e => e.year))
        : null
    }));

    res.json({ clients: clientsWithStats });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client with full engagement history
router.get('/:id', auditLogger('VIEW', 'CLIENT'), async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        leadPartner: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        engagements: {
          include: {
            leadPartner: {
              select: { firstName: true, lastName: true }
            },
            report: {
              select: { id: true, status: true, isLocked: true }
            }
          },
          orderBy: { year: 'desc' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/', auditLogger('CREATE', 'CLIENT'), async (req, res) => {
  try {
    const { name, industry, leadPartnerId } = req.body;

    if (!name || !industry || !leadPartnerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify lead partner exists and is in same firm
    const leadPartner = await prisma.user.findFirst({
      where: {
        id: leadPartnerId,
        firmId: req.firmId,
        role: { in: ['PARTNER', 'ADMIN'] }
      }
    });

    if (!leadPartner) {
      return res.status(400).json({ error: 'Invalid lead partner' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        industry,
        leadPartnerId,
        firmId: req.firmId
      },
      include: {
        leadPartner: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', auditLogger('UPDATE', 'CLIENT'), async (req, res) => {
  try {
    const { name, industry, leadPartnerId } = req.body;

    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(industry && { industry }),
        ...(leadPartnerId && { leadPartnerId })
      },
      include: {
        leadPartner: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({ client: updated });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', auditLogger('DELETE', 'CLIENT'), async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        engagements: true
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.engagements.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing engagements' 
      });
    }

    await prisma.client.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
