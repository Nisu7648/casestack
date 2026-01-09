const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================
// PDF EXPORT SERVICE
// Generates audit-ready PDF exports of cases
// ============================================

class PDFExportService {
  constructor() {
    this.exportDir = process.env.EXPORT_DIR || path.join(__dirname, '../../exports');
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  // Generate case export PDF
  async generateCaseExportPDF(caseData, bundles, approvalChain) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `CASE-${caseData.caseNumber}-${Date.now()}.pdf`;
        const filePath = path.join(this.exportDir, fileName);
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'CASE EXPORT - AUDIT READY');
        
        // Case Information
        this.addSection(doc, 'CASE INFORMATION');
        this.addKeyValue(doc, 'Case Number', caseData.caseNumber);
        this.addKeyValue(doc, 'Case Name', caseData.caseName);
        this.addKeyValue(doc, 'Client', caseData.client.name);
        this.addKeyValue(doc, 'Case Type', caseData.caseType);
        this.addKeyValue(doc, 'Fiscal Year', caseData.fiscalYear.toString());
        this.addKeyValue(doc, 'Period', `${new Date(caseData.periodStart).toLocaleDateString()} - ${new Date(caseData.periodEnd).toLocaleDateString()}`);
        this.addKeyValue(doc, 'Status', caseData.status);
        
        if (caseData.description) {
          doc.moveDown();
          doc.fontSize(10).text('Description:', { underline: true });
          doc.fontSize(9).text(caseData.description, { align: 'justify' });
        }

        doc.moveDown(2);

        // Responsibility Chain
        this.addSection(doc, 'RESPONSIBILITY CHAIN');
        this.addKeyValue(doc, 'Prepared By', `${caseData.preparedBy.firstName} ${caseData.preparedBy.lastName} (${caseData.preparedBy.role})`);
        this.addKeyValue(doc, 'Email', caseData.preparedBy.email);
        
        if (caseData.reviewedBy) {
          doc.moveDown();
          this.addKeyValue(doc, 'Reviewed By', `${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName} (${caseData.reviewedBy.role})`);
          this.addKeyValue(doc, 'Email', caseData.reviewedBy.email);
        }
        
        if (caseData.approvedBy) {
          doc.moveDown();
          this.addKeyValue(doc, 'Approved By (Partner)', `${caseData.approvedBy.firstName} ${caseData.approvedBy.lastName} (${caseData.approvedBy.role})`);
          this.addKeyValue(doc, 'Email', caseData.approvedBy.email);
        }

        if (caseData.finalizedAt) {
          doc.moveDown();
          this.addKeyValue(doc, 'Finalized At', new Date(caseData.finalizedAt).toLocaleString());
        }

        doc.moveDown(2);

        // Approval History
        if (approvalChain && approvalChain.length > 0) {
          this.addSection(doc, 'APPROVAL HISTORY');
          
          approvalChain.forEach((approval, index) => {
            doc.fontSize(9)
              .fillColor('#1f2937')
              .text(`${index + 1}. ${approval.action}`, { continued: false });
            
            doc.fontSize(8)
              .fillColor('#6b7280')
              .text(`   By: ${approval.actionBy.firstName} ${approval.actionBy.lastName} (${approval.actionBy.role})`, { continued: false })
              .text(`   Date: ${new Date(approval.createdAt).toLocaleString()}`, { continued: false });
            
            if (approval.comments) {
              doc.text(`   Comments: ${approval.comments}`, { continued: false });
            }
            
            doc.moveDown(0.5);
          });

          doc.moveDown();
        }

        // File Bundles
        if (bundles && bundles.length > 0) {
          this.addSection(doc, 'FILE BUNDLES');
          
          bundles.forEach((bundle, bundleIndex) => {
            doc.fontSize(10)
              .fillColor('#1f2937')
              .text(`Bundle ${bundleIndex + 1}: ${bundle.bundleName}`, { underline: true });
            
            doc.fontSize(8)
              .fillColor('#6b7280')
              .text(`Version: ${bundle.version} | Files: ${bundle.files.length} | Finalized: ${bundle.isFinalized ? 'Yes' : 'No'}`);
            
            doc.moveDown(0.5);

            if (bundle.files && bundle.files.length > 0) {
              // Table header
              const tableTop = doc.y;
              const col1 = 50;
              const col2 = 250;
              const col3 = 350;
              const col4 = 450;

              doc.fontSize(8)
                .fillColor('#1f2937')
                .text('File Name', col1, tableTop, { width: 190 })
                .text('Type', col2, tableTop, { width: 90 })
                .text('Size', col3, tableTop, { width: 90 })
                .text('Hash (SHA-256)', col4, tableTop, { width: 100 });

              doc.moveTo(col1, doc.y + 2)
                .lineTo(550, doc.y + 2)
                .stroke();

              doc.moveDown(0.3);

              // Table rows
              bundle.files.forEach((file) => {
                const rowTop = doc.y;
                
                doc.fontSize(7)
                  .fillColor('#374151')
                  .text(file.fileName, col1, rowTop, { width: 190 })
                  .text(file.fileType, col2, rowTop, { width: 90 })
                  .text(`${(file.fileSize / 1024 / 1024).toFixed(2)} MB`, col3, rowTop, { width: 90 })
                  .text(file.fileHash.substring(0, 16) + '...', col4, rowTop, { width: 100 });

                doc.moveDown(0.5);
              });
            }

            doc.moveDown();
          });
        }

        // Footer with legal notice
        doc.moveDown(2);
        this.addSection(doc, 'LEGAL NOTICE');
        doc.fontSize(8)
          .fillColor('#6b7280')
          .text('This document is an official export from CASESTACK Finalization & Defensibility System.', { align: 'justify' })
          .text('All information contained herein is accurate as of the export date and has been verified through our immutable audit trail.', { align: 'justify' })
          .text('File integrity can be verified using the SHA-256 hashes provided above.', { align: 'justify' });

        doc.moveDown();
        doc.fontSize(7)
          .fillColor('#9ca3af')
          .text(`Export Generated: ${new Date().toLocaleString()}`, { align: 'center' })
          .text('CASESTACK © 2024 - Finalization & Defensibility System', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            fileSize: fs.statSync(filePath).size
          });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper: Add header
  addHeader(doc, title) {
    doc.fontSize(20)
      .fillColor('#1f2937')
      .text(title, { align: 'center' });
    
    doc.moveDown();
    doc.moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    
    doc.moveDown(2);
  }

  // Helper: Add section
  addSection(doc, title) {
    doc.fontSize(14)
      .fillColor('#1f2937')
      .text(title, { underline: true });
    
    doc.moveDown(0.5);
  }

  // Helper: Add key-value pair
  addKeyValue(doc, key, value) {
    doc.fontSize(9)
      .fillColor('#6b7280')
      .text(key + ':', { continued: true })
      .fillColor('#1f2937')
      .text(' ' + value);
  }

  // Clean up old exports (older than 7 days)
  async cleanupOldExports() {
    try {
      const files = fs.readdirSync(this.exportDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      files.forEach(file => {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old export: ${file}`);
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new PDFExportService();
