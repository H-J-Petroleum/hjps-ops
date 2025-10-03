/**
 * PDF Service Client
 * Wrapper around @hjps/toolkit-pdf for approval-api integration
 * Provides backward-compatible CommonJS interface
 */

const logger = require('../../utils/logger');
const approvalConfig = require('../../config/approval');

// Lazy-load toolkit-pdf (ES module) using dynamic import
let PDFClient = null;
let ValueFormattingService = null;

async function loadToolkit() {
  if (!PDFClient) {
    const toolkit = await import('@hjps/toolkit-pdf');
    PDFClient = toolkit.PDFClient;
    ValueFormattingService = toolkit.ValueFormattingService;
  }
}

class PDFServiceClient {
  constructor() {
    this.logger = logger;
    this.config = approvalConfig.pdf;
    this.client = null;
    this.valueFormatter = null;
    this.initialized = false;
  }

  /**
   * Initialize the PDF client (lazy initialization)
   */
  async _ensureInitialized() {
    if (this.initialized) {
      return;
    }

    await loadToolkit();

    this.client = new PDFClient({
      generatorUrl: this.config.generatorUrl,
      timeout: this.config.timeout,
      useMock: this.config.useMock,
      types: this.config.types,
      defaultType: this.config.defaultType,
      logger: this.logger
    });

    this.valueFormatter = new ValueFormattingService({ logger: this.logger });
    this.initialized = true;
  }

  /**
   * Generate PDF for approval
   * @param {Object} options - PDF generation options
   * @param {string} options.approvalId - Approval ID
   * @param {string} options.pdfType - PDF type (customer, consultant, invoice, internal)
   * @param {Object} options.approvalData - Approval data for PDF generation
   * @param {Array} options.timesheetData - Timesheet data for PDF generation
   * @returns {Promise<Object>} PDF generation result
   */
  async generatePDF(options = {}) {
    await this._ensureInitialized();

    const {
      approvalId,
      pdfType = this.config.defaultType,
      approvalData = {},
      timesheetData = []
    } = options;

    this.logger.info('Generating PDF via toolkit', {
      approvalId,
      pdfType,
      hasApprovalData: Object.keys(approvalData).length > 0,
      timesheetCount: timesheetData.length
    });

    try {
      // Prepare data using local methods (backward compatibility)
      const preparedRequest = {
        approvalId,
        pdfType,
        approvalData: this.prepareApprovalData(approvalData),
        timesheetData: this.prepareTimesheetData(timesheetData)
      };

      // Use toolkit client
      const result = await this.client.generatePDF(preparedRequest);

      this.logger.info('Successfully generated PDF via toolkit', {
        approvalId,
        pdfType,
        fileId: result.fileId,
        url: result.url
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to generate PDF via toolkit', {
        error: error.message,
        approvalId,
        pdfType
      });
      throw error;
    }
  }

  /**
   * Get PDF status
   * @param {string} fileId - PDF file ID
   * @returns {Promise<Object>} PDF status information
   */
  async getPDFStatus(fileId) {
    await this._ensureInitialized();

    try {
      const status = await this.client.getPDFStatus(fileId);

      this.logger.debug('Retrieved PDF status via toolkit', {
        fileId,
        status: status.status
      });

      return status;

    } catch (error) {
      this.logger.error('Failed to get PDF status via toolkit', {
        error: error.message,
        fileId
      });
      throw error;
    }
  }

  /**
   * Retry PDF generation
   * @param {string} approvalId - Approval ID
   * @param {string} pdfType - PDF type
   * @returns {Promise<Object>} PDF generation result
   */
  async retryPDFGeneration(approvalId, pdfType = this.config.defaultType) {
    await this._ensureInitialized();

    this.logger.info('Retrying PDF generation via toolkit', { approvalId, pdfType });

    try {
      const result = await this.client.retryPDFGeneration(approvalId, pdfType);

      this.logger.info('Successfully retried PDF generation via toolkit', {
        approvalId,
        pdfType,
        fileId: result.fileId
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to retry PDF generation via toolkit', {
        error: error.message,
        approvalId,
        pdfType
      });
      throw error;
    }
  }

  /**
   * Check PDF generator health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    await this._ensureInitialized();

    try {
      const health = await this.client.checkHealth();

      return {
        healthy: health.healthy,
        status: health.status,
        version: health.version,
        uptime: health.uptime
      };

    } catch (error) {
      this.logger.error('PDF generator health check failed via toolkit', {
        error: error.message
      });

      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare approval data for PDF generation
   * Maintains backward compatibility with existing data structure
   * @param {Object} approvalData - Raw approval data
   * @returns {Object} Prepared approval data
   */
  prepareApprovalData(approvalData) {
    return {
      approvalId: approvalData.approvalId || approvalData.hs_object_id,
      approvalStatus: approvalData.approval_status,
      approvalDate: approvalData.approval_date,
      approvalNotes: approvalData.approval_notes,
      projectId: approvalData.projectId,
      projectName: approvalData.projectName,
      customerEmail: approvalData.customerEmail,
      customerName: approvalData.operatorName,
      companyName: approvalData.customerCompanyName,
      dealId: approvalData.salesDealId,
      dealName: approvalData.projectName,
      dealAmount: approvalData.dealAmount,
      consultantId: approvalData.consultantId,
      consultantName: approvalData.consultantName,
      consultantEmail: approvalData.consultantEmail,
      timesheetIds: approvalData.approvalTimesheetIds || approvalData.timesheet_ids,
      totalHours: approvalData.totalHours,
      totalAmount: approvalData.totalAmount,
      createdDate: approvalData.createdate,
      modifiedDate: approvalData.hs_lastmodifieddate
    };
  }

  /**
   * Prepare timesheet data for PDF generation
   * Uses toolkit's ValueFormattingService for formatting
   * @param {Array} timesheetData - Raw timesheet data
   * @returns {Array} Prepared timesheet data
   */
  prepareTimesheetData(timesheetData) {
    if (!Array.isArray(timesheetData)) {
      return [];
    }

    return timesheetData.map(timesheet => {
      const props = timesheet.properties || {};
      const quantityRaw = parseFloat(props.timesheet_quantity ?? props.hours_worked) || 0;
      const priceRaw = parseFloat(
        props.timesheet_hj_price
        ?? props.timesheet_price
        ?? props.hourly_rate
      ) || 0;
      const totalRaw = parseFloat(
        props.timesheet_hj_total_price
        ?? props.timesheet_total_price
        ?? props.total_amount
        ?? quantityRaw * priceRaw
      ) || 0;

      const unit = this.valueFormatter.deriveUnit(props);
      const unitDisplay = this.valueFormatter.getUnitDisplay(unit);
      const serviceName = props.timesheet_job_service || props.service || props.description || '';

      return {
        timesheetId: timesheet.id || props.hs_object_id,
        consultantId: props.timesheet_consultant_id || props.consultant_id,
        consultantName: props.timesheet_consultant_full_name || props.consultant_name,
        workDate: props.timesheet_start_date || props.work_date,
        hoursWorked: parseFloat(props.timesheet_quantity ?? props.hours_worked) || 0,
        hourlyRate: priceRaw,
        totalAmount: totalRaw,
        description: props.description || serviceName,
        status: props.timesheet_status,
        approvalId: props.approval_id || props.timesheet_approval_request_id,
        createdDate: timesheet.createdAt,
        modifiedDate: timesheet.updatedAt,

        // Enhanced fields for downstream consumers (using toolkit formatter)
        serviceName,
        serviceLabel: this.valueFormatter.labelWithUnit(serviceName, unit),
        unit,
        unitDisplay,
        quantity: quantityRaw,
        quantityFormatted: this.valueFormatter.formatQuantity(quantityRaw),
        priceFormatted: this.valueFormatter.formatCurrency(priceRaw),
        totalAmountFormatted: this.valueFormatter.formatCurrency(totalRaw),
        raw: props
      };
    });
  }

  /**
   * Validate PDF generation request
   * @param {Object} options - PDF generation options
   * @returns {Object} Validation result
   */
  async validatePDFRequest(options) {
    await this._ensureInitialized();
    return this.client.validatePDFRequest(options);
  }

  /**
   * Get supported PDF types
   * @returns {Array} Array of supported PDF types
   */
  getSupportedTypes() {
    return [...this.config.types];
  }

  /**
   * Get PDF generator configuration
   * @returns {Object} PDF generator configuration
   */
  getConfig() {
    return {
      baseURL: this.config.generatorUrl,
      timeout: this.config.timeout,
      supportedTypes: this.config.types,
      defaultType: this.config.defaultType,
      useMock: this.config.useMock
    };
  }
}

module.exports = PDFServiceClient;
