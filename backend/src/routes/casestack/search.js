const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// FIRM MEMORY & SEARCH
// Institutional memory that survives employee turnover
// ============================================

// Global search across finalized cases
router.get('/', async (req, res) => {
  try {
    const { q, fiscalYear, caseType, clientName, partnerName, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = q.trim().toLowerCase();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      firmId: req.firmId,
      ...(fiscalYear && { fiscalYear: parseInt(fiscalYear) }),
      ...(caseType && { caseType: { contains: caseType, mode: 'insensitive' } }),
      ...(clientName && { clientName: { contains: clientName, mode: 'insensitive' } }),
      ...(partnerName && { partnerName: { contains: partnerName, mode: 'insensitive' } }),
      OR: [
        { caseName: { contains: searchTerm, mode: 'insensitive' } },
        { clientName: { contains: searchTerm, mode: 'insensitive' } },
        { caseType: { contains: searchTerm, mode: 'insensitive' } },
        { partnerName: { contains: searchTerm, mode: 'insensitive' } },
        { searchVector: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    const [results, total] = await Promise.all([
      prisma.firmMemoryIndex.findMany({
        where,
        include: {
          case: {
            include: {
              client: {
                select: { name: true, industry: true }
              },
              preparedBy: {
                select: { firstName: true, lastName: true }
              },
              approvedBy: {
                select: { firstName: true, lastName: true }
              },
              bundles: {
                select: {
                  id: true,
                  bundleName: true,
                  _count: {
                    select: { files: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { finalizedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.firmMemoryIndex.count({ where })
    ]);

    res.json({
      query: searchTerm,
      results: results.map(r => ({
        id: r.id,
        caseId: r.caseId,
        caseNumber: r.case.caseNumber,
        caseName: r.caseName,
        clientName: r.clientName,
        caseType: r.caseType,
        fiscalYear: r.fiscalYear,
        partnerName: r.partnerName,
        finalizedAt: r.finalizedAt,
        preparedBy: `${r.case.preparedBy.firstName} ${r.case.preparedBy.lastName}`,
        approvedBy: r.case.approvedBy ? `${r.case.approvedBy.firstName} ${r.case.approvedBy.lastName}` : null,
        bundleCount: r.case.bundles.length,
        fileCount: r.case.bundles.reduce((sum, b) => sum + b._count.files, 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search with filters
router.post('/advanced', async (req, res) => {
  try {
    const {
      caseName,
      clientName,
      caseType,
      fiscalYearFrom,
      fiscalYearTo,
      partnerName,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.body;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      firmId: req.firmId,
      ...(caseName && { caseName: { contains: caseName, mode: 'insensitive' } }),
      ...(clientName && { clientName: { contains: clientName, mode: 'insensitive' } }),
      ...(caseType && { caseType }),
      ...(partnerName && { partnerName: { contains: partnerName, mode: 'insensitive' } }),
      ...(fiscalYearFrom || fiscalYearTo) && {
        fiscalYear: {
          ...(fiscalYearFrom && { gte: parseInt(fiscalYearFrom) }),
          ...(fiscalYearTo && { lte: parseInt(fiscalYearTo) })
        }
      },
      ...(dateFrom || dateTo) && {
        finalizedAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) })
        }
      }
    };

    const [results, total] = await Promise.all([
      prisma.firmMemoryIndex.findMany({
        where,
        include: {
          case: {
            include: {
              client: true,
              preparedBy: {
                select: { firstName: true, lastName: true }
              },
              approvedBy: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { finalizedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.firmMemoryIndex.count({ where })
    ]);

    res.json({
      results: results.map(r => ({
        caseId: r.caseId,
        caseNumber: r.case.caseNumber,
        caseName: r.caseName,
        clientName: r.clientName,
        caseType: r.caseType,
        fiscalYear: r.fiscalYear,
        partnerName: r.partnerName,
        finalizedAt: r.finalizedAt,
        preparedBy: `${r.case.preparedBy.firstName} ${r.case.preparedBy.lastName}`,
        approvedBy: r.case.approvedBy ? `${r.case.approvedBy.firstName} ${r.case.approvedBy.lastName}` : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// Get search suggestions (autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { type, q } = req.query;

    if (!type || !q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    let suggestions = [];

    switch (type) {
      case 'client':
        const clients = await prisma.firmMemoryIndex.findMany({
          where: {
            firmId: req.firmId,
            clientName: { contains: searchTerm, mode: 'insensitive' }
          },
          select: { clientName: true },
          distinct: ['clientName'],
          take: 10
        });
        suggestions = clients.map(c => c.clientName);
        break;

      case 'case':
        const cases = await prisma.firmMemoryIndex.findMany({
          where: {
            firmId: req.firmId,
            caseName: { contains: searchTerm, mode: 'insensitive' }
          },
          select: { caseName: true },
          distinct: ['caseName'],
          take: 10
        });
        suggestions = cases.map(c => c.caseName);
        break;

      case 'partner':
        const partners = await prisma.firmMemoryIndex.findMany({
          where: {
            firmId: req.firmId,
            partnerName: { contains: searchTerm, mode: 'insensitive' }
          },
          select: { partnerName: true },
          distinct: ['partnerName'],
          take: 10
        });
        suggestions = partners.map(p => p.partnerName);
        break;

      default:
        suggestions = [];
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Get search statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCases,
      casesByYear,
      casesByType,
      topClients,
      topPartners
    ] = await Promise.all([
      prisma.firmMemoryIndex.count({
        where: { firmId: req.firmId }
      }),
      prisma.firmMemoryIndex.groupBy({
        by: ['fiscalYear'],
        where: { firmId: req.firmId },
        _count: true,
        orderBy: { fiscalYear: 'desc' }
      }),
      prisma.firmMemoryIndex.groupBy({
        by: ['caseType'],
        where: { firmId: req.firmId },
        _count: true,
        orderBy: { _count: { caseType: 'desc' } }
      }),
      prisma.firmMemoryIndex.groupBy({
        by: ['clientName'],
        where: { firmId: req.firmId },
        _count: true,
        orderBy: { _count: { clientName: 'desc' } },
        take: 10
      }),
      prisma.firmMemoryIndex.groupBy({
        by: ['partnerName'],
        where: { firmId: req.firmId },
        _count: true,
        orderBy: { _count: { partnerName: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      totalCases,
      casesByYear: casesByYear.map(y => ({
        year: y.fiscalYear,
        count: y._count
      })),
      casesByType: casesByType.map(t => ({
        type: t.caseType,
        count: t._count
      })),
      topClients: topClients.map(c => ({
        client: c.clientName,
        count: c._count
      })),
      topPartners: topPartners.map(p => ({
        partner: p.partnerName,
        count: p._count
      }))
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Export search results to CSV
router.post('/export', async (req, res) => {
  try {
    const { filters } = req.body;

    const where = {
      firmId: req.firmId,
      ...filters
    };

    const results = await prisma.firmMemoryIndex.findMany({
      where,
      include: {
        case: {
          include: {
            client: true,
            preparedBy: {
              select: { firstName: true, lastName: true }
            },
            approvedBy: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { finalizedAt: 'desc' }
    });

    // Generate CSV
    const csv = [
      'Case Number,Case Name,Client,Type,Fiscal Year,Prepared By,Approved By,Finalized At',
      ...results.map(r => 
        `${r.case.caseNumber},"${r.caseName}","${r.clientName}",${r.caseType},${r.fiscalYear},"${r.case.preparedBy.firstName} ${r.case.preparedBy.lastName}","${r.case.approvedBy ? r.case.approvedBy.firstName + ' ' + r.case.approvedBy.lastName : 'N/A'}",${r.finalizedAt.toISOString()}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=casestack-search-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export results' });
  }
});

module.exports = router;
