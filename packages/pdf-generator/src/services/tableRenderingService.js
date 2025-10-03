/**
 * Table Rendering Service for PDF generation
 * Handles generic table rendering with smart column widths
 */

const logger = require('../utils/logger');
const Formatters = require('../utils/formatters');
const { calculateGenericSmartWidths } = require('../utils/smartColumnWidths');

class TableRenderingService {
  /**
   * Render a table with smart column widths
   * @param {Object} doc - PDFKit document instance
   * @param {Object} tableConfig - Table configuration
   * @param {Array} data - Table data
   * @param {Object} options - Rendering options
   * @returns {Promise} Promise that resolves when table is rendered
   */
  async renderTable(doc, tableConfig, data) {
    const {
      title,
      headers,
      columnConfig,
      dataMapper = (item) => item,
      prepareHeader = () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow = () => {
        doc.font('Helvetica').fontSize(9);
      },
      padding = 3,
      x = doc.page.margins.left
    } = tableConfig;

    try {
      // Add title if provided
      if (title) {
        doc.fontSize(14).font('Helvetica-Bold').text(title, 50, doc.y);
        doc.moveDown(0.5);
      }

      // Prepare data for smart width calculation
      const rows = data.map(dataMapper);

      // Calculate smart column widths
      const availableWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
      const smartWidths = calculateGenericSmartWidths(doc, headers, rows, columnConfig, availableWidth);

      // Prepare table headers
      const tableHeaders = headers.map((header, index) => ({
        label: header,
        property: columnConfig[index]?.property || `col${index}`,
        width: smartWidths[index], // smartWidths[index] is already the width value
        align: columnConfig[index]?.align || 'left'
      }));

      // Create table configuration
      const table = {
        headers: tableHeaders,
        datas: rows
      };

      // Render the table
      await doc.table(table, {
        x,
        prepareHeader,
        prepareRow,
        padding
      });

      doc.moveDown(1);
      logger.info('Table rendered successfully', { title, rowCount: rows.length });

    } catch (error) {
      logger.error('Error rendering table', {
        error: error.message,
        title: tableConfig.title,
        dataLength: data.length
      });
      throw error;
    }
  }

  /**
   * Render approval information table
   * @param {Object} doc - PDFKit document instance
   * @param {Object} approvalData - Processed approval data
   * @returns {Promise} Promise that resolves when table is rendered
   */
  async renderApprovalInfoTable(doc, approvalData) {
    const approvalRows = [
      {
        field1: 'Approval Request',
        value1: approvalData.approvalRequest,
        field2: 'Project ID',
        value2: approvalData.projectId
      },
      {
        field1: 'Consultant',
        value1: approvalData.consultant,
        field2: 'Project',
        value2: approvalData.project
      },
      {
        field1: 'Customer',
        value1: approvalData.customer,
        field2: 'Approver',
        value2: approvalData.approver
      },
      {
        field1: 'Approver Email',
        value1: approvalData.approverEmail,
        field2: 'Approver Role',
        value2: approvalData.approverRole
      },
      {
        field1: 'Date Range',
        value1: approvalData.dateRange,
        field2: 'Generated',
        value2: approvalData.generated
      }
    ];

    const tableConfig = {
      title: 'Approval Information',
      headers: ['', '', '', ''], // No visible headers
      columnConfig: [
        { property: 'field1', mustFit: false },
        { property: 'value1', mustFit: false },
        { property: 'field2', mustFit: false },
        { property: 'value2', mustFit: false }
      ],
      dataMapper: (item) => item,
      prepareRow: (_row, indexColumn) => {
        doc.font('Helvetica').fontSize(9);
        // Make field names bold (columns 0 and 2)
        if (indexColumn === 0 || indexColumn === 2) {
          doc.font('Helvetica-Bold');
        }
      }
    };

    return this.renderTable(doc, tableConfig, approvalRows);
  }

  /**
   * Render service summary table
   * @param {Object} doc - PDFKit document instance
   * @param {Array} serviceTotals - Service totals data
   * @returns {Promise} Promise that resolves when table is rendered
   */
  async renderServiceSummaryTable(doc, serviceTotals) {
    const tableConfig = {
      title: 'Service Summary',
      headers: ['Service', 'Qty', 'Total Amount', 'Date Range'],
      columnConfig: [
        { property: 'service', mustFit: false },
        { property: 'quantity', mustFit: true, align: 'right' },
        { property: 'amount', mustFit: true, align: 'right' },
        { property: 'dateRange', mustFit: false }
      ],
      dataMapper: (service) => ({
        service: service.service,
        quantity: service.quantityDisplay,
        amount: service.amountDisplay,
        dateRange: service.dateRange
      })
    };

    return this.renderTable(doc, tableConfig, serviceTotals);
  }

  /**
   * Render well breakdown table
   * @param {Object} doc - PDFKit document instance
   * @param {Array} wellBreakdown - Well breakdown data
   * @returns {Promise} Promise that resolves when table is rendered
   */
  async renderWellBreakdownTable(doc, wellBreakdown) {
    const tableConfig = {
      title: 'Well Breakdown',
      headers: ['Service', 'Well', 'AFE', 'Qty', 'Amount', 'Date Range'],
      columnConfig: [
        { property: 'service', mustFit: false },
        { property: 'well', mustFit: false },
        { property: 'afe', mustFit: true },
        { property: 'quantity', mustFit: true, align: 'right' },
        { property: 'amount', mustFit: true, align: 'right' },
        { property: 'dateRange', mustFit: false }
      ],
      dataMapper: (well) => ({
        service: well.service,
        well: well.well,
        afe: well.afe,
        quantity: well.quantityDisplay,
        amount: well.amountDisplay,
        dateRange: well.dateRange
      })
    };

    return this.renderTable(doc, tableConfig, wellBreakdown);
  }

  /**
   * Render detailed timesheet table
   * @param {Object} doc - PDFKit document instance
   * @param {Array} timesheetData - Timesheet data
   * @param {number} totalAmount - Total amount for footer
   * @returns {Promise} Promise that resolves when table is rendered
   */
  async renderTimesheetTable(doc, timesheetData, totalAmount) {
    const tableConfig = {
      title: 'Detailed Line Items',
      headers: ['#', 'Consultant', 'Service', 'Start', 'End', 'AFE', 'Well', 'Unit', 'Qty', 'Price', 'Total'],
      columnConfig: [
        { property: 'ordinal', mustFit: true, align: 'right' },
        { property: 'consultant', mustFit: false },
        { property: 'job', mustFit: false },
        { property: 'start', mustFit: true },
        { property: 'end', mustFit: true },
        { property: 'wellAfe', mustFit: true },
        { property: 'well', mustFit: false },
        { property: 'unit', mustFit: true },
        { property: 'qty', mustFit: true, align: 'right' },
        { property: 'price', mustFit: true, align: 'right' },
        { property: 'total', mustFit: true, align: 'right' }
      ],
      dataMapper: (item) => item
    };

    await this.renderTable(doc, tableConfig, timesheetData);

    // Add total footer
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTAL: ${Formatters.formatCurrency(totalAmount)}`, 0, doc.y, { align: 'right' });
    doc.moveDown(1);
  }

  /**
   * Calculate smart column widths for a table
   * @param {Object} doc - PDFKit document instance
   * @param {Array} headers - Table headers
   * @param {Array} data - Table data
   * @param {Array} columnConfig - Column configuration
   * @param {number} availableWidth - Available width for the table
   * @returns {Array} Array of calculated widths
   */
  calculateSmartWidths(doc, headers, data, columnConfig, availableWidth) {
    return calculateGenericSmartWidths(doc, headers, data, columnConfig, availableWidth);
  }

  /**
   * Prepare table headers with widths
   * @param {Array} headers - Table headers
   * @param {Array} widths - Calculated widths
   * @param {Array} columnConfig - Column configuration
   * @returns {Array} Prepared header objects
   */
  prepareTableHeaders(headers, widths, columnConfig) {
    return headers.map((header, index) => ({
      label: header,
      property: columnConfig[index]?.property || `col${index}`,
      width: widths[index],
      align: columnConfig[index]?.align || 'left'
    }));
  }
}

module.exports = TableRenderingService;
