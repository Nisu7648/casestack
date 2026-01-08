const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get time entries for a case
 */
const getTimeEntriesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { userId, startDate, endDate } = req.query;

    const where = { caseId };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

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
        task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Calculate totals
    const totals = await prisma.timeEntry.aggregate({
      where,
      _sum: {
        duration: true,
        amount: true
      }
    });

    res.json({
      success: true,
      data: {
        entries: timeEntries,
        totals: {
          hours: totals._sum.duration || 0,
          amount: totals._sum.amount || 0
        }
      }
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time entries'
    });
  }
};

/**
 * Get active timer for current user
 */
const getActiveTimer = async (req, res) => {
  try {
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      },
      include: {
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

    res.json({
      success: true,
      data: activeTimer
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active timer'
    });
  }
};

/**
 * Start timer
 */
const startTimer = async (req, res) => {
  try {
    const { caseId, taskId, description } = req.body;

    // Check if user already has an active timer
    const existingTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      }
    });

    if (existingTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active timer. Please stop it first.'
      });
    }

    // Get case details for hourly rate
    const caseItem = await prisma.case.findUnique({
      where: { id: caseId }
    });

    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(),
        description,
        userId: req.user.id,
        caseId,
        taskId,
        hourlyRate: caseItem?.hourlyRate,
        billable: true
      },
      include: {
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

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPDATED',
        entity: 'time',
        entityId: timeEntry.id,
        description: `Started timer${taskId ? ` for task` : ''}`,
        userId: req.user.id,
        caseId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start timer'
    });
  }
};

/**
 * Stop timer
 */
const stopTimer = async (req, res) => {
  try {
    const { id } = req.body;

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        userId: req.user.id,
        endTime: null
      }
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Active timer not found'
      });
    }

    const endTime = new Date();
    const duration = (endTime - timeEntry.startTime) / (1000 * 60 * 60); // hours
    const amount = timeEntry.hourlyRate 
      ? parseFloat(timeEntry.hourlyRate) * duration 
      : null;

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        duration,
        amount
      },
      include: {
        case: {
          select: {
            id: true,
            title: true
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

    // Update case budget spent
    await updateCaseBudget(timeEntry.caseId);

    // Update task actual hours if task is linked
    if (timeEntry.taskId) {
      await updateTaskActualHours(timeEntry.taskId);
    }

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPDATED',
        entity: 'time',
        entityId: id,
        description: `Logged ${duration.toFixed(2)} hours`,
        userId: req.user.id,
        caseId: timeEntry.caseId
      }
    });

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop timer'
    });
  }
};

/**
 * Create manual time entry
 */
const createTimeEntry = async (req, res) => {
  try {
    const {
      caseId,
      taskId,
      startTime,
      endTime,
      duration,
      description,
      billable = true
    } = req.body;

    // Get case details for hourly rate
    const caseItem = await prisma.case.findUnique({
      where: { id: caseId }
    });

    const calculatedDuration = duration || 
      (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

    const amount = caseItem?.hourlyRate && billable
      ? parseFloat(caseItem.hourlyRate) * calculatedDuration
      : null;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration: calculatedDuration,
        description,
        billable,
        hourlyRate: caseItem?.hourlyRate,
        amount,
        userId: req.user.id,
        caseId,
        taskId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    // Update case budget
    await updateCaseBudget(caseId);

    // Update task hours if linked
    if (taskId) {
      await updateTaskActualHours(taskId);
    }

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'time',
        entityId: timeEntry.id,
        description: `Logged ${calculatedDuration.toFixed(2)} hours`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'TimeEntry', timeEntry.id, {
      caseId,
      duration: calculatedDuration
    });

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time entry'
    });
  }
};

/**
 * Update time entry
 */
const updateTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // Recalculate if times changed
    if (updates.startTime || updates.endTime) {
      const start = updates.startTime ? new Date(updates.startTime) : existingEntry.startTime;
      const end = updates.endTime ? new Date(updates.endTime) : existingEntry.endTime;
      
      if (end) {
        updates.duration = (end - start) / (1000 * 60 * 60);
        if (existingEntry.hourlyRate) {
          updates.amount = parseFloat(existingEntry.hourlyRate) * updates.duration;
        }
      }
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updates
    });

    // Update case budget
    await updateCaseBudget(existingEntry.caseId);

    // Update task hours if linked
    if (existingEntry.taskId) {
      await updateTaskActualHours(existingEntry.taskId);
    }

    await req.logActivity('UPDATE', 'TimeEntry', id, { changes: updates });

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time entry'
    });
  }
};

/**
 * Delete time entry
 */
const deleteTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    await prisma.timeEntry.delete({ where: { id } });

    // Update case budget
    await updateCaseBudget(existingEntry.caseId);

    // Update task hours if linked
    if (existingEntry.taskId) {
      await updateTaskActualHours(existingEntry.taskId);
    }

    await req.logActivity('DELETE', 'TimeEntry', id);

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete time entry'
    });
  }
};

/**
 * Helper: Update case budget spent
 */
async function updateCaseBudget(caseId) {
  const totals = await prisma.timeEntry.aggregate({
    where: { caseId },
    _sum: { amount: true }
  });

  await prisma.case.update({
    where: { id: caseId },
    data: {
      budgetSpent: totals._sum.amount || 0
    }
  });
}

/**
 * Helper: Update task actual hours
 */
async function updateTaskActualHours(taskId) {
  const totals = await prisma.timeEntry.aggregate({
    where: { taskId },
    _sum: { duration: true }
  });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      actualHours: totals._sum.duration || 0
    }
  });
}

module.exports = {
  getTimeEntriesByCase,
  getActiveTimer,
  startTimer,
  stopTimer,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
};
