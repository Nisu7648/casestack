const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get current firm details
 */
const getCurrentFirm = async (req, res) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!firm) {
      return res.status(404).json({ 
        success: false, 
        message: 'Firm not found' 
      });
    }

    res.json({
      success: true,
      data: {
        id: firm.id,
        name: firm.name,
        country: firm.country,
        billingEnabled: firm.billingEnabled,
        userCount: firm._count.users,
        createdAt: firm.createdAt,
        updatedAt: firm.updatedAt
      }
    });
  } catch (error) {
    console.error('Get firm error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch firm' 
    });
  }
};

/**
 * Update firm details
 */
const updateFirm = async (req, res) => {
  try {
    const { name, country, billingEnabled } = req.body;

    const firm = await prisma.firm.update({
      where: { id: req.user.firmId },
      data: {
        ...(name && { name }),
        ...(country && { country }),
        ...(billingEnabled !== undefined && { billingEnabled })
      }
    });

    await req.logActivity('UPDATE', 'Firm', firm.id, { 
      changes: { name, country, billingEnabled } 
    });

    res.json({
      success: true,
      message: 'Firm updated successfully',
      data: firm
    });
  } catch (error) {
    console.error('Update firm error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update firm' 
    });
  }
};

/**
 * Get firm statistics
 */
const getFirmStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({
        where: { firmId: req.user.firmId }
      }),
      prisma.user.count({
        where: { 
          firmId: req.user.firmId,
          isActive: true 
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { firmId: req.user.firmId },
        _count: true
      }),
      prisma.activityLog.count({
        where: {
          firmId: req.user.firmId,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
          }, {})
        },
        activity: {
          last7Days: recentActivity
        }
      }
    });
  } catch (error) {
    console.error('Get firm stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch firm statistics' 
    });
  }
};

module.exports = {
  getCurrentFirm,
  updateFirm,
  getFirmStats
};
