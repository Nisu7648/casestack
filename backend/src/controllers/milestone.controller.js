const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get milestones for a case
 */
const getMilestonesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const milestones = await prisma.milestone.findMany({
      where: { caseId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Calculate status based on dates
    const now = new Date();
    const enrichedMilestones = milestones.map(milestone => {
      let status = milestone.status;
      
      if (milestone.completedAt) {
        status = 'COMPLETED';
      } else if (new Date(milestone.dueDate) < now) {
        status = 'DELAYED';
      } else if (new Date(milestone.dueDate) - now < 7 * 24 * 60 * 60 * 1000) {
        status = 'IN_PROGRESS';
      } else {
        status = 'UPCOMING';
      }

      return {
        ...milestone,
        status,
        daysUntilDue: Math.ceil((new Date(milestone.dueDate) - now) / (1000 * 60 * 60 * 24))
      };
    });

    res.json({
      success: true,
      data: enrichedMilestones
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestones'
    });
  }
};

/**
 * Create milestone
 */
const createMilestone = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      caseId
    } = req.body;

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
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
        entity: 'milestone',
        entityId: milestone.id,
        description: `Created milestone "${title}"`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'Milestone', milestone.id, { title });

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: milestone
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestone'
    });
  }
};

/**
 * Update milestone
 */
const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const milestone = await prisma.milestone.update({
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
      message: 'Milestone updated successfully',
      data: milestone
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone'
    });
  }
};

/**
 * Delete milestone
 */
const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id }
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    await prisma.milestone.delete({ where: { id } });

    await req.logActivity('DELETE', 'Milestone', id, { title: milestone.title });

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete milestone'
    });
  }
};

/**
 * Complete milestone
 */
const completeMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
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
        action: 'COMPLETED',
        entity: 'milestone',
        entityId: id,
        description: `Completed milestone "${milestone.title}"`,
        userId: req.user.id,
        caseId: milestone.caseId
      }
    });

    res.json({
      success: true,
      message: 'Milestone completed successfully',
      data: milestone
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete milestone'
    });
  }
};

module.exports = {
  getMilestonesByCase,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  completeMilestone
};
