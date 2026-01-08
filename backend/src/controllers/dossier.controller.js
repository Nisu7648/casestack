const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

/**
 * MODULE F1 - Generate Dossier PDF
 * Combines report sections + evidence list + activity log
 */
const generateDossier = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { 
      includeCoverPage = true,
      includeIndex = true,
      includeEvidence = true,
      includeActivityLog = true,
      includeSignatures = true
    } = req.body;

    // Fetch complete report data
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        client: {
          include: {
            contacts: true
          }
        },
        engagement: true,
        scope: true,
        observations: {
          orderBy: { order: 'asc' }
        },
        findings: {
          orderBy: { order: 'asc' }
        },
        conclusion: true,
        evidenceItems: {
          orderBy: { referenceNumber: 'asc' },
          include: {
            collector: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        leadConsultant: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        reviews: {
          where: { status: 'COMPLETED' },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { completedAt: 'desc' }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Fetch activity log
    let activityLog = [];
    if (includeActivityLog) {
      activityLog = await prisma.activityLog.findMany({
        where: {
          entity: 'Report',
          entityId: reportId
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { timestamp: 'asc' }
      });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      info: {
        Title: report.title,
        Author: `${report.leadConsultant.firstName} ${report.leadConsultant.lastName}`,
        Subject: `${report.type} Report`,
        Keywords: `${report.client.name}, ${report.type}, ${report.year}`
      }
    });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `dossier-${report.reportNumber}-${timestamp}.pdf`;
    const filepath = path.join('temp', 'dossiers', filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Pipe to file
    const stream = doc.pipe(require('fs').createWriteStream(filepath));

    // F1.1 - Cover Page
    if (includeCoverPage) {
      generateCoverPage(doc, report);
      doc.addPage();
    }

    // F1.2 - Table of Contents / Index
    if (includeIndex) {
      generateIndex(doc, report, {
        includeEvidence,
        includeActivityLog
      });
      doc.addPage();
    }

    // Report Metadata
    generateMetadata(doc, report);
    doc.addPage();

    // Executive Summary
    if (report.executiveSummary) {
      doc.fontSize(16).text('Executive Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.executiveSummary);
      doc.addPage();
    }

    // Scope Section
    if (report.scope) {
      doc.fontSize(16).text('Scope', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.scope.content);
      doc.addPage();
    }

    // Methodology
    if (report.methodology) {
      doc.fontSize(16).text('Methodology', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.methodology);
      doc.addPage();
    }

    // Observations
    if (report.observations && report.observations.length > 0) {
      doc.fontSize(16).text('Observations', { underline: true });
      doc.moveDown();
      
      report.observations.forEach((obs, index) => {
        doc.fontSize(13).text(`${index + 1}. ${obs.title}`, { bold: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(obs.content);
        doc.moveDown();
      });
      
      doc.addPage();
    }

    // Findings
    if (report.findings && report.findings.length > 0) {
      doc.fontSize(16).text('Findings', { underline: true });
      doc.moveDown();
      
      report.findings.forEach((finding, index) => {
        doc.fontSize(13).text(`${index + 1}. ${finding.title}`, { bold: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(finding.content);
        doc.moveDown();
      });
      
      doc.addPage();
    }

    // Recommendations
    if (report.recommendations) {
      doc.fontSize(16).text('Recommendations', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.recommendations);
      doc.addPage();
    }

    // Conclusion
    if (report.conclusion) {
      doc.fontSize(16).text('Conclusion', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.conclusion.content);
      doc.addPage();
    }

    // Limitations
    if (report.limitations) {
      doc.fontSize(16).text('Limitations', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(report.limitations);
      doc.addPage();
    }

    // F1.3 - Evidence List
    if (includeEvidence && report.evidenceItems.length > 0) {
      doc.fontSize(16).text('Evidence Reference List', { underline: true });
      doc.moveDown();
      
      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Ref #', 50, doc.y, { width: 80, continued: true });
      doc.text('File Name', 130, doc.y, { width: 200, continued: true });
      doc.text('Type', 330, doc.y, { width: 100, continued: true });
      doc.text('Collected By', 430, doc.y, { width: 120 });
      doc.moveDown();
      
      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      
      // Table rows
      doc.font('Helvetica').fontSize(9);
      report.evidenceItems.forEach(evidence => {
        const y = doc.y;
        doc.text(evidence.referenceNumber, 50, y, { width: 80 });
        doc.text(evidence.fileName, 130, y, { width: 200 });
        doc.text(evidence.evidenceType, 330, y, { width: 100 });
        doc.text(`${evidence.collector.firstName} ${evidence.collector.lastName}`, 430, y, { width: 120 });
        doc.moveDown(0.8);
        
        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });
      
      doc.addPage();
    }

    // F1.4 - Activity Log
    if (includeActivityLog && activityLog.length > 0) {
      doc.fontSize(16).text('Activity Audit Log', { underline: true });
      doc.moveDown();
      
      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date/Time', 50, doc.y, { width: 120, continued: true });
      doc.text('User', 170, doc.y, { width: 120, continued: true });
      doc.text('Action', 290, doc.y, { width: 80, continued: true });
      doc.text('Details', 370, doc.y, { width: 180 });
      doc.moveDown();
      
      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      
      // Table rows
      doc.font('Helvetica').fontSize(9);
      activityLog.forEach(log => {
        const y = doc.y;
        doc.text(new Date(log.timestamp).toLocaleString(), 50, y, { width: 120 });
        doc.text(`${log.user.firstName} ${log.user.lastName}`, 170, y, { width: 120 });
        doc.text(log.action, 290, y, { width: 80 });
        doc.text(log.description || '', 370, y, { width: 180 });
        doc.moveDown(0.8);
        
        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });
      
      doc.addPage();
    }

    // Signatures Page
    if (includeSignatures && report.reviews.length > 0) {
      doc.fontSize(16).text('Approvals & Sign-offs', { underline: true });
      doc.moveDown(2);
      
      report.reviews.forEach(review => {
        if (review.signedOffAt) {
          doc.fontSize(11);
          doc.text(`${review.reviewer.firstName} ${review.reviewer.lastName}`, { bold: true });
          doc.fontSize(10);
          doc.text(`Role: ${review.reviewType}`);
          doc.text(`Decision: ${review.decision}`);
          doc.text(`Signed: ${new Date(review.signedOffAt).toLocaleString()}`);
          if (review.signature) {
            doc.text(`Signature: ${review.signature.substring(0, 20)}...`);
          }
          doc.moveDown(2);
        }
      });
    }

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Create dossier record
    const dossier = await prisma.dossier.create({
      data: {
        reportId,
        filename,
        filepath,
        fileSize: (await fs.stat(filepath)).size,
        generatedById: req.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    await req.logActivity('GENERATE', 'Dossier', dossier.id, {
      reportNumber: report.reportNumber
    });

    res.json({
      success: true,
      message: 'Dossier generated successfully',
      data: {
        dossierId: dossier.id,
        filename,
        downloadUrl: `/api/dossier/download/${dossier.id}`,
        expiresAt: dossier.expiresAt
      }
    });
  } catch (error) {
    console.error('Generate dossier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dossier'
    });
  }
};

/**
 * Generate cover page
 */
const generateCoverPage = (doc, report) => {
  // Logo/Header
  doc.fontSize(24).font('Helvetica-Bold')
     .text(report.firm?.name || 'Consulting Firm', { align: 'center' });
  
  doc.moveDown(3);
  
  // Report Title
  doc.fontSize(20).text(report.title, { align: 'center' });
  
  doc.moveDown(2);
  
  // Report Details
  doc.fontSize(14).font('Helvetica');
  doc.text(`Report Number: ${report.reportNumber}`, { align: 'center' });
  doc.text(`Report Type: ${report.type}`, { align: 'center' });
  doc.text(`Year: ${report.year}`, { align: 'center' });
  
  doc.moveDown(2);
  
  // Client Information
  doc.fontSize(16).font('Helvetica-Bold').text('Client Information', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text(`Client: ${report.client.name}`, { align: 'center' });
  doc.text(`Industry: ${report.client.industry}`, { align: 'center' });
  
  doc.moveDown(3);
  
  // Team
  doc.fontSize(16).font('Helvetica-Bold').text('Engagement Team', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text(`Lead Consultant: ${report.leadConsultant.firstName} ${report.leadConsultant.lastName}`, { align: 'center' });
  
  doc.moveDown(3);
  
  // Date
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  
  // Confidentiality Notice
  doc.moveDown(4);
  doc.fontSize(10).font('Helvetica-Oblique')
     .text('CONFIDENTIAL', { align: 'center' });
  doc.text('This document contains confidential information and is intended solely for the use of the client.', { align: 'center' });
};

/**
 * Generate index/table of contents
 */
const generateIndex = (doc, report, options) => {
  doc.fontSize(18).font('Helvetica-Bold').text('Table of Contents', { underline: true });
  doc.moveDown(2);
  
  doc.fontSize(12).font('Helvetica');
  
  let pageNum = 1;
  
  doc.text(`${pageNum++}. Report Metadata`);
  
  if (report.executiveSummary) {
    doc.text(`${pageNum++}. Executive Summary`);
  }
  
  if (report.scope) {
    doc.text(`${pageNum++}. Scope`);
  }
  
  if (report.methodology) {
    doc.text(`${pageNum++}. Methodology`);
  }
  
  if (report.observations?.length > 0) {
    doc.text(`${pageNum++}. Observations`);
  }
  
  if (report.findings?.length > 0) {
    doc.text(`${pageNum++}. Findings`);
  }
  
  if (report.recommendations) {
    doc.text(`${pageNum++}. Recommendations`);
  }
  
  if (report.conclusion) {
    doc.text(`${pageNum++}. Conclusion`);
  }
  
  if (report.limitations) {
    doc.text(`${pageNum++}. Limitations`);
  }
  
  if (options.includeEvidence) {
    doc.text(`${pageNum++}. Evidence Reference List`);
  }
  
  if (options.includeActivityLog) {
    doc.text(`${pageNum++}. Activity Audit Log`);
  }
  
  doc.text(`${pageNum++}. Approvals & Sign-offs`);
};

/**
 * Generate metadata section
 */
const generateMetadata = (doc, report) => {
  doc.fontSize(16).font('Helvetica-Bold').text('Report Metadata', { underline: true });
  doc.moveDown();
  
  doc.fontSize(11).font('Helvetica');
  
  const metadata = [
    ['Report Number', report.reportNumber],
    ['Title', report.title],
    ['Type', report.type],
    ['Year', report.year],
    ['Fiscal Period', report.fiscalPeriod || 'N/A'],
    ['Status', report.status],
    ['Client', report.client.name],
    ['Client ID', report.client.uniqueIdentifier],
    ['Industry', report.client.industry],
    ['Lead Consultant', `${report.leadConsultant.firstName} ${report.leadConsultant.lastName}`],
    ['Created', new Date(report.createdAt).toLocaleDateString()],
    ['Last Updated', new Date(report.updatedAt).toLocaleDateString()]
  ];
  
  if (report.finalizedAt) {
    metadata.push(['Finalized', new Date(report.finalizedAt).toLocaleDateString()]);
  }
  
  if (report.lockedAt) {
    metadata.push(['Locked', new Date(report.lockedAt).toLocaleDateString()]);
  }
  
  metadata.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value);
  });
};

/**
 * MODULE F2 - Download Dossier
 */
const downloadDossier = async (req, res) => {
  try {
    const { dossierId } = req.params;

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        report: {
          select: {
            reportNumber: true,
            title: true
          }
        }
      }
    });

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier not found'
      });
    }

    // Check if expired
    if (new Date() > dossier.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Dossier has expired'
      });
    }

    // Update download count
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date()
      }
    });

    await req.logActivity('DOWNLOAD', 'Dossier', dossierId, {
      reportNumber: dossier.report.reportNumber
    });

    // Send file
    res.download(dossier.filepath, dossier.filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      // F2.2 - Delete after download (optional)
      // Uncomment to enable auto-deletion
      // try {
      //   await fs.unlink(dossier.filepath);
      //   await prisma.dossier.delete({ where: { id: dossierId } });
      // } catch (cleanupError) {
      //   console.error('Cleanup error:', cleanupError);
      // }
    });
  } catch (error) {
    console.error('Download dossier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download dossier'
    });
  }
};

/**
 * Cleanup expired dossiers
 */
const cleanupTempFiles = async (req, res) => {
  try {
    const expiredDossiers = await prisma.dossier.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    let deletedCount = 0;

    for (const dossier of expiredDossiers) {
      try {
        await fs.unlink(dossier.filepath);
        await prisma.dossier.delete({ where: { id: dossier.id } });
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete dossier ${dossier.id}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired dossiers`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup temp files'
    });
  }
};

module.exports = {
  generateDossier,
  downloadDossier,
  cleanupTempFiles
};
