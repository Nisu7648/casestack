const nodemailer = require('nodemailer');

// ============================================
// EMAIL NOTIFICATION SERVICE
// Sends emails for case submissions, approvals, finalization
// ============================================

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@casestack.io';
    this.fromName = process.env.FROM_NAME || 'CASESTACK';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  // Send case submitted for review notification
  async sendCaseSubmittedNotification(caseData, reviewer) {
    const subject = `Case Submitted for Review: ${caseData.caseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Case Submitted for Review</h2>
        
        <p>Hello ${reviewer.firstName},</p>
        
        <p>A new case has been submitted for your review:</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #1f2937;">
          <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseData.caseNumber}</p>
          <p style="margin: 5px 0;"><strong>Case Name:</strong> ${caseData.caseName}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${caseData.client.name}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${caseData.caseType}</p>
          <p style="margin: 5px 0;"><strong>Prepared By:</strong> ${caseData.preparedBy.firstName} ${caseData.preparedBy.lastName}</p>
        </div>
        
        <p>
          <a href="${this.appUrl}/cases/${caseData.id}" 
             style="display: inline-block; padding: 12px 24px; background: #1f2937; color: white; text-decoration: none; border-radius: 4px;">
            Review Case
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from CASESTACK. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail(reviewer.email, subject, html);
  }

  // Send case approved notification
  async sendCaseApprovedNotification(caseData, preparer) {
    const subject = `Case Approved: ${caseData.caseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✓ Case Approved</h2>
        
        <p>Hello ${preparer.firstName},</p>
        
        <p>Your case has been approved and is ready for partner finalization:</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseData.caseNumber}</p>
          <p style="margin: 5px 0;"><strong>Case Name:</strong> ${caseData.caseName}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${caseData.client.name}</p>
          <p style="margin: 5px 0;"><strong>Reviewed By:</strong> ${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName}</p>
        </div>
        
        <p>
          <a href="${this.appUrl}/cases/${caseData.id}" 
             style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 4px;">
            View Case
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from CASESTACK. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail(preparer.email, subject, html);
  }

  // Send case rejected notification
  async sendCaseRejectedNotification(caseData, preparer, comments) {
    const subject = `Case Rejected: ${caseData.caseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">✗ Case Rejected</h2>
        
        <p>Hello ${preparer.firstName},</p>
        
        <p>Your case has been rejected and requires revisions:</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseData.caseNumber}</p>
          <p style="margin: 5px 0;"><strong>Case Name:</strong> ${caseData.caseName}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${caseData.client.name}</p>
          <p style="margin: 5px 0;"><strong>Reviewed By:</strong> ${caseData.reviewedBy.firstName} ${caseData.reviewedBy.lastName}</p>
        </div>
        
        ${comments ? `
          <div style="background: #fef2f2; padding: 15px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Comments:</strong></p>
            <p style="margin: 10px 0 0 0;">${comments}</p>
          </div>
        ` : ''}
        
        <p>
          <a href="${this.appUrl}/cases/${caseData.id}" 
             style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px;">
            View Case
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from CASESTACK. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail(preparer.email, subject, html);
  }

  // Send case finalized notification
  async sendCaseFinalizedNotification(caseData, team) {
    const subject = `🔒 Case Finalized: ${caseData.caseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">🔒 Case Finalized and Locked</h2>
        
        <p>A case has been finalized and permanently locked:</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #1f2937;">
          <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseData.caseNumber}</p>
          <p style="margin: 5px 0;"><strong>Case Name:</strong> ${caseData.caseName}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${caseData.client.name}</p>
          <p style="margin: 5px 0;"><strong>Finalized By:</strong> ${caseData.approvedBy.firstName} ${caseData.approvedBy.lastName} (Partner)</p>
          <p style="margin: 5px 0;"><strong>Finalized At:</strong> ${new Date(caseData.finalizedAt).toLocaleString()}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Important:</strong> This case is now permanently locked and cannot be modified.
          </p>
        </div>
        
        <p>
          <a href="${this.appUrl}/cases/${caseData.id}" 
             style="display: inline-block; padding: 12px 24px; background: #1f2937; color: white; text-decoration: none; border-radius: 4px;">
            View Case
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from CASESTACK. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send to all team members
    const emails = team.map(member => member.email);
    await this.sendEmail(emails, subject, html);
  }

  // Send welcome email to new user
  async sendWelcomeEmail(user, tempPassword) {
    const subject = 'Welcome to CASESTACK';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Welcome to CASESTACK</h2>
        
        <p>Hello ${user.firstName},</p>
        
        <p>Your account has been created. Here are your login credentials:</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #1f2937;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Security:</strong> Please change your password after first login.
          </p>
        </div>
        
        <p>
          <a href="${this.appUrl}/login" 
             style="display: inline-block; padding: 12px 24px; background: #1f2937; color: white; text-decoration: none; border-radius: 4px;">
            Login to CASESTACK
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from CASESTACK. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  // Generic send email function
  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
