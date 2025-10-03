/**
 * Base PDF Template Class
 * Contains common functionality shared between Customer and Consultant PDF templates
 */

const PDFDocument = require('pdfkit-table');
const ConfigManager = require('../services/configManager');
const logger = require('../utils/logger');
const signatureService = require('../services/signatureService');
const logoService = require('../services/logoService');
const Formatters = require('../utils/formatters');
const DataProcessingService = require('../services/dataProcessingService');
const TableRenderingService = require('../services/tableRenderingService');

class BasePDFTemplate {
  constructor() {
    this.configManager = new ConfigManager();
    this.dataProcessor = new DataProcessingService();
    this.tableRenderer = new TableRenderingService();
  }

  /**
   * Create a new PDF document
   * @returns {PDFDocument} PDFKit document instance
   */
  createDoc() {
    const pdfConfig = this.configManager.getPDFConfig();
    return new PDFDocument({ 
      size: pdfConfig.pageSize, 
      margin: pdfConfig.margin 
    });
  }

  /**
   * Main render method - common structure for all PDF types
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  async render(doc, approvalData) {
    await this.addHeader(doc, approvalData);
    await this.addApprovalInfo(doc, approvalData);
    await this.addServiceSummary(doc, approvalData.timesheetData || []);
    await this.addWellBreakdown(doc, approvalData.timesheetData || []);
    await this.addTimesheetTable(doc, approvalData.timesheetData || []);
    await this.addSignature(doc, approvalData);
    doc.end();
  }

  /**
   * Add header with logo and title
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  async addHeader(doc) {
    const startY = doc.y;
    let logoHeight = 0;

    // Add H&J logo
    if (logoService.hasLogo()) {
      try {
        const logo = logoService.getLogo();
        const logoDims = logoService.getDimensions();
        
        // Use template-specific logo positioning
        const logoPosition = this.getLogoPosition(doc, logoDims);
        doc.image(logo, logoPosition.x, startY, { width: logoDims.width });
        logoHeight = logoDims.height;
        logger.info(`H&J logo added to ${this.getPDFType()} PDF`, logoDims);
        
        // Add title using template-specific positioning
        this.addTitle(doc, startY, logoPosition);
      } catch (e) {
        logger.warn(`Failed to add H&J logo to ${this.getPDFType()} PDF`, { error: e.message });
      }
    }

    // Move cursor below the logo
    doc.y = startY + Math.max(logoHeight, 30) + 10;
  }

  /**
   * Add approval information table
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  async addApprovalInfo(doc, approvalData) {
    try {
      // Prepare approval data using the data processor
      const processedApprovalData = this.dataProcessor.prepareApprovalData(approvalData, approvalData.timesheetData || []);
      
      // Render approval info table using the table renderer
      await this.tableRenderer.renderApprovalInfoTable(doc, processedApprovalData);
    } catch (error) {
      logger.error('Error rendering approval info table', { error: error.message });
      // Fallback to simple text
      this.addFallbackApprovalInfo(doc, approvalData);
    }
  }

  /**
   * Add service summary table
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Array} timesheetData - Array of timesheet objects
   */
  async addServiceSummary(doc, timesheetData) {
    try {
      // Calculate service totals using the data processor with PDF type
      const serviceTotals = this.dataProcessor.calculateServiceTotals(timesheetData, this.getPDFType());
      
      // Render service summary table using the table renderer
      await this.tableRenderer.renderServiceSummaryTable(doc, serviceTotals);
    } catch (error) {
      logger.error('Error rendering service summary table', { error: error.message });
    }
  }

  /**
   * Add well breakdown table
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Array} timesheetData - Array of timesheet objects
   */
  async addWellBreakdown(doc, timesheetData) {
    try {
      // Calculate well breakdown using the data processor with PDF type
      const wellBreakdown = this.dataProcessor.calculateWellBreakdown(timesheetData, this.getPDFType());
      
      // Render well breakdown table using the table renderer
      await this.tableRenderer.renderWellBreakdownTable(doc, wellBreakdown);
    } catch (error) {
      logger.error('Error rendering well breakdown table', { error: error.message });
    }
  }

  /**
   * Add detailed timesheet table
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Array} timesheetData - Array of timesheet objects
   */
  async addTimesheetTable(doc, timesheetData) {
    try {
      // Prepare timesheet table data using the data processor
      const tableData = this.prepareTimesheetTableData(timesheetData);
      
      // Calculate total amount
      const totalAmount = this.calculateTotalAmount(timesheetData);
      
      // Render timesheet table using the table renderer
      await this.tableRenderer.renderTimesheetTable(doc, tableData, totalAmount);
    } catch (error) {
      logger.error('Error rendering timesheet table', { error: error.message });
      throw error;
    }
  }

  /**
   * Add signature section
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  async addSignature(doc, approvalData) {
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica').text('Approved by:', 50, doc.y);

    const approverName = approvalData.approval_approver_name || 'N/A';

    // Add space for signature (reduced by ~33% from 4 to 2.7 lines)
    doc.moveDown(2.7);
    const signatureY = doc.y;

    // Use signature service to process signature
    const signature = signatureService.processSignature(approverName, approvalData.signature_new);

    if (signature) {
      if (signature.type === 'text') {
        // Handle text signature
        doc.fontSize(10).text(signature.content, 50, signatureY);
        logger.info('Text signature added', {
          approverName,
          signatureType: signature.type,
          content: signature.content
        });
      } else if (signature.buffer) {
        // Handle image signature
        try {
          // Place signature above the approver name
          doc.image(signature.buffer, { fit: [120, 40], x: 50, y: signatureY - 15 });
          logger.info('Image signature added successfully', {
            approverName,
            signatureType: signature.type,
            signatureName: signature.name
          });
        } catch (e) {
          logger.warn('Image signature processing failed', {
            message: e.message,
            approverName,
            signatureType: signature.type
          });
          // Fallback to text signature
          doc.fontSize(10).text(`Signature: ${approverName}`, 50, signatureY);
        }
      }
    } else if (approvalData.signature_new) {
      // Use the provided signature for other approvers
      try {
        const buffer = this.processSignature(approvalData.signature_new);
        doc.image(buffer, { fit: [120, 40], x: 50, y: signatureY - 15 });
      } catch (e) {
        logger.warn('Signature processing failed', { message: e.message });
      }
    }

    // Add approver name below signature (closer positioning)
    doc.font('Helvetica-Bold').text(approverName, 50, signatureY + 20);
  }

  /**
   * Process signature from base64 data
   * @param {string} signatureBase64 - Base64 encoded signature
   * @returns {Buffer} Signature buffer
   */
  processSignature(signatureBase64) {
    const base64Data = String(signatureBase64).replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  // ===== ABSTRACT METHODS (must be implemented by subclasses) =====

  /**
   * Get PDF type name (for logging and identification)
   * @returns {string} PDF type name
   */
  getPDFType() {
    throw new Error('getPDFType() must be implemented by subclass');
  }

  /**
   * Get logo position for this PDF type
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} logoDims - Logo dimensions
   * @returns {Object} Logo position {x, y}
   */
  getLogoPosition() {
    throw new Error('getLogoPosition() must be implemented by subclass');
  }

  /**
   * Add title for this PDF type
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {number} startY - Starting Y position
   * @param {Object} logoPosition - Logo position
   */
  addTitle() {
    throw new Error('addTitle() must be implemented by subclass');
  }

  /**
   * Check if this PDF type uses consultant prices
   * @returns {boolean} True if uses consultant prices
   */
  useConsultantPrices() {
    throw new Error('useConsultantPrices() must be implemented by subclass');
  }

  /**
   * Prepare timesheet table data for this PDF type
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Array} Processed timesheet data
   */
  prepareTimesheetTableData() {
    throw new Error('prepareTimesheetTableData() must be implemented by subclass');
  }

  /**
   * Calculate total amount for this PDF type
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {number} Total amount
   */
  calculateTotalAmount(timesheetData) {
    return this.dataProcessor.calculateTotalAmount(timesheetData, this.getPDFType());
  }

  /**
   * Add fallback approval info when table rendering fails
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  addFallbackApprovalInfo(doc, approvalData) {
    doc.fontSize(9).font('Helvetica');
    doc.text(`Approval Request: ${approvalData.approval_request_id || 'N/A'}`, 50, doc.y);
    doc.text(`Project ID: ${approvalData.approval_project_id || 'N/A'}`, 50, doc.y);
    doc.moveDown(1);
  }

  // ===== DELEGATED METHODS =====

  /**
   * Format date and time
   * @param {string} date - Date string
   * @param {string} time - Time string
   * @returns {string} Formatted date/time
   */
  formatDateTime(date, time) {
    return Formatters.formatDateTime(date, time);
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    return Formatters.formatCurrency(amount);
  }

  /**
   * Calculate date range from timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {string} Formatted date range
   */
  calculateDateRange(timesheetData) {
    return this.dataProcessor.calculateDateRange(timesheetData);
  }
}

module.exports = BasePDFTemplate;
