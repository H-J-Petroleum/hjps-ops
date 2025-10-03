/**
 * HubSpot Client for Custom Code
 * Simplified CommonJS client inspired by @hjps/toolkit-hubspot patterns
 * Designed for HubSpot workflow custom code environment
 */

const axios = require('axios');

const DEFAULT_OBJECT_IDS = {
  production: {
    HJ_APPROVAL_OBJECT_ID: '2-26103010',
    HJ_PROJECT_OBJECT_ID: '2-26102958',
    HJ_TIMESHEET_OBJECT_ID: '2-26173281',
  },
  sandbox: {
    HJ_APPROVAL_OBJECT_ID: '2-43857574',
    HJ_PROJECT_OBJECT_ID: '2-43857563',
    HJ_TIMESHEET_OBJECT_ID: '2-43857566',
  },
  betaSandbox: {
    HJ_APPROVAL_OBJECT_ID: '2-50490319',
    HJ_PROJECT_OBJECT_ID: '2-50490320',
    HJ_TIMESHEET_OBJECT_ID: '2-50490321',
  },
};

function normaliseEnvKey(value) {
  if (!value) return null;

  const lower = String(value).toLowerCase();
  if (lower === 'production' || lower === 'prod') return 'production';
  if (lower === 'sandbox' || lower === 'standard_sandbox') return 'sandbox';
  if (lower === 'beta' || lower === 'beta_sandbox' || lower === 'betasandbox') return 'betaSandbox';

  return value;
}

function resolveDefaultIds() {
  const envHint = normaliseEnvKey(process.env.HUBSPOT_ENV);
  if (envHint && DEFAULT_OBJECT_IDS[envHint]) {
    return DEFAULT_OBJECT_IDS[envHint];
  }

  if (!process.env.HJ_APPROVAL_OBJECT_ID) {
    if (process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN) return DEFAULT_OBJECT_IDS.betaSandbox;
    if (process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN) return DEFAULT_OBJECT_IDS.sandbox;
  }

  return DEFAULT_OBJECT_IDS.production;
}

class HubSpotClient {
  constructor(options = {}) {
    this.token = options.token;
    this.logger = options.logger || console;
    this.timeout = options.timeout || 15000;

    // Resolve object IDs
    const defaultIds = resolveDefaultIds();
    this.objectIds = {
      approval: process.env.HJ_APPROVAL_OBJECT_ID || defaultIds.HJ_APPROVAL_OBJECT_ID,
      project: process.env.HJ_PROJECT_OBJECT_ID || defaultIds.HJ_PROJECT_OBJECT_ID,
      timesheet: process.env.HJ_TIMESHEET_OBJECT_ID || defaultIds.HJ_TIMESHEET_OBJECT_ID,
    };

    if (!this.token) {
      throw new Error('PRIVATE_APP_TOKEN is required');
    }

    // Create axios client
    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });
  }

  /**
   * Get approval object by ID
   * @param {string} approvalId - Approval object ID
   * @param {Array<string>} properties - Properties to fetch
   * @returns {Promise<Object>} Approval object
   */
  async getApproval(approvalId, properties = []) {
    this.logger.debug('Fetching approval', { approvalId });

    const response = await this.client.get(
      `/crm/v3/objects/${this.objectIds.approval}/${approvalId}`,
      {
        params: {
          properties: properties.length > 0 ? properties.join(',') : undefined,
        },
      }
    );

    return response.data;
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @param {Array<string>} properties - Properties to fetch
   * @returns {Promise<Object|null>} Contact object or null
   */
  async getContact(contactId, properties = []) {
    if (!contactId) return null;

    this.logger.debug('Fetching contact', { contactId });

    const response = await this.client.get(`/crm/v3/objects/contacts/${contactId}`, {
      params: {
        properties: properties.length > 0 ? properties.join(',') : undefined,
      },
    });

    return response.data;
  }

  /**
   * Search for project by project ID
   * @param {string} projectId - Project ID value
   * @param {Array<string>} properties - Properties to fetch
   * @returns {Promise<Object|null>} Project object or null
   */
  async searchProjectById(projectId, properties = []) {
    if (!projectId) return null;

    this.logger.debug('Searching for project', { projectId });

    const body = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'hj_project_id',
              operator: 'EQ',
              value: projectId,
            },
          ],
        },
      ],
      properties: properties.length > 0 ? properties : undefined,
      limit: 1,
    };

    const response = await this.client.post(
      `/crm/v3/objects/${this.objectIds.project}/search`,
      body
    );

    return response.data.results?.[0] || null;
  }

  /**
   * Get timesheets by batch read
   * @param {Array<string>} timesheetIds - Timesheet IDs
   * @param {Array<string>} properties - Properties to fetch
   * @returns {Promise<Array>} Timesheet objects
   */
  async getTimesheetsBatch(timesheetIds, properties = []) {
    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return [];
    }

    this.logger.debug('Fetching timesheets batch', {
      count: timesheetIds.length
    });

    const inputs = timesheetIds.map((id) => ({ id }));
    const body = {
      properties: properties.length > 0 ? properties : undefined,
      inputs,
    };

    const response = await this.client.post(
      `/crm/v3/objects/${this.objectIds.timesheet}/batch/read`,
      body
    );

    return response.data.results || [];
  }

  /**
   * Update approval object
   * @param {string} approvalId - Approval object ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated approval object
   */
  async updateApproval(approvalId, properties) {
    this.logger.debug('Updating approval', { approvalId });

    const response = await this.client.patch(
      `/crm/v3/objects/${this.objectIds.approval}/${approvalId}`,
      { properties }
    );

    return response.data;
  }

  /**
   * Update multiple timesheets
   * @param {Array<Object>} updates - Array of {id, properties} objects
   * @returns {Promise<Object>} Batch update response
   */
  async updateTimesheetsBatch(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return { results: [] };
    }

    this.logger.debug('Updating timesheets batch', {
      count: updates.length
    });

    const inputs = updates.map((update) => ({
      id: update.id,
      properties: update.properties,
    }));

    const response = await this.client.post(
      `/crm/v3/objects/${this.objectIds.timesheet}/batch/update`,
      { inputs }
    );

    return response.data;
  }

  /**
   * Create association between objects
   * @param {string} fromObjectType - Source object type
   * @param {string} fromObjectId - Source object ID
   * @param {string} toObjectType - Target object type
   * @param {string} toObjectId - Target object ID
   * @param {string} associationType - Association type ID
   * @returns {Promise<Object>} Association response
   */
  async createAssociation(fromObjectType, fromObjectId, toObjectType, toObjectId, associationType) {
    this.logger.debug('Creating association', {
      fromObjectType,
      fromObjectId,
      toObjectType,
      toObjectId,
      associationType
    });

    const response = await this.client.put(
      `/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/default/${toObjectType}/${toObjectId}`,
      [{
        associationCategory: 'HUBSPOT_DEFINED',
        associationTypeId: associationType
      }]
    );

    return response.data;
  }
}

module.exports = { HubSpotClient };
