// Billing & Time Tracking Tests
const request = require('supertest');
const app = require('../src/index');
const { prisma, cleanDatabase } = require('./setup');

describe('Billing & Time Tracking API', () => {
  let token;
  let firmId;
  let userId;
  let caseId;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Register and login
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firmName: 'Test Law Firm',
        country: 'India',
        email: 'lawyer@testfirm.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Lawyer'
      });
    
    token = registerResponse.body.token;
    firmId = registerResponse.body.user.firmId;
    userId = registerResponse.body.user.id;

    // Create test client and case
    const client = await prisma.client.create({
      data: {
        id: 'test-client-id',
        name: 'Test Client',
        firmId: firmId
      }
    });

    const caseData = await prisma.case.create({
      data: {
        id: 'test-case-id',
        caseNumber: 'CASE-2025-0001',
        caseName: 'Test Case',
        caseType: 'TAX_AUDIT',
        clientId: client.id,
        firmId: firmId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-12-31'),
        fiscalYear: 2024,
        preparedById: userId,
        status: 'DRAFT'
      }
    });
    
    caseId = caseData.id;
  });

  describe('POST /api/billing/time', () => {
    it('should create a time entry', async () => {
      const response = await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Legal research',
          hours: 2.5,
          billableRate: 100,
          date: '2025-01-17'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.timeEntry).toHaveProperty('hours', 2.5);
      expect(response.body.timeEntry).toHaveProperty('totalAmount', 250);
    });

    it('should reject time entry without required fields', async () => {
      const response = await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Legal research'
        });

      expect(response.status).toBe(400);
    });

    it('should calculate total amount correctly', async () => {
      const response = await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Court appearance',
          hours: 3,
          billableRate: 150
        });

      expect(response.body.timeEntry.totalAmount).toBe(450);
    });
  });

  describe('GET /api/billing/time/case/:caseId', () => {
    beforeEach(async () => {
      // Create some time entries
      await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Research',
          hours: 2,
          billableRate: 100
        });

      await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Meeting',
          hours: 1,
          billableRate: 100
        });
    });

    it('should list time entries for a case', async () => {
      const response = await request(app)
        .get(`/api/billing/time/case/${caseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.timeEntries.length).toBe(2);
      expect(response.body.summary.totalHours).toBe(3);
      expect(response.body.summary.totalAmount).toBe(300);
    });
  });

  describe('POST /api/billing/invoices', () => {
    let timeEntryIds = [];

    beforeEach(async () => {
      // Create time entries
      const entry1 = await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Research',
          hours: 2,
          billableRate: 100
        });

      const entry2 = await request(app)
        .post('/api/billing/time')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Meeting',
          hours: 1,
          billableRate: 100
        });

      timeEntryIds = [
        entry1.body.timeEntry.id,
        entry2.body.timeEntry.id
      ];
    });

    it('should create an invoice from time entries', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          timeEntryIds: timeEntryIds,
          notes: 'Monthly invoice'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.invoice).toHaveProperty('invoiceNumber');
      expect(response.body.invoice.subtotal).toBe(300);
      expect(response.body.invoice.total).toBe(300);
    });

    it('should apply discount correctly', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          timeEntryIds: timeEntryIds,
          discount: 10 // 10%
        });

      expect(response.body.invoice.subtotal).toBe(300);
      expect(response.body.invoice.discount).toBe(30);
      expect(response.body.invoice.total).toBe(270);
    });

    it('should reject invoice without time entries', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          timeEntryIds: []
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/billing/expenses', () => {
    it('should create an expense', async () => {
      const response = await request(app)
        .post('/api/billing/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Court filing fee',
          amount: 500,
          category: 'COURT_FEES',
          date: '2025-01-17'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.expense).toHaveProperty('amount', 500);
    });

    it('should reject expense without required fields', async () => {
      const response = await request(app)
        .post('/api/billing/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Filing fee'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/billing/expenses/case/:caseId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/billing/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Court fee',
          amount: 500,
          category: 'COURT_FEES'
        });

      await request(app)
        .post('/api/billing/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId,
          description: 'Travel',
          amount: 200,
          category: 'TRAVEL'
        });
    });

    it('should list expenses for a case', async () => {
      const response = await request(app)
        .get(`/api/billing/expenses/case/${caseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses.length).toBe(2);
      expect(response.body.summary.total).toBe(700);
    });
  });
});
