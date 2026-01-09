const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const os = require('os');

const prisma = new PrismaClient();

// ============================================
// HEALTH CHECK & MONITORING ENDPOINTS
// ============================================

// Basic health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const checks = {
      database: false,
      memory: false,
      disk: false
    };

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    checks.memory = memUsagePercent < 90; // Healthy if < 90% used

    // Disk check (basic)
    checks.disk = true; // Would need additional library for real disk check

    const isHealthy = Object.values(checks).every(check => check === true);

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
          systemTotal: Math.round(totalMem / 1024 / 1024) + ' MB',
          systemFree: Math.round(freeMem / 1024 / 1024) + ' MB',
          usagePercent: Math.round(memUsagePercent) + '%'
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown'
        },
        platform: os.platform(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    // Check if app is ready to serve traffic
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    // Get database statistics
    const [
      totalCases,
      totalClients,
      totalUsers,
      totalFiles,
      finalizedCases,
      draftCases
    ] = await Promise.all([
      prisma.case.count(),
      prisma.client.count(),
      prisma.user.count(),
      prisma.caseFile.count(),
      prisma.case.count({ where: { status: 'FINALIZED' } }),
      prisma.case.count({ where: { status: 'DRAFT' } })
    ]);

    // Memory metrics
    const memUsage = process.memoryUsage();

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        totalCases,
        totalClients,
        totalUsers,
        totalFiles,
        finalizedCases,
        draftCases
      },
      system: {
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: os.loadavg()
      }
    });
  } catch (error) {
    logger.error('Metrics error', { error: error.message });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Version info
router.get('/version', (req, res) => {
  res.json({
    name: 'CASESTACK',
    version: '1.0.0',
    description: 'Finalization & Defensibility System',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
