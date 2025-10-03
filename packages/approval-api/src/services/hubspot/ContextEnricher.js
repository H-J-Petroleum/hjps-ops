/**
 * Context Enrichment Service
 * Business logic for enriching approval context from HubSpot objects
 *
 * This service contains the domain logic for mapping HubSpot properties
 * to the approval context model. Separated from the HubSpot client to
 * maintain clean separation of concerns.
 */

const logger = require('../../utils/logger');

class ContextEnricher {
  constructor() {
    this.logger = logger;
  }

  /**
   * Enrich context with approval object data
   * @param {Object} context - Context object to enrich
   * @param {Object} approval - Approval object from HubSpot
   * @returns {Object} Enriched context
   */
  enrichFromApproval(context, approval) {
    const props = approval.properties || {};

    this.logger.debug('Enriching context from approval', {
      approvalId: approval.id,
      availableProperties: Object.keys(props).length,
      hasTimesheetIds: !!props.response_approval_timesheet_ids_array
    });

    // Property mappings: HubSpot property -> context keys
    const propertyMappings = {
      approval_request_id: ['approvalRequestId'],
      approval_project_id: ['projectId'],
      project_name: ['projectName'],
      approval_customer: ['customerCompanyName'],
      approval_operator: ['operatorName'],
      approval_consultant_name: ['consultantName'],
      approval_consultant_id: ['consultantId'],
      approval_consultant_email: ['consultantEmail'],
      approval_approver_email: ['approverEmail'],
      approval_approver_name: ['approverName'],
      approval_approver_is_: ['approverType'],
      response_approval_sales_deal_id: ['salesDealId'],
      approval_timesheet_ids_array: ['approvalTimesheetIds'],
      response_approval_timesheet_ids_array: ['approvalTimesheetIds'],
      approval_wells: ['wellNames'],
      approval_approval_from: ['responseFromDate', 'approvalFromDate'],
      approval_approval_until: ['responseUntilDate', 'approvalUntilDate'],
      quote_customer_primary_contact_id: ['contactId', 'quoteCustomerPrimaryContactId'],
      signature_new: ['signature'],
      consultant_timesheet_approval_url: ['consultantApprovalUrl']
    };

    // Apply mappings
    Object.entries(propertyMappings).forEach(([hubspotProp, contextKeys]) => {
      const value = props[hubspotProp];
      if (!value) return;

      const targets = Array.isArray(contextKeys) ? contextKeys : [contextKeys];
      targets.forEach(target => {
        if (!target) return;

        if (!context[target]) {
          context[target] = value;
          this.logger.debug(`Enriched: ${target} = ${value}`);
        } else {
          this.logger.debug(`Preserved existing: ${target} = ${context[target]}`);
        }
      });
    });

    // Parse timesheet IDs if they're comma-separated
    if (context.approvalTimesheetIds && typeof context.approvalTimesheetIds === 'string') {
      context.approvalTimesheetIds = context.approvalTimesheetIds
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      this.logger.debug('Parsed timesheet IDs', {
        count: context.approvalTimesheetIds.length
      });
    }

    return context;
  }

  /**
   * Enrich context with timesheets data
   * @param {Object} context - Context object to enrich
   * @param {Array} timesheets - Array of timesheet records
   * @returns {Object} Enriched context
   */
  enrichFromTimesheets(context, timesheets) {
    if (!Array.isArray(timesheets) || timesheets.length === 0) {
      return context;
    }

    const wellNames = new Set();
    let minStartDate = null;
    let maxEndDate = null;

    timesheets.forEach(timesheet => {
      const props = timesheet.properties || {};

      // Collect well names
      if (props.timesheet_well) {
        wellNames.add(props.timesheet_well.trim());
      }

      // Enrich missing context properties
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

      // Track date range
      const startDate = parseInt(props.timesheet_start_date, 10);
      if (!Number.isNaN(startDate)) {
        minStartDate = minStartDate === null ? startDate : Math.min(minStartDate, startDate);
      }

      const endDate = parseInt(props.timesheet_end_date, 10);
      if (!Number.isNaN(endDate)) {
        maxEndDate = maxEndDate === null ? endDate : Math.max(maxEndDate, endDate);
      }
    });

    // Set well names
    if (!context.wellNames && wellNames.size > 0) {
      context.wellNames = Array.from(wellNames).join(', ');
    }

    // Set date range
    if (!context.responseFromDate && minStartDate !== null) {
      context.responseFromDate = `${minStartDate}`;
    }

    if (!context.responseUntilDate && maxEndDate !== null) {
      context.responseUntilDate = `${maxEndDate}`;
    }

    this.logger.debug('Enriched from timesheets', {
      wells: wellNames.size,
      dateRange: minStartDate && maxEndDate ? `${minStartDate}-${maxEndDate}` : null
    });

    return context;
  }

  /**
   * Enrich context with contact data
   * @param {Object} context - Context object to enrich
   * @param {Object} contact - Contact object from HubSpot
   * @returns {Object} Enriched context
   */
  enrichFromContact(context, contact) {
    const props = contact.properties || {};

    if (props.email && !context.customerEmail) {
      context.customerEmail = props.email;
    }

    if (props.firstname && props.lastname && !context.operatorName) {
      context.operatorName = `${props.firstname} ${props.lastname}`;
    }

    // Check if this contact is the approver
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

    return context;
  }

  /**
   * Enrich context with deal data
   * @param {Object} context - Context object to enrich
   * @param {Object} deal - Deal object from HubSpot
   * @returns {Object} Enriched context
   */
  enrichFromDeal(context, deal) {
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

    // Extract approver contact from associations
    const contactAssociations = deal.associations?.contacts?.results || [];

    const approverAssociation = contactAssociations.find((association) => {
      const { type, associationTypeId, label } = association || {};
      const normalizedType = typeof type === 'string' ? type.toLowerCase() : '';
      const normalizedLabel = typeof label === 'string' ? label.toLowerCase() : '';

      if (normalizedType === 'approver' || normalizedLabel === 'approver') {
        return true;
      }

      // Custom association type IDs (if configured)
      const approverTypeIds = process.env.HUBSPOT_APPROVER_ASSOCIATION_TYPES?.split(',') || [];
      return approverTypeIds.includes(String(associationTypeId));
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

    return context;
  }

  /**
   * Enrich context with company data
   * @param {Object} context - Context object to enrich
   * @param {Object} company - Company object from HubSpot
   * @returns {Object} Enriched context
   */
  enrichFromCompany(context, company) {
    const props = company.properties || {};

    if (props.name && !context.customerCompanyName) {
      context.customerCompanyName = props.name;
    }

    if (props.domain && !context.customerCompanyDomain) {
      context.customerCompanyDomain = props.domain;
    }

    return context;
  }

  /**
   * Enrich context with project data
   * @param {Object} context - Context object to enrich
   * @param {Object} project - Project object from HubSpot
   * @returns {Object} Enriched context
   */
  enrichFromProject(context, project) {
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

    // Contact and approver resolution
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

    return context;
  }
}

module.exports = ContextEnricher;
