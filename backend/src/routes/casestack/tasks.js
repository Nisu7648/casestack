const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// TASK MANAGEMENT ROUTES
// ============================================

async function getUserFirm(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  return user.firmId;
}

// ============================================
// 1. LIST TASKS
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const { status, priority, assignedTo, caseId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        firmId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedTo && { assignedTo }),
        ...(caseId && { caseId })
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            client: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            checklist: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Group by status for Kanban view
    const grouped = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE')
    };

    res.json({
      tasks,
      grouped,
      count: tasks.length
    });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

// ============================================
// 2. GET MY TASKS
// ============================================
router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const tasks = await prisma.task.findMany({
      where: {
        firmId,
        assignedTo: req.user.userId,
        status: { not: 'DONE' }
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            client: { select: { name: true } }
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ]
    });

    res.json({
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// ============================================
// 3. GET TASK BY ID
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            client: { select: { name: true } }
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
        checklist: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// ============================================
// 4. CREATE TASK
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      caseId,
      assignedTo,
      dueDate,
      priority
    } = req.body;

    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        firmId,
        title,
        description,
        caseId: caseId || null,
        assignedTo: assignedTo || null,
        assignedBy: req.user.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: 'TODO'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: task.id,
        details: `Created task: ${title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ============================================
// 5. UPDATE TASK
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      status
    } = req.body;

    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        completedAt: status === 'DONE' && !task.completedAt ? new Date() : task.completedAt
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: id,
        details: `Updated task: ${title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      task: updated,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ============================================
// 6. UPDATE TASK STATUS
// ============================================
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'DONE' ? new Date() : null
      }
    });

    res.json({
      success: true,
      task: updated
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================
// 7. DELETE TASK
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TASK_DELETED',
        entityType: 'TASK',
        entityId: id,
        details: `Deleted task: ${task.title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ============================================
// 8. ADD COMMENT
// ============================================
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newComment = await prisma.taskComment.create({
      data: {
        id: uuidv4(),
        taskId: id,
        userId: req.user.userId,
        comment
      },
      include: {
        user: {
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
      comment: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ============================================
// 9. ADD CHECKLIST ITEM
// ============================================
router.post('/:id/checklist', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item } = req.body;

    const firmId = await getUserFirm(req.user.userId);

    const task = await prisma.task.findFirst({
      where: { id, firmId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get current max order
    const maxOrder = await prisma.taskChecklist.findFirst({
      where: { taskId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const checklistItem = await prisma.taskChecklist.create({
      data: {
        id: uuidv4(),
        taskId: id,
        item,
        order: (maxOrder?.order || 0) + 1
      }
    });

    res.json({
      success: true,
      item: checklistItem,
      message: 'Checklist item added'
    });
  } catch (error) {
    console.error('Add checklist item error:', error);
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

// ============================================
// 10. TOGGLE CHECKLIST ITEM
// ============================================
router.put('/:taskId/checklist/:itemId', authenticateToken, async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    const { isCompleted } = req.body;

    const item = await prisma.taskChecklist.findFirst({
      where: { id: itemId, taskId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    const updated = await prisma.taskChecklist.update({
      where: { id: itemId },
      data: { isCompleted }
    });

    res.json({
      success: true,
      item: updated
    });
  } catch (error) {
    console.error('Toggle checklist error:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

module.exports = router;
