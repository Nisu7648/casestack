const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// CLIENT MANAGEMENT (MINIMAL)
// Simple client records for case association
// ============================================

// Get all clients for firm
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    const where = {
      firmId: req.firmId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' }
      })
    };

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: { cases: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client with cases
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        cases: {
          include: {
            preparedBy: {
              select: { firstName: true, lastName: true }
            },
            approvedBy: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
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

// Create client
router.post('/', auditLogger('CLIENT_CREATED', 'CLIENT'), async (req, res) => {
  try {
    const { name, industry } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        industry,
        firmId: req.firmId
      }
    });

    res.status(201).json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', auditLogger('CLIENT_UPDATED', 'CLIENT'), async (req, res) => {
  try {
    const { name, industry } = req.body;

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
        ...(industry && { industry })
      }
    });

    res.json({ client: updated });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

module.exports = router;
