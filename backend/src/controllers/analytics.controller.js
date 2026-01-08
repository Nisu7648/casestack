const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const firmId = req.user.firmId;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { firmId };
    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }

    // Get case statistics
    const [
      totalCases,
      activeCases,
      completedCases,
      casesByType,
      casesByStatus
    ] = await Promise.all([
      prisma.case.count({ where: { firmId } }),
      prisma.case.count({ where: { firmId, status: 'IN_PROGRESS' } }),
      prisma.case.count({ where: { firmId, status: 'COMPLETED' } }),
      prisma.case.groupBy({
        by: ['caseType'],
        where: { firmId },
        _count: true
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: { firmId },
        _count: true
      })
    ]);

    // Get financial statistics
    const financials = await prisma.case.aggregate({
      where: { firmId },
      _sum: {
        budgetTotal: true,
        budgetSpent: true
      }
    });

    // Get time statistics
    const timeStats = await prisma.timeEntry.aggregate({
      where: {
        case: { firmId }
      },
      _sum: {
        duration: true,
        amount: true
      }
    });

    // Get task statistics
    const [totalTasks, completedTasks] = await Promise.all([
      prisma.task.count({
        where: { case: { firmId } }
      }),
      prisma.task.count({
        where: {
          case: { firmId },
          status: 'DONE'
        }
      })
    ]);

    // Get recent activity
    const recentActivity = await prisma.caseActivity.findMany({
      where: {
        case: { firmId }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            title: true,
            caseNumber: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Calculate trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const caseTrend = await prisma.case.groupBy({
      by: ['createdAt'],
      where: {
        firmId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        cases: {
          total: totalCases,
          active: activeCases,
          completed: completedCases,
          completionRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
          byType: casesByType.reduce((acc, item) => {
            acc[item.caseType] = item._count;
            return acc;
          }, {}),
          byStatus: casesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {})
        },
        financials: {
          totalBudget: financials._sum.budgetTotal || 0,
          totalSpent: financials._sum.budgetSpent || 0,
          utilization: financials._sum.budgetTotal > 0
            ? Math.round((parseFloat(financials._sum.budgetSpent) / parseFloat(financials._sum.budgetTotal)) * 100)
            : 0
        },
        time: {
          totalHours: timeStats._sum.duration || 0,
          totalRevenue: timeStats._sum.amount || 0,
          averageHourlyRate: timeStats._sum.duration > 0
            ? parseFloat(timeStats._sum.amount) / parseFloat(timeStats._sum.duration)
            : 0
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        recentActivity,
        trends: {
          cases: caseTrend
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

/**
 * Get case-specific analytics
 */
const getCaseAnalytics = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        milestones: true,
        risks: true
      }
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Task analytics
    const tasksByStatus = caseData.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const tasksByAssignee = caseData.tasks.reduce((acc, task) => {
      if (task.assignee) {
        const name = `${task.assignee.firstName} ${task.assignee.lastName}`;
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {});

    // Time analytics
    const timeByUser = caseData.timeEntries.reduce((acc, entry) => {
      const name = `${entry.user.firstName} ${entry.user.lastName}`;
      acc[name] = (acc[name] || 0) + parseFloat(entry.duration);
      return acc;
    }, {});

    const timeByWeek = caseData.timeEntries.reduce((acc, entry) => {
      const week = new Date(entry.startTime).toISOString().split('T')[0];
      acc[week] = (acc[week] || 0) + parseFloat(entry.duration);
      return acc;
    }, {});

    // Milestone progress
    const milestoneProgress = {
      total: caseData.milestones.length,
      completed: caseData.milestones.filter(m => m.status === 'COMPLETED').length,
      delayed: caseData.milestones.filter(m => m.status === 'DELAYED').length
    };

    // Risk analysis
    const riskAnalysis = {
      total: caseData.risks.length,
      critical: caseData.risks.filter(r => r.riskScore >= 12).length,
      high: caseData.risks.filter(r => r.riskScore >= 6 && r.riskScore < 12).length,
      active: caseData.risks.filter(r => r.status !== 'CLOSED').length
    };

    res.json({
      success: true,
      data: {
        case: {
          id: caseData.id,
          title: caseData.title,
          status: caseData.status,
          progress: caseData.progressPercentage
        },
        tasks: {
          total: caseData.tasks.length,
          byStatus: tasksByStatus,
          byAssignee: tasksByAssignee
        },
        time: {
          totalHours: caseData.timeEntries.reduce((sum, e) => sum + parseFloat(e.duration), 0),
          byUser: timeByUser,
          byWeek: timeByWeek
        },
        budget: {
          total: parseFloat(caseData.budgetTotal),
          spent: parseFloat(caseData.budgetSpent),
          remaining: parseFloat(caseData.budgetTotal) - parseFloat(caseData.budgetSpent),
          utilization: caseData.budgetTotal > 0
            ? Math.round((parseFloat(caseData.budgetSpent) / parseFloat(caseData.budgetTotal)) * 100)
            : 0
        },
        milestones: milestoneProgress,
        risks: riskAnalysis
      }
    });
  } catch (error) {
    console.error('Get case analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case analytics'
    });
  }
};

/**
 * Get time analytics
 */
const getTimeAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, userId, caseId } = req.query;
    const firmId = req.user.firmId;

    const where = {
      case: { firmId }
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    if (userId) where.userId = userId;
    if (caseId) where.caseId = caseId;

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Aggregate by user
    const byUser = timeEntries.reduce((acc, entry) => {
      const name = `${entry.user.firstName} ${entry.user.lastName}`;
      if (!acc[name]) {
        acc[name] = {
          hours: 0,
          revenue: 0,
          entries: 0
        };
      }
      acc[name].hours += parseFloat(entry.duration);
      acc[name].revenue += parseFloat(entry.amount || 0);
      acc[name].entries += 1;
      return acc;
    }, {});

    // Aggregate by case
    const byCase = timeEntries.reduce((acc, entry) => {
      const caseTitle = entry.case.title;
      if (!acc[caseTitle]) {
        acc[caseTitle] = {
          hours: 0,
          revenue: 0,
          entries: 0
        };
      }
      acc[caseTitle].hours += parseFloat(entry.duration);
      acc[caseTitle].revenue += parseFloat(entry.amount || 0);
      acc[caseTitle].entries += 1;
      return acc;
    }, {});

    // Aggregate by day
    const byDay = timeEntries.reduce((acc, entry) => {
      const day = new Date(entry.startTime).toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          hours: 0,
          revenue: 0
        };
      }
      acc[day].hours += parseFloat(entry.duration);
      acc[day].revenue += parseFloat(entry.amount || 0);
      return acc;
    }, {});

    const totals = await prisma.timeEntry.aggregate({
      where,
      _sum: {
        duration: true,
        amount: true
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        totals: {
          hours: totals._sum.duration || 0,
          revenue: totals._sum.amount || 0,
          entries: totals._count
        },
        byUser,
        byCase,
        byDay
      }
    });
  } catch (error) {
    console.error('Get time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time analytics'
    });
  }
};

/**
 * Get budget analytics
 */
const getBudgetAnalytics = async (req, res) => {
  try {
    const firmId = req.user.firmId;

    const cases = await prisma.case.findMany({
      where: { firmId },
      select: {
        id: true,
        title: true,
        caseNumber: true,
        budgetTotal: true,
        budgetSpent: true,
        status: true
      }
    });

    const analytics = cases.map(c => ({
      ...c,
      budgetRemaining: parseFloat(c.budgetTotal) - parseFloat(c.budgetSpent),
      utilization: c.budgetTotal > 0
        ? Math.round((parseFloat(c.budgetSpent) / parseFloat(c.budgetTotal)) * 100)
        : 0,
      status: c.budgetSpent > c.budgetTotal ? 'OVER_BUDGET' :
              parseFloat(c.budgetSpent) / parseFloat(c.budgetTotal) > 0.9 ? 'AT_RISK' :
              'ON_TRACK'
    }));

    const summary = {
      totalBudget: cases.reduce((sum, c) => sum + parseFloat(c.budgetTotal), 0),
      totalSpent: cases.reduce((sum, c) => sum + parseFloat(c.budgetSpent), 0),
      overBudget: analytics.filter(c => c.status === 'OVER_BUDGET').length,
      atRisk: analytics.filter(c => c.status === 'AT_RISK').length,
      onTrack: analytics.filter(c => c.status === 'ON_TRACK').length
    };

    res.json({
      success: true,
      data: {
        summary,
        cases: analytics.sort((a, b) => b.utilization - a.utilization)
      }
    });
  } catch (error) {
    console.error('Get budget analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget analytics'
    });
  }
};

/**
 * Get team performance
 */
const getTeamPerformance = async (req, res) => {
  try {
    const firmId = req.user.firmId;

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
        const [tasks, timeEntries, casesLead, casesMember] = await Promise.all([
          prisma.task.count({
            where: { assigneeId: user.id }
          }),
          prisma.timeEntry.aggregate({
            where: { userId: user.id },
            _sum: {
              duration: true,
              amount: true
            }
          }),
          prisma.case.count({
            where: { leadId: user.id }
          }),
          prisma.caseMember.count({
            where: { userId: user.id }
          })
        ]);

        const completedTasks = await prisma.task.count({
          where: {
            assigneeId: user.id,
            status: 'DONE'
          }
        });

        return {
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
          },
          tasks: {
            total: tasks,
            completed: completedTasks,
            completionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0
          },
          time: {
            hours: timeEntries._sum.duration || 0,
            revenue: timeEntries._sum.amount || 0
          },
          cases: {
            leading: casesLead,
            member: casesMember,
            total: casesLead + casesMember
          }
        };
      })
    );

    res.json({
      success: true,
      data: performance.sort((a, b) => b.time.hours - a.time.hours)
    });
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team performance'
    });
  }
};

/**
 * Export data
 */
const exportData = async (req, res) => {
  try {
    const { type, format = 'json', filters = {} } = req.body;
    const firmId = req.user.firmId;

    let data;

    switch (type) {
      case 'cases':
        data = await prisma.case.findMany({
          where: { firmId, ...filters },
          include: {
            client: true,
            lead: true,
            members: {
              include: {
                user: true
              }
            }
          }
        });
        break;

      case 'time':
        data = await prisma.timeEntry.findMany({
          where: {
            case: { firmId },
            ...filters
          },
          include: {
            user: true,
            case: true,
            task: true
          }
        });
        break;

      case 'tasks':
        data = await prisma.task.findMany({
          where: {
            case: { firmId },
            ...filters
          },
          include: {
            assignee: true,
            case: true
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    // Convert to CSV if requested
    if (format === 'csv') {
      // Simple CSV conversion (you might want to use a library like json2csv)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

module.exports = {
  getDashboardAnalytics,
  getCaseAnalytics,
  getTimeAnalytics,
  getBudgetAnalytics,
  getTeamPerformance,
  exportData
};
