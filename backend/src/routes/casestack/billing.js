const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// TIME TRACKING
// ============================================

// Create time entry
router.post('/time', async (req, res) => {
  try {
    const { caseId, description, hours, billableRate, date, taskId } = req.body;

    if (!caseId || !hours || !billableRate) {
      return res.status(400).json({ error: 'caseId, hours, and billableRate required' });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        id: uuidv4(),
        caseId,
        userId: req.userId,
        description: description || '',
        hours: parseFloat(hours),
        billableRate: parseFloat(billableRate),
        totalAmount: parseFloat(hours) * parseFloat(billableRate),
        date: date ? new Date(date) : new Date(),
        taskId: taskId || null,
        isBilled: false
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            caseName: true,
            caseNumber: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      timeEntry
    });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// Get time entries for a case
router.get('/time/case/:caseId', async (req, res) => {
  try {
    const { startDate, endDate, userId, billed } = req.query;

    const where = {
      caseId: req.params.caseId,
      ...(userId && { userId }),
      ...(billed !== undefined && { isBilled: billed === 'true' }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);

    res.json({
      success: true,
      timeEntries,
      summary: {
        totalHours,
        totalAmount,
        count: timeEntries.length
      }
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Update time entry
router.put('/time/:id', async (req, res) => {
  try {
    const { description, hours, billableRate, date } = req.body;

    const data = {};
    if (description !== undefined) data.description = description;
    if (hours !== undefined) {
      data.hours = parseFloat(hours);
      const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
      data.totalAmount = parseFloat(hours) * (billableRate || entry.billableRate);
    }
    if (billableRate !== undefined) {
      data.billableRate = parseFloat(billableRate);
      const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
      data.totalAmount = (hours || entry.hours) * parseFloat(billableRate);
    }
    if (date) data.date = new Date(date);

    const timeEntry = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      timeEntry
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// Delete time entry
router.delete('/time/:id', async (req, res) => {
  try {
    // Check if already billed
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id }
    });

    if (entry.isBilled) {
      return res.status(400).json({ error: 'Cannot delete billed time entry' });
    }

    await prisma.timeEntry.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Time entry deleted'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// ============================================
// INVOICING
// ============================================

// Create invoice from time entries
router.post('/invoices', async (req, res) => {
  try {
    const { caseId, timeEntryIds, dueDate, notes, discount } = req.body;

    if (!caseId || !timeEntryIds || timeEntryIds.length === 0) {
      return res.status(400).json({ error: 'caseId and timeEntryIds required' });
    }

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        caseId,
        isBilled: false
      }
    });

    if (timeEntries.length === 0) {
      return res.status(400).json({ error: 'No unbilled time entries found' });
    }

    // Calculate totals
    const subtotal = timeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
    const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
    const total = subtotal - discountAmount;

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Create invoice
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          id: uuidv4(),
          invoiceNumber,
          caseId,
          subtotal,
          discount: discountAmount,
          total,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: notes || '',
          status: 'DRAFT',
          createdById: req.userId
        }
      });

      // Mark time entries as billed
      await tx.timeEntry.updateMany({
        where: {
          id: { in: timeEntryIds }
        },
        data: {
          isBilled: true,
          invoiceId: inv.id
        }
      });

      return inv;
    });

    res.status(201).json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get invoice with details
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        case: {
          include: {
            client: true
          }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Get all invoices for a case
router.get('/invoices/case/:caseId', async (req, res) => {
  try {
    const { status } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        caseId: req.params.caseId,
        ...(status && { status })
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      success: true,
      invoices,
      summary: {
        total: totalAmount,
        paid: paidAmount,
        outstanding: totalAmount - paidAmount,
        count: invoices.length
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Update invoice status
router.put('/invoices/:id/status', async (req, res) => {
  try {
    const { status, paidDate } = req.body;

    if (!['DRAFT', 'SENT', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = { status };
    if (status === 'PAID' && paidDate) {
      data.paidDate = new Date(paidDate);
    }
    if (status === 'SENT' && !paidDate) {
      data.sentDate = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data
    });

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// ============================================
// EXPENSES
// ============================================

// Create expense
router.post('/expenses', async (req, res) => {
  try {
    const { caseId, description, amount, category, date, receiptUrl } = req.body;

    if (!caseId || !amount || !description) {
      return res.status(400).json({ error: 'caseId, amount, and description required' });
    }

    const expense = await prisma.expense.create({
      data: {
        id: uuidv4(),
        caseId,
        description,
        amount: parseFloat(amount),
        category: category || 'OTHER',
        date: date ? new Date(date) : new Date(),
        receiptUrl: receiptUrl || null,
        createdById: req.userId,
        isBilled: false
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expenses for a case
router.get('/expenses/case/:caseId', async (req, res) => {
  try {
    const { category, billed } = req.query;

    const expenses = await prisma.expense.findMany({
      where: {
        caseId: req.params.caseId,
        ...(category && { category }),
        ...(billed !== undefined && { isBilled: billed === 'true' })
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      expenses,
      summary: {
        total: totalAmount,
        count: expenses.length
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

module.exports = router;
