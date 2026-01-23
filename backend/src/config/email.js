const sgMail = require('@sendgrid/mail');

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@legalstack.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send email using SendGrid
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent:', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await sgMail.send(msg);
    console.log('Email sent successfully:', { to, subject });
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user, firmName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to LegalStack! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.firstName},</h2>
          <p>Welcome to <strong>LegalStack</strong> - your modern legal case management platform!</p>
          <p>Your account has been successfully created for <strong>${firmName}</strong>.</p>
          
          <h3>What you can do now:</h3>
          <ul>
            <li>✅ Create and manage cases</li>
            <li>✅ Upload and organize documents</li>
            <li>✅ Track time and generate invoices</li>
            <li>✅ Collaborate with your team</li>
            <li>✅ Monitor case progress</li>
          </ul>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
            Go to Dashboard
          </a>

          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br><strong>The LegalStack Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 LegalStack. Fair, accessible legal case management.</p>
          <p>This email was sent to ${user.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to LegalStack! 🎉',
    html
  });
};

/**
 * Send case assignment notification
 */
const sendCaseAssignmentEmail = async (user, caseData, assignedBy) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .case-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Case Assignment</h2>
        </div>
        <div class="content">
          <p>Hi ${user.firstName},</p>
          <p>You have been assigned to a new case by <strong>${assignedBy.firstName} ${assignedBy.lastName}</strong>.</p>
          
          <div class="case-info">
            <h3>${caseData.title}</h3>
            <p><strong>Case Number:</strong> ${caseData.caseNumber}</p>
            <p><strong>Status:</strong> ${caseData.status}</p>
            <p><strong>Priority:</strong> ${caseData.priority || 'Normal'}</p>
            ${caseData.description ? `<p><strong>Description:</strong> ${caseData.description}</p>` : ''}
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cases/${caseData.id}" class="button">
            View Case
          </a>

          <p>Best regards,<br><strong>LegalStack</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `New Case Assignment: ${caseData.title}`,
    html
  });
};

/**
 * Send task deadline reminder
 */
const sendTaskReminderEmail = async (user, task, caseData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .task-info { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .urgent { color: #dc2626; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⏰ Task Deadline Reminder</h2>
        </div>
        <div class="content">
          <p>Hi ${user.firstName},</p>
          <p class="urgent">You have an upcoming task deadline!</p>
          
          <div class="task-info">
            <h3>${task.title}</h3>
            <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p><strong>Priority:</strong> ${task.priority || 'Normal'}</p>
            <p><strong>Case:</strong> ${caseData.title} (${caseData.caseNumber})</p>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task.id}" class="button">
            View Task
          </a>

          <p>Best regards,<br><strong>LegalStack</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `⏰ Task Reminder: ${task.title}`,
    html
  });
};

/**
 * Send invoice notification
 */
const sendInvoiceEmail = async (client, invoice, firmName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .invoice-info { background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
        .total { font-size: 24px; color: #10b981; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Invoice from ${firmName}</h2>
        </div>
        <div class="content">
          <p>Dear ${client.name},</p>
          <p>You have received a new invoice from <strong>${firmName}</strong>.</p>
          
          <div class="invoice-info">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p class="total">Total Amount: $${invoice.totalAmount.toFixed(2)}</p>
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices/${invoice.id}" class="button">
            View Invoice
          </a>

          <p>Please make payment by the due date to avoid late fees.</p>
          
          <p>Thank you for your business!</p>
          <p>Best regards,<br><strong>${firmName}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber} from ${firmName}`,
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hi ${user.firstName},</p>
          <p>We received a request to reset your password for your LegalStack account.</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>

          <div class="warning">
            <p><strong>⚠️ Security Notice:</strong></p>
            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>

          <p>Best regards,<br><strong>LegalStack Security Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - LegalStack',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendCaseAssignmentEmail,
  sendTaskReminderEmail,
  sendInvoiceEmail,
  sendPasswordResetEmail
};
