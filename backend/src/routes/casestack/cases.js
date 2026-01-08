const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePartner, requireManager } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// CASE FINALIZATION SYSTEM (CORE)
// ============================================

// Get all cases with filters
router.get('/', auditLogger('CASE_VIEWED', 'CASE'), async (req, res) => {
  try {
    const { status, fiscalYear, clientId, caseType } = req.query;

    const where = {
      firmId: req.firmId,
      ...(status && { status }),
      ...(fiscalYear && { fiscalYear: parseInt(fiscalYear) }),
      ...(clientId && { clientId }),
      ...(caseType && { caseType })
    };

    const cases = await prisma.case.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    res.json({ cases });
  } catch (error) {
    console.error('Get cases error:', error);
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
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Create new case (DRAFT only)
router.post('/', auditLogger('CASE_CREATED', 'CASE'), async (req, res) => {
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

    if (!caseName || !caseType || !clientId || !periodStart || !periodEnd || !fiscalYear) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    res.status(201).json({ case: caseData });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Submit case for review (DRAFT → UNDER_REVIEW)
router.post('/:id/submit', auditLogger('CASE_SUBMITTED', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId,
        preparedById: req.userId // Only preparer can submit
      },
      include: {
        bundles: {
          include: { files: true }
        }
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

    // Update case status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCase = await tx.case.update({
        where: { id: req.params.id },
        data: {
          status: 'UNDER_REVIEW',
          submittedForReviewAt: new Date()
        }
      });

      // Create approval chain entry
      await tx.approvalChain.create({
        data: {
          caseId: req.params.id,
          action: 'SUBMITTED_FOR_REVIEW',
          actionById: req.userId
        }
      });

      return updatedCase;
    });

    res.json({
      message: 'Case submitted for review',
      case: updated
    });
  } catch (error) {
    console.error('Submit case error:', error);
    res.status(500).json({ error: 'Failed to submit case' });
  }
});

// Review case (Manager+ only)
router.post('/:id/review', requireManager, auditLogger('CASE_REVIEWED', 'CASE'), async (req, res) => {
  try {
    const { approved, comments } = req.body;

    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ error: 'Case is not under review' });
    }

    if (approved) {
      // Approve - ready for partner finalization
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

      res.json({
        message: 'Case reviewed and approved. Ready for partner finalization.',
        case: updated
      });
    } else {
      // Reject - send back to DRAFT
      const updated = await prisma.$transaction(async (tx) => {
        const updatedCase = await tx.case.update({
          where: { id: req.params.id },
          data: {
            status: 'DRAFT',
            submittedForReviewAt: null
          }
        });

        await tx.approvalChain.create({
          data: {
            caseId: req.params.id,
            action: 'REJECTED',
            actionById: req.userId,
            comments: comments || 'Rejected by reviewer'
          }
        });

        return updatedCase;
      });

      res.json({
        message: 'Case rejected and sent back to DRAFT',
        case: updated
      });
    }
  } catch (error) {
    console.error('Review case error:', error);
    res.status(500).json({ error: 'Failed to review case' });
  }
});

// FINALIZE case (Partner only) - IRREVERSIBLE
router.post('/:id/finalize', requirePartner, auditLogger('CASE_FINALIZED', 'CASE'), async (req, res) => {
  try {
    const { finalComments } = req.body;

    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        bundles: {
          include: { files: true }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.status === 'FINALIZED') {
      return res.status(400).json({ error: 'Case is already finalized' });
    }

    if (!caseData.reviewedById) {
      return res.status(400).json({ error: 'Case must be reviewed before finalization' });
    }

    if (caseData.bundles.length === 0 || caseData.bundles.every(b => b.files.length === 0)) {
      return res.status(400).json({ error: 'Cannot finalize case without files' });
    }

    // FINALIZE - LOCK EVERYTHING
    const finalized = await prisma.$transaction(async (tx) => {
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

      // Lock all bundles
      await tx.caseBundle.updateMany({
        where: { caseId: req.params.id },
        data: {
          isFinalized: true,
          finalizedAt: new Date()
        }
      });

      // Lock all files
      for (const bundle of caseData.bundles) {
        await tx.caseFile.updateMany({
          where: { bundleId: bundle.id },
          data: {
            isLocked: true,
            lockedAt: new Date()
          }
        });
      }

      // Create approval chain entry
      await tx.approvalChain.create({
        data: {
          caseId: req.params.id,
          action: 'FINALIZED',
          actionById: req.userId,
          comments: finalComments
        }
      });

      // Create firm memory index for search
      await tx.firmMemoryIndex.create({
        data: {
          firmId: req.firmId,
          caseId: req.params.id,
          clientName: caseData.client.name,
          caseName: caseData.caseName,
          caseType: caseData.caseType,
          fiscalYear: caseData.fiscalYear,
          partnerName: `${req.user.firstName} ${req.user.lastName}`,
          searchVector: `${caseData.caseName} ${caseData.client.name} ${caseData.caseType} ${caseData.fiscalYear}`,
          finalizedAt: new Date()
        }
      });

      return updatedCase;
    });

    res.json({
      message: '✅ CASE FINALIZED AND LOCKED. This action is irreversible.',
      case: finalized
    });
  } catch (error) {
    console.error('Finalize case error:', error);
    res.status(500).json({ error: 'Failed to finalize case' });
  }
});

// Get approval chain for case
router.get('/:id/approval-chain', async (req, res) => {
  try {
    const chain = await prisma.approvalChain.findMany({
      where: {
        caseId: req.params.id,
        case: {
          firmId: req.firmId
        }
      },
      include: {
        actionBy: {
          select: { firstName: true, lastName: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ approvalChain: chain });
  } catch (error) {
    console.error('Get approval chain error:', error);
    res.status(500).json({ error: 'Failed to fetch approval chain' });
  }
});

module.exports = router;
