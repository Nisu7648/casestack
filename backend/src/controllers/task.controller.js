const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

/**
 * Get all tasks for a case
 */
const getTasksByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status, assigneeId } = req.query;

    const where = { caseId };
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true,
            timeEntries: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Calculate time for each task
    const tasksWithTime = await Promise.all(
      tasks.map(async (task) => {
        const timeSum = await prisma.timeEntry.aggregate({
          where: { taskId: task.id },
          _sum: { duration: true }
        });

        return {
          ...task,
          actualHours: timeSum._sum.duration || 0
        };
      })
    );

    res.json({
      success: true,
      data: tasksWithTime
    });
  } catch (error) {
    console.error('Get tasks by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
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
          },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
};

/**
 * Create new task
 */
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      caseId,
      type = 'TASK',
      priority = 'MEDIUM',
      assigneeId,
      dueDate,
      estimatedHours,
      deliverableType
    } = req.body;

    // Get max order for the case
    const maxOrder = await prisma.task.aggregate({
      where: { caseId },
      _max: { order: true }
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        caseId,
        type,
        priority,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        deliverableType,
        order: (maxOrder._max.order || 0) + 1
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'task',
        entityId: task.id,
        description: `Created task "${title}"`,
        userId: req.user.id,
        caseId
      }
    });

    await req.logActivity('CREATE', 'Task', task.id, { title, caseId });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
};

/**
 * Update task
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { case: true }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Handle date conversions
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    if (updates.estimatedHours) {
      updates.estimatedHours = parseFloat(updates.estimatedHours);
    }

    const task = await prisma.task.update({
      where: { id },
      data: updates,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'UPDATED',
        entity: 'task',
        entityId: id,
        description: `Updated task "${task.title}"`,
        metadata: JSON.stringify(updates),
        userId: req.user.id,
        caseId: existingTask.caseId
      }
    });

    await req.logActivity('UPDATE', 'Task', id, { changes: updates });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
};

/**
 * Update task status
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { case: true }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updateData = { status };
    if (status === 'DONE' && !existingTask.completedAt) {
      updateData.completedAt = new Date();
    } else if (status !== 'DONE') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update case progress
    await updateCaseProgress(existingTask.caseId);

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: status === 'DONE' ? 'COMPLETED' : 'UPDATED',
        entity: 'task',
        entityId: id,
        description: `${status === 'DONE' ? 'Completed' : 'Updated status of'} task "${task.title}"`,
        userId: req.user.id,
        caseId: existingTask.caseId
      }
    });

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await prisma.task.delete({ where: { id } });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'DELETED',
        entity: 'task',
        entityId: id,
        description: `Deleted task "${existingTask.title}"`,
        userId: req.user.id,
        caseId: existingTask.caseId
      }
    });

    await req.logActivity('DELETE', 'Task', id, { title: existingTask.title });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
};

/**
 * Add comment to task
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: id,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'COMMENTED',
        entity: 'task',
        entityId: id,
        description: `Commented on task "${task.title}"`,
        userId: req.user.id,
        caseId: task.caseId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

/**
 * Get comments for task
 */
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

/**
 * Helper: Update case progress based on task completion
 */
async function updateCaseProgress(caseId) {
  const tasks = await prisma.task.findMany({
    where: { caseId },
    select: { status: true }
  });

  if (tasks.length === 0) return;

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const progressPercentage = Math.round((completedTasks / tasks.length) * 100);

  await prisma.case.update({
    where: { id: caseId },
    data: { progressPercentage }
  });
}

module.exports = {
  getTasksByCase,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  getComments
};
