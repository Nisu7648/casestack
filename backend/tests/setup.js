// Test Setup for CaseStack Backend
// This file runs before all tests

const { PrismaClient } = require('@prisma/client');

// Test database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/casestack_test'
    }
  }
});

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Connect to test database
  await prisma.$connect();
  
  // Clean database before tests
  await cleanDatabase();
  
  console.log('✅ Test environment ready');
});

// Clean database after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  await cleanDatabase();
  await prisma.$disconnect();
  
  console.log('✅ Test environment cleaned');
});

// Helper function to clean database
async function cleanDatabase() {
  const tables = [
    'activity_logs',
    'documents',
    'cases',
    'clients',
    'users',
    'firms'
  ];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      console.warn(`Warning: Could not truncate ${table}:`, error.message);
    }
  }
}

// Export test utilities
module.exports = {
  prisma,
  cleanDatabase
};
