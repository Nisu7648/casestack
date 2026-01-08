const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Risk score calculation
const calculateRiskScore = (probability, impact) => {
  const scores = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  };
  return scores[probability] * scores[impact];
};

/**
 * Get risks for a case
 */
const getRisksByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.query;

    const where = { caseId };
    if (status) where.status = status;

    const risks = await prisma.risk.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { riskScore: 'desc' },
        { identifiedAt: 'desc' }
      ]
    });

    // Calculate risk matrix
    const matrix = {
      critical: risks.filter(r => r.riskScore >= 12).length,
      high: risks.filter(r => r.riskScore >= 6 && r.riskScore < 12).length,
      medium: risks.filter(r => r.riskScore >= 3 && r.riskScore < 6).length,
      low: risks.filter(r => r.riskScore < 3).length
    };

    res.json({
      success: true,
      data: {
        risks,
        matrix,
        totalRisks: risks.length,
        activeRisks: risks.filter(r => r.status !== 'CLOSED').length
      }
    });
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risks'
    });
  }
};

/**
 * Create risk
 */
const createRisk = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      probability,
      impact,
      mitigation,
      contingency,
      caseId
    } = req.body;

    const riskScore = calculateRiskScore(probability, impact);

    const risk = await prisma.risk.create({
      data: {
        title,
        description,
        category,
        probability,
        impact,
        riskScore,
        mitigation,
        contingency,
        caseId,
        ownerId: req.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'risk',
        entityId: risk.id,
        description: `Identified ${probability.toLowerCase()} probability risk: "${title}"`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'Risk', risk.id, { title, riskScore });

    res.status(201).json({
      success: true,
      message: 'Risk created successfully',
      data: risk
    });
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create risk'
    });
  }
};

/**
 * Update risk
 */
const updateRisk = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Recalculate risk score if probability or impact changed
    if (updates.probability || updates.impact) {
      const existingRisk = await prisma.risk.findUnique({
        where: { id }
      });

      const probability = updates.probability || existingRisk.probability;
      const impact = updates.impact || existingRisk.impact;
      updates.riskScore = calculateRiskScore(probability, impact);
    }

    const risk = await prisma.risk.update({
      where: { id },
      data: updates,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Risk updated successfully',
      data: risk
    });
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk'
    });
  }
};

/**
 * Delete risk
 */
const deleteRisk = async (req, res) => {
  try {
    const { id } = req.params;

    const risk = await prisma.risk.findUnique({
      where: { id }
    });

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }

    await prisma.risk.delete({ where: { id } });

    await req.logActivity('DELETE', 'Risk', id, { title: risk.title });

    res.json({
      success: true,
      message: 'Risk deleted successfully'
    });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete risk'
    });
  }
};

/**
 * Close risk
 */
const closeRisk = async (req, res) => {
  try {
    const { id } = req.params;

    const risk = await prisma.risk.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPDATED',
        entity: 'risk',
        entityId: id,
        description: `Closed risk "${risk.title}"`,
        userId: req.user.id,
        caseId: risk.caseId
      }
    });

    res.json({
      success: true,
      message: 'Risk closed successfully',
      data: risk
    });
  } catch (error) {
    console.error('Close risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close risk'
    });
  }
};

module.exports = {
  getRisksByCase,
  createRisk,
  updateRisk,
  deleteRisk,
  closeRisk
};
