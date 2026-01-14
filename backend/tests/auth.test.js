// Authentication Tests for CaseStack
const request = require('supertest');
const app = require('../src/index');
const { prisma, cleanDatabase } = require('./setup');

describe('Authentication API', () => {
  
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new firm and user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Test Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'admin@testfirm.com');
    });
    
    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Test Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      expect(response.status).toBe(400);
    });
    
    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Test Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Another Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Test Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });
    });
    
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@testfirm.com',
          password: 'SecurePass123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
    
    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@testfirm.com',
          password: 'WrongPassword'
        });
      
      expect(response.status).toBe(401);
    });
    
    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@testfirm.com',
          password: 'SecurePass123!'
        });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/auth/verify', () => {
    let token;
    
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firmName: 'Test Firm',
          country: 'India',
          email: 'admin@testfirm.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      token = response.body.token;
    });
    
    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'admin@testfirm.com');
    });
    
    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
    
    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');
      
      expect(response.status).toBe(401);
    });
  });
});
