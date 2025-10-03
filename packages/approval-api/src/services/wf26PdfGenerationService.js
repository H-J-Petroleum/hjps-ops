/**
 * WF-26 PDF Generation Service
 * Implements Actions 6 & 7 from WF-26: Field Ticket PDF Generation
 * 
 * Uses the existing PDF generator service to create professional PDFs from approval data
 * instead of the old chunking approach. This provides better quality and maintainability.
 * 
 * Action 6: Customer Field Ticket PDF
 * - Generates PDF using existing PDF generator (customer type)
 * - Uploads to HubSpot Files in 'ApprovedFieldTickets' folder
 * - Updates approval object with field_ticket_id and field_ticket_url
 * 
 * Action 7: Consultant Field Ticket PDF  
 * - Generates PDF using existing PDF generator (consultant type)
 * - Uploads to HubSpot Files in 'BillForConsultants' folder
 * - Updates approval object with consultant_field_ticket_id and consultant_field_ticket_url
 */

const logger = require('../utils/logger');
const PdfIntegrationService = require('./pdfIntegrationService');

class WF26PdfGenerationService {
  constructor() {
    this.logger = logger;
    this.pdfIntegrationService = new PdfIntegrationService();
  }

  /**
   * Generate Customer Field Ticket PDF (WF-26 Action 6)
   * Uses the existing PDF generator service to create a professional PDF
   * @param {string} approvalId - Approval object ID
   * @returns {Promise<Object>} Result with fileId and url
   */
  async generateCustomerFieldTicket(approvalId) {
    try {
      this.logger.info('Generating Customer Field Ticket PDF using existing PDF generator', {
        approvalId,
        pdfType: 'customer'
      });

      // Use the existing PDF generator service
      const result = await this.pdfIntegrationService.generatePDF({
        approvalId,
        pdfType: 'customer'
      });

      this.logger.info('Customer Field Ticket PDF generated successfully', {
        approvalId,
        fileId: result.fileId,
        url: result.url
      });

      return {
        success: true,
        pdfType: 'customer',
        fileId: result.fileId,
        url: result.url,
        fileName: result.fileName,
        folderPath: result.folderPath
      };

    } catch (error) {
      this.logger.error('Failed to generate Customer Field Ticket PDF', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Generate Consultant Field Ticket PDF (WF-26 Action 7)
   * Uses the existing PDF generator service to create a professional PDF
   * @param {string} approvalId - Approval object ID
   * @returns {Promise<Object>} Result with fileId and url
   */
  async generateConsultantFieldTicket(approvalId) {
    try {
      this.logger.info('Generating Consultant Field Ticket PDF using existing PDF generator', {
        approvalId,
        pdfType: 'consultant'
      });

      // Use the existing PDF generator service
      const result = await this.pdfIntegrationService.generatePDF({
        approvalId,
        pdfType: 'consultant'
      });

      this.logger.info('Consultant Field Ticket PDF generated successfully', {
        approvalId,
        fileId: result.fileId,
        url: result.url
      });

      return {
        success: true,
        pdfType: 'consultant',
        fileId: result.fileId,
        url: result.url,
        fileName: result.fileName,
        folderPath: result.folderPath
      };

    } catch (error) {
      this.logger.error('Failed to generate Consultant Field Ticket PDF', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Generate both Customer and Consultant PDFs (WF-26 Actions 6 & 7)
   * Uses the existing PDF generator service for both PDF types
   * @param {string} approvalId - Approval object ID
   * @param {Object} options - Generation options
   * @param {boolean} options.generateCustomer - Whether to generate customer PDF (default: true)
   * @param {boolean} options.generateConsultant - Whether to generate consultant PDF (default: true)
   * @returns {Promise<Object>} Results for both PDFs
   */
  async generateBothFieldTickets(approvalId, options = {}) {
    try {
      const validation = this.validateRequest(approvalId);
      if (!validation.isValid) {
        throw new Error(`Invalid PDF generation request: ${validation.errors.join(', ')}`);
      }

      const { generateCustomer = true, generateConsultant = true } = options;

      this.logger.info('Generating both Customer and Consultant Field Ticket PDFs using existing PDF generator', {
        approvalId,
        generateCustomer,
        generateConsultant
      });

      const results = {};

      // Generate Customer Field Ticket (Action 6)
      if (generateCustomer) {
        results.customer = await this.generateCustomerFieldTicket(approvalId);
      }

      // Generate Consultant Field Ticket (Action 7)
      if (generateConsultant) {
        results.consultant = await this.generateConsultantFieldTicket(approvalId);
      }

      this.logger.info('Both Field Ticket PDFs generated successfully', {
        approvalId,
        customerGenerated: !!results.customer,
        consultantGenerated: !!results.consultant
      });

      return {
        success: true,
        results,
        approvalId
      };

    } catch (error) {
      this.logger.error('Failed to generate Field Ticket PDFs', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Validate PDF generation request
   * @param {string} approvalId - Approval object ID
   * @returns {Object} Validation result
   */
  validateRequest(approvalId) {
    const errors = [];

    if (approvalId === null || approvalId === undefined || approvalId === '') {
      errors.push('approvalId is required');
    } else if (typeof approvalId !== 'string') {
      errors.push('approvalId must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = WF26PdfGenerationService;
