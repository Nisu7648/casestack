const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePartner } = require('../../middleware/rbac.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');
const PDFDocument = require('pdfkit');

const prisma = new PrismaClient();

router.use(authenticate);

// Get all dossiers
router.get('/', async (req, res) => {
  try {
    const dossiers = await prisma.dossier.findMany({
      where: {
        generatedBy: req.userId,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ dossiers });
  } catch (error) {
    console.error('Get dossiers error:', error);
    res.status(500).json({ error: 'Failed to fetch dossiers' });
  }
});

// Generate dossier (Partner+ only)
router.post('/generate', requirePartner, auditLogger('GENERATE', 'DOSSIER'), async (req, res) => {
  try {
    const { title, reportIds } = req.body;

    if (!title || !reportIds || reportIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch all reports with full data
    const reports = await prisma.report.findMany({
      where: {
        id: { in: reportIds },
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
        }
      }
    });

    if (reports.length === 0) {
      return res.status(404).json({ error: 'No reports found' });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfBase64 = pdfBuffer.toString('base64');
      const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

      // Save dossier record
      const dossier = await prisma.dossier.create({
        data: {
          title,
          reportIds,
          generatedBy: req.userId,
          pdfUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      res.json({ 
        dossier,
        message: 'Dossier generated successfully. Expires in 24 hours.'
      });
    });

    // Build PDF content
    const firm = await prisma.firm.findUnique({ where: { id: req.firmId } });

    // Cover page
    doc.fontSize(24).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(firm.name, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.addPage();

    // Table of contents
    doc.fontSize(18).text('Table of Contents', { underline: true });
    doc.moveDown();
    reports.forEach((report, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${report.engagement.client.name} - ${report.engagement.type} (${report.engagement.year})`
      );
    });
    doc.addPage();

    // Report content
    reports.forEach((report, reportIndex) => {
      // Report header
      doc.fontSize(20).text(
        `Report ${reportIndex + 1}: ${report.engagement.client.name}`,
        { underline: true }
      );
      doc.moveDown();
      doc.fontSize(12).text(`Engagement Type: ${report.engagement.type}`);
      doc.text(`Year: ${report.engagement.year}`);
      doc.text(`Lead Partner: ${report.engagement.leadPartner.firstName} ${report.engagement.leadPartner.lastName}`);
      doc.text(`Status: ${report.status}`);
      doc.moveDown(2);

      // Sections
      report.sections.forEach(section => {
        doc.fontSize(16).text(section.type, { underline: true });
        doc.moveDown();
        doc.fontSize(11).text(section.content || 'No content');
        doc.moveDown(2);
      });

      if (reportIndex < reports.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
  } catch (error) {
    console.error('Generate dossier error:', error);
    res.status(500).json({ error: 'Failed to generate dossier' });
  }
});

// Delete dossier
router.delete('/:id', auditLogger('DELETE', 'DOSSIER'), async (req, res) => {
  try {
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: req.params.id,
        generatedBy: req.userId
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    await prisma.dossier.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Dossier deleted successfully' });
  } catch (error) {
    console.error('Delete dossier error:', error);
    res.status(500).json({ error: 'Failed to delete dossier' });
  }
});

// Cleanup expired dossiers (cron job endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await prisma.dossier.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    res.json({ 
      message: 'Cleanup completed',
      deleted: result.count
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;
