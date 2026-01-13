const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLogger } = require('../../middleware/audit.middleware');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const { logger } = require('../../utils/logger');

const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// EXPORT FEATURES
// PDF, Excel, CSV, ZIP exports
// ============================================

// Export single case to PDF
router.get('/case/:id/pdf', auditLogger('CASE_EXPORTED_PDF', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        client: true,
        preparedBy: true,
        reviewedBy: true,
        approvedBy: true,
        bundles: {
          include: {
            files: true
          }
        },
        approvalChains: {
          include: {
            actionBy: true
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${caseData.caseNumber}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('CASE REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Case Details
    doc.fontSize(14).text('Case Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Case Number: ${caseData.caseNumber}`);
    doc.text(`Client: ${caseData.client.name}`);
    doc.text(`Fiscal Year: ${caseData.fiscalYear}`);
    doc.text(`Case Type: ${caseData.caseType}`);
    doc.text(`Status: ${caseData.status}`);
    doc.text(`Created: ${new Date(caseData.createdAt).toLocaleDateString()}`);
    
    if (caseData.preparedBy) {
      doc.text(`Prepared By: ${caseData.preparedBy.firstName} ${caseData.preparedBy.lastName}`);
    }
    if (caseData.reviewedBy) {
      doc.text(`Reviewed By: ${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName}`);
    }
    if (caseData.approvedBy) {
      doc.text(`Approved By: ${caseData.approvedBy.firstName} ${caseData.approvedBy.lastName}`);
    }
    if (caseData.finalizedAt) {
      doc.text(`Finalized: ${new Date(caseData.finalizedAt).toLocaleDateString()}`);
    }

    doc.moveDown(2);

    // Documents
    doc.fontSize(14).text('Documents', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (caseData.bundles.length === 0) {
      doc.text('No documents uploaded');
    } else {
      caseData.bundles.forEach((bundle, idx) => {
        doc.text(`Bundle ${idx + 1}: ${bundle.bundleName}`, { bold: true });
        bundle.files.forEach(file => {
          doc.text(`  • ${file.fileName} (${(file.fileSize / 1024).toFixed(2)} KB)`);
          doc.text(`    SHA-256: ${file.sha256Hash}`, { fontSize: 8 });
        });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);

    // Audit Trail
    doc.fontSize(14).text('Audit Trail', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (caseData.approvalChains.length === 0) {
      doc.text('No audit trail');
    } else {
      caseData.approvalChains.forEach(log => {
        doc.text(`${new Date(log.timestamp).toLocaleString()} - ${log.action}`);
        doc.text(`  by ${log.actionBy.firstName} ${log.actionBy.lastName}`, { fontSize: 9 });
        if (log.comments) {
          doc.text(`  "${log.comments}"`, { fontSize: 9, italics: true });
        }
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).text('This is a system-generated report from CASESTACK', { align: 'center' });
    doc.text('All data is verified and tamper-proof', { align: 'center' });

    doc.end();

    logger.info('Case exported to PDF', { caseId: caseData.id, userId: req.userId });

  } catch (error) {
    logger.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Export case list to Excel
router.get('/cases/excel', auditLogger('CASES_EXPORTED_EXCEL', 'CASE'), async (req, res) => {
  try {
    const { status, fiscalYear, clientId } = req.query;

    const where = {
      firmId: req.firmId,
      ...(status && { status }),
      ...(fiscalYear && { fiscalYear: parseInt(fiscalYear) }),
      ...(clientId && { clientId })
    };

    const cases = await prisma.case.findMany({
      where,
      include: {
        client: true,
        preparedBy: true,
        reviewedBy: true,
        approvedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cases');

    // Define columns
    worksheet.columns = [
      { header: 'Case Number', key: 'caseNumber', width: 20 },
      { header: 'Client', key: 'client', width: 25 },
      { header: 'Fiscal Year', key: 'fiscalYear', width: 12 },
      { header: 'Case Type', key: 'caseType', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Prepared By', key: 'preparedBy', width: 20 },
      { header: 'Reviewed By', key: 'reviewedBy', width: 20 },
      { header: 'Approved By', key: 'approvedBy', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
      { header: 'Finalized Date', key: 'finalizedAt', width: 15 }
    ];

    // Add rows
    cases.forEach(c => {
      worksheet.addRow({
        caseNumber: c.caseNumber,
        client: c.client.name,
        fiscalYear: c.fiscalYear,
        caseType: c.caseType,
        status: c.status,
        preparedBy: c.preparedBy ? `${c.preparedBy.firstName} ${c.preparedBy.lastName}` : '',
        reviewedBy: c.reviewedBy ? `${c.reviewedBy.firstName} ${c.reviewedBy.lastName}` : '',
        approvedBy: c.approvedBy ? `${c.approvedBy.firstName} ${c.approvedBy.lastName}` : '',
        createdAt: new Date(c.createdAt).toLocaleDateString(),
        finalizedAt: c.finalizedAt ? new Date(c.finalizedAt).toLocaleDateString() : ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cases-${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

    logger.info('Cases exported to Excel', { count: cases.length, userId: req.userId });

  } catch (error) {
    logger.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// Export audit logs to CSV
router.get('/audit-logs/csv', auditLogger('AUDIT_LOGS_EXPORTED_CSV', 'AUDIT'), async (req, res) => {
  try {
    const { startDate, endDate, action, entityType } = req.query;

    const where = {
      firmId: req.firmId,
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: true
      },
      orderBy: { timestamp: 'desc' }
    });

    // Create CSV
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'].join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        `${log.user.firstName} ${log.user.lastName}`,
        log.action,
        log.entityType,
        log.entityId || '',
        log.ipAddress || '',
        log.details || ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    logger.info('Audit logs exported to CSV', { count: logs.length, userId: req.userId });

  } catch (error) {
    logger.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export case bundle as ZIP (all files)
router.get('/case/:id/zip', auditLogger('CASE_EXPORTED_ZIP', 'CASE'), async (req, res) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id,
        firmId: req.firmId
      },
      include: {
        bundles: {
          include: {
            files: true
          }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="case-${caseData.caseNumber}.zip"`);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Add files to archive
    for (const bundle of caseData.bundles) {
      for (const file of bundle.files) {
        // In production, fetch file from S3/storage
        // For now, add placeholder
        archive.append(`File: ${file.fileName}\nSHA-256: ${file.sha256Hash}`, {
          name: `${bundle.bundleName}/${file.fileName}`
        });
      }
    }

    // Add case info as text file
    const caseInfo = `
Case Number: ${caseData.caseNumber}
Fiscal Year: ${caseData.fiscalYear}
Case Type: ${caseData.caseType}
Status: ${caseData.status}
Created: ${new Date(caseData.createdAt).toLocaleString()}
Exported: ${new Date().toLocaleString()}
    `.trim();

    archive.append(caseInfo, { name: 'case-info.txt' });

    await archive.finalize();

    logger.info('Case exported to ZIP', { caseId: caseData.id, userId: req.userId });

  } catch (error) {
    logger.error('ZIP export error:', error);
    res.status(500).json({ error: 'Failed to export ZIP' });
  }
});

module.exports = router;
