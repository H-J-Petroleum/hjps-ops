/**
 * Consultant PDF Template
 * Extends BasePDFTemplate with consultant-specific functionality
 */

const BasePDFTemplate = require('./basePDFTemplate');

class ConsultantPDFTemplate extends BasePDFTemplate {
  /**
   * Get PDF type name
   * @returns {string} PDF type name
   */
  getPDFType() {
    return 'consultant';
  }

  /**
   * Get logo position for consultant PDF (left-aligned)
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} logoDims - Logo dimensions
   * @returns {Object} Logo position {x, y}
   */
  getLogoPosition() {
    return {
      x: 50,
      y: 0
    };
  }

  /**
   * Add title for consultant PDF
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {number} startY - Starting Y position
   * @param {Object} logoPosition - Logo position
   */
  addTitle(doc, startY) {
    // Add title to the right of logo
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Consultant Timesheet', 220, startY + 10, { align: 'left' });
  }

  /**
   * Check if consultant PDF uses consultant prices (true)
   * @returns {boolean} True for consultant PDF
   */
  useConsultantPrices() {
    return true;
  }

  /**
   * Prepare timesheet table data for consultant PDF (uses consultant prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Array} Processed timesheet data
   */
  prepareTimesheetTableData(timesheetData) {
    return this.dataProcessor.prepareConsultantTimesheetTableData(timesheetData);
  }

  /**
   * Calculate total amount for consultant PDF (uses consultant prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {number} Total amount
   */
  calculateTotalAmount(timesheetData) {
    return this.dataProcessor.calculateConsultantTotalAmount(timesheetData);
  }

  /**
   * Add fallback approval info when table rendering fails
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} approvalData - Approval data object
   */
  addFallbackApprovalInfo(doc, approvalData) {
    doc.fontSize(9).font('Helvetica');
    doc.text(`Consultant: ${approvalData.timesheet_consultant_full_name || 'N/A'}`, 50, doc.y);
    doc.text(`Project: ${approvalData.approval_project_name || 'N/A'}`, 50, doc.y);
    doc.moveDown(1);
  }
}

module.exports = ConsultantPDFTemplate;
