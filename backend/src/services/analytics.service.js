// Analytics Service
// Business intelligence and metrics tracking

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  
  // ============================================
  // REVENUE ANALYTICS
  // ============================================
  
  async getRevenueMetrics(firmId, startDate, endDate) {
    try {
      // Get all invoices in date range
      const invoices = await prisma.invoice.findMany({
        where: {
          firmId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Calculate metrics
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const paidRevenue = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.total, 0);
      const pendingRevenue = invoices
        .filter(inv => inv.status === 'SENT')
        .reduce((sum, inv) => sum + inv.total, 0);
      const overdueRevenue = invoices
        .filter(inv => inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.total, 0);
      
      // Calculate growth
      const previousPeriod = await this.getPreviousPeriodRevenue(
        firmId, 
        startDate, 
        endDate
      );
      const growth = previousPeriod > 0 
        ? ((paidRevenue - previousPeriod) / previousPeriod) * 100 
        : 0;
      
      return {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue,
        invoiceCount: invoices.length,
        averageInvoice: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        growth: Math.round(growth * 10) / 10,
        paymentRate: invoices.length > 0 
          ? (invoices.filter(i => i.status === 'PAID').length / invoices.length) * 100 
          : 0
      };
    } catch (error) {
      console.error('Revenue metrics error:', error);
      throw error;
    }
  }
  
  async getPreviousPeriodRevenue(firmId, startDate, endDate) {
    const duration = endDate - startDate;
    const prevStart = new Date(startDate.getTime() - duration);
    const prevEnd = new Date(startDate.getTime());
    
    const invoices = await prisma.invoice.findMany({
      where: {
        firmId,
        status: 'PAID',
        createdAt: {
          gte: prevStart,
          lte: prevEnd
        }
      }
    });
    
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }
  
  // ============================================
  // CASE ANALYTICS
  // ============================================
  
  async getCaseMetrics(firmId, startDate, endDate) {
    try {
      const cases = await prisma.case.findMany({
        where: {
          firmId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          tasks: true,
          timeEntries: true
        }
      });
      
      const totalCases = cases.length;
      const openCases = cases.filter(c => c.status === 'OPEN').length;
      const inProgressCases = cases.filter(c => c.status === 'IN_PROGRESS').length;
      const closedCases = cases.filter(c => c.status === 'CLOSED').length;
      
      // Calculate average completion time
      const completedCases = cases.filter(c => c.closedAt);
      const avgCompletionTime = completedCases.length > 0
        ? completedCases.reduce((sum, c) => {
            const duration = (new Date(c.closedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
            return sum + duration;
          }, 0) / completedCases.length
        : 0;
      
      // Calculate total billable hours
      const totalHours = cases.reduce((sum, c) => {
        return sum + c.timeEntries.reduce((s, t) => s + t.hours, 0);
      }, 0);
      
      return {
        totalCases,
        openCases,
        inProgressCases,
        closedCases,
        completionRate: totalCases > 0 ? (closedCases / totalCases) * 100 : 0,
        avgCompletionDays: Math.round(avgCompletionTime),
        totalBillableHours: totalHours,
        avgHoursPerCase: totalCases > 0 ? totalHours / totalCases : 0
      };
    } catch (error) {
      console.error('Case metrics error:', error);
      throw error;
    }
  }
  
  // ============================================
  // USER PRODUCTIVITY
  // ============================================
  
  async getUserProductivity(firmId, startDate, endDate) {
    try {
      const users = await prisma.user.findMany({
        where: { firmId },
        include: {
          timeEntries: {
            where: {
              date: {
                gte: startDate,
                lte: endDate
              }
            }
          },
          tasks: {
            where: {
              completedAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });
      
      const productivity = users.map(user => {
        const totalHours = user.timeEntries.reduce((sum, t) => sum + t.hours, 0);
        const completedTasks = user.tasks.filter(t => t.status === 'DONE').length;
        const billableHours = user.timeEntries
          .filter(t => t.billable)
          .reduce((sum, t) => sum + t.hours, 0);
        
        return {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          totalHours,
          billableHours,
          utilizationRate: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
          completedTasks,
          avgHoursPerDay: totalHours / this.getDaysBetween(startDate, endDate)
        };
      });
      
      return productivity.sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('User productivity error:', error);
      throw error;
    }
  }
  
  // ============================================
  // CLIENT ANALYTICS
  // ============================================
  
  async getClientMetrics(firmId) {
    try {
      const clients = await prisma.client.findMany({
        where: { firmId },
        include: {
          cases: {
            include: {
              timeEntries: true
            }
          }
        }
      });
      
      const clientMetrics = clients.map(client => {
        const totalCases = client.cases.length;
        const activeCases = client.cases.filter(c => 
          c.status === 'OPEN' || c.status === 'IN_PROGRESS'
        ).length;
        const totalHours = client.cases.reduce((sum, c) => {
          return sum + c.timeEntries.reduce((s, t) => s + t.hours, 0);
        }, 0);
        
        return {
          clientId: client.id,
          name: client.name,
          totalCases,
          activeCases,
          totalHours,
          avgHoursPerCase: totalCases > 0 ? totalHours / totalCases : 0
        };
      });
      
      return clientMetrics.sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('Client metrics error:', error);
      throw error;
    }
  }
  
  // ============================================
  // AI USAGE ANALYTICS
  // ============================================
  
  async getAIUsageMetrics(firmId, startDate, endDate) {
    try {
      const aiInteractions = await prisma.aIInteraction.findMany({
        where: {
          user: { firmId },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      const byType = {};
      aiInteractions.forEach(ai => {
        byType[ai.type] = (byType[ai.type] || 0) + 1;
      });
      
      const avgConfidence = aiInteractions.length > 0
        ? aiInteractions.reduce((sum, ai) => sum + (ai.confidence || 0), 0) / aiInteractions.length
        : 0;
      
      return {
        totalInteractions: aiInteractions.length,
        byType,
        avgConfidence: Math.round(avgConfidence * 100),
        dailyAverage: aiInteractions.length / this.getDaysBetween(startDate, endDate)
      };
    } catch (error) {
      console.error('AI usage metrics error:', error);
      throw error;
    }
  }
  
  // ============================================
  // DASHBOARD OVERVIEW
  // ============================================
  
  async getDashboardOverview(firmId) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const [revenue, cases, productivity, aiUsage] = await Promise.all([
        this.getRevenueMetrics(firmId, thirtyDaysAgo, now),
        this.getCaseMetrics(firmId, thirtyDaysAgo, now),
        this.getUserProductivity(firmId, thirtyDaysAgo, now),
        this.getAIUsageMetrics(firmId, thirtyDaysAgo, now)
      ]);
      
      return {
        period: {
          start: thirtyDaysAgo,
          end: now,
          days: 30
        },
        revenue,
        cases,
        productivity: {
          totalUsers: productivity.length,
          totalHours: productivity.reduce((sum, p) => sum + p.totalHours, 0),
          avgUtilization: productivity.length > 0
            ? productivity.reduce((sum, p) => sum + p.utilizationRate, 0) / productivity.length
            : 0,
          topPerformers: productivity.slice(0, 5)
        },
        aiUsage
      };
    } catch (error) {
      console.error('Dashboard overview error:', error);
      throw error;
    }
  }
  
  // ============================================
  // EXPORT ANALYTICS
  // ============================================
  
  async exportAnalytics(firmId, startDate, endDate, format = 'json') {
    try {
      const data = {
        firm: await prisma.firm.findUnique({ where: { id: firmId } }),
        period: { start: startDate, end: endDate },
        revenue: await this.getRevenueMetrics(firmId, startDate, endDate),
        cases: await this.getCaseMetrics(firmId, startDate, endDate),
        productivity: await this.getUserProductivity(firmId, startDate, endDate),
        clients: await this.getClientMetrics(firmId),
        aiUsage: await this.getAIUsageMetrics(firmId, startDate, endDate)
      };
      
      if (format === 'csv') {
        return this.convertToCSV(data);
      }
      
      return data;
    } catch (error) {
      console.error('Export analytics error:', error);
      throw error;
    }
  }
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  getDaysBetween(start, end) {
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }
  
  convertToCSV(data) {
    // Simple CSV conversion
    // In production, use a proper CSV library
    const rows = [];
    
    // Revenue section
    rows.push(['Revenue Metrics']);
    rows.push(['Total Revenue', data.revenue.totalRevenue]);
    rows.push(['Paid Revenue', data.revenue.paidRevenue]);
    rows.push(['Pending Revenue', data.revenue.pendingRevenue]);
    rows.push(['']);
    
    // Cases section
    rows.push(['Case Metrics']);
    rows.push(['Total Cases', data.cases.totalCases]);
    rows.push(['Open Cases', data.cases.openCases]);
    rows.push(['Closed Cases', data.cases.closedCases]);
    rows.push(['']);
    
    return rows.map(row => row.join(',')).join('\n');
  }
}

module.exports = new AnalyticsService();
