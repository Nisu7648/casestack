// Document Management Tests
const request = require('supertest');
const app = require('../src/index');
const { prisma, cleanDatabase } = require('./setup');
const path = require('path');
const fs = require('fs');

describe('Document Management API', () => {
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

    // Create a test client
    const client = await prisma.client.create({
      data: {
        id: 'test-client-id',
        name: 'Test Client',
        firmId: firmId
      }
    });

    // Create a test case
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

  describe('POST /api/documents/upload', () => {
    it('should upload a document successfully', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test document content');

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('caseId', caseId)
        .field('description', 'Test document')
        .attach('file', testFilePath);

      // Clean up test file
      fs.unlinkSync(testFilePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.document).toHaveProperty('fileName');
      expect(response.body.document).toHaveProperty('fileSize');
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('caseId', caseId);

      expect(response.status).toBe(400);
    });

    it('should reject upload for non-existent case', async () => {
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test content');

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('caseId', 'non-existent-case')
        .attach('file', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/documents/case/:caseId', () => {
    it('should list documents for a case', async () => {
      const response = await request(app)
        .get(`/api/documents/case/${caseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });

  describe('POST /api/documents/folders', () => {
    it('should create a folder', async () => {
      const response = await request(app)
        .post('/api/documents/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Tax Documents',
          caseId: caseId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.folder).toHaveProperty('name', 'Tax Documents');
    });

    it('should reject folder creation without name', async () => {
      const response = await request(app)
        .post('/api/documents/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caseId: caseId
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/documents/search', () => {
    it('should search documents', async () => {
      const response = await request(app)
        .get('/api/documents/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ query: 'test', caseId: caseId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });
});
