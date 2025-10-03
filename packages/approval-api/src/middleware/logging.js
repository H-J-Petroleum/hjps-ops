/**
 * Logging Middleware
 * Request logging and ID generation for the approval API service
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loggingMiddleware = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();

  // Log request
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body) {
    logger.info('Response sent', {
      requestId: req.id,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      timestamp: new Date().toISOString()
    });
    return originalJson.call(this, body);
  };

  // Set start time for response time calculation
  req.startTime = Date.now();

  next();
};

module.exports = loggingMiddleware;
