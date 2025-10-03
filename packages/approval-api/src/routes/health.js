/**
 * Health Check Routes
 * Health monitoring endpoints for the approval API service
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * Basic health check
 * GET /health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'approval-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'approval-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'not_implemented',
        hubspot: 'not_implemented',
        pdf_generator: 'not_implemented'
      }
    };

    // TODO: Add actual health checks for:
    // - HubSpot API connectivity
    // - PDF Generator service connectivity
    // - Database connectivity (if applicable)

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'approval-api',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Readiness check
 * GET /health/ready
 */
router.get('/ready', (req, res) => {
  // TODO: Add readiness checks for:
  // - All required services are available
  // - Configuration is loaded
  // - Dependencies are initialized

  res.json({
    status: 'ready',
    service: 'approval-api',
    timestamp: new Date().toISOString()
  });
});

/**
 * Liveness check
 * GET /health/live
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    service: 'approval-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
