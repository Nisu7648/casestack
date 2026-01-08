const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireManager } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get report by engagement ID
router.get('/engagement/:engagementId', auditLogger('VIEW', 'REPORT'), async (req, res) => {
  try {
    const report = await prisma.report.findFirst({
      where: {
        engagementId: req.params.engagementId,
        engagement: {
          firmId: req.firmId
        }
      },
      include: {
        engagement: {
          include: {
            client: true,
            leadPartner: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        sections: {
          orderBy: { order: 'asc' }
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true }
            },
            section: {
              select: { type: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Get report sections
router.get('/:reportId/sections', auditLogger('VIEW', 'REPORT_SECTION'), async (req, res) => {
  try {
    const sections = await prisma.reportSection.findMany({
      where: {
        reportId: req.params.reportId,
        report: {
          engagement: {
            firmId: req.firmId
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Update section content
router.put('/:reportId/sections/:sectionId', auditLogger('UPDATE', 'REPORT_SECTION'), async (req, res) => {
  try {
    const { content } = req.body;

    // Check if section is locked
    const section = await prisma.reportSection.findFirst({
      where: {
        id: req.params.sectionId,
        reportId: req.params.reportId,
        report: {
          engagement: {
            firmId: req.firmId
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (section.isLocked) {
      return res.status(403).json({ error: 'Section is locked' });
    }

    const updated = await prisma.reportSection.update({
      where: { id: req.params.sectionId },
      data: { content }
    });

    res.json({ section: updated });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Lock/unlock section (Manager+ only)
router.post('/:reportId/sections/:sectionId/lock', requireManager, auditLogger('LOCK', 'REPORT_SECTION'), async (req, res) => {
  try {
    const section = await prisma.reportSection.findFirst({
      where: {
        id: req.params.sectionId,
        reportId: req.params.reportId,
        report: {
          engagement: {
            firmId: req.firmId
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const updated = await prisma.reportSection.update({
      where: { id: req.params.sectionId },
      data: { isLocked: !section.isLocked }
    });

    res.json({ 
      section: updated,
      message: updated.isLocked ? 'Section locked' : 'Section unlocked'
    });
  } catch (error) {
    console.error('Lock section error:', error);
    res.status(500).json({ error: 'Failed to lock/unlock section' });
  }
});

// Get comments for report
router.get('/:reportId/comments', auditLogger('VIEW', 'COMMENT'), async (req, res) => {
  try {
    const { sectionId, isResolved } = req.query;

    const where = {
      reportId: req.params.reportId,
      report: {
        engagement: {
          firmId: req.firmId
        }
      },
      ...(sectionId && { sectionId }),
      ...(isResolved !== undefined && { isResolved: isResolved === 'true' })
    };

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        section: {
          select: { type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment
router.post('/:reportId/comments', auditLogger('CREATE', 'COMMENT'), async (req, res) => {
  try {
    const { content, sectionId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        reportId: req.params.reportId,
        sectionId: sectionId || null,
        userId: req.userId,
        content: content.trim()
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Resolve/unresolve comment
router.post('/:reportId/comments/:commentId/resolve', auditLogger('RESOLVE', 'COMMENT'), async (req, res) => {
  try {
    const comment = await prisma.comment.findFirst({
      where: {
        id: req.params.commentId,
        reportId: req.params.reportId,
        report: {
          engagement: {
            firmId: req.firmId
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { isResolved: !comment.isResolved }
    });

    res.json({ 
      comment: updated,
      message: updated.isResolved ? 'Comment resolved' : 'Comment reopened'
    });
  } catch (error) {
    console.error('Resolve comment error:', error);
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

// Submit report for review
router.post('/:reportId/submit', auditLogger('SUBMIT', 'REPORT'), async (req, res) => {
  try {
    const report = await prisma.report.findFirst({
      where: {
        id: req.params.reportId,
        engagement: {
          firmId: req.firmId
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Report already submitted' });
    }

    const updated = await prisma.report.update({
      where: { id: req.params.reportId },
      data: { status: 'SUBMITTED' }
    });

    res.json({ 
      report: updated,
      message: 'Report submitted for review'
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Approve report (Manager+ only)
router.post('/:reportId/approve', requireManager, auditLogger('APPROVE', 'REPORT'), async (req, res) => {
  try {
    const report = await prisma.report.findFirst({
      where: {
        id: req.params.reportId,
        engagement: {
          firmId: req.firmId
        }
      },
      include: {
        comments: {
          where: { isResolved: false }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.comments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot approve report with unresolved comments',
        unresolvedCount: report.comments.length
      });
    }

    const updated = await prisma.report.update({
      where: { id: req.params.reportId },
      data: { 
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });

    res.json({ 
      report: updated,
      message: 'Report approved successfully'
    });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

module.exports = router;
