/**
 * URL Resolver Service
 * Converts PowerShell resolve-approval-context.ps1 to Node.js
 * Parses approval URLs and extracts context information
 */

const logger = require('../utils/logger');
const { URL } = require('url');

class UrlResolverService {
  constructor() {
    this.logger = logger;
  }

  /**
   * Resolve approval context from URL or manual inputs
   * @param {Object} options - Resolution options
   * @param {string} options.approvalUrl - Approval URL to parse
   * @param {string} options.approvalObjectId - Manual approval object ID
   * @param {string} options.approvalRequestId - Manual approval request ID
   * @param {string} options.projectId - Manual project ID
   * @param {string} options.consultantId - Manual consultant ID
   * @param {string} options.customerEmail - Manual customer email
   * @param {Object} options.existingContext - Existing context to seed from
   * @returns {Object} Resolved context object
   */
  async resolveContext(options = {}) {
    const {
      approvalUrl,
      approvalObjectId,
      approvalRequestId,
      projectId,
      consultantId,
      customerEmail,
      existingContext = null
    } = options;

    this.logger.info('Resolving approval context', {
      approvalUrl: !!approvalUrl,
      approvalObjectId: !!approvalObjectId,
      approvalRequestId: !!approvalRequestId,
      projectId: !!projectId,
      consultantId: !!consultantId,
      customerEmail: !!customerEmail,
      hasExistingContext: !!existingContext
    });

    // Initialize context with default values
    const context = {
      approvalUrl: null,
      approvalObjectId: null,
      approvalRequestId: null,
      projectId: null,
      projectName: null,
      approvalCustomer: null,
      customerCompanyId: null,
      operatorName: null,
      approverIs: null,
      salesDealId: null,
      dealOwnerEmail: null,
      consultantId: null,
      consultantIdEncrypted: null,
      consultantName: null,
      consultantEmail: null,
      contactOwnerId: null,
      quoteCustomerPrimaryContactId: null,
      responseTimesheetIds: null,
      approvalTimesheetIds: null,
      responseFromDate: null,
      responseUntilDate: null,
      customerEmail: null,
      sourceNotes: []
    };

    // Seed context with existing values if provided
    if (existingContext) {
      this.logger.info('Seeding context with existing values');
      Object.keys(context).forEach(key => {
        if (existingContext[key] && !context[key]) {
          context[key] = existingContext[key];
          this.logger.debug(`Seeded ${key} with ${existingContext[key]}`);
        }
      });
    }

    // Parse approval URL if provided
    if (approvalUrl) {
      try {
        await this.parseApprovalUrl(approvalUrl, context);
      } catch (error) {
        this.logger.error('Failed to parse approval URL', {
          error: error.message,
          approvalUrl
        });
        throw new Error(`Invalid approval URL supplied: ${error.message}`);
      }
    }

    // Set manual values if provided
    this.setContextField(context, 'approvalObjectId', approvalObjectId);
    this.setContextField(context, 'approvalRequestId', approvalRequestId);
    this.setContextField(context, 'projectId', projectId);
    this.setContextField(context, 'consultantId', consultantId);
    this.setContextField(context, 'customerEmail', customerEmail);

    // Log final context
    this.logger.info('Resolved context', {
      context: Object.keys(context).reduce((acc, key) => {
        acc[key] = context[key] || '<null>';
        return acc;
      }, {})
    });

    return context;
  }

  /**
   * Parse approval URL and extract context information
   * @param {string} approvalUrl - The approval URL to parse
   * @param {Object} context - Context object to populate
   */
  async parseApprovalUrl(approvalUrl, context) {
    this.logger.info('Parsing approval URL', { approvalUrl });

    try {
      const url = new URL(approvalUrl);
      context.approvalUrl = approvalUrl;

      // Parse query parameters
      const queryValues = {};
      if (url.search) {
        const searchParams = new URLSearchParams(url.search);
        for (const [key, value] of searchParams) {
          queryValues[key] = decodeURIComponent(value);
        }
      }

      this.logger.debug('Parsed query parameters', { queryValues });

      // Set context values from URL parameters
      this.setContextField(context, 'projectId', queryValues.project_id);
      this.setContextField(context, 'approvalRequestId', queryValues.approval_request_id);
      this.setContextField(context, 'customerEmail', queryValues.customer_email);
      this.setContextField(context, 'salesDealId', queryValues.sales_deal_id);
      this.setContextField(context, 'approverIs', queryValues.approver_is);

      // Handle consultant ID with decryption logic
      const consultantValue = queryValues.consultant_id;
      if (consultantValue) {
        if (/^\d+$/.test(consultantValue)) {
          context.consultantIdEncrypted = consultantValue;
          const numeric = parseInt(consultantValue, 10);
          const offset = 3522;

          if (numeric > offset) {
            const decrypted = numeric - offset;
            context.consultantId = decrypted.toString();
            context.sourceNotes.push(`Consultant ID decrypted from URL by subtracting offset ${offset}.`);
            this.logger.debug('Decrypted consultant ID', {
              encrypted: consultantValue,
              decrypted: context.consultantId,
              offset
            });
          } else {
            context.consultantId = consultantValue;
            this.logger.debug('Using consultant ID as-is', { consultantId: consultantValue });
          }
        } else {
          context.consultantId = consultantValue;
          this.logger.debug('Using consultant ID as-is (non-numeric)', { consultantId: consultantValue });
        }
      }

      this.logger.info('Successfully parsed approval URL', {
        projectId: context.projectId,
        approvalRequestId: context.approvalRequestId,
        consultantId: context.consultantId,
        customerEmail: context.customerEmail
      });

    } catch (error) {
      this.logger.error('Failed to parse approval URL', {
        error: error.message,
        approvalUrl
      });
      throw error;
    }
  }

  /**
   * Set context field with validation and logging
   * @param {Object} context - Context object
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  setContextField(context, field, value) {
    this.logger.debug('Setting context field', {
      field,
      value,
      currentValue: context[field]
    });

    if (!Object.prototype.hasOwnProperty.call(context, field)) {
      context[field] = null;
      this.logger.debug(`Added field ${field} with null value`);
    }

    if (!context[field] && value) {
      context[field] = value;
      this.logger.debug(`Set ${field} to ${value}`);
    } else {
      this.logger.debug(`Skipped setting ${field} (current: ${context[field]}, new: ${value})`);
    }
  }

  /**
   * Validate context for required fields
   * @param {Object} context - Context object to validate
   * @returns {Object} Validation result
   */
  validateContext(context) {
    const requiredFields = ['approvalRequestId'];
    const missingFields = requiredFields.filter(field => !context[field]);

    const validation = {
      isValid: missingFields.length === 0,
      missingFields,
      warnings: []
    };

    // Add warnings for optional but important fields
    if (!context.projectId) {
      validation.warnings.push('Project ID not found - may affect data retrieval');
    }
    if (!context.consultantId) {
      validation.warnings.push('Consultant ID not found - may affect timesheet processing');
    }
    if (!context.customerEmail) {
      validation.warnings.push('Customer email not found - may affect notifications');
    }

    this.logger.info('Context validation result', validation);
    return validation;
  }

  /**
   * Extract object ID from HubSpot URL
   * @param {string} url - HubSpot URL
   * @returns {string|null} Object ID or null if not found
   */
  extractObjectIdFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Look for object ID in the path (usually the last numeric part)
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(pathParts[i])) {
          return pathParts[i];
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to extract object ID from URL', {
        error: error.message,
        url
      });
      return null;
    }
  }
}

module.exports = UrlResolverService;
