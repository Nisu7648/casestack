const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const emailService = require('../config/email');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * Send test email
 */
router.post('/test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    const result = await emailService.sendEmail({
      to: to || req.user.email,
      subject: subject || 'Test Email from LegalStack',
      html: `<p>${message || 'This is a test email from LegalStack.'}</p>`
    });

    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send email',
      data: result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
});

/**
 * Send case assignment notification
 */
router.post('/case-assignment', async (req, res) => {
  try {
    const { userId, caseId } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const caseData = await prisma.case.findUnique({ where: { id: caseId } });

    if (!user || !caseData) {
      return res.status(404).json({
        success: false,
        message: 'User or case not found'
      });
    }

    const result = await emailService.sendCaseAssignmentEmail(user, caseData, req.user);

    res.json({
      success: result.success,
      message: result.success ? 'Assignment notification sent' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('Case assignment email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send assignment notification'
    });
  }
});

/**
 * Send task reminder
 */
router.post('/task-reminder', async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        case: true
      }
    });

    if (!task || !task.assignedTo) {
      return res.status(404).json({
        success: false,
        message: 'Task or assigned user not found'
      });
    }

    const result = await emailService.sendTaskReminderEmail(
      task.assignedTo,
      task,
      task.case
    );

    res.json({
      success: result.success,
      message: result.success ? 'Task reminder sent' : 'Failed to send reminder'
    });
  } catch (error) {
    console.error('Task reminder email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send task reminder'
    });
  }
});

/**
 * Send invoice notification
 */
router.post('/invoice', async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        firm: true
      }
    });

    if (!invoice || !invoice.client) {
      return res.status(404).json({
        success: false,
        message: 'Invoice or client not found'
      });
    }

    const result = await emailService.sendInvoiceEmail(
      invoice.client,
      invoice,
      invoice.firm.name
    );

    res.json({
      success: result.success,
      message: result.success ? 'Invoice notification sent' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('Invoice email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice notification'
    });
  }
});

/**
 * Get email templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        description: 'Sent to new users when they register',
        subject: 'Welcome to LegalStack!'
      },
      {
        id: 'case-assignment',
        name: 'Case Assignment',
        description: 'Sent when a user is assigned to a case',
        subject: 'New Case Assignment'
      },
      {
        id: 'task-reminder',
        name: 'Task Reminder',
        description: 'Sent before task deadline',
        subject: 'Task Deadline Reminder'
      },
      {
        id: 'invoice',
        name: 'Invoice Notification',
        description: 'Sent when invoice is generated',
        subject: 'New Invoice'
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        description: 'Sent when user requests password reset',
        subject: 'Password Reset Request'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

module.exports = router;
