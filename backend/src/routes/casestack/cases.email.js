const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePartner, requireManager } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');
const emailService = require('../../services/email.service');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// CASE FINALIZATION SYSTEM (ENHANCED WITH EMAILS)
// ============================================

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
        console.error('Email notification error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      message: 'Case submitted for review. Notifications sent to reviewers.',
      case: updated
    });
  } catch (error) {
    console.error('Submit case error:', error);
    res.status(500).json({ error: 'Failed to submit case' });
  }
});

// Review case (Manager+ only) - WITH EMAIL
router.post('/:id/review', requireManager, auditLogger('CASE_REVIEWED', 'CASE'), async (req, res) => {
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
        console.error('Email notification error:', emailError);
      }

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
        console.error('Email notification error:', emailError);
      }

      res.json({
        message: 'Case rejected. Returned to DRAFT status.',
        case: updated
      });
    }
  } catch (error) {
    console.error('Review case error:', error);
    res.status(500).json({ error: 'Failed to review case' });
  }
});

// Finalize case (Partner only) - WITH EMAIL
router.post('/:id/finalize', requirePartner, auditLogger('CASE_FINALIZED', 'CASE'), async (req, res) => {
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
      console.error('Email notification error:', emailError);
    }

    res.json({
      message: '✅ CASE FINALIZED AND LOCKED. This action is irreversible.',
      case: updated
    });
  } catch (error) {
    console.error('Finalize case error:', error);
    res.status(500).json({ error: 'Failed to finalize case' });
  }
});

module.exports = router;
