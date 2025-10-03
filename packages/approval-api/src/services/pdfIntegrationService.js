/**
 * PDF Integration Service
 * Integrates with the existing PDF Generator service
 * Handles PDF generation requests and responses
 */

const axios = require('axios');
const logger = require('../utils/logger');
const approvalConfig = require('../config/approval');
const ValueFormattingService = require('../../../pdf-generator/src/services/valueFormattingService');

class PdfIntegrationService {
  constructor() {
    this.logger = logger;
    this.config = approvalConfig.pdf;
    this.baseURL = this.config.generatorUrl;
    this.timeout = this.config.timeout;
    this.useMock = this.config.useMock;
    this.valueFormatter = new ValueFormattingService();

    // Create axios instance for PDF generator communication
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('PDF Generator request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data ? 'present' : 'none'
        });
        return config;
      },
      (error) => {
        this.logger.error('PDF Generator request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('PDF Generator response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        this.logger.error('PDF Generator response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate PDF for approval
   * @param {Object} options - PDF generation options
   * @param {string} options.approvalId - Approval ID
   * @param {string} options.pdfType - PDF type (customer, consultant, invoice, internal)
   * @param {Object} options.approvalData - Approval data for PDF generation
   * @param {Object} options.timesheetData - Timesheet data for PDF generation
   * @returns {Object} PDF generation result
   */
  async generatePDF(options = {}) {
    const {
      approvalId,
      pdfType = this.config.defaultType,
      approvalData = {},
      timesheetData = []
    } = options;

    this.logger.info('Generating PDF', {
      approvalId,
      pdfType,
      hasApprovalData: Object.keys(approvalData).length > 0,
      timesheetCount: timesheetData.length
    });

    try {
      // Validate PDF type
      if (!this.config.types.includes(pdfType)) {
        throw new Error(`Invalid PDF type: ${pdfType}. Valid types: ${this.config.types.join(', ')}`);
      }

      // Prepare PDF generation request
      const pdfRequest = {
        approvalId,
        pdfType,
        approvalData: this.prepareApprovalData(approvalData),
        timesheetData: this.prepareTimesheetData(timesheetData)
      };

      if (this.useMock) {
        // For testing purposes, return a mock response instead of calling the PDF generator
        this.logger.info('Using mock PDF generation');

        const mockResponse = {
          success: true,
          fileId: `mock-file-${Date.now()}`,
          url: `https://mock-files.hjpetro.com/pdfs/mock-${approvalId}-${pdfType}.pdf`,
          folderPath: pdfType === 'customer' ? 'ApprovedFieldTickets' : 'BillForConsultants',
          timestamp: new Date().toISOString()
        };

        const result = {
          success: true,
          approvalId,
          pdfType,
          fileId: mockResponse.fileId,
          url: mockResponse.url,
          fileName: `mock-${approvalId}-${pdfType}.pdf`,
          folderPath: mockResponse.folderPath,
          generatedAt: mockResponse.timestamp
        };

        this.logger.info('Successfully generated PDF (mock)', {
          approvalId,
          pdfType,
          fileId: result.fileId,
          url: result.url
        });

        return result;
      }

      const response = await this.client.post('/api/pdf/generate', {
        approvalId: pdfRequest.approvalId,
        pdfType: pdfRequest.pdfType,
        approvalData: pdfRequest.approvalData,
        timesheetData: pdfRequest.timesheetData
      });

      const data = response.data || {};
      if (!data.success) {
        throw new Error(data.error?.message || 'PDF generator returned an unsuccessful response');
      }

      const result = {
        success: true,
        approvalId,
        pdfType,
        fileId: data.fileId,
        url: data.url,
        fileName: data.fileName || `${data.fileId || approvalId}-${pdfType}.pdf`,
        folderPath: data.folderPath,
        generatedAt: data.timestamp || new Date().toISOString()
      };

      this.logger.info('Successfully generated PDF', {
        approvalId,
        pdfType,
        fileId: result.fileId,
        url: result.url
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to generate PDF', {
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
   * @returns {Object} PDF status information
   */
  async getPDFStatus(fileId) {
    try {
      const response = await this.client.get(`/api/pdf/status/${fileId}`);

      this.logger.debug('Retrieved PDF status', {
        fileId,
        status: response.data.status
      });

      return response.data;

    } catch (error) {
      this.logger.error('Failed to get PDF status', {
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
   * @returns {Object} PDF generation result
   */
  async retryPDFGeneration(approvalId, pdfType = this.config.defaultType) {
    this.logger.info('Retrying PDF generation', { approvalId, pdfType });

    try {
      const response = await this.client.post('/api/pdf/retry', {
        approvalId,
        pdfType
      });

      if (!response.data.success) {
        throw new Error(`PDF retry failed: ${response.data.error?.message || 'Unknown error'}`);
      }

      this.logger.info('Successfully retried PDF generation', {
        approvalId,
        pdfType,
        fileId: response.data.fileId
      });

      return response.data;

    } catch (error) {
      this.logger.error('Failed to retry PDF generation', {
        error: error.message,
        approvalId,
        pdfType
      });
      throw error;
    }
  }

  /**
   * Check PDF generator health
   * @returns {Object} Health status
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');

      return {
        healthy: true,
        status: response.data.status,
        version: response.data.version,
        uptime: response.data.uptime
      };

    } catch (error) {
      this.logger.error('PDF generator health check failed', {
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

        // Enhanced fields for downstream consumers
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
  validatePDFRequest(options) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Required fields
    if (!options.approvalId) {
      validation.errors.push('approvalId is required');
      validation.isValid = false;
    }

    if (!options.pdfType) {
      validation.errors.push('pdfType is required');
      validation.isValid = false;
    }

    // Validate PDF type
    if (options.pdfType && !this.config.types.includes(options.pdfType)) {
      validation.errors.push(`Invalid pdfType: ${options.pdfType}. Valid types: ${this.config.types.join(', ')}`);
      validation.isValid = false;
    }

    // Warnings for optional but important fields
    if (!options.approvalData || Object.keys(options.approvalData).length === 0) {
      validation.warnings.push('No approval data provided - PDF may be incomplete');
    }

    if (!options.timesheetData || options.timesheetData.length === 0) {
      validation.warnings.push('No timesheet data provided - PDF may be incomplete');
    }

    this.logger.debug('PDF request validation', validation);
    return validation;
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
      baseURL: this.baseURL,
      timeout: this.timeout,
      supportedTypes: this.config.types,
      defaultType: this.config.defaultType
    };
  }
}

module.exports = PdfIntegrationService;
