/**
 * Approval Service
 * Main orchestration service for the approval workflow
 * Coordinates URL resolution, data fetching, PDF generation, and timesheet approval
 */

const logger = require('../utils/logger');
const UrlResolverService = require('./urlResolverService');
const { ApprovalContextService } = require('./hubspot'); // NEW: Using toolkit-based service
const TimesheetService = require('./timesheetService');
const { PDFServiceClient } = require('./pdf'); // NEW: Using toolkit-pdf
const WF26PdfGenerationService = require('./wf26PdfGenerationService');
const InvoiceBillNumberService = require('./invoiceBillNumberService');
const EmailService = require('./email/EmailService');
const NoteCreationService = require('./noteCreationService');

class ApprovalService {
  constructor() {
    this.logger = logger;
    this.urlResolver = new UrlResolverService();
    this.contextService = new ApprovalContextService(); // NEW: Replaces hubspotService
    this.timesheetService = new TimesheetService(this.contextService);
    this.pdfServiceClient = new PDFServiceClient(); // NEW: Using toolkit-pdf
    this.wf26PdfGeneration = new WF26PdfGenerationService();
    this.invoiceBillNumberService = new InvoiceBillNumberService(this.contextService);

    const emailProvider = process.env.APPROVAL_EMAIL_PROVIDER || 'console';
    const emailConfig = { provider: emailProvider };

    if (emailProvider === 'smtp') {
      emailConfig.smtp = {
        host: process.env.APPROVAL_EMAIL_HOST || 'smtp.office365.com',
        port: Number(process.env.APPROVAL_EMAIL_PORT || 587),
        secure: process.env.APPROVAL_EMAIL_SECURE === 'true',
        auth: {
          user: process.env.APPROVAL_EMAIL_USER || 'timesheets@hjpetro.com',
          pass: process.env.APPROVAL_EMAIL_PASSWORD
        }
      };
    }

    this.emailService = new EmailService(emailConfig);
    this.noteCreationService = new NoteCreationService();
  }

  /**
   * Build property map used to hydrate approval object
   * @param {Object} context - Enriched context
   * @returns {Object} Property map
   */
  buildApprovalHydrationProperties(context) {
    return this.buildApprovalPropertySnapshot(context);
  }

  /**
   * Build approval property snapshot using enriched context
   * @param {Object} context - Enriched context
   * @returns {Object} Property snapshot keyed by HubSpot property names
   */
  buildApprovalPropertySnapshot(context) {
    const approverEmail = context.approverEmail
      || context.customerEmail
      || context.consultantEmail
      || 'timesheets@hjpetro.com';

    const approverName = context.approverName
      || context.consultantName
      || context.customerCompanyName
      || 'H&J Approvals Team';

    const approverType = context.approverType || 'HJPetro';

    const timesheetIds = Array.isArray(context.approvalTimesheetIds)
      ? context.approvalTimesheetIds.filter(Boolean).join(',')
      : context.approvalTimesheetIds;

    const propertyMap = {
      approval_request_id: context.approvalRequestId,
      approval_project_id: context.projectId,
      project_name: context.projectName,
      approval_customer: context.customerCompanyName || context.customer,
      approval_operator: context.operatorName,
      approval_wells: context.wellNames,
      approval_consultant_name: context.consultantName,
      approval_consultant_id: context.consultantId,
      approval_consultant_email: context.consultantEmail,
      approval_approver_email: approverEmail,
      approval_approver_name: approverName,
      approval_approver_is_: approverType,
      approval_sales_deal_owner_email: context.dealOwnerEmail || context.salesDealOwnerEmail,
      approval_approval_from: context.responseFromDate || context.approvalFromDate,
      approval_approval_until: context.responseUntilDate || context.approvalUntilDate,
      approval_timesheet_ids_array: timesheetIds,
      response_approval_timesheet_ids_array: timesheetIds,
      response_approval_from_date: context.responseFromDate,
      response_approval_until_date: context.responseUntilDate,
      response_approval_sales_deal_id: context.salesDealId,
      quote_customer_primary_contact_id: context.contactId || context.quoteCustomerPrimaryContactId,
      response_approval_customer: context.customerCompanyId,
      response_approval_project_id: context.projectId,
      response_approval_project_name: context.projectName,
      response_approval_operator: context.operatorName,
      consultant_timesheet_approval_url: context.consultantApprovalUrl
    };

    return this.filterEmptyProperties(propertyMap);
  }

  /**
   * Remove empty or undefined properties from an object
   * @param {Object} properties - Property bag
   * @returns {Object} Filtered property bag
   */
  filterEmptyProperties(properties) {
    return Object.entries(properties).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }

      if (typeof value === 'string' && value.trim() === '') {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
  }

  /**
   * Hydrate approval object with discovered context values
   * @param {Object} context - Enriched context
   */
  async hydrateApprovalProperties(context) {
    const approvalId = context.approvalObjectId || context.approvalRequestId;
    if (!approvalId) {
      return;
    }

    const properties = this.buildApprovalHydrationProperties(context);
    if (Object.keys(properties).length === 0) {
      return;
    }

    try {
      await this.contextService.updateApproval(approvalId, properties);
      this.logger.info('Hydrated approval object with context data', {
        approvalId,
        propertyCount: Object.keys(properties).length
      });
    } catch (error) {
      this.logger.warn('Failed to hydrate approval object', {
        approvalId,
        error: error.message
      });
    }
  }

  /**
   * Process complete approval workflow
   * @param {Object} options - Approval process options
   * @param {string} options.approvalUrl - Approval URL (optional)
   * @param {string} options.approvalId - Approval ID (optional)
   * @param {string} options.pdfType - PDF type (customer, consultant, invoice, internal)
   * @param {string} options.decision - Decision (Approve/Reject)
   * @param {string} options.comments - Approval comments
   * @param {Object} options.manualContext - Manual context data (optional)
   * @returns {Object} Approval process result
   */
  async processApproval(options = {}) {
    const {
      approvalUrl,
      approvalId,
      pdfType = 'customer',
      decision = 'Approve',
      comments = 'Approved via API',
      manualContext = {}
    } = options;

    this.logger.info('Starting approval process', {
      approvalUrl: !!approvalUrl,
      approvalId: !!approvalId,
      pdfType,
      decision,
      comments
    });

    try {
      // Step 1: Resolve context
      this.logger.info('Resolving context with manual context', { manualContext });
      const context = await this.resolveContext({
        approvalUrl,
        approvalRequestId: approvalId, // Map approvalId to approvalRequestId
        ...manualContext
      });
      this.logger.info('Resolved context', {
        approvalTimesheetIds: context.approvalTimesheetIds,
        hasManualTimesheetIds: !!manualContext.approvalTimesheetIds
      });

      // Step 2: Pull related records from HubSpot
      this.logger.info('Before pullRelatedRecords', {
        approvalTimesheetIds: context.approvalTimesheetIds
      });
      const enrichedContext = await this.pullRelatedRecords(context);
      this.logger.info('After pullRelatedRecords', {
        approvalTimesheetIds: enrichedContext.approvalTimesheetIds
      });

      enrichedContext.approverEmail = enrichedContext.approverEmail
        || enrichedContext.customerEmail
        || enrichedContext.consultantEmail
        || 'timesheets@hjpetro.com';

      enrichedContext.approverName = enrichedContext.approverName
        || enrichedContext.consultantName
        || enrichedContext.customerCompanyName
        || 'H&J Approvals Team';

      enrichedContext.approverType = enrichedContext.approverType || 'HJPetro';

      if (!enrichedContext.consultantApprovalUrl && enrichedContext.approvalUrl) {
        enrichedContext.consultantApprovalUrl = enrichedContext.approvalUrl;
      }

      await this.hydrateApprovalProperties(enrichedContext);

      // Step 3: Generate PDFs (customer + consultant when approving)
      let pdfResult = null;
      const pdfResults = {};
      if (decision === 'Approve') {
        const pdfTypesToGenerate = new Set([
          pdfType || 'customer',
          'customer',
          'consultant'
        ]);

        for (const type of pdfTypesToGenerate) {
          const generated = await this.generatePDF(enrichedContext, type);
          pdfResults[type] = generated;

          if (type === 'consultant' && generated?.url) {
            enrichedContext.consultantApprovalUrl = generated.url;
          }
        }

        pdfResult = pdfResults[pdfType] || pdfResults.customer || pdfResults.consultant || null;

        if (Object.keys(pdfResults).length > 0) {
          await this.hydrateApprovalProperties(enrichedContext);
        }
      }

      // Step 4: Approve/Reject timesheets (this also updates the approval object)
      const timesheetResult = await this.processTimesheets({
        approvalRequestId: enrichedContext.approvalRequestId,
        approvalObjectId: enrichedContext.approvalObjectId,
        decision,
        comments,
        timesheetIds: enrichedContext.approvalTimesheetIds
      });

      if (Array.isArray(timesheetResult?.processedTimesheetIds) && timesheetResult.processedTimesheetIds.length > 0) {
        enrichedContext.approvalTimesheetIds = timesheetResult.processedTimesheetIds;
      }

      let invoiceBillResult = null;
      if (decision === 'Approve') {
        const approvalIdentifier = enrichedContext.approvalObjectId || enrichedContext.approvalRequestId;
        try {
          invoiceBillResult = await this.generateWF26InvoiceBillNumbers(approvalIdentifier, {
            generateInvoice: true,
            generateBill: true
          });
        } catch (error) {
          this.logger.error('Failed to generate invoice/bill numbers', {
            error: error.message,
            approvalId: approvalIdentifier
          });
        }
      } else {
        await this.hydrateApprovalProperties(enrichedContext);
      }

      // Step 6: Send approval notification emails
      let emailResult = null;
      try {
        emailResult = await this.sendApprovalNotifications(enrichedContext, {
          decision,
          comments,
          pdfResult,
          timesheetResult
        });
      } catch (emailError) {
        this.logger.warn('Failed to send approval notifications', {
          error: emailError.message,
          approvalId: enrichedContext.approvalRequestId
        });
        // Don't fail the entire process if emails fail
      }

      // Create sales deal note (WF-26 Action 9)
      let noteResult = null;
      try {
        noteResult = await this.createApprovalNote(enrichedContext, decision, comments);
        this.logger.info('Sales deal note created successfully', {
          noteId: noteResult.noteId,
          salesDealId: noteResult.salesDealId
        });
      } catch (error) {
        this.logger.error('Failed to create sales deal note', {
          error: error.message,
          approvalId: enrichedContext.approvalRequestId
        });
        // Don't fail the entire process if note creation fails
      }

      const result = {
        success: true,
        approvalId: enrichedContext.approvalRequestId,
        status: decision.toLowerCase(),
        pdfResult,
        timesheetResult,
        invoiceBillResult,
        emailResult,
        noteResult,
        context: this.sanitizeContext(enrichedContext),
        processedAt: new Date().toISOString()
      };

      if (Object.keys(pdfResults).length > 0) {
        result.pdfResults = pdfResults;
      }

      this.logger.info('Successfully completed approval process', {
        approvalId: result.approvalId,
        status: result.status,
        hasPDF: !!pdfResult,
        timesheetCount: timesheetResult.timesheetCount,
        invoiceBillGenerated: !!invoiceBillResult
      });

      return result;

    } catch (error) {
      this.logger.error('Approval process failed', {
        error: error.message,
        approvalUrl: !!approvalUrl,
        approvalId: !!approvalId,
        decision
      });
      throw error;
    }
  }

  /**
   * Resolve approval context
   * @param {Object} options - Context resolution options
   * @returns {Object} Resolved context
   */
  async resolveContext(options) {
    this.logger.info('Resolving approval context');

    try {
      // Extract manual context from options
      const { approvalUrl, approvalRequestId, projectId, consultantId, customerEmail, ...manualContext } = options;

      const context = await this.urlResolver.resolveContext({
        approvalUrl,
        approvalRequestId,
        projectId,
        consultantId,
        customerEmail,
        existingContext: manualContext
      });

      // Validate context
      const validation = this.urlResolver.validateContext(context);
      if (!validation.isValid) {
        throw new Error(`Context validation failed: ${validation.missingFields.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        this.logger.warn('Context validation warnings', { warnings: validation.warnings });
      }

      this.logger.info('Successfully resolved context', {
        approvalRequestId: context.approvalRequestId,
        projectId: context.projectId,
        consultantId: context.consultantId
      });

      return context;

    } catch (error) {
      this.logger.error('Failed to resolve context', { error: error.message });
      throw error;
    }
  }

  /**
   * Pull related records from HubSpot
   * @param {Object} context - Context object
   * @returns {Object} Enriched context
   */
  async pullRelatedRecords(context) {
    this.logger.info('Pulling related records from HubSpot');

    try {
      const enrichedContext = await this.contextService.pullRelatedRecords(context);

      this.logger.info('Successfully pulled related records', {
        hasApproval: !!enrichedContext.approvalRequestId,
        hasTimesheets: !!enrichedContext.timesheets,
        timesheetCount: enrichedContext.timesheets?.length || 0
      });

      return enrichedContext;

    } catch (error) {
      this.logger.error('Failed to pull related records', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate PDF for approval
   * @param {Object} context - Enriched context
   * @param {string} pdfType - PDF type
   * @returns {Object} PDF generation result
   */
  async generatePDF(context, pdfType) {
    this.logger.info('Generating PDF', { pdfType });

    try {
      const pdfResult = await this.pdfIntegration.generatePDF({
        approvalId: context.approvalObjectId || context.approvalRequestId,
        pdfType,
        approvalData: context,
        timesheetData: context.timesheets || []
      });

      this.logger.info('Successfully generated PDF', {
        fileId: pdfResult.fileId,
        url: pdfResult.url,
        pdfType
      });

      return pdfResult;

    } catch (error) {
      this.logger.error('Failed to generate PDF', { error: error.message, pdfType });
      throw error;
    }
  }

  /**
   * Process timesheets (approve/reject)
   * @param {Object} options - Timesheet processing options
   * @returns {Object} Timesheet processing result
   */
  async processTimesheets(options) {
    const { decision, ...timesheetOptions } = options;

    this.logger.info('Processing timesheets', { decision });

    try {
      let result;
      if (decision === 'Approve') {
        result = await this.timesheetService.approveTimesheets(timesheetOptions);
      } else {
        result = await this.timesheetService.rejectTimesheets(timesheetOptions);
      }

      this.logger.info('Successfully processed timesheets', {
        decision,
        timesheetCount: result.timesheetCount
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to process timesheets', { error: error.message, decision });
      throw error;
    }
  }

  /**
   * Update approval object with final status
   * @param {Object} context - Context object
   * @param {Object} results - Processing results
   * @returns {Object} Update result
   */
  async updateApprovalObject(context, results) {
    const { decision, comments, pdfResult, timesheetResult } = results;

    this.logger.info('Updating approval object with final status');

    try {
      const updateData = {
        approval_status: decision.toLowerCase(),
        approval_date: new Date().toISOString(),
        approval_notes: comments,
        timesheet_count: timesheetResult.timesheetCount,
        processed_timesheet_ids: timesheetResult.processedTimesheetIds?.join(',') || '',
        last_modified: new Date().toISOString()
      };

      // Add PDF information if generated
      if (pdfResult) {
        updateData.pdf_url = pdfResult.url;
        updateData.pdf_file_id = pdfResult.fileId;
        updateData.pdf_generated_date = pdfResult.generatedAt;
      }

      // Add rejection reason if rejecting
      if (decision === 'Reject') {
        updateData.rejection_reason = comments;
      }

      const approvalIdentifier = context.approvalObjectId || context.approvalRequestId;

      const result = await this.contextService.updateApproval(
        approvalIdentifier,
        updateData
      );

      this.logger.info('Successfully updated approval object', {
        approvalId: approvalIdentifier,
        status: decision.toLowerCase(),
        hasPDF: !!pdfResult
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to update approval object', { error: error.message });
      throw error;
    }
  }

  /**
   * Send approval notification emails
   * @param {Object} context - Context object with approval data
   * @param {Object} results - Processing results
   * @returns {Object} Email notification result
   */
  async sendApprovalNotifications(context, results, options = {}) {
    const { decision, comments, pdfResult } = results;
    const { approvalRequestId, projectId, consultantId, approverType } = context;
    const dryRun = !!options.dryRun;
    const overrideRecipient = options.overrideRecipient;
    const overrideConsultantRecipient = options.overrideConsultantRecipient;
    const overrideInternalRecipient = options.overrideInternalRecipient;
    const overrideApproverId = options.overrideApproverId;
    const overrideApproverEmail = options.overrideApproverEmail;

    this.logger.info('Sending approval notifications', {
      approvalRequestId,
      decision,
      approverType,
      dryRun
    });

    try {
      const notifications = [];

      // Get additional context data for emails
      let approvalData = null;
      try {
        approvalData = await this.contextService.hubspot.getApprovalObject(approvalRequestId);
      } catch (error) {
        this.logger.warn('Approval lookup for notifications failed, using context fallback', {
          approvalRequestId,
          error: error.message
        });
      }

      const fallbackApprovalProps = this.buildApprovalPropertySnapshot(context);
      const approvalProps = {
        ...fallbackApprovalProps,
        ...(approvalData?.properties || {})
      };

      const resolvedProjectId = projectId
        || approvalProps.response_approval_project_id
        || approvalProps.approval_project_id
        || context.projectId;

      const resolvedConsultantId = consultantId
        || approvalProps.approval_consultant_id
        || context.consultantId;

      let consultantData = context.contact || null;
      if (!consultantData && resolvedConsultantId) {
        try {
          consultantData = await this.contextService.hubspot.getContact(resolvedConsultantId);
        } catch (error) {
          this.logger.warn('Consultant contact not found, using context data', {
            consultantId: resolvedConsultantId,
            error: error.message
          });
        }
      }

      let projectData = context.project || null;
      if (!projectData && resolvedProjectId) {
        try {
          projectData = await this.contextService.hubspot.getProject(resolvedProjectId);
        } catch (error) {
          this.logger.warn('Project not found, using context data', {
            projectId: resolvedProjectId,
            error: error.message
          });
        }
      }

      const consultantName = consultantData?.properties
        ? `${consultantData.properties.firstname || ''} ${consultantData.properties.lastname || ''}`.trim()
        : context.consultantName
          || approvalProps.approval_consultant_name
          || 'Consultant';

      const consultantEmail = approvalProps.approval_consultant_email
        || consultantData?.properties?.email
        || context.consultantEmail
        || context.customerEmail;

      const projectName = projectData?.properties?.hj_project_name
        || context.projectName
        || approvalProps.project_name
        || approvalProps.response_approval_project_name;

      const salesDealId = projectData?.properties?.hj_sales_deal_record_id
        || context.salesDealId
        || approvalProps.response_approval_sales_deal_id
        || approvalProps.approval_sales_deal_id;

      const salesDealOwnerName = projectData?.properties?.hj_sales_deal_owner_name
        || context.salesDealOwnerName
        || approvalProps.approval_sales_deal_owner_name;

      const customer = approvalProps.approval_customer
        || context.customerCompanyName
        || approvalProps.response_approval_customer
        || context.customer;

      const operator = approvalProps.approval_operator
        || approvalProps.response_approval_operator
        || context.operatorName;

      const fromDate = approvalProps.approval_from_date
        || approvalProps.approval_approval_from
        || approvalProps.response_approval_from_date
        || context.responseFromDate;

      const untilDate = approvalProps.approval_until_date
        || approvalProps.approval_approval_until
        || approvalProps.response_approval_until_date
        || context.responseUntilDate;

      const wellNames = approvalProps.approval_wells || context.wellNames;

      let approverEmail = context.approverEmail
        || approvalProps.approval_approver_email
        || context.customerEmail
        || consultantEmail;

      if (overrideApproverEmail) {
        approverEmail = overrideApproverEmail;
      }

      const effectiveApproverId = overrideApproverId
        || context.approverId
        || context.approverContactId
        || context.contactId;

      if (!effectiveApproverId) {
        this.logger.warn('Approver ID missing for notification payload', {
          approvalRequestId
        });
      }

      const emailData = {
        consultantId: resolvedConsultantId,
        approvalRequestId,
        projectId: resolvedProjectId,
        consultantName,
        projectName,
        fromDate,
        untilDate,
        customer,
        operator,
        comment: comments,
        approvalStatus: decision,
        pdfUrl: pdfResult?.url,
        wellNames,
        approverEmail,
        approverType,
        salesDealId,
        taskId: approvalProps.approval_hj_task_id,
        salesDealOwnerName,
        approverId: effectiveApproverId
      };

      const consultantRecipient = overrideConsultantRecipient
        || overrideRecipient
        || consultantEmail;

      const internalRecipient = overrideInternalRecipient
        || overrideRecipient
        || approverEmail
        || consultantEmail;

      // Send customer approval response email (to consultant)
      if (approverType === 'Primary Contact' || approverType === 'Customer') {
        if (consultantRecipient) {
          const customerResult = await this.emailService.sendEmail(
            'approval',
            'customerApprovalResponse',
            emailData,
            {
              recipientEmail: consultantRecipient,
              dryRun
            }
          );
          notifications.push({
            type: 'customer_approval_response',
            recipient: consultantRecipient,
            status: customerResult.dryRun ? 'dry_run' : customerResult.success ? 'sent' : 'failed',
            result: customerResult
          });
        } else {
          this.logger.warn('Skipping customer approval email - consultant email not available', {
            approvalRequestId
          });
        }
      }

      // Send H&J internal approval response email
      if (approverType === 'HJPetro' || approverType === 'H&J Petroleum') {
        if (internalRecipient) {
          const hjResult = await this.emailService.sendEmail(
            'approval',
            'hjApprovalResponse',
            {
              ...emailData,
              encryptedConsultantId: parseInt(consultantId) + 3522
            },
            {
              recipientEmail: internalRecipient,
              dryRun
            }
          );
          notifications.push({
            type: 'hj_approval_response',
            recipient: internalRecipient,
            status: hjResult.dryRun ? 'dry_run' : hjResult.success ? 'sent' : 'failed',
            result: hjResult
          });
        } else {
          this.logger.warn('Skipping internal approval email - approver email not available', {
            approvalRequestId
          });
        }
      }

      this.logger.info('Successfully sent approval notifications', {
        approvalRequestId,
        notificationCount: notifications.length,
        types: notifications.map(n => n.type)
      });

      return {
        success: true,
        notifications,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send approval notifications', {
        error: error.message,
        approvalRequestId
      });
      throw error;
    }
  }

  /**
   * Create sales deal note summarizing approval decision (WF-26 Action 9)
   * @param {Object} context - Enriched approval context
   * @param {string} decision - Approval decision
   * @param {string} comments - Approval comments
   * @returns {Promise<Object>} Note creation result
   */
  async createApprovalNote(context, decision, comments) {
    const salesDealId = context.salesDealId;

    if (!salesDealId) {
      throw new Error('Cannot create approval note without sales deal ID');
    }

    const { firstName, lastName } = this.resolveApproverNameParts(
      context.approverName,
      context.approverEmail
    );

    const noteData = {
      approvalRequestId: context.approvalRequestId,
      consultantName: context.consultantName,
      customer: context.customerCompanyName || context.customer,
      projectName: context.projectName,
      projectId: context.projectId,
      salesDealId,
      fromDate: context.responseFromDate || context.approvalFromDate,
      untilDate: context.responseUntilDate || context.approvalUntilDate,
      approverFirstName: firstName,
      approverLastName: lastName,
      approverEmail: context.approverEmail,
      operator: context.operatorName,
      comment: comments,
      fieldTicketId: Array.isArray(context.approvalTimesheetIds)
        ? context.approvalTimesheetIds.join(', ')
        : context.approvalTimesheetIds,
      consultantFieldTicketId: Array.isArray(context.approvalTimesheetIds)
        ? context.approvalTimesheetIds[0]
        : context.approvalTimesheetIds,
      approvalObjectId: context.approvalObjectId
    };

    return this.noteCreationService.createApprovalNote(noteData, decision, comments);
  }

  /**
   * Send approval request email (initial request)
   * @param {Object} context - Context object with approval data
   * @returns {Object} Email request result
   */
  async sendApprovalRequestEmail(context) {
    const { approvalRequestId, projectId, consultantId, approverId, approverType } = context;

    this.logger.info('Sending approval request email', {
      approvalRequestId,
      approverType
    });

    try {
      // Get additional context data for email
      let approvalData = null;
      try {
        approvalData = await this.contextService.hubspot.getApprovalObject(approvalRequestId);
      } catch (error) {
        this.logger.warn('Approval lookup for request email failed, using context fallback', {
          approvalRequestId,
          error: error.message
        });
      }

      const fallbackApprovalProps = this.buildApprovalPropertySnapshot(context);
      const approvalProps = {
        ...fallbackApprovalProps,
        ...(approvalData?.properties || {})
      };

      const resolvedConsultantId = consultantId
        || approvalProps.approval_consultant_id
        || context.consultantId;

      const resolvedProjectId = projectId
        || approvalProps.response_approval_project_id
        || approvalProps.approval_project_id
        || context.projectId;

      let consultantData = context.contact || null;
      if (!consultantData && resolvedConsultantId) {
        try {
          consultantData = await this.contextService.hubspot.getContact(resolvedConsultantId);
        } catch (error) {
          this.logger.warn('Consultant contact not found for request email, using context data', {
            consultantId: resolvedConsultantId,
            error: error.message
          });
        }
      }

      let projectData = context.project || null;
      if (!projectData && resolvedProjectId) {
        try {
          projectData = await this.contextService.hubspot.getProject(resolvedProjectId);
        } catch (error) {
          this.logger.warn('Project not found for request email, using context data', {
            projectId: resolvedProjectId,
            error: error.message
          });
        }
      }

      const consultantName = consultantData?.properties
        ? `${consultantData.properties.firstname || ''} ${consultantData.properties.lastname || ''}`.trim()
        : context.consultantName
          || approvalProps.approval_consultant_name;

      const fromDate = approvalProps.approval_approval_from
        || approvalProps.approval_from_date
        || approvalProps.response_approval_from_date
        || context.responseFromDate;

      const untilDate = approvalProps.approval_approval_until
        || approvalProps.approval_until_date
        || approvalProps.response_approval_until_date
        || context.responseUntilDate;

      const emailData = {
        approverId,
        projectId: resolvedProjectId,
        approvalRequestId,
        consultantName,
        consultantId: resolvedConsultantId,
        customer: approvalProps.approval_customer
          || context.customerCompanyName
          || approvalProps.response_approval_customer,
        operator: approvalProps.approval_operator
          || approvalProps.response_approval_operator
          || context.operatorName,
        wellNames: approvalProps.approval_wells || context.wellNames,
        fromDate,
        untilDate,
        approverEmail: context.approverEmail
          || approvalProps.approval_approver_email
          || context.customerEmail,
        approverType,
        salesDealId: projectData?.properties?.hj_sales_deal_record_id
          || context.salesDealId
          || approvalProps.response_approval_sales_deal_id
          || approvalProps.approval_sales_deal_id
      };

      const missingFields = Object.entries({
        consultantName: emailData.consultantName,
        consultantId: emailData.consultantId,
        projectId: emailData.projectId,
        fromDate: emailData.fromDate,
        untilDate: emailData.untilDate
      })
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required data for approval request email: ${missingFields.join(', ')}`);
      }

      // Generate and send customer approval request email
      const requestEmail = this.emailService.getEmailTemplate('approval', 'customerApprovalRequest', emailData);
      const result = await this.contextService.hubspot.updateContactProperties(
        approverId,
        requestEmail.properties
      );

      this.logger.info('Successfully sent approval request email', {
        approvalRequestId,
        recipient: approverId,
        approverType
      });

      return {
        success: true,
        type: 'customer_approval_request',
        recipient: approverId,
        result,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send approval request email', {
        error: error.message,
        approvalRequestId
      });
      throw error;
    }
  }

  /**
   * Send reminder email
   * @param {Object} context - Context object with approval data
   * @param {string} reminderType - Type of reminder (FirstReminder, SecondReminder, ThirdReminder)
   * @returns {Object} Reminder email result
   */
  async sendReminderEmail(context, reminderType = 'FirstReminder') {
    const { approvalRequestId, projectId, consultantId, approverId, approverType } = context;

    this.logger.info('Sending reminder email', {
      approvalRequestId,
      reminderType,
      approverType
    });

    try {
      // Get additional context data for email
      let approvalData = null;
      try {
        approvalData = await this.contextService.hubspot.getApprovalObject(approvalRequestId);
      } catch (error) {
        this.logger.warn('Approval lookup for reminder email failed, using context fallback', {
          approvalRequestId,
          error: error.message
        });
      }

      const fallbackApprovalProps = this.buildApprovalPropertySnapshot(context);
      const approvalProps = {
        ...fallbackApprovalProps,
        ...(approvalData?.properties || {})
      };

      const resolvedConsultantId = consultantId
        || approvalProps.approval_consultant_id
        || context.consultantId;

      const resolvedProjectId = projectId
        || approvalProps.response_approval_project_id
        || approvalProps.approval_project_id
        || context.projectId;

      let consultantData = context.contact || null;
      if (!consultantData && resolvedConsultantId) {
        try {
          consultantData = await this.contextService.hubspot.getContact(resolvedConsultantId);
        } catch (error) {
          this.logger.warn('Consultant contact not found for reminder email, using context data', {
            consultantId: resolvedConsultantId,
            error: error.message
          });
        }
      }

      let projectData = context.project || null;
      if (!projectData && resolvedProjectId) {
        try {
          projectData = await this.contextService.hubspot.getProject(resolvedProjectId);
        } catch (error) {
          this.logger.warn('Project not found for reminder email, using context data', {
            projectId: resolvedProjectId,
            error: error.message
          });
        }
      }

      const consultantName = consultantData?.properties
        ? `${consultantData.properties.firstname || ''} ${consultantData.properties.lastname || ''}`.trim()
        : context.consultantName
          || approvalProps.approval_consultant_name;

      const fromDate = approvalProps.approval_approval_from
        || approvalProps.approval_from_date
        || approvalProps.response_approval_from_date
        || context.responseFromDate;

      const untilDate = approvalProps.approval_approval_until
        || approvalProps.approval_until_date
        || approvalProps.response_approval_until_date
        || context.responseUntilDate;

      const emailData = {
        approverId,
        projectId: resolvedProjectId,
        approvalRequestId,
        consultantName,
        consultantId: resolvedConsultantId,
        customer: approvalProps.approval_customer
          || context.customerCompanyName
          || approvalProps.response_approval_customer,
        operator: approvalProps.approval_operator
          || approvalProps.response_approval_operator
          || context.operatorName,
        wellNames: approvalProps.approval_wells || context.wellNames,
        fromDate,
        untilDate,
        approverEmail: context.approverEmail
          || approvalProps.approval_approver_email
          || context.customerEmail,
        approverType,
        salesDealId: projectData?.properties?.hj_sales_deal_record_id
          || context.salesDealId
          || approvalProps.response_approval_sales_deal_id
          || approvalProps.approval_sales_deal_id
      };

      const missingFields = Object.entries({
        consultantName: emailData.consultantName,
        consultantId: emailData.consultantId,
        projectId: emailData.projectId,
        fromDate: emailData.fromDate,
        untilDate: emailData.untilDate
      })
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required data for reminder email: ${missingFields.join(', ')}`);
      }

      // Generate and send reminder email
      const reminderEmail = this.emailService.getEmailTemplate('approval', 'reminderEmail', {
        ...emailData,
        reminderType
      });
      const result = await this.contextService.hubspot.updateContactProperties(
        approverId,
        reminderEmail.properties
      );

      this.logger.info('Successfully sent reminder email', {
        approvalRequestId,
        reminderType,
        recipient: approverId
      });

      return {
        success: true,
        type: 'reminder',
        reminderType,
        recipient: approverId,
        result,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send reminder email', {
        error: error.message,
        approvalRequestId,
        reminderType
      });
      throw error;
    }
  }

  /**
   * Get approval status
   * @param {string} approvalId - Approval ID
   * @returns {Object} Approval status
   */
  async getApprovalStatus(approvalId) {
    this.logger.info('Getting approval status', { approvalId });

    try {
      const approval = await this.contextService.hubspot.getApprovalObject(approvalId);
      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      const props = approval.properties || {};
      const status = {
        approvalId,
        status: props.approval_status || 'unknown',
        approvalDate: props.approval_date,
        approvalNotes: props.approval_notes,
        timesheetCount: props.timesheet_count,
        pdfUrl: props.pdf_url,
        pdfFileId: props.pdf_file_id,
        pdfGeneratedDate: props.pdf_generated_date,
        lastModified: approval.updatedAt,
        createdDate: approval.createdAt
      };

      this.logger.info('Retrieved approval status', status);
      return status;

    } catch (error) {
      this.logger.error('Failed to get approval status', { error: error.message, approvalId });
      throw error;
    }
  }

  /**
   * Retry failed approval
   * @param {string} approvalId - Approval ID
   * @param {Object} options - Retry options
   * @returns {Object} Retry result
   */
  async retryApproval(approvalId, options = {}) {
    this.logger.info('Retrying approval', { approvalId });

    try {
      // Get current approval status
      const currentStatus = await this.getApprovalStatus(approvalId);
      this.logger.debug('Current approval status before retry', {
        approvalId,
        currentStatus
      });

      // Reset approval status to processing
      await this.contextService.updateApproval(approvalId, {
        approval_status: 'processing',
        retry_date: new Date().toISOString(),
        last_modified: new Date().toISOString()
      });

      // Retry the approval process
      const result = await this.processApproval({
        approvalId,
        ...options
      });

      this.logger.info('Successfully retried approval', {
        approvalId,
        status: result.status
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to retry approval', { error: error.message, approvalId });
      throw error;
    }
  }

  /**
   * Generate Field Ticket PDFs using WF-26 Actions 6 & 7 logic
   * Uses the existing PDF generator service for professional PDF generation
   * @param {string} approvalId - Approval object ID
   * @param {Object} options - Generation options
   * @param {boolean} options.generateCustomer - Whether to generate customer PDF (default: true)
   * @param {boolean} options.generateConsultant - Whether to generate consultant PDF (default: true)
   * @returns {Promise<Object>} PDF generation results
   */
  async generateWF26FieldTickets(approvalId, options = {}) {
    try {
      this.logger.info('Generating WF-26 Field Ticket PDFs using existing PDF generator', {
        approvalId,
        options
      });

      // Validate request
      const validation = this.wf26PdfGeneration.validateRequest(approvalId);
      if (!validation.isValid) {
        throw new Error(`Invalid PDF generation request: ${validation.errors.join(', ')}`);
      }

      // Generate PDFs using existing PDF generator service
      const result = await this.wf26PdfGeneration.generateBothFieldTickets(approvalId, options);

      this.logger.info('WF-26 Field Ticket PDFs generated successfully', {
        approvalId,
        customerGenerated: !!result.results.customer,
        consultantGenerated: !!result.results.consultant
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to generate WF-26 Field Ticket PDFs', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Generate Invoice and Bill Numbers using WF-26 Actions 4 & 5 logic
   * Creates invoice and bill numbers with format: [SEQUENTIAL_COUNTER]-[CUSTOMER_ID]-[FROM_DATE]-[UNTIL_DATE]
   * @param {string} approvalId - Approval object ID
   * @param {Object} options - Generation options
   * @param {boolean} options.generateInvoice - Whether to generate invoice number (default: true)
   * @param {boolean} options.generateBill - Whether to generate bill number (default: true)
   * @returns {Promise<Object>} Invoice and bill number generation results
   */
  async generateWF26InvoiceBillNumbers(approvalId, options = {}) {
    try {
      this.logger.info('Generating WF-26 Invoice and Bill Numbers', {
        approvalId,
        options
      });

      // Validate request
      const validation = this.invoiceBillNumberService.validateRequest(approvalId);
      if (!validation.isValid) {
        throw new Error(`Invalid invoice/bill number generation request: ${validation.errors.join(', ')}`);
      }

      // Generate numbers using invoice/bill number service
      const result = await this.invoiceBillNumberService.generateBothNumbers(approvalId, options);

      this.logger.info('WF-26 Invoice and Bill Numbers generated successfully', {
        approvalId,
        invoiceGenerated: !!result.results.invoice,
        billGenerated: !!result.results.bill
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to generate WF-26 Invoice and Bill Numbers', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Determine approver first/last name components for downstream integrations
   * @param {string} name - Full approver name
   * @param {string} email - Approver email (fallback)
   * @returns {{ firstName: string, lastName: string }} Name parts
   */
  resolveApproverNameParts(name, email) {
    if (name && typeof name === 'string' && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) {
        return {
          firstName: parts[0],
          lastName: 'Team'
        };
      }

      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || 'Team'
      };
    }

    if (email && typeof email === 'string' && email.includes('@')) {
      const localPart = email.split('@')[0];
      return {
        firstName: localPart,
        lastName: 'Team'
      };
    }

    return {
      firstName: 'H&J',
      lastName: 'Team'
    };
  }

  /**
   * Sanitize context for response (remove sensitive data)
   * @param {Object} context - Context object
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    const sanitized = { ...context };

    // Remove sensitive fields
    delete sanitized.consultantIdEncrypted;
    delete sanitized.sourceNotes;
    delete sanitized.approvalObjectId;
    delete sanitized.approval;

    // Remove detailed timesheet data if present
    if (sanitized.timesheets) {
      sanitized.timesheetCount = sanitized.timesheets.length;
      delete sanitized.timesheets;
    }

    return sanitized;
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    try {
      const pdfHealth = await this.pdfIntegration.checkHealth();

      return {
        service: 'approval-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dependencies: {
          pdfGenerator: pdfHealth,
          hubspot: 'connected' // Assume connected if no errors
        }
      };

    } catch (error) {
      return {
        service: 'approval-api',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = ApprovalService;
