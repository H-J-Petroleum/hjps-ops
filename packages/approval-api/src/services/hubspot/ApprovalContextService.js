/**
 * Approval Context Service
 * Orchestrates pulling related records and enriching context
 *
 * This service combines the HubSpot client and context enricher
 * to provide the main orchestration logic for building approval context.
 * Replaces the legacy pullRelatedRecords method.
 */

const HubSpotClient = require('./HubSpotClient');
const ContextEnricher = require('./ContextEnricher');
const logger = require('../../utils/logger');

class ApprovalContextService {
  constructor(options = {}) {
    this.hubspot = options.hubspot || new HubSpotClient(options);
    this.enricher = options.enricher || new ContextEnricher();
    this.logger = options.logger || logger;
  }

  /**
   * Pull related records based on context and enrich
   * @param {Object} context - Initial context object
   * @returns {Promise<Object>} Enriched context with HubSpot data
   */
  async pullRelatedRecords(context) {
    this.logger.info('Pulling related records from HubSpot', {
      approvalRequestId: context.approvalRequestId,
      projectId: context.projectId,
      consultantId: context.consultantId
    });

    try {
      // Step 1: Get approval object
      const approval = await this.hubspot.getApprovalObject(context.approvalRequestId);

      if (approval) {
        context.approvalObjectId = approval.id;
        context.approval = approval;
        this.enricher.enrichFromApproval(context, approval);

        this.logger.debug('Approval object loaded', {
          approvalId: approval.id,
          hasTimesheetIds: !!context.approvalTimesheetIds
        });
      }

      // Step 2: Discover timesheet IDs if not present on approval object
      const hasTimesheetIds = Array.isArray(context.approvalTimesheetIds)
        ? context.approvalTimesheetIds.length > 0
        : !!context.approvalTimesheetIds;

      if (!hasTimesheetIds && context.approvalRequestId) {
        const discoveredTimesheets = await this.hubspot.findTimesheetsByApprovalRequestId(
          context.approvalRequestId
        );

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

      // Step 3: Get timesheets if available
      if (context.approvalTimesheetIds && context.approvalTimesheetIds.length > 0) {
        const timesheets = await this.hubspot.getTimesheets(context.approvalTimesheetIds);
        context.timesheets = timesheets;
        this.enricher.enrichFromTimesheets(context, timesheets);

        this.logger.info('Retrieved timesheets', { count: timesheets.length });
      }

      // Step 4: Get project information only if we need additional context
      const needsProjectEnrichment = !context.approverEmail
        || !context.approverName
        || !context.approverType
        || !context.salesDealId;

      if (context.projectId && needsProjectEnrichment) {
        const project = await this.hubspot.getProject(context.projectId);

        if (project) {
          this.enricher.enrichFromProject(context, project);
          context.project = project;

          this.logger.debug('Project data loaded', {
            projectId: context.projectId,
            projectName: context.projectName
          });
        }
      }

      // Step 5: Get contact information
      if (context.contactId) {
        const contact = await this.hubspot.getContact(context.contactId);

        if (contact) {
          this.enricher.enrichFromContact(context, contact);
          context.contact = contact;

          this.logger.debug('Contact data loaded', {
            contactId: context.contactId
          });
        }
      }

      // Step 6: Get deal information
      if (context.salesDealId) {
        const deal = await this.hubspot.getDeal(context.salesDealId);

        if (deal) {
          this.enricher.enrichFromDeal(context, deal);
          context.deal = deal;

          this.logger.debug('Deal data loaded', {
            dealId: context.salesDealId
          });

          // Get approver contact if needed
          const approverContactId = context.approverContactId || context.contactId;
          const needsApproverContact = approverContactId
            && (!context.approverEmail || !context.approverName);

          const contactAlreadyLoaded = context.contact?.id === approverContactId
            || context.approverContact?.id === approverContactId;

          if (needsApproverContact && !contactAlreadyLoaded) {
            const approverContact = await this.hubspot.getContact(approverContactId);

            if (approverContact) {
              this.enricher.enrichFromContact(context, approverContact);
              context.approverContact = approverContact;

              this.logger.debug('Approver contact loaded', {
                approverContactId
              });
            }
          }
        }
      }

      // Step 7: Get company information
      if (context.customerCompanyId) {
        const company = await this.hubspot.getCompany(context.customerCompanyId);

        if (company) {
          this.enricher.enrichFromCompany(context, company);
          context.company = company;

          this.logger.debug('Company data loaded', {
            companyId: context.customerCompanyId
          });
        }
      }

      // Final summary
      this.logger.info('Successfully pulled related records', {
        hasApproval: !!approval,
        hasTimesheets: !!context.timesheets && context.timesheets.length > 0,
        hasProject: !!context.project,
        hasContact: !!context.contact,
        hasDeal: !!context.deal,
        hasCompany: !!context.company
      });

      return context;

    } catch (error) {
      this.logger.error('Failed to pull related records', {
        error: error.message,
        stack: error.stack,
        context: {
          approvalRequestId: context.approvalRequestId,
          projectId: context.projectId
        }
      });
      throw error;
    }
  }

  /**
   * Update approval object
   * @param {string} approvalId - Approval object ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated approval
   */
  async updateApproval(approvalId, properties) {
    return await this.hubspot.updateApprovalObject(approvalId, properties);
  }

  /**
   * Update timesheet objects
   * @param {Array} timesheetUpdates - Array of {id, properties} objects
   * @returns {Promise<Object>} Batch update result
   */
  async updateTimesheets(timesheetUpdates) {
    return await this.hubspot.updateTimesheets(timesheetUpdates);
  }

  /**
   * Create a note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    return await this.hubspot.createNote(noteData);
  }
}

module.exports = ApprovalContextService;
