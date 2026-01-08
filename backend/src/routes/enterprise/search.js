const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Global search across all entities
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = q.trim();
    const results = {};

    // Search clients
    if (!type || type === 'clients') {
      results.clients = await prisma.client.findMany({
        where: {
          firmId: req.firmId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { industry: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          leadPartner: {
            select: { firstName: true, lastName: true }
          }
        },
        take: 10
      });
    }

    // Search engagements
    if (!type || type === 'engagements') {
      results.engagements = await prisma.engagement.findMany({
        where: {
          firmId: req.firmId,
          OR: [
            { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { type: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          client: {
            select: { name: true }
          },
          leadPartner: {
            select: { firstName: true, lastName: true }
          }
        },
        take: 10
      });
    }

    // Search reports (by content in sections)
    if (!type || type === 'reports') {
      results.reports = await prisma.report.findMany({
        where: {
          engagement: {
            firmId: req.firmId
          },
          sections: {
            some: {
              content: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        },
        include: {
          engagement: {
            include: {
              client: {
                select: { name: true }
              }
            }
          },
          sections: {
            where: {
              content: { contains: searchTerm, mode: 'insensitive' }
            },
            select: { type: true, content: true }
          }
        },
        take: 10
      });
    }

    // Search evidence
    if (!type || type === 'evidence') {
      results.evidence = await prisma.evidence.findMany({
        where: {
          engagement: {
            firmId: req.firmId
          },
          OR: [
            { fileName: { contains: searchTerm, mode: 'insensitive' } },
            { sourceSystem: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          engagement: {
            include: {
              client: {
                select: { name: true }
              }
            }
          },
          addedBy: {
            select: { firstName: true, lastName: true }
          }
        },
        take: 10
      });
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      query: searchTerm,
      totalResults,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
