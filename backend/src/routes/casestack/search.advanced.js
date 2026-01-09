const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { searchValidation, paginationValidation } = require('../../middleware/validation.middleware');
const { logger } = require('../../utils/logger');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// ADVANCED SEARCH WITH FULL-TEXT
// PostgreSQL full-text search + filters
// ============================================

// Advanced search endpoint
router.get('/', searchValidation.search, paginationValidation, async (req, res) => {
  try {
    const {
      q,
      fiscalYear,
      caseType,
      clientId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      firmId: req.firmId,
      ...(fiscalYear && { fiscalYear: parseInt(fiscalYear) }),
      ...(caseType && { caseType }),
      ...(clientId && { clientId }),
      ...(status && { status }),
      ...(dateFrom && {
        createdAt: {
          gte: new Date(dateFrom)
        }
      }),
      ...(dateTo && {
        createdAt: {
          ...where.createdAt,
          lte: new Date(dateTo)
        }
      })
    };

    // Full-text search using PostgreSQL
    if (q) {
      // Search in case name, case number, description, and client name
      where.OR = [
        { caseName: { contains: q, mode: 'insensitive' } },
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        {
          client: {
            name: { contains: q, mode: 'insensitive' }
          }
        }
      ];
    }

    // Execute search
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, industry: true }
          },
          preparedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          bundles: {
            select: {
              id: true,
              bundleName: true,
              isFinalized: true,
              _count: {
                select: { files: true }
              }
            }
          }
        },
        orderBy: [
          { finalizedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.case.count({ where })
    ]);

    // Calculate relevance score (simple scoring)
    const casesWithScore = cases.map(c => {
      let score = 0;
      const searchTerm = q?.toLowerCase() || '';

      if (c.caseName.toLowerCase().includes(searchTerm)) score += 10;
      if (c.caseNumber.toLowerCase().includes(searchTerm)) score += 15;
      if (c.description?.toLowerCase().includes(searchTerm)) score += 5;
      if (c.client.name.toLowerCase().includes(searchTerm)) score += 8;
      if (c.tags.some(tag => tag.toLowerCase().includes(searchTerm))) score += 7;

      return { ...c, relevanceScore: score };
    });

    // Sort by relevance if search query exists
    if (q) {
      casesWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    logger.info('Search executed', {
      query: q,
      filters: { fiscalYear, caseType, status },
      results: cases.length,
      userId: req.userId,
      firmId: req.firmId
    });

    res.json({
      cases: casesWithScore,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      query: {
        searchTerm: q,
        filters: { fiscalYear, caseType, clientId, status, dateFrom, dateTo }
      }
    });
  } catch (error) {
    logger.error('Search error', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions (autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get case name suggestions
    const caseNames = await prisma.case.findMany({
      where: {
        firmId: req.firmId,
        caseName: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: { caseName: true },
      distinct: ['caseName'],
      take: 5
    });

    // Get client name suggestions
    const clientNames = await prisma.client.findMany({
      where: {
        firmId: req.firmId,
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: { name: true },
      take: 5
    });

    // Get tag suggestions
    const tags = await prisma.case.findMany({
      where: {
        firmId: req.firmId,
        tags: {
          hasSome: [q]
        }
      },
      select: { tags: true },
      take: 10
    });

    const uniqueTags = [...new Set(tags.flatMap(t => t.tags))].filter(tag =>
      tag.toLowerCase().includes(q.toLowerCase())
    );

    res.json({
      suggestions: {
        cases: caseNames.map(c => c.caseName),
        clients: clientNames.map(c => c.name),
        tags: uniqueTags.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error('Suggestions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Search filters metadata
router.get('/filters', async (req, res) => {
  try {
    // Get available filter options
    const [fiscalYears, caseTypes, clients, statuses] = await Promise.all([
      prisma.case.findMany({
        where: { firmId: req.firmId },
        select: { fiscalYear: true },
        distinct: ['fiscalYear'],
        orderBy: { fiscalYear: 'desc' }
      }),
      prisma.case.findMany({
        where: { firmId: req.firmId },
        select: { caseType: true },
        distinct: ['caseType']
      }),
      prisma.client.findMany({
        where: { firmId: req.firmId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.case.findMany({
        where: { firmId: req.firmId },
        select: { status: true },
        distinct: ['status']
      })
    ]);

    res.json({
      filters: {
        fiscalYears: fiscalYears.map(f => f.fiscalYear),
        caseTypes: caseTypes.map(c => c.caseType),
        clients: clients,
        statuses: statuses.map(s => s.status)
      }
    });
  } catch (error) {
    logger.error('Filters error', { error: error.message });
    res.status(500).json({ error: 'Failed to get filters' });
  }
});

// Recent searches (user-specific)
router.get('/recent', async (req, res) => {
  try {
    // Get recent searches from audit logs
    const recentSearches = await prisma.auditLog.findMany({
      where: {
        firmId: req.firmId,
        userId: req.userId,
        action: 'SEARCH_EXECUTED'
      },
      select: {
        metadata: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const searches = recentSearches
      .map(log => ({
        query: log.metadata?.query,
        timestamp: log.createdAt
      }))
      .filter(s => s.query);

    res.json({ recentSearches: searches });
  } catch (error) {
    logger.error('Recent searches error', { error: error.message });
    res.status(500).json({ error: 'Failed to get recent searches' });
  }
});

module.exports = router;
