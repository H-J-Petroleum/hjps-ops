/**
 * PDF Generation Factory
 * Centralized orchestration for PDF generation with template management
 */

const logger = require('../utils/logger');
const CustomerPDFTemplate = require('../templates/customerPDF');
const ConsultantPDFTemplate = require('../templates/consultantPDF');

class PDFGenerationFactory {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize all available PDF templates
   */
  initializeTemplates() {
    this.templates.set('customer', new CustomerPDFTemplate());
    this.templates.set('consultant', new ConsultantPDFTemplate());
    this.templates.set('invoice', new ConsultantPDFTemplate()); // Alias for consultant
    this.templates.set('internal', new CustomerPDFTemplate()); // Reuse customer for now
    
    logger.info('PDF Generation Factory initialized', {
      availableTypes: Array.from(this.templates.keys())
    });
  }

  /**
   * Create a PDF template instance for the specified type
   * @param {string} pdfType - PDF type (customer, consultant, invoice, internal)
   * @returns {BasePDFTemplate} Template instance
   * @throws {Error} If PDF type is not supported
   */
  createTemplate(pdfType) {
    const normalizedType = this.normalizePDFType(pdfType);
    
    if (!this.templates.has(normalizedType)) {
      const availableTypes = Array.from(this.templates.keys());
      throw new Error(`Unsupported PDF type: ${pdfType}. Available types: ${availableTypes.join(', ')}`);
    }

    const template = this.templates.get(normalizedType);
    logger.info('PDF template created', { 
      requestedType: pdfType, 
      normalizedType, 
      templateClass: template.constructor.name 
    });
    
    return template;
  }

  /**
   * Generate a PDF buffer for the specified type and data
   * @param {string} pdfType - PDF type
   * @param {Object} approvalData - Approval data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(pdfType, approvalData) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting PDF generation', { pdfType, approvalId: approvalData.approval_request_id });
      
      const template = this.createTemplate(pdfType);
      const doc = template.createDoc();
      
      // Generate PDF buffer
      const pdfBuffer = await this.getPDFBufferFromDoc(doc, (d) => template.render(d, approvalData));
      
      const duration = Date.now() - startTime;
      logger.info('PDF generation completed', { 
        pdfType, 
        approvalId: approvalData.approval_request_id,
        bufferSize: pdfBuffer.length,
        duration: `${duration}ms`
      });
      
      return pdfBuffer;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('PDF generation failed', { 
        pdfType, 
        approvalId: approvalData.approval_request_id,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Get PDF buffer from document with error handling
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Function} renderFn - Render function
   * @returns {Promise<Buffer>} PDF buffer
   */
  getPDFBufferFromDoc(doc, renderFn) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
      
      Promise.resolve()
        .then(() => renderFn(doc))
        .catch((err) => reject(err));
    });
  }

  /**
   * Normalize PDF type (handle aliases and case variations)
   * @param {string} pdfType - Raw PDF type
   * @returns {string} Normalized PDF type
   */
  normalizePDFType(pdfType) {
    if (!pdfType || typeof pdfType !== 'string') {
      throw new Error('PDF type must be a non-empty string');
    }

    const normalized = pdfType.toLowerCase().trim();
    
    // Handle aliases
    const aliases = {
      'invoice': 'consultant',
      'timesheet': 'consultant',
      'field-ticket': 'customer',
      'field_ticket': 'customer'
    };

    return aliases[normalized] || normalized;
  }

  /**
   * Get available PDF types
   * @returns {Array<string>} Array of available PDF types
   */
  getAvailableTypes() {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a PDF type is supported
   * @param {string} pdfType - PDF type to check
   * @returns {boolean} True if supported
   */
  isSupportedType(pdfType) {
    try {
      const normalized = this.normalizePDFType(pdfType);
      return this.templates.has(normalized);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get template information for a PDF type
   * @param {string} pdfType - PDF type
   * @returns {Object} Template information
   */
  getTemplateInfo(pdfType) {
    const normalized = this.normalizePDFType(pdfType);
    const template = this.templates.get(normalized);
    
    if (!template) {
      throw new Error(`Template not found for type: ${pdfType}`);
    }

    return {
      type: normalized,
      className: template.constructor.name,
      usesConsultantPrices: template.useConsultantPrices ? template.useConsultantPrices() : false,
      pdfType: template.getPDFType ? template.getPDFType() : normalized
    };
  }

  /**
   * Validate PDF generation request
   * @param {string} pdfType - PDF type
   * @param {Object} approvalData - Approval data
   * @returns {Object} Validation result
   */
  validateRequest(pdfType, approvalData) {
    const errors = [];

    // Validate PDF type
    if (!pdfType) {
      errors.push('PDF type is required');
    } else if (!this.isSupportedType(pdfType)) {
      errors.push(`Unsupported PDF type: ${pdfType}. Available types: ${this.getAvailableTypes().join(', ')}`);
    }

    // Validate approval data
    if (!approvalData) {
      errors.push('Approval data is required');
    } else {
      if (!approvalData.approval_request_id) {
        errors.push('Approval request ID is required');
      }
      if (!approvalData.timesheetData || !Array.isArray(approvalData.timesheetData)) {
        errors.push('Timesheet data is required and must be an array');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PDFGenerationFactory;
