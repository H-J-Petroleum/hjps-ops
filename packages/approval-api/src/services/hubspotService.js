/**
 * HubSpot Service
 * Converts PowerShell pull-related-records.ps1 to Node.js
 * Handles all HubSpot API interactions for approval workflow
 */

const axios = require('axios');
const logger = require('../utils/logger');
const hubspotConfig = require('../config/hubspot');

class HubspotService {
  constructor() {
    this.logger = logger;
    this.config = hubspotConfig;
    this.baseURL = this.config.baseUrl;
    this.apiKey = this.config.apiKey;

    if (!this.apiKey) {
      throw new Error('HubSpot API key is required');
    }

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout.request
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('HubSpot API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data ? 'present' : 'none'
        });
        return config;
      },
      (error) => {
        this.logger.error('HubSpot API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('HubSpot API response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        this.logger.error('HubSpot API response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Pull related records based on context
   * @param {Object} context - Context object with approval information
   * @returns {Object} Enriched context with HubSpot data
   */
  async pullRelatedRecords(context) {
    this.logger.info('Pulling related records from HubSpot', {
      approvalRequestId: context.approvalRequestId,
      projectId: context.projectId,
      consultantId: context.consultantId
    });

    try {
      // Get approval object
      const approval = await this.getApprovalObject(context.approvalRequestId);
      if (approval) {
        context.approvalObjectId = approval.id;
        context.approval = approval;
        this.enrichContextFromApproval(context, approval);
      }

      // Fallback: discover timesheet IDs if not present on approval object
      const hasTimesheetIds = Array.isArray(context.approvalTimesheetIds) ? context.approvalTimesheetIds.length > 0 : !!context.approvalTimesheetIds;
      if (!hasTimesheetIds && context.approvalRequestId) {
        const discoveredTimesheets = await this.findTimesheetsByApprovalRequestId(context.approvalRequestId);
        if (discoveredTimesheets.length > 0) {
          context.approvalTimesheetIds = discoveredTimesheets;
          context.sourceNotes = context.sourceNotes || [];
          context.sourceNotes.push('Timesheet IDs discovered via approval request search');
          this.logger.info('Timesheet IDs populated via fallback search', {
            approvalRequestId: context.approvalRequestId,
            timesheetIds: discoveredTimesheets
          });
        }
      }

      // Get timesheets if available
      if (context.approvalTimesheetIds) {
        const timesheets = await this.getTimesheets(context.approvalTimesheetIds);
        context.timesheets = timesheets;
        this.enrichContextFromTimesheets(context, timesheets);
        this.logger.info('Retrieved timesheets', { count: timesheets.length });
      }

      // Get project information only if we still need additional context
      const needsProjectEnrichment = !context.approverEmail
        || !context.approverName
        || !context.approverType
        || !context.salesDealId;

      if (context.projectId && needsProjectEnrichment) {
        const project = await this.getProject(context.projectId);
        if (project) {
          this.enrichContextFromProject(context, project);
          context.project = project;
        }
      }

      // Get contact information
      if (context.contactId) {
        const contact = await this.getContact(context.contactId);
        if (contact) {
          this.enrichContextFromContact(context, contact);
          context.contact = contact;
        }
      }

      // Get deal information
      if (context.salesDealId) {
        const deal = await this.getDeal(context.salesDealId);
        if (deal) {
          this.enrichContextFromDeal(context, deal);
          context.deal = deal;

          const approverContactId = context.approverContactId || context.contactId;
          const needsApproverContact = approverContactId
            && (!context.approverEmail || !context.approverName);

          const contactAlreadyLoaded = context.contact?.id === approverContactId
            || context.approverContact?.id === approverContactId;

          if (needsApproverContact && !contactAlreadyLoaded) {
            const approverContact = await this.getContact(approverContactId);
            if (approverContact) {
              this.enrichContextFromContact(context, approverContact);
              context.approverContact = approverContact;
            }
          }
        }
      }

      // Get company information
      if (context.customerCompanyId) {
        const company = await this.getCompany(context.customerCompanyId);
        if (company) {
          this.enrichContextFromCompany(context, company);
          context.company = company;
        }
      }

      this.logger.info('Successfully pulled related records', {
        hasApproval: !!approval,
        hasTimesheets: !!context.timesheets,
        hasProject: !!context.project,
        hasContact: !!context.contactId,
        hasDeal: !!context.salesDealId,
        hasCompany: !!context.customerCompanyId
      });

      return context;

    } catch (error) {
      this.logger.error('Failed to pull related records', {
        error: error.message,
        context: {
          approvalRequestId: context.approvalRequestId,
          projectId: context.projectId
        }
      });
      throw error;
    }
  }

  /**
   * Get approval object by ID
   * @param {string} approvalId - Approval object ID
   * @returns {Object|null} Approval object or null if not found
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
    ].join(',');

    const basePath = `${this.config.endpoints.objects}/${this.config.objectTypes.approval}`;

    try {
      const response = await this.client.get(
        `${basePath}/${approvalIdentifier}`,
        { params: { properties } }
      );

      this.logger.debug('Retrieved approval object by HubSpot ID', {
        approvalId: approvalIdentifier,
        properties: Object.keys(response.data.properties || {})
      });

      return response.data;

    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }

      this.logger.warn('Approval object not found by HubSpot ID, attempting search by approval_request_id', {
        approvalIdentifier
      });

      try {
        const searchResponse = await this.client.post(
          `${basePath}/search`,
          {
            filterGroups: [{
              filters: [{
                propertyName: 'approval_request_id',
                operator: 'EQ',
                value: approvalIdentifier
              }]
            }],
            properties: properties.split(','),
            limit: 1
          }
        );

        const result = searchResponse.data.results?.[0];
        if (!result) {
          this.logger.warn('Approval object not found via search', {
            approvalRequestId: approvalIdentifier
          });
          return null;
        }

        this.logger.info('Approval object found via search', {
          approvalRequestId: approvalIdentifier,
          hubspotId: result.id
        });

        return result;

      } catch (searchError) {
        this.logger.error('Approval search failed', {
          approvalRequestId: approvalIdentifier,
          error: searchError.message
        });
        throw searchError;
      }
    }
  }

  /**
   * Get timesheets by IDs
   * @param {string|Array} timesheetIds - Timesheet ID(s)
   * @returns {Array} Array of timesheet objects
   */
  async getTimesheets(timesheetIds) {
    const ids = Array.isArray(timesheetIds) ? timesheetIds : [timesheetIds];

    try {
      // Request specific properties that we need
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
      ].join(',');

      // Use individual GET requests instead of batch read
      const timesheets = [];
      for (const id of ids) {
        try {
          const response = await this.client.get(
            `${this.config.endpoints.objects}/${this.config.objectTypes.timesheet}/${id}`,
            {
              params: {
                properties
              }
            }
          );
          timesheets.push(response.data);
        } catch (error) {
          this.logger.warn('Failed to retrieve individual timesheet', {
            timesheetId: id,
            error: error.message
          });
        }
      }

      this.logger.debug('Retrieved timesheets', {
        requested: ids.length,
        returned: timesheets.length
      });

      return timesheets;

    } catch (error) {
      this.logger.error('Failed to retrieve timesheets', {
        error: error.message,
        timesheetIds: ids
      });
      throw error;
    }
  }

  /**
   * Find timesheets by approval request ID using HubSpot search API
   * @param {string} approvalRequestId - Approval request ID
   * @returns {Promise<Array<string>>} Array of timesheet IDs
   */
  async findTimesheetsByApprovalRequestId(approvalRequestId) {
    if (!approvalRequestId) {
      return [];
    }

    this.logger.info('Searching timesheets by approval request ID', { approvalRequestId });

    try {
      const response = await this.client.post(
        `${this.config.endpoints.objects}/${this.config.objectTypes.timesheet}/search`,
        {
          filterGroups: [{
            filters: [{
              propertyName: 'timesheet_approval_request_id',
              operator: 'EQ',
              value: approvalRequestId
            }]
          }],
          properties: ['hs_object_id'],
          limit: 100
        }
      );

      const results = response.data?.results || [];
      if (results.length === 0) {
        this.logger.warn('No timesheets found by approval request ID', { approvalRequestId });
        return [];
      }

      const ids = results.map(result => result.id);
      this.logger.info('Timesheets discovered via approval request ID search', {
        approvalRequestId,
        timesheetCount: ids.length,
        timesheetIds: ids
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
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Object|null} Contact object or null if not found
   */
  async getContact(contactId) {
    try {
      const response = await this.client.get(
        `${this.config.endpoints.objects}/${this.config.objectTypes.contact}/${contactId}`,
        {
          params: {
            properties: 'email,firstname,lastname,company,phone'
          }
        }
      );

      this.logger.debug('Retrieved contact', { contactId });
      return response.data;

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
   * @returns {Object|null} Deal object or null if not found
   */
  async getDeal(dealId) {
    try {
      const response = await this.client.get(
        `${this.config.endpoints.objects}/${this.config.objectTypes.deal}/${dealId}`,
        {
          params: {
            properties: 'dealname,amount,dealstage,closedate,owner',
            associations: 'contacts'
          }
        }
      );

      this.logger.debug('Retrieved deal', { dealId });
      return response.data;

    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn('Deal not found', { dealId });
        return null;
      }
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Object|null} Project object or null if not found
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

    const baseUrl = `${this.config.endpoints.objects}/${this.config.objectTypes.project}`;
    const propertiesParam = properties.join(',');

    try {
      const response = await this.client.get(
        `${baseUrl}/${projectId}`,
        {
          params: {
            properties: propertiesParam
          }
        }
      );

      this.logger.debug('Retrieved project', { projectId, source: 'direct' });
      return response.data;

    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }

      const idProperties = ['hj_project_id', 'project_unique_id'];

      for (const idProperty of idProperties) {
        this.logger.warn('Project not found by HubSpot ID, attempting alternate lookup', {
          projectId,
          objectTypeId: this.config.objectTypes.project,
          idProperty
        });

        try {
          const altResponse = await this.client.get(
            `${baseUrl}/${encodeURIComponent(projectId)}`,
            {
              params: {
                properties: propertiesParam,
                idProperty
              }
            }
          );

          this.logger.info('Project retrieved via alternate idProperty', {
            projectId,
            hubspotId: altResponse.data?.id,
            idProperty
          });

          return altResponse.data;

        } catch (altError) {
          const status = altError.response?.status;
          const responseData = altError.response?.data;
          this.logger.warn(
            `Project lookup via ${idProperty} failed (status: ${status || 'unknown'}, projectId: ${projectId}, response: ${responseData ? JSON.stringify(responseData) : 'n/a'})`
          );
        }
      }

      const fallbackProject = await this.searchForProject(projectId, properties);
      if (fallbackProject) {
        return fallbackProject;
      }

      this.logger.warn('Project lookup failed after all fallbacks', {
        projectId,
        objectTypeId: this.config.objectTypes.project
      });
      return null;
    }
  }

  async searchForProject(projectId, properties) {
    const searchEndpoint = `${this.config.endpoints.objects}/${this.config.objectTypes.project}/search`;
    const candidateProperties = ['hj_project_id', 'project_unique_id'];

    if (/^\d+$/.test(projectId)) {
      candidateProperties.push('hj_project_record_id');
    }

    for (const propertyName of candidateProperties) {
      try {
        this.logger.info('Attempting project search fallback', {
          projectId,
          propertyName,
          objectTypeId: this.config.objectTypes.project
        });

        const response = await this.client.post(
          searchEndpoint,
          {
            filterGroups: [{
              filters: [{
                propertyName,
                operator: 'EQ',
                value: projectId
              }]
            }],
            properties,
            limit: 1
          }
        );

        const result = response.data?.results?.[0];
        if (result) {
          this.logger.info('Project retrieved via search fallback', {
            projectId,
            propertyName,
            hubspotId: result.id
          });
          return result;
        }

        this.logger.warn('Project search fallback returned no results', {
          projectId,
          propertyName
        });

      } catch (searchError) {
        const status = searchError.response?.status;
        const responseData = searchError.response?.data;
        this.logger.warn('Project search fallback failed', {
          projectId,
          propertyName,
          status,
          response: responseData ? JSON.stringify(responseData) : searchError.message
        });
      }
    }

    // Last resort: use generic query search if the properties aren't filterable
    try {
      this.logger.info('Attempting project query search fallback', {
        projectId,
        objectTypeId: this.config.objectTypes.project
      });

      const response = await this.client.post(
        searchEndpoint,
        {
          query: projectId,
          properties,
          limit: 1
        }
      );

      const result = response.data?.results?.[0];
      if (result) {
        this.logger.info('Project retrieved via query search fallback', {
          projectId,
          hubspotId: result.id
        });
        return result;
      }

      this.logger.warn('Project query search fallback returned no results', {
        projectId
      });

    } catch (queryError) {
      const status = queryError.response?.status;
      const responseData = queryError.response?.data;
      this.logger.warn('Project query search fallback failed', {
        projectId,
        status,
        response: responseData ? JSON.stringify(responseData) : queryError.message
      });
    }

    return null;
  }

  /**
   * Get company by ID
   * @param {string} companyId - Company ID
   * @returns {Object|null} Company object or null if not found
   */
  async getCompany(companyId) {
    try {
      const response = await this.client.get(
        `${this.config.endpoints.objects}/${this.config.objectTypes.company}/${companyId}`,
        {
          params: {
            properties: 'name,domain,industry,phone'
          }
        }
      );

      this.logger.debug('Retrieved company', { companyId });
      return response.data;

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
   * @returns {Object} Updated approval object
   */
  async updateApprovalObject(approvalId, properties) {
    try {
      this.logger.info('Updating approval object', {
        approvalId,
        configEndpoints: this.config.endpoints,
        configObjectTypes: this.config.objectTypes
      });

      const response = await this.client.patch(
        `${this.config.endpoints.objects}/${this.config.objectTypes.approval}/${approvalId}`,
        {
          properties: this.mapPropertiesToHubSpot(properties)
        }
      );

      this.logger.info('Updated approval object', {
        approvalId,
        properties: Object.keys(properties)
      });

      return response.data;

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
   * Update timesheet objects
   * @param {Array} timesheetUpdates - Array of timesheet updates
   * @returns {Object} Batch update result
   */
  async updateTimesheets(timesheetUpdates) {
    try {
      // Use individual PATCH requests instead of batch update
      const results = [];
      for (const update of timesheetUpdates) {
        try {
          const response = await this.client.patch(
            `${this.config.endpoints.objects}/${this.config.objectTypes.timesheet}/${update.id}`,
            {
              properties: this.mapPropertiesToHubSpot(update.properties)
            }
          );
          results.push(response.data);
        } catch (error) {
          this.logger.warn('Failed to update individual timesheet', {
            timesheetId: update.id,
            error: error.message
          });
        }
      }

      this.logger.info('Updated timesheets', {
        count: timesheetUpdates.length,
        results: results.length
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
   * Enrich context with approval object data
   * @param {Object} context - Context object
   * @param {Object} approval - Approval object from HubSpot
   */
  enrichContextFromApproval(context, approval) {
    const props = approval.properties || {};

    this.logger.debug('Enriching context from approval', {
      approvalId: approval.id,
      availableProperties: Object.keys(props),
      hasTimesheetIds: !!props.response_approval_timesheet_ids_array
    });

    // Map approval properties to context (hardcoded mapping since config doesn't have properties.approval)
    const propertyMappings = {
      'approval_request_id': ['approvalRequestId'],
      'approval_project_id': ['projectId'],
      'project_name': ['projectName'],
      'approval_customer': ['customerCompanyName'],
      'approval_operator': ['operatorName'],
      'approval_consultant_name': ['consultantName'],
      'approval_consultant_id': ['consultantId'],
      'approval_consultant_email': ['consultantEmail'],
      'approval_approver_email': ['approverEmail'],
      'approval_approver_name': ['approverName'],
      'approval_approver_is_': ['approverType'],
      'approval_sales_deal_id': ['salesDealId'],
      'approval_timesheet_ids_array': ['approvalTimesheetIds'],
      'response_approval_timesheet_ids_array': ['approvalTimesheetIds'],
      'approval_wells': ['wellNames'],
      'approval_approval_from': ['responseFromDate', 'approvalFromDate'],
      'approval_approval_until': ['responseUntilDate', 'approvalUntilDate'],
      'quote_customer_primary_contact_id': ['contactId', 'quoteCustomerPrimaryContactId'],
      'signature_new': ['signature'],
      'consultant_timesheet_approval_url': ['consultantApprovalUrl']
    };

    Object.entries(propertyMappings).forEach(([hubspotProp, contextKeys]) => {
      const value = props[hubspotProp];
      if (!value) {
        return;
      }

      const targets = Array.isArray(contextKeys) ? contextKeys : [contextKeys];
      targets.forEach(target => {
        if (!target) {
          return;
        }

        if (!context[target]) {
          context[target] = value;
          this.logger.debug(`Enriched context from approval: ${target} = ${value}`);
        } else {
          this.logger.debug(`Preserving existing context value: ${target} = ${context[target]}`);
        }
      });
    });

    // Extract timesheet IDs from the mapped property
    if (context.approvalTimesheetIds) {
      if (typeof context.approvalTimesheetIds === 'string') {
        context.approvalTimesheetIds = context.approvalTimesheetIds
          .split(',')
          .map(id => id.trim())
          .filter(Boolean);
      }
      this.logger.debug('Timesheet IDs present after enrichment', {
        timesheetIds: context.approvalTimesheetIds
      });
    } else {
      this.logger.warn('No timesheet IDs found in approval object for context enrichment');
    }
  }

  /**
   * Enrich context with data derived from timesheets
   * @param {Object} context - Context object
   * @param {Array} timesheets - Array of timesheet records
   */
  enrichContextFromTimesheets(context, timesheets) {
    if (!Array.isArray(timesheets) || timesheets.length === 0) {
      return;
    }

    const wellNames = new Set();
    let minStartDate = null;
    let maxEndDate = null;

    timesheets.forEach(timesheet => {
      const props = timesheet.properties || {};

      if (props.timesheet_well) {
        wellNames.add(props.timesheet_well.trim());
      }

      if (props.timesheet_project_name && !context.projectName) {
        context.projectName = props.timesheet_project_name;
      }

      if (props.timesheet_project_id && !context.projectId) {
        context.projectId = props.timesheet_project_id;
      }

      if (props.timesheet_consultant_full_name && !context.consultantName) {
        context.consultantName = props.timesheet_consultant_full_name;
      }

      if (props.timesheet_consultant_email && !context.consultantEmail) {
        context.consultantEmail = props.timesheet_consultant_email;
      }

      if (props.timesheet_consultant_id && !context.consultantId) {
        context.consultantId = props.timesheet_consultant_id;
      }

      if (props.timesheet_customer && !context.customerCompanyName) {
        context.customerCompanyName = props.timesheet_customer;
      }

      if (props.timesheet_operator && !context.operatorName) {
        context.operatorName = props.timesheet_operator;
      }

      if (props.timesheet_payment_deal_id && !context.salesDealId) {
        context.salesDealId = props.timesheet_payment_deal_id;
      }

      const startDate = parseInt(props.timesheet_start_date, 10);
      if (!Number.isNaN(startDate)) {
        minStartDate = minStartDate === null ? startDate : Math.min(minStartDate, startDate);
      }

      const endDate = parseInt(props.timesheet_end_date, 10);
      if (!Number.isNaN(endDate)) {
        maxEndDate = maxEndDate === null ? endDate : Math.max(maxEndDate, endDate);
      }
    });

    if (!context.wellNames && wellNames.size > 0) {
      context.wellNames = Array.from(wellNames).join(', ');
    }

    if (!context.responseFromDate && minStartDate !== null) {
      context.responseFromDate = `${minStartDate}`;
    }

    if (!context.responseUntilDate && maxEndDate !== null) {
      context.responseUntilDate = `${maxEndDate}`;
    }
  }

  /**
   * Enrich context with contact data
   * @param {Object} context - Context object
   * @param {Object} contact - Contact object from HubSpot
   */
  enrichContextFromContact(context, contact) {
    const props = contact.properties || {};

    if (props.email && !context.customerEmail) {
      context.customerEmail = props.email;
    }
    if (props.firstname && props.lastname && !context.operatorName) {
      context.operatorName = `${props.firstname} ${props.lastname}`;
    }

    const contactId = contact.id;
    const isDesignatedApprover = !context.approverContactId || context.approverContactId === contactId;
    if (isDesignatedApprover) {
      if (props.email && !context.approverEmail) {
        context.approverEmail = props.email;
      }

      const fullName = [props.firstname, props.lastname].filter(Boolean).join(' ').trim();
      if (fullName && !context.approverName) {
        context.approverName = fullName;
      }

      if (!context.approverContactId && contactId) {
        context.approverContactId = contactId;
      }
    }
  }

  /**
   * Enrich context with deal data
   * @param {Object} context - Context object
   * @param {Object} deal - Deal object from HubSpot
   */
  enrichContextFromDeal(context, deal) {
    const props = deal.properties || {};

    if (props.dealname && !context.projectName) {
      context.projectName = props.dealname;
    }

    if (props.project_unique_id && !context.projectId) {
      context.projectId = props.project_unique_id;
    }
    if (props.amount && !context.dealAmount) {
      context.dealAmount = props.amount;
    }

    const contactAssociations = deal.associations?.contacts?.results || [];

    const approverAssociation = contactAssociations.find((association) => {
      const { type, associationTypeId, label } = association || {};
      const normalizedType = typeof type === 'string' ? type.toLowerCase() : '';
      const normalizedLabel = typeof label === 'string' ? label.toLowerCase() : '';

      if (normalizedType === 'approver' || normalizedLabel === 'approver') {
        return true;
      }

      // HubSpot custom labels sometimes come through on associationTypeId mappings. Allow override via env/config if needed.
      if (this.config?.associationTypeMappings?.approver) {
        return this.config.associationTypeMappings.approver.includes(String(associationTypeId));
      }

      return false;
    });
    const approverContactId = approverAssociation?.id;

    if (approverContactId) {
      if (!context.approverContactId) {
        context.approverContactId = approverContactId;
      }
      if (!context.contactId) {
        context.contactId = approverContactId;
      }
    }
  }

  /**
   * Enrich context with company data
   * @param {Object} context - Context object
   * @param {Object} company - Company object from HubSpot
   */
  enrichContextFromCompany(context, company) {
    const props = company.properties || {};

    if (props.name && !context.customerCompanyName) {
      context.customerCompanyName = props.name;
    }
    if (props.domain && !context.customerCompanyDomain) {
      context.customerCompanyDomain = props.domain;
    }
  }

  /**
   * Enrich context with project data
   * @param {Object} context - Context object
   * @param {Object} project - Project object from HubSpot
   */
  enrichContextFromProject(context, project) {
    const props = project.properties || {};

    if (props.hj_project_name && !context.projectName) {
      context.projectName = props.hj_project_name;
    }
    if (props.hj_sales_deal_record_id && !context.salesDealId) {
      context.salesDealId = props.hj_sales_deal_record_id;
    }
    if (props.hj_sales_deal_owner_name && !context.salesDealOwnerName) {
      context.salesDealOwnerName = props.hj_sales_deal_owner_name;
    }
    if (props.hj_sales_deal_owner_email && !context.salesDealOwnerEmail) {
      context.salesDealOwnerEmail = props.hj_sales_deal_owner_email;
    }
    if (props.hj_customer_company_id && !context.customerCompanyId) {
      context.customerCompanyId = props.hj_customer_company_id;
    }
    if (props.hj_operator_name && !context.operatorName) {
      context.operatorName = props.hj_operator_name;
    }
    const projectPrimaryContactId = props.hj_primary_contact_id;
    const projectApproverContactId = props.hj_approver_id;

    const resolvedApproverContactId = projectApproverContactId || projectPrimaryContactId;

    if (projectPrimaryContactId && !context.contactId) {
      context.contactId = projectPrimaryContactId;
    }

    if (resolvedApproverContactId && !context.approverContactId) {
      context.approverContactId = resolvedApproverContactId;
    }

    if (props.hj_approver_email && !context.approverEmail) {
      context.approverEmail = props.hj_approver_email;
    }

    if (props.hj_approver_name && !context.approverName) {
      context.approverName = props.hj_approver_name;
    }

    if (props.hj_approver_is && !context.approverType) {
      context.approverType = props.hj_approver_is;
    }
  }

  /**
   * Map properties to HubSpot format
   * @param {Object} properties - Properties to map
   * @returns {Object} Mapped properties
   */
  mapPropertiesToHubSpot(properties) {
    // For now, just return the properties as-is since we don't have property mappings in config
    // TODO: Add property mappings to config if needed
    return properties;
  }

  /**
   * Create a note in HubSpot
   * @param {Object} noteData - Note data with associations and properties
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    try {
      const response = await this.client.post(
        `${this.config.endpoints.objects}/notes`,
        {
          properties: noteData.properties,
          associations: noteData.associations
        }
      );

      this.logger.info('Created HubSpot note', {
        noteId: response.data?.id,
        hasAssociations: Array.isArray(noteData.associations) && noteData.associations.length > 0
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating HubSpot note', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
      throw new Error(`Failed to create note: ${error.message}`);
    }
  }


}

module.exports = HubspotService;
