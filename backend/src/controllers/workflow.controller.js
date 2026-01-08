const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all workflow templates
 */
const getTemplates = async (req, res) => {
  try {
    const { caseType } = req.query;

    const where = {
      OR: [
        { firmId: req.user.firmId },
        { isPublic: true }
      ]
    };

    if (caseType) where.caseType = caseType;

    const templates = await prisma.workflowTemplate.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

/**
 * Get template by ID
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.workflowTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...template,
        templateData: JSON.parse(template.templateData)
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
};

/**
 * Create workflow template
 */
const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      caseType,
      isPublic = false,
      tasks = [],
      milestones = [],
      dependencies = []
    } = req.body;

    const templateData = {
      tasks,
      milestones,
      dependencies
    };

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        description,
        caseType,
        isPublic,
        templateData: JSON.stringify(templateData),
        firmId: req.user.firmId
      }
    });

    await req.logActivity('CREATE', 'WorkflowTemplate', template.id, { name });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
};

/**
 * Update workflow template
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.tasks || updates.milestones || updates.dependencies) {
      const templateData = {
        tasks: updates.tasks,
        milestones: updates.milestones,
        dependencies: updates.dependencies
      };
      updates.templateData = JSON.stringify(templateData);
      delete updates.tasks;
      delete updates.milestones;
      delete updates.dependencies;
    }

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data: updates
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
};

/**
 * Delete workflow template
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.workflowTemplate.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
};

/**
 * Apply template to case
 */
const applyTemplate = async (req, res) => {
  try {
    const { templateId, caseId } = req.body;

    // Get template
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get case
    const caseItem = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user.firmId
      }
    });

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const templateData = JSON.parse(template.templateData);

    // Create tasks from template
    const taskMap = new Map();
    for (const taskTemplate of templateData.tasks || []) {
      const task = await prisma.task.create({
        data: {
          title: taskTemplate.title,
          description: taskTemplate.description,
          type: taskTemplate.type || 'TASK',
          priority: taskTemplate.priority || 'MEDIUM',
          estimatedHours: taskTemplate.estimatedHours,
          caseId,
          order: taskTemplate.order || 0
        }
      });
      taskMap.set(taskTemplate.id, task.id);
    }

    // Create milestones from template
    for (const milestoneTemplate of templateData.milestones || []) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (milestoneTemplate.daysFromStart || 0));

      await prisma.milestone.create({
        data: {
          title: milestoneTemplate.title,
          description: milestoneTemplate.description,
          dueDate,
          caseId,
          ownerId: req.user.id,
          order: milestoneTemplate.order || 0
        }
      });
    }

    // Create dependencies from template
    for (const depTemplate of templateData.dependencies || []) {
      const dependentTaskId = taskMap.get(depTemplate.dependentTaskId);
      const blockingTaskId = taskMap.get(depTemplate.blockingTaskId);

      if (dependentTaskId && blockingTaskId) {
        await prisma.dependency.create({
          data: {
            type: depTemplate.type || 'FINISH_TO_START',
            lagDays: depTemplate.lagDays || 0,
            caseId,
            dependentTaskId,
            blockingTaskId
          }
        });
      }
    }

    // Increment usage count
    await prisma.workflowTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 }
      }
    });

    // Create activity
    await prisma.caseActivity.create({
      data: {
        action: 'CREATED',
        entity: 'workflow',
        description: `Applied workflow template "${template.name}"`,
        userId: req.user.id,
        caseId
      }
    });

    res.json({
      success: true,
      message: 'Template applied successfully',
      data: {
        tasksCreated: taskMap.size,
        milestonesCreated: templateData.milestones?.length || 0,
        dependenciesCreated: templateData.dependencies?.length || 0
      }
    });
  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply template'
    });
  }
};

/**
 * Get case workflows (tasks with dependencies)
 */
const getCaseWorkflows = async (req, res) => {
  try {
    const { caseId } = req.params;

    const [tasks, dependencies, milestones] = await Promise.all([
      prisma.task.findMany({
        where: { caseId },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          subtasks: true
        },
        orderBy: { order: 'asc' }
      }),
      prisma.dependency.findMany({
        where: { caseId },
        include: {
          dependentTask: {
            select: {
              id: true,
              title: true
            }
          },
          blockingTask: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.milestone.findMany({
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
      })
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        dependencies,
        milestones
      }
    });
  } catch (error) {
    console.error('Get case workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows'
    });
  }
};

/**
 * Update workflow instance (reorder tasks, update dependencies)
 */
const updateWorkflowInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskOrders, dependencies } = req.body;

    // Update task orders
    if (taskOrders) {
      for (const { taskId, order } of taskOrders) {
        await prisma.task.update({
          where: { id: taskId },
          data: { order }
        });
      }
    }

    // Update dependencies
    if (dependencies) {
      // Delete existing dependencies for this workflow
      await prisma.dependency.deleteMany({
        where: { caseId: id }
      });

      // Create new dependencies
      for (const dep of dependencies) {
        await prisma.dependency.create({
          data: {
            type: dep.type,
            lagDays: dep.lagDays || 0,
            caseId: id,
            dependentTaskId: dep.dependentTaskId,
            blockingTaskId: dep.blockingTaskId
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow'
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  getCaseWorkflows,
  updateWorkflowInstance
};
