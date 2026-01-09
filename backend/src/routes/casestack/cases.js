const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePartner, requireManager } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');
const { caseValidation, paginationValidation } = require('../../middleware/validation.middleware');
const emailService = require('../../services/email.service');
const { logger } = require('../../utils/logger');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// CASE MANAGEMENT - FULLY INTEGRATED
// With email notifications, validation, logging
// ============================================

// Get all cases with filters
router.get('/', paginationValidation, auditLogger('CASE_VIEWED', 'CASE'), async (req, res) => {
  try {
    const { status, fiscalYear, clientId, caseType, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      firmId: req.firmId,
      ...(status && { status }),
      ...(fiscalYear && { fiscalYear: parseInt(fiscalYear) }),
      ...(clientId && { clientId }),
      ...(caseType && { caseType })
    };

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, industry: true }
          },
          preparedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, role: true }
          },
          bundles: {
            select: { id: true, bundleName: true, isFinalized: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.case.count({ where })
    ]);

    res.json({
      cases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Get single case with full details
router.get('/:id', auditLogger('CASE_VIEWED', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        client: true,
        preparedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        bundles: {
          include: {
            files: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                isLocked: true,
                createdAt: true
              }
            }
          }
        },
        approvalChain: {
          include: {
            actionBy: {
              select: { firstName: true, lastName: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: caseData });
  } catch (error) {
    logger.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Create new case (DRAFT only)
router.post('/', caseValidation.create, auditLogger('CASE_CREATED', 'CASE'), async (req, res) => {
  try {
    const {
      caseName,
      caseType,
      clientId,
      periodStart,
      periodEnd,
      fiscalYear,
      description,
      tags
    } = req.body;

    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: req.firmId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Generate case number
    const year = new Date().getFullYear();
    const count = await prisma.case.count({
      where: { firmId: req.firmId }
    });
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;

    const caseData = await prisma.case.create({
      data: {
        caseNumber,
        caseName,
        caseType,
        clientId,
        firmId: req.firmId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        fiscalYear: parseInt(fiscalYear),
        description,
        tags: tags || [],
        preparedById: req.userId,
        status: 'DRAFT'
      },
      include: {
        client: true,
        preparedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    logger.info('Case created', { caseId: caseData.id, caseNumber: caseData.caseNumber });

    res.status(201).json({ case: caseData });
  } catch (error) {
    logger.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Submit case for review (DRAFT → UNDER_REVIEW) - WITH EMAIL
router.post('/:id/submit', auditLogger('CASE_SUBMITTED', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId,
        preparedById: req.userId
      },
      include: {
        bundles: {
          include: { files: true }
        },
        client: true,
        preparedBy: true
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found or you are not the preparer' });
    }

    if (caseData.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Case is not in DRAFT status' });
    }

    if (caseData.bundles.length === 0 || caseData.bundles.every(b => b.files.length === 0)) {
      return res.status(400).json({ error: 'Cannot submit case without files' });
    }

    // Get all managers and partners to notify
    const reviewers = await prisma.user.findMany({
      where: {
        firmId: req.firmId,
        role: { in: ['MANAGER', 'PARTNER', 'ADMIN'] },
        isActive: true
      }
    });

    // Update case status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCase = await tx.case.update({
        where: { id: req.params.id },
        data: {
          status: 'UNDER_REVIEW',
          submittedForReviewAt: new Date()
        }
      });

      await tx.approvalChain.create({
        data: {
          caseId: req.params.id,
          action: 'SUBMITTED_FOR_REVIEW',
          actionById: req.userId
        }
      });

      return updatedCase;
    });

    // Send email notifications to reviewers
    for (const reviewer of reviewers) {
      try {
        await emailService.sendCaseSubmittedNotification(caseData, reviewer);
      } catch (emailError) {
        logger.error('Email notification error:', emailError);
      }
    }

    logger.info('Case submitted', { caseId: updated.id, reviewersNotified: reviewers.length });

    res.json({
      message: 'Case submitted for review. Notifications sent to reviewers.',
      case: updated
    });
  } catch (error) {
    logger.error('Submit case error:', error);
    res.status(500).json({ error: 'Failed to submit case' });
  }
});

// Review case (Manager+ only) - WITH EMAIL
router.post('/:id/review', requireManager, caseValidation.review, auditLogger('CASE_REVIEWED', 'CASE'), async (req, res) => {
  try {
    const { approved, comments } = req.body;

    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        client: true,
        preparedBy: true,
        reviewedBy: true
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ error: 'Case is not under review' });
    }

    if (approved) {
      // APPROVED - Ready for partner finalization
      const updated = await prisma.$transaction(async (tx) => {
        const updatedCase = await tx.case.update({
          where: { id: req.params.id },
          data: {
            reviewedById: req.userId
          }
        });

        await tx.approvalChain.create({
          data: {
            caseId: req.params.id,
            action: 'REVIEWED',
            actionById: req.userId,
            comments
          }
        });

        return updatedCase;
      });

      // Send approval email to preparer
      try {
        await emailService.sendCaseApprovedNotification(
          { ...caseData, reviewedBy: { firstName: req.user.firstName, lastName: req.user.lastName } },
          caseData.preparedBy
        );
      } catch (emailError) {
        logger.error('Email notification error:', emailError);
      }

      logger.info('Case approved', { caseId: updated.id });

      res.json({
        message: 'Case approved. Ready for partner finalization.',
        case: updated
      });
    } else {
      // REJECTED - Back to DRAFT
      const updated = await prisma.$transaction(async (tx) => {
        const updatedCase = await tx.case.update({
          where: { id: req.params.id },
          data: {
            status: 'DRAFT',
            reviewedById: req.userId
          }
        });

        await tx.approvalChain.create({
          data: {
            caseId: req.params.id,
            action: 'REJECTED',
            actionById: req.userId,
            comments
          }
        });

        return updatedCase;
      });

      // Send rejection email to preparer
      try {
        await emailService.sendCaseRejectedNotification(
          { ...caseData, reviewedBy: { firstName: req.user.firstName, lastName: req.user.lastName } },
          caseData.preparedBy,
          comments
        );
      } catch (emailError) {
        logger.error('Email notification error:', emailError);
      }

      logger.info('Case rejected', { caseId: updated.id });

      res.json({
        message: 'Case rejected. Returned to DRAFT status.',
        case: updated
      });
    }
  } catch (error) {
    logger.error('Review case error:', error);
    res.status(500).json({ error: 'Failed to review case' });
  }
});

// Finalize case (Partner only) - WITH EMAIL
router.post('/:id/finalize', requirePartner, caseValidation.finalize, auditLogger('CASE_FINALIZED', 'CASE'), async (req, res) => {
  try {
    const { finalComments } = req.body;

    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        client: true,
        preparedBy: true,
        reviewedBy: true,
        bundles: {
          include: { files: true }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ error: 'Case must be under review to finalize' });
    }

    if (!caseData.reviewedById) {
      return res.status(400).json({ error: 'Case must be reviewed before finalization' });
    }

    // FINALIZE - IRREVERSIBLE
    const updated = await prisma.$transaction(async (tx) => {
      // Update case
      const updatedCase = await tx.case.update({
        where: { id: req.params.id },
        data: {
          status: 'FINALIZED',
          approvedById: req.userId,
          finalizedAt: new Date(),
          isLocked: true,
          lockedAt: new Date(),
          lockedReason: 'FINALIZED'
        }
      });

      // Lock all bundles and files
      await tx.caseBundle.updateMany({
        where: { caseId: req.params.id },
        data: { isFinalized: true, finalizedAt: new Date() }
      });

      const allFileIds = caseData.bundles.flatMap(b => b.files.map(f => f.id));
      await tx.caseFile.updateMany({
        where: { id: { in: allFileIds } },
        data: { isLocked: true, lockedAt: new Date() }
      });

      // Create approval chain entry
      await tx.approvalChain.create({
        data: {
          caseId: req.params.id,
          action: 'FINALIZED',
          actionById: req.userId,
          comments: finalComments
        }
      });

      // Create firm memory index
      await tx.firmMemoryIndex.create({
        data: {
          firmId: req.firmId,
          caseId: req.params.id,
          clientName: caseData.client.name,
          caseName: caseData.caseName,
          caseType: caseData.caseType,
          fiscalYear: caseData.fiscalYear,
          partnerName: `${req.user.firstName} ${req.user.lastName}`,
          searchVector: `${caseData.caseName} ${caseData.client.name} ${caseData.caseType}`,
          finalizedAt: new Date()
        }
      });

      return updatedCase;
    });

    // Get all team members for notification
    const team = [caseData.preparedBy];
    if (caseData.reviewedBy) team.push(caseData.reviewedBy);
    
    // Add current user (partner)
    team.push({
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email
    });

    // Send finalization email to team
    try {
      await emailService.sendCaseFinalizedNotification(
        {
          ...caseData,
          approvedBy: { firstName: req.user.firstName, lastName: req.user.lastName },
          finalizedAt: new Date()
        },
        team
      );
    } catch (emailError) {
      logger.error('Email notification error:', emailError);
    }

    logger.info('Case finalized', { caseId: updated.id });

    res.json({
      message: '✅ CASE FINALIZED AND LOCKED. This action is irreversible.',
      case: updated
    });
  } catch (error) {
    logger.error('Finalize case error:', error);
    res.status(500).json({ error: 'Failed to finalize case' });
  }
});

module.exports = router;
