/**
 * HubSpot Client Wrapper
 * Uses @hjps/toolkit-hubspot for all HubSpot interactions
 *
 * This wrapper provides backward compatibility while leveraging
 * the shared toolkit client for consistency across repositories.
 */

const { HubSpotClient: ToolkitClient } = require('@hjps/toolkit-hubspot');
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');
const logger = require('../../utils/logger');

class HubSpotClient {
  constructor(options = {}) {
    this.logger = options.logger || logger;

    // Initialize toolkit client
    this.client = new ToolkitClient({
      environment: options.environment || process.env.HUBSPOT_ENV || 'production',
      token: options.token || process.env.PRIVATE_APP_TOKEN || process.env.BEARER_TOKEN,
      logger: this.logger,
      retry: {
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    });

    this.config = this.client.config;
  }

  /**
   * Validate environment configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateEnvironment() {
    const env = process.env.HUBSPOT_ENV || 'production';
    const validation = await validateEnvironment(env);

    if (!validation.valid) {
      this.logger.error('Environment validation failed', {
        environment: env,
        errors: validation.errors
      });
      throw new Error(`Invalid HubSpot environment: ${validation.errors.join(', ')}`);
    }

    this.logger.info('Environment validated successfully', {
      environment: env,
      portalId: validation.config.portalId
    });

    return validation;
  }

  /**
   * Get approval object by ID or approval_request_id
   * @param {string} approvalIdentifier - HubSpot ID or approval_request_id
   * @returns {Promise<Object|null>} Approval object or null
   */
  async getApprovalObject(approvalIdentifier) {
    const properties = [
      'approval_request_id',
      'approval_project_id',
      'project_name',
      'approval_customer',
      'approval_operator',
      'approval_wells',
      'approval_consultant_name',
      'approval_consultant_id',
      'approval_consultant_email',
      'approval_approver_name',
      'approval_approver_email',
      'approval_approver_is_',
      'approval_from_date',
      'approval_until_date',
      'approval_approval_from',
      'approval_approval_until',
      'approval_hj_task_id',
      'approval_timesheet_ids_array',
      'response_approval_timesheet_ids_array',
      'quote_customer_primary_contact_id',
      'response_approval_sales_deal_id',
      'signature_new',
      'consultant_timesheet_approval_url',
      'response_approval_from_date',
      'response_approval_until_date'
    ];

    try {
      // Try direct ID lookup first
      return await this.client.getObject('approval', approvalIdentifier, {
        properties,
        fallbackSearch: {
          propertyName: 'approval_request_id',
          value: approvalIdentifier
        }
      });
    } catch (error) {
      this.logger.warn('Approval object not found', {
        approvalIdentifier,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get timesheets by IDs
   * @param {string|Array<string>} timesheetIds - Timesheet ID(s)
   * @returns {Promise<Array>} Array of timesheet objects
   */
  async getTimesheets(timesheetIds) {
    const ids = Array.isArray(timesheetIds) ? timesheetIds : [timesheetIds];

    const properties = [
      'timesheet_project_name',
      'timesheet_customer',
      'timesheet_operator',
      'timesheet_consultant_id',
      'timesheet_consultant_email',
      'timesheet_consultant_full_name',
      'timesheet_well',
      'timesheet_role',
      'timesheet_job_service',
      'timesheet_billing_frequency',
      'timesheet_hj_price',
      'timesheet_price',
      'timesheet_quantity',
      'timesheet_hj_total_price',
      'timesheet_total_price',
      'timesheet_start_date',
      'timesheet_end_date',
      'timesheet_start_time',
      'timesheet_end_time',
      'timesheet_ordinal_number',
      'timesheet_payment_deal_id',
      'timesheet_project_id',
      'timesheet_approval_request_id',
      'invoice_number_second_part'
    ];

    try {
      const results = await this.client.getObjectBatch('timesheet', ids, {
        properties,
        continueOnError: true
      });

      this.logger.debug('Retrieved timesheets', {
        requested: ids.length,
        returned: results.length
      });

      return results.filter(r => !r.error);
    } catch (error) {
      this.logger.error('Failed to retrieve timesheets', {
        error: error.message,
        timesheetIds: ids
      });
      throw error;
    }
  }

  /**
   * Find timesheets by approval request ID
   * @param {string} approvalRequestId - Approval request ID
   * @returns {Promise<Array<string>>} Array of timesheet IDs
   */
  async findTimesheetsByApprovalRequestId(approvalRequestId) {
    if (!approvalRequestId) {
      return [];
    }

    this.logger.info('Searching timesheets by approval request ID', { approvalRequestId });

    try {
      const results = await this.client.search('timesheet', {
        filterGroups: [{
          filters: [{
            propertyName: 'timesheet_approval_request_id',
            operator: 'EQ',
            value: approvalRequestId
          }]
        }],
        properties: ['hs_object_id'],
        limit: 100
      });

      const ids = results.results?.map(r => r.id) || [];

      this.logger.info('Timesheets discovered via search', {
        approvalRequestId,
        timesheetCount: ids.length
      });

      return ids;
    } catch (error) {
      this.logger.error('Timesheet search failed', {
        error: error.message,
        approvalRequestId
      });
      return [];
    }
  }

  /**
   * Get project by ID with fallback logic
   * @param {string} projectId - Project ID
   * @returns {Promise<Object|null>} Project object or null
   */
  async getProject(projectId) {
    if (!projectId) {
      return null;
    }

    const properties = [
      'hj_project_id',
      'hj_project_name',
      'hj_project_is_locked',
      'hj_class',
      'hj_terms',
      'hj_taxable',
      'hj_customer',
      'hj_customer_id',
      'hj_operator',
      'hj_operator_id',
      'hj_primary_contact_id',
      'hj_primary_contact_email',
      'hj_primary_contact_name',
      'hj_approver_id',
      'hj_approver_email',
      'hj_approver_name',
      'hj_approver_is',
      'hj_sales_deal_owner_contact_id',
      'hj_sales_deal_owner_email',
      'hj_sales_deal_owner_name',
      'hj_sales_deal_record_id'
    ];

    try {
      return await this.client.getObject('project', projectId, {
        properties,
        fallbackSearch: {
          propertyName: 'hj_project_id',
          value: projectId
        }
      });
    } catch (error) {
      this.logger.warn('Project lookup failed', {
        projectId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object|null>} Contact object or null
   */
  async getContact(contactId) {
    if (!contactId) {
      return null;
    }

    try {
      return await this.client.getObject('contact', contactId, {
        properties: ['email', 'firstname', 'lastname', 'company', 'phone']
      });
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn('Contact not found', { contactId });
        return null;
      }
      throw error;
    }
  }

  /**
   * Get deal by ID
   * @param {string} dealId - Deal ID
   * @returns {Promise<Object|null>} Deal object or null
   */
  async getDeal(dealId) {
    if (!dealId) {
      return null;
    }

    try {
      return await this.client.getObject('deal', dealId, {
        properties: ['dealname', 'amount', 'dealstage', 'closedate', 'owner'],
        associations: ['contacts']
      });
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn('Deal not found', { dealId });
        return null;
      }
      throw error;
    }
  }

  /**
   * Get company by ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object|null>} Company object or null
   */
  async getCompany(companyId) {
    if (!companyId) {
      return null;
    }

    try {
      return await this.client.getObject('company', companyId, {
        properties: ['name', 'domain', 'industry', 'phone']
      });
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn('Company not found', { companyId });
        return null;
      }
      throw error;
    }
  }

  /**
   * Update approval object properties
   * @param {string} approvalId - Approval object ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated approval object
   */
  async updateApprovalObject(approvalId, properties) {
    try {
      this.logger.info('Updating approval object', {
        approvalId,
        propertyCount: Object.keys(properties).length
      });

      const result = await this.client.updateObject('approval', approvalId, properties);

      this.logger.info('Updated approval object', {
        approvalId,
        properties: Object.keys(properties)
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update approval object', {
        error: error.message,
        approvalId,
        properties: Object.keys(properties)
      });
      throw error;
    }
  }

  /**
   * Update multiple timesheet objects
   * @param {Array} timesheetUpdates - Array of {id, properties} objects
   * @returns {Promise<Object>} Batch update result
   */
  async updateTimesheets(timesheetUpdates) {
    try {
      const results = await this.client.updateObjectBatch('timesheet', timesheetUpdates);

      this.logger.info('Updated timesheets', {
        count: timesheetUpdates.length,
        successful: results.filter(r => !r.error).length
      });

      return { results };
    } catch (error) {
      this.logger.error('Failed to update timesheets', {
        error: error.message,
        count: timesheetUpdates.length
      });
      throw error;
    }
  }

  /**
   * Create a note in HubSpot
   * @param {Object} noteData - Note data with properties and associations
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    try {
      const result = await this.client.createObject('note', noteData);

      this.logger.info('Created HubSpot note', {
        noteId: result.id,
        hasAssociations: Array.isArray(noteData.associations) && noteData.associations.length > 0
      });

      return result;
    } catch (error) {
      this.logger.error('Error creating HubSpot note', {
        status: error.response?.status,
        message: error.message
      });
      throw new Error(`Failed to create note: ${error.message}`);
    }
  }

  /**
   * Update contact properties
   * @param {string} contactId - Contact ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated contact
   */
  async updateContactProperties(contactId, properties) {
    try {
      this.logger.info('Updating contact properties', {
        contactId,
        propertyCount: Object.keys(properties).length
      });

      const result = await this.client.updateObject('contact', contactId, properties);

      this.logger.info('Updated contact properties', {
        contactId,
        properties: Object.keys(properties)
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update contact properties', {
        error: error.message,
        contactId,
        properties: Object.keys(properties)
      });
      throw error;
    }
  }

  /**
   * Search for objects
   * @param {string} objectType - Object type to search
   * @param {Object} searchRequest - Search request payload
   * @returns {Promise<Object>} Search results
   */
  async search(objectType, searchRequest) {
    return await this.client.search(objectType, searchRequest);
  }
}

module.exports = HubSpotClient;
