/**
 * WF-26 Invoice and Bill Number Generation Service
 * Implements Actions 4 & 5 from WF-26: Invoice and Bill Number Generation
 * 
 * Generates invoice and bill numbers using the exact logic from the original HubSpot workflow:
 * Format: [SEQUENTIAL_COUNTER]-[CUSTOMER_ID]-[FROM_DATE]-[UNTIL_DATE]
 * 
 * Action 4: Invoice Number Generation
 * - Retrieves sequential counter from timesheet records (invoice_number_second_part)
 * - Formats dates from approval from/until dates (MM/DD/YYYY → MMDD)
 * - Generates invoice number and updates all timesheet records
 * 
 * Action 5: Bill Number Generation
 * - Uses same logic as invoice number generation
 * - Generates bill number and updates all timesheet records
 */

const logger = require('../utils/logger');
const HubspotService = require('./hubspotService');

class InvoiceBillNumberService {
  constructor(hubspotService = null) {
    this.logger = logger;
    this.contextService = hubspotService; // Renamed for clarity - accepts ApprovalContextService
    this.hubspot = this.contextService?.hubspot; // Direct access to HubSpot client
  }

  /**
   * Generate Invoice Number (WF-26 Action 4)
   * @param {string} approvalId - Approval object ID
   * @returns {Promise<Object>} Result with generated invoice number
   */
  async generateInvoiceNumber(approvalId) {
    try {
      this.logger.info('Generating Invoice Number (WF-26 Action 4)', {
        approvalId
      });

      // Get approval data and timesheet information
      const approvalData = await this.getApprovalData(approvalId);
      const timesheetData = await this.getTimesheetData(approvalData);

      // Generate the invoice number
      const invoiceNumber = this.generateNumber(
        timesheetData.sequentialCounter,
        approvalData.customerId,
        approvalData.fromDate,
        approvalData.untilDate
      );

      // Update all timesheets with the invoice number
      const updateResult = await this.updateTimesheetsWithNumber(
        timesheetData.timesheetIds,
        'invoice_number',
        invoiceNumber
      );

      this.logger.info('Invoice Number generated successfully', {
        approvalId,
        invoiceNumber,
        timesheetCount: updateResult.updatedCount
      });

      return {
        success: true,
        numberType: 'invoice',
        invoiceNumber,
        timesheetCount: updateResult.updatedCount,
        timesheetIds: timesheetData.timesheetIds
      };

    } catch (error) {
      this.logger.error('Failed to generate Invoice Number', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Generate Bill Number (WF-26 Action 5)
   * @param {string} approvalId - Approval object ID
   * @returns {Promise<Object>} Result with generated bill number
   */
  async generateBillNumber(approvalId) {
    try {
      this.logger.info('Generating Bill Number (WF-26 Action 5)', {
        approvalId
      });

      // Get approval data and timesheet information
      const approvalData = await this.getApprovalData(approvalId);
      const timesheetData = await this.getTimesheetData(approvalData);

      // Generate the bill number
      const billNumber = this.generateNumber(
        timesheetData.sequentialCounter,
        approvalData.customerId,
        approvalData.fromDate,
        approvalData.untilDate
      );

      // Update all timesheets with the bill number
      const updateResult = await this.updateTimesheetsWithNumber(
        timesheetData.timesheetIds,
        'bill_number',
        billNumber
      );

      this.logger.info('Bill Number generated successfully', {
        approvalId,
        billNumber,
        timesheetCount: updateResult.updatedCount
      });

      return {
        success: true,
        numberType: 'bill',
        billNumber,
        timesheetCount: updateResult.updatedCount,
        timesheetIds: timesheetData.timesheetIds
      };

    } catch (error) {
      this.logger.error('Failed to generate Bill Number', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Generate both Invoice and Bill Numbers (WF-26 Actions 4 & 5)
   * @param {string} approvalId - Approval object ID
   * @param {Object} options - Generation options
   * @param {boolean} options.generateInvoice - Whether to generate invoice number (default: true)
   * @param {boolean} options.generateBill - Whether to generate bill number (default: true)
   * @returns {Promise<Object>} Results for both numbers
   */
  async generateBothNumbers(approvalId, options = {}) {
    try {
      const { generateInvoice = true, generateBill = true } = options;

      this.logger.info('Generating both Invoice and Bill Numbers (WF-26 Actions 4 & 5)', {
        approvalId,
        generateInvoice,
        generateBill
      });

      const results = {};

      // Generate Invoice Number (Action 4)
      if (generateInvoice) {
        results.invoice = await this.generateInvoiceNumber(approvalId);
      }

      // Generate Bill Number (Action 5)
      if (generateBill) {
        results.bill = await this.generateBillNumber(approvalId);
      }

      this.logger.info('Both Invoice and Bill Numbers generated successfully', {
        approvalId,
        invoiceGenerated: !!results.invoice,
        billGenerated: !!results.bill
      });

      return {
        success: true,
        results,
        approvalId
      };

    } catch (error) {
      this.logger.error('Failed to generate Invoice and Bill Numbers', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Get approval data required for number generation
   * @param {string} approvalId - Approval object ID
   * @returns {Object} Approval data
   */
  async getApprovalData(approvalId) {
    try {
      const approval = await this.hubspot.getApprovalObject(approvalId);
      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      const props = approval.properties || {};

      // Extract required data
      const timesheetIdsString = props.response_approval_timesheet_ids_array;
      const fromDate = props.response_approval_from_date;
      const untilDate = props.response_approval_until_date;
      const customerId = props.quote_customer_primary_contact_id;

      // Validate required fields
      if (!timesheetIdsString) {
        throw new Error('Missing response_approval_timesheet_ids_array in approval data');
      }
      if (!fromDate) {
        throw new Error('Missing response_approval_from_date in approval data');
      }
      if (!untilDate) {
        throw new Error('Missing response_approval_until_date in approval data');
      }
      if (!customerId) {
        throw new Error('Missing quote_customer_primary_contact_id in approval data');
      }

      return {
        approvalId,
        timesheetIdsString,
        fromDate,
        untilDate,
        customerId
      };

    } catch (error) {
      this.logger.error('Failed to get approval data', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Get timesheet data including sequential counter
   * @param {Object} approvalData - Approval data
   * @returns {Object} Timesheet data with sequential counter
   */
  async getTimesheetData(approvalData) {
    try {
      const { timesheetIdsString } = approvalData;

      // Parse timesheet IDs
      const timesheetIds = timesheetIdsString.split(',').map(id => id.trim()).filter(id => id);
      if (timesheetIds.length === 0) {
        throw new Error('No valid timesheet IDs found');
      }

      // Get timesheet records to extract sequential counter
      const timesheets = await this.hubspot.getTimesheets(timesheetIds);
      if (timesheets.length === 0) {
        throw new Error('No timesheet records found');
      }

      // Get sequential counter from first timesheet
      const firstTimesheet = timesheets[0];
      const sequentialCounter = firstTimesheet.properties?.invoice_number_second_part;

      if (!sequentialCounter) {
        throw new Error('Missing invoice_number_second_part in timesheet data');
      }

      this.logger.debug('Retrieved timesheet data', {
        timesheetCount: timesheets.length,
        sequentialCounter
      });

      return {
        timesheetIds,
        timesheets,
        sequentialCounter
      };

    } catch (error) {
      this.logger.error('Failed to get timesheet data', {
        error: error.message,
        approvalData: { timesheetIdsString: approvalData.timesheetIdsString }
      });
      throw error;
    }
  }

  /**
   * Generate invoice/bill number using WF-26 logic
   * Format: [SEQUENTIAL_COUNTER]-[CUSTOMER_ID]-[FROM_DATE]-[UNTIL_DATE]
   * @param {string} sequentialCounter - Sequential counter (e.g., "0001")
   * @param {string} customerId - Customer contact ID
   * @param {string} fromDate - From date (MM/DD/YYYY format)
   * @param {string} untilDate - Until date (MM/DD/YYYY format)
   * @returns {string} Generated number
   */
  generateNumber(sequentialCounter, customerId, fromDate, untilDate) {
    try {
      // Format dates using WF-26 logic
      const formattedFromDate = this.formatDate(fromDate);
      const formattedUntilDate = this.formatDate(untilDate);

      // Generate number: [SEQUENTIAL_COUNTER]-[CUSTOMER_ID]-[FROM_DATE]-[UNTIL_DATE]
      const number = `${sequentialCounter}-${customerId}-${formattedFromDate}-${formattedUntilDate}`;

      this.logger.debug('Generated number', {
        sequentialCounter,
        customerId,
        fromDate,
        untilDate,
        formattedFromDate,
        formattedUntilDate,
        number
      });

      return number;

    } catch (error) {
      this.logger.error('Failed to generate number', {
        error: error.message,
        sequentialCounter,
        customerId,
        fromDate,
        untilDate
      });
      throw error;
    }
  }

  /**
   * Format date using WF-26 logic
   * Extract date portion before last "/" and remove all "/" characters
   * @param {string} dateString - Date string (MM/DD/YYYY format)
   * @returns {string} Formatted date (MMDD format)
   */
  formatDate(dateString) {
    try {
      if (!dateString) {
        throw new Error('Date string is required');
      }

      // Extract date portion before last "/" (removes time component if present)
      let datePart = dateString;
      const lastSlashIndex = dateString.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        datePart = dateString.substr(0, lastSlashIndex);
      }

      // Remove all "/" characters to get MMDD format
      const formattedDate = datePart.replaceAll('/', '');

      // Validate format (should be 4 characters: MMDD)
      if (formattedDate.length !== 4) {
        throw new Error(`Invalid date format: expected MMDD, got ${formattedDate}`);
      }

      return formattedDate;

    } catch (error) {
      this.logger.error('Failed to format date', {
        error: error.message,
        dateString
      });
      throw error;
    }
  }

  /**
   * Update timesheets with generated number
   * @param {Array} timesheetIds - Array of timesheet IDs
   * @param {string} propertyName - Property name (invoice_number or bill_number)
   * @param {string} number - Generated number
   * @returns {Object} Update result
   */
  async updateTimesheetsWithNumber(timesheetIds, propertyName, number) {
    try {
      this.logger.info('Updating timesheets with generated number', {
        propertyName,
        number,
        timesheetCount: timesheetIds.length
      });

      // Prepare batch update
      const timesheetUpdates = timesheetIds.map(id => ({
        id,
        properties: {
          [propertyName]: number
        }
      }));

      // Update timesheets using batch API
      const result = await this.contextService.updateTimesheets(timesheetUpdates);

      this.logger.info('Successfully updated timesheets', {
        propertyName,
        number,
        updatedCount: result.results?.length || 0
      });

      return {
        success: true,
        updatedCount: result.results?.length || 0,
        results: result.results || []
      };

    } catch (error) {
      this.logger.error('Failed to update timesheets', {
        error: error.message,
        propertyName,
        number,
        timesheetCount: timesheetIds.length
      });
      throw error;
    }
  }

  /**
   * Validate number generation request
   * @param {string} approvalId - Approval object ID
   * @returns {Object} Validation result
   */
  validateRequest(approvalId) {
    const errors = [];

    if (approvalId === null || approvalId === undefined) {
      errors.push('approvalId is required');
    } else if (typeof approvalId !== 'string') {
      errors.push('approvalId must be a string');
    } else if (approvalId.trim().length === 0) {
      errors.push('approvalId cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    try {
      // Test HubSpot connection by making a simple API call
      await this.hubspot.getApprovalObject('test');

      return {
        service: 'invoice-bill-number-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dependencies: {
          hubspot: 'connected'
        }
      };

    } catch (error) {
      return {
        service: 'invoice-bill-number-service',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = InvoiceBillNumberService;
