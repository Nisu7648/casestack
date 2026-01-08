const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * MODULE G1 - Global Search
 * Search across clients, reports, and sections
 */
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.toLowerCase();

    // Search clients
    const clients = await prisma.client.findMany({
      where: {
        firmId: req.user.firmId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { uniqueIdentifier: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        uniqueIdentifier: true,
        industry: true,
        accountStatus: true
      }
    });

    // Search reports
    const reports = await prisma.report.findMany({
      where: {
        firmId: req.user.firmId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { reportNumber: { contains: searchTerm, mode: 'insensitive' } },
          { executiveSummary: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        reportNumber: true,
        title: true,
        type: true,
        status: true,
        year: true,
        client: {
          select: {
            name: true
          }
        }
      }
    });

    // Search sections
    const sections = await prisma.reportSection.findMany({
      where: {
        report: {
          firmId: req.user.firmId
        },
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        sectionType: true,
        report: {
          select: {
            reportNumber: true,
            title: true
          }
        }
      }
    });

    // Search evidence
    const evidence = await prisma.evidence.findMany({
      where: {
        report: {
          firmId: req.user.firmId
        },
        OR: [
          { referenceNumber: { contains: searchTerm, mode: 'insensitive' } },
          { fileName: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        referenceNumber: true,
        fileName: true,
        evidenceType: true,
        report: {
          select: {
            reportNumber: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        query: q,
        results: {
          clients: {
            count: clients.length,
            items: clients
          },
          reports: {
            count: reports.length,
            items: reports
          },
          sections: {
            count: sections.length,
            items: sections
          },
          evidence: {
            count: evidence.length,
            items: evidence
          }
        },
        totalResults: clients.length + reports.length + sections.length + evidence.length
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

/**
 * Search clients
 */
const searchClients = async (req, res) => {
  try {
    const { q, industry, status, page = 1, limit = 20 } = req.query;

    const where = {
      firmId: req.user.firmId
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { uniqueIdentifier: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    if (status) {
      where.accountStatus = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              engagements: true,
              reports: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search clients'
    });
  }
};

/**
 * Search reports
 */
const searchReports = async (req, res) => {
  try {
    const { q, type, status, clientId, page = 1, limit = 20 } = req.query;

    const where = {
      firmId: req.user.firmId
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { reportNumber: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          client: {
            select: {
              name: true,
              uniqueIdentifier: true
            }
          },
          leadConsultant: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              evidenceItems: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search reports'
    });
  }
};

/**
 * MODULE G2 - Filter by Year
 */
const filterByYear = async (req, res) => {
  try {
    const { year, entity = 'reports' } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    let results;

    if (entity === 'reports') {
      results = await prisma.report.findMany({
        where: {
          firmId: req.user.firmId,
          year: parseInt(year)
        },
        include: {
          client: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (entity === 'engagements') {
      results = await prisma.engagement.findMany({
        where: {
          firmId: req.user.firmId,
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        },
        include: {
          client: {
            select: {
              name: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      });
    }

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        entity,
        count: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Filter by year error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter by year'
    });
  }
};

/**
 * MODULE G2 - Filter by Status
 */
const filterByStatus = async (req, res) => {
  try {
    const { status, entity = 'reports' } = req.query;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status parameter is required'
      });
    }

    let results;

    if (entity === 'reports') {
      results = await prisma.report.findMany({
        where: {
          firmId: req.user.firmId,
          status
        },
        include: {
          client: {
            select: {
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else if (entity === 'clients') {
      results = await prisma.client.findMany({
        where: {
          firmId: req.user.firmId,
          accountStatus: status
        },
        orderBy: { name: 'asc' }
      });
    }

    res.json({
      success: true,
      data: {
        status,
        entity,
        count: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Filter by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter by status'
    });
  }
};

/**
 * MODULE G2 - Filter by User
 */
const filterByUser = async (req, res) => {
  try {
    const { userId, entity = 'reports' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID parameter is required'
      });
    }

    let results;

    if (entity === 'reports') {
      results = await prisma.report.findMany({
        where: {
          firmId: req.user.firmId,
          OR: [
            { leadConsultantId: userId },
            { reviewerId: userId },
            { approverId: userId }
          ]
        },
        include: {
          client: {
            select: {
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else if (entity === 'evidence') {
      results = await prisma.evidence.findMany({
        where: {
          report: {
            firmId: req.user.firmId
          },
          collectedBy: userId
        },
        include: {
          report: {
            select: {
              reportNumber: true,
              title: true
            }
          }
        },
        orderBy: { collectedAt: 'desc' }
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        entity,
        count: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Filter by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter by user'
    });
  }
};

/**
 * Advanced search with multiple criteria
 */
const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      entity = 'reports',
      filters = {}
    } = req.body;

    const where = {
      firmId: req.user.firmId
    };

    // Apply text search
    if (query) {
      if (entity === 'reports') {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { reportNumber: { contains: query, mode: 'insensitive' } }
        ];
      } else if (entity === 'clients') {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { uniqueIdentifier: { contains: query, mode: 'insensitive' } }
        ];
      }
    }

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        where[key] = filters[key];
      }
    });

    let results;

    if (entity === 'reports') {
      results = await prisma.report.findMany({
        where,
        include: {
          client: {
            select: {
              name: true
            }
          },
          leadConsultant: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else if (entity === 'clients') {
      results = await prisma.client.findMany({
        where,
        include: {
          _count: {
            select: {
              engagements: true,
              reports: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    res.json({
      success: true,
      data: {
        query,
        entity,
        filters,
        count: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Advanced search failed'
    });
  }
};

module.exports = {
  globalSearch,
  searchClients,
  searchReports,
  filterByYear,
  filterByStatus,
  filterByUser,
  advancedSearch
};
