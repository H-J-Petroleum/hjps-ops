/**
 * Customer PDF Template
 * Extends BasePDFTemplate with customer-specific functionality
 */

const BasePDFTemplate = require('./basePDFTemplate');

class CustomerPDFTemplate extends BasePDFTemplate {
  /**
   * Get PDF type name
   * @returns {string} PDF type name
   */
  getPDFType() {
    return 'customer';
  }

  /**
   * Get logo position for customer PDF (centered with title)
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {Object} logoDims - Logo dimensions
   * @returns {Object} Logo position {x, y}
   */
  getLogoPosition(doc, logoDims) {
    const pageCenter = doc.page.width / 2;
    // Position logo so its right edge is at center
    return {
      x: pageCenter - logoDims.width,
      y: 0
    };
  }

  /**
   * Add title for customer PDF
   * @param {PDFDocument} doc - PDFKit document instance
   * @param {number} startY - Starting Y position
   * @param {Object} logoPosition - Logo position
   */
  addTitle(doc, startY) {
    const pageCenter = doc.page.width / 2;
    // Place "Field Ticket" just to the right of logo
    doc.fontSize(18).font('Helvetica-Bold')
      .text('Field Ticket', pageCenter + 5, startY + 10, { align: 'left' });
  }

  /**
   * Check if customer PDF uses consultant prices (false - uses H&J prices)
   * @returns {boolean} False for customer PDF
   */
  useConsultantPrices() {
    return false;
  }

  /**
   * Prepare timesheet table data for customer PDF (uses H&J prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Array} Processed timesheet data
   */
  prepareTimesheetTableData(timesheetData) {
    return this.dataProcessor.prepareTimesheetTableData(timesheetData);
  }

  /**
   * Calculate total amount for customer PDF (uses H&J prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {number} Total amount
   */
  calculateTotalAmount(timesheetData) {
    return this.dataProcessor.calculateTotalAmount(timesheetData);
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
}

module.exports = CustomerPDFTemplate;
