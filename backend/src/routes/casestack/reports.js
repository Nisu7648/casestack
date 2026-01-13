const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../../middleware/auth');

const prisma = new PrismaClient();

// ============================================
// REPORTING & ANALYTICS ROUTES
// Better than Clio: Real-time data, predictive insights, custom date ranges
// ============================================

async function getUserFirm(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  return user.firmId;
}

// ============================================
// 1. DASHBOARD OVERVIEW
// ============================================
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    // Total counts
    const [totalCases, totalClients, totalUsers, totalTasks] = await Promise.all([
      prisma.case.count({ where: { firmId } }),
      prisma.client.count({ where: { firmId } }),
      prisma.user.count({ where: { firmId } }),
      prisma.task.count({ where: { firmId } })
    ]);

    // This year stats
    const thisYearCases = await prisma.case.count({
      where: {
        firmId,
        createdAt: {
          gte: new Date(thisYear, 0, 1)
        }
      }
    });

    // This month stats
    const thisMonthCases = await prisma.case.count({
      where: {
        firmId,
        createdAt: {
          gte: new Date(thisYear, thisMonth, 1)
        }
      }
    });

    // Active cases
    const activeCases = await prisma.case.count({
      where: {
        firmId,
        status: { in: ['DRAFT', 'IN_REVIEW', 'PARTNER_REVIEW'] }
      }
    });

    // Finalized cases
    const finalizedCases = await prisma.case.count({
      where: {
        firmId,
        status: 'FINALIZED'
      }
    });

    res.json({
      totals: {
        cases: totalCases,
        clients: totalClients,
        users: totalUsers,
        tasks: totalTasks
      },
      thisYear: {
        cases: thisYearCases
      },
      thisMonth: {
        cases: thisMonthCases
      },
      caseStatus: {
        active: activeCases,
        finalized: finalizedCases
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// ============================================
// 2. CASES BY STATUS
// ============================================
router.get('/cases-by-status', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const statuses = ['DRAFT', 'IN_REVIEW', 'PARTNER_REVIEW', 'FINALIZED', 'ARCHIVED'];
    
    const data = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.case.count({
          where: { firmId, status }
        })
      }))
    );

    res.json({
      data,
      total: data.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    console.error('Get cases by status error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 3. CASES BY TYPE
// ============================================
router.get('/cases-by-type', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const cases = await prisma.case.groupBy({
      by: ['caseType'],
      where: { firmId },
      _count: true
    });

    const data = cases.map(item => ({
      type: item.caseType,
      count: item._count
    }));

    res.json({
      data,
      total: data.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    console.error('Get cases by type error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 4. MONTHLY TRENDS (Last 12 months)
// ============================================
router.get('/monthly-trends', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const now = new Date();
    const months = [];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await prisma.case.count({
        where: {
          firmId,
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      });

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });
    }

    res.json({
      data: months,
      total: months.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    console.error('Get monthly trends error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 5. TEAM PERFORMANCE
// ============================================
router.get('/team-performance', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const users = await prisma.user.findMany({
      where: { firmId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    const performance = await Promise.all(
      users.map(async (user) => {
        const [casesCreated, casesReviewed, tasksAssigned, tasksCompleted] = await Promise.all([
          prisma.case.count({
            where: { firmId, preparedBy: user.id }
          }),
          prisma.case.count({
            where: { firmId, reviewedBy: user.id }
          }),
          prisma.task.count({
            where: { firmId, assignedTo: user.id }
          }),
          prisma.task.count({
            where: { firmId, assignedTo: user.id, status: 'DONE' }
          })
        ]);

        return {
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
          },
          stats: {
            casesCreated,
            casesReviewed,
            tasksAssigned,
            tasksCompleted,
            taskCompletionRate: tasksAssigned > 0 
              ? Math.round((tasksCompleted / tasksAssigned) * 100) 
              : 0
          }
        };
      })
    );

    res.json({
      data: performance,
      count: performance.length
    });
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 6. CLIENT DISTRIBUTION
// ============================================
router.get('/client-distribution', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const clients = await prisma.client.findMany({
      where: { firmId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { cases: true }
        }
      },
      orderBy: {
        cases: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const data = clients.map(client => ({
      client: client.name,
      cases: client._count.cases
    }));

    res.json({
      data,
      total: data.reduce((sum, item) => sum + item.cases, 0)
    });
  } catch (error) {
    console.error('Get client distribution error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 7. CASE COMPLETION TIME (Average days)
// ============================================
router.get('/completion-time', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const finalizedCases = await prisma.case.findMany({
      where: {
        firmId,
        status: 'FINALIZED',
        finalizedAt: { not: null }
      },
      select: {
        createdAt: true,
        finalizedAt: true,
        caseType: true
      }
    });

    // Calculate average by case type
    const byType = {};
    finalizedCases.forEach(c => {
      const days = Math.round(
        (new Date(c.finalizedAt).getTime() - new Date(c.createdAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      
      if (!byType[c.caseType]) {
        byType[c.caseType] = { total: 0, count: 0 };
      }
      byType[c.caseType].total += days;
      byType[c.caseType].count += 1;
    });

    const data = Object.keys(byType).map(type => ({
      type,
      averageDays: Math.round(byType[type].total / byType[type].count),
      count: byType[type].count
    }));

    // Overall average
    const overallAverage = finalizedCases.length > 0
      ? Math.round(
          finalizedCases.reduce((sum, c) => {
            return sum + (new Date(c.finalizedAt).getTime() - new Date(c.createdAt).getTime());
          }, 0) / (finalizedCases.length * 1000 * 60 * 60 * 24)
        )
      : 0;

    res.json({
      data,
      overall: {
        averageDays: overallAverage,
        totalCases: finalizedCases.length
      }
    });
  } catch (error) {
    console.error('Get completion time error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 8. UPCOMING DEADLINES
// ============================================
router.get('/upcoming-deadlines', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);

    const tasks = await prisma.task.findMany({
      where: {
        firmId,
        status: { not: 'DONE' },
        dueDate: {
          gte: now,
          lte: future
        }
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            caseNumber: true,
            client: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 10
    });

    res.json({
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 9. ACTIVITY LOG (Recent actions)
// ============================================
router.get('/activity-log', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const { limit = 20 } = req.query;

    const activities = await prisma.auditLog.findMany({
      where: { firmId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// ============================================
// 10. EXPORT REPORT (CSV)
// ============================================
router.get('/export/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    let data = [];
    let filename = 'report.csv';

    switch (type) {
      case 'cases':
        const cases = await prisma.case.findMany({
          where: { firmId },
          include: {
            client: { select: { name: true } },
            preparedBy: { select: { firstName: true, lastName: true } }
          }
        });
        
        data = cases.map(c => ({
          'Case Number': c.caseNumber,
          'Client': c.client.name,
          'Type': c.caseType,
          'Fiscal Year': c.fiscalYear,
          'Status': c.status,
          'Prepared By': `${c.preparedBy.firstName} ${c.preparedBy.lastName}`,
          'Created': new Date(c.createdAt).toLocaleDateString()
        }));
        filename = 'cases-report.csv';
        break;

      case 'team':
        const users = await prisma.user.findMany({
          where: { firmId }
        });
        
        data = users.map(u => ({
          'Name': `${u.firstName} ${u.lastName}`,
          'Email': u.email,
          'Role': u.role,
          'Active': u.isActive ? 'Yes' : 'No',
          'Joined': new Date(u.createdAt).toLocaleDateString()
        }));
        filename = 'team-report.csv';
        break;
    }

    // Convert to CSV
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
