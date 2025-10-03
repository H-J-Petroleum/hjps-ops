/**
 * Enhanced Error Handler
 * Centralized error handling and recovery for PDF Generator
 */

const logger = require('../utils/logger');

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.lastErrorTime = new Map();
  }

  /**
   * Handle PDF generation errors
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {Object} Error response
   */
  handleGenerationError(error, context = {}) {
    const errorId = this.generateErrorId();
    const errorType = this.categorizeError(error);

    // Log error with context
    logger.error('PDF generation error', {
      errorId,
      errorType,
      message: error.message,
      stack: error.stack,
      context
    });

    // Track error frequency
    this.trackError(errorType, context);

    // Generate user-friendly error response
    const response = this.generateErrorResponse(error, errorType, errorId);

    // Check if we should trigger alerts
    if (this.shouldTriggerAlert(errorType)) {
      this.triggerAlert(error, context, errorId);
    }

    return response;
  }

  /**
   * Handle service errors
   * @param {Error} error - Error object
   * @param {string} serviceName - Service name
   * @param {Object} context - Error context
   * @returns {Object} Error response
   */
  handleServiceError(error, serviceName, context = {}) {
    const errorId = this.generateErrorId();
    const errorType = this.categorizeError(error);

    logger.error('Service error', {
      errorId,
      serviceName,
      errorType,
      message: error.message,
      stack: error.stack,
      context
    });

    this.trackError(`${serviceName}:${errorType}`, context);

    return this.generateErrorResponse(error, errorType, errorId);
  }

  /**
   * Handle validation errors
   * @param {Array} validationErrors - Array of validation errors
   * @param {Object} context - Error context
   * @returns {Object} Error response
   */
  handleValidationError(validationErrors, context = {}) {
    const errorId = this.generateErrorId();

    logger.warn('Validation error', {
      errorId,
      errors: validationErrors,
      context
    });

    return {
      success: false,
      error: 'Validation failed',
      errorId,
      details: validationErrors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Categorize error type
   * @param {Error} error - Error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'AuthenticationError') return 'authentication';
    if (error.name === 'AuthorizationError') return 'authorization';
    if (error.name === 'NetworkError') return 'network';
    if (error.name === 'TimeoutError') return 'timeout';
    if (error.message.includes('not found')) return 'not_found';
    if (error.message.includes('unauthorized')) return 'unauthorized';
    if (error.message.includes('forbidden')) return 'forbidden';
    if (error.message.includes('timeout')) return 'timeout';
    if (error.message.includes('network')) return 'network';
    if (error.message.includes('validation')) return 'validation';
    if (error.message.includes('PDF')) return 'pdf_generation';
    if (error.message.includes('template')) return 'template';
    if (error.message.includes('signature')) return 'signature';
    if (error.message.includes('logo')) return 'logo';

    return 'unknown';
  }

  /**
   * Generate error response
   * @param {Error} error - Error object
   * @param {string} errorType - Error type
   * @param {string} errorId - Error ID
   * @returns {Object} Error response
   */
  generateErrorResponse(error, errorType, errorId) {
    const baseResponse = {
      success: false,
      errorId,
      timestamp: new Date().toISOString(),
      type: errorType
    };

    // Generate user-friendly error messages
    switch (errorType) {
    case 'validation':
      return {
        ...baseResponse,
        error: 'Invalid request data',
        message: 'Please check your request parameters and try again',
        details: error.message
      };

    case 'authentication':
      return {
        ...baseResponse,
        error: 'Authentication failed',
        message: 'Invalid or missing API credentials',
        details: 'Please check your HubSpot API token'
      };

    case 'authorization':
      return {
        ...baseResponse,
        error: 'Access denied',
        message: 'Insufficient permissions for this operation',
        details: 'Please check your HubSpot API permissions'
      };

    case 'not_found':
      return {
        ...baseResponse,
        error: 'Resource not found',
        message: 'The requested resource could not be found',
        details: error.message
      };

    case 'network':
      return {
        ...baseResponse,
        error: 'Network error',
        message: 'Unable to connect to external services',
        details: 'Please try again later'
      };

    case 'timeout':
      return {
        ...baseResponse,
        error: 'Request timeout',
        message: 'The request took too long to complete',
        details: 'Please try again with a smaller dataset'
      };

    case 'pdf_generation':
      return {
        ...baseResponse,
        error: 'PDF generation failed',
        message: 'Unable to generate PDF document',
        details: 'Please check your data and try again'
      };

    case 'template':
      return {
        ...baseResponse,
        error: 'Template error',
        message: 'PDF template processing failed',
        details: 'Please contact support if this persists'
      };

    case 'signature':
      return {
        ...baseResponse,
        error: 'Signature processing failed',
        message: 'Unable to process signature data',
        details: 'Please check your signature format'
      };

    case 'logo':
      return {
        ...baseResponse,
        error: 'Logo processing failed',
        message: 'Unable to process logo data',
        details: 'Please check your logo format'
      };

    default:
      return {
        ...baseResponse,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please contact support'
      };
    }
  }

  /**
   * Track error frequency
   * @param {string} errorType - Error type
   * @param {Object} context - Error context
   */
  trackError(errorType, context) {
    const key = `${errorType}:${context.pdfType || 'unknown'}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
    this.lastErrorTime.set(key, Date.now());
  }

  /**
   * Check if we should trigger alerts
   * @param {string} errorType - Error type
   * @returns {boolean} True if should trigger alert
   */
  shouldTriggerAlert(errorType) {
    const key = `${errorType}:unknown`;
    const count = this.errorCounts.get(key) || 0;
    const lastError = this.lastErrorTime.get(key) || 0;
    const timeSinceLastError = Date.now() - lastError;

    // Alert if more than 10 errors in the last hour
    return count > 10 && timeSinceLastError < 3600000;
  }

  /**
   * Trigger alert for critical errors
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @param {string} errorId - Error ID
   */
  triggerAlert(error, context, errorId) {
    logger.error('ALERT: High error frequency detected', {
      errorId,
      errorType: this.categorizeError(error),
      errorCount: this.errorCounts.get(`${this.categorizeError(error)}:${context.pdfType || 'unknown'}`),
      context
    });

    // In a real implementation, this would send alerts to monitoring systems
    // For now, we just log the alert
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {};
    for (const [key, count] of this.errorCounts) {
      const [errorType, pdfType] = key.split(':');
      if (!stats[errorType]) {
        stats[errorType] = {};
      }
      stats[errorType][pdfType] = count;
    }
    return stats;
  }

  /**
   * Reset error tracking
   */
  resetErrorTracking() {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
    logger.info('Error tracking reset');
  }

  /**
   * Handle retry logic
   * @param {Function} operation - Operation to retry
   * @param {Object} context - Operation context
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} Operation result
   */
  async handleRetry(operation, context = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorType = this.categorizeError(error);

        // Don't retry certain error types
        if (['validation', 'authentication', 'authorization', 'not_found'].includes(errorType)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn('Retrying operation', {
            attempt,
            maxRetries,
            delay,
            errorType,
            context
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    logger.error('Operation failed after all retries', {
      maxRetries,
      context,
      lastError: lastError.message
    });
    throw lastError;
  }
}

module.exports = ErrorHandler;
