/**
 * Timesheet Service
 * Converts PowerShell approve-timesheet-api.ps1 to Node.js
 * Handles timesheet approval functionality
 */

const logger = require('../utils/logger');
const approvalConfig = require('../config/approval');

class TimesheetService {
  constructor(contextService) {
    this.logger = logger;
    this.contextService = contextService; // NEW: Using toolkit-based service
    this.hubspot = contextService.hubspot; // Direct access to HubSpot client
    this.config = approvalConfig;
  }

  /**
   * Approve timesheets
   * @param {Object} options - Approval options
   * @param {string} options.approvalRequestId - Approval request ID
   * @param {string} options.projectId - Project ID (optional)
   * @param {string} options.comments - Approval comments
   * @param {string} options.decision - Decision (Approve/Reject)
   * @param {Array} options.timesheetIds - Specific timesheet IDs to approve
   * @returns {Object} Approval result
   */
  async approveTimesheets(options = {}) {
    const {
      approvalRequestId,
      approvalObjectId = null,
      projectId,
      comments = 'Approved via API',
      decision = 'Approve',
      timesheetIds = null
    } = options;

    this.logger.info('Starting timesheet approval process', {
      approvalRequestId,
      projectId,
      decision,
      comments,
      timesheetIds: timesheetIds?.length || 'all'
    });

    try {
      // Get approval object to find timesheet IDs
      const approvalIdentifier = approvalObjectId || approvalRequestId;
      const approval = await this.hubspot.getApprovalObject(approvalIdentifier);
      if (!approval) {
        throw new Error(`Approval object not found: ${approvalIdentifier}`);
      }

      const approvalObjectIdResolved = approval.id;

      // Get timesheet IDs to process
      const timesheetsToProcess = timesheetIds || this.extractTimesheetIds(approval);
      if (!timesheetsToProcess || timesheetsToProcess.length === 0) {
        throw new Error('No timesheets found to process');
      }

      this.logger.info('Processing timesheets', {
        count: timesheetsToProcess.length,
        timesheetIds: timesheetsToProcess
      });

      // Get current timesheet data
      const timesheets = await this.hubspot.getTimesheets(timesheetsToProcess);
      if (!timesheets || timesheets.length === 0) {
        throw new Error('No timesheet data found');
      }

      // Prepare timesheet updates
      const timesheetUpdates = this.prepareTimesheetUpdates(timesheets, {
        decision,
        comments
      });

      // Update timesheets in batch
      await this.contextService.updateTimesheets(timesheetUpdates);

      // Update approval object
      const approvalUpdate = this.prepareApprovalUpdate(approval, {
        decision,
        comments
      });

      await this.contextService.updateApproval(approvalObjectIdResolved || approvalRequestId, approvalUpdate);

      const result = {
        success: true,
        approvalRequestId,
        decision,
        timesheetCount: timesheets.length,
        processedTimesheetIds: timesheetsToProcess,
        comments,
        timestamp: new Date().toISOString()
      };

      this.logger.info('Successfully approved timesheets', result);
      return result;

    } catch (error) {
      this.logger.error('Failed to approve timesheets', {
        error: error.message,
        approvalRequestId,
        decision
      });
      throw error;
    }
  }

  /**
   * Reject timesheets
   * @param {Object} options - Rejection options
   * @param {string} options.approvalRequestId - Approval request ID
   * @param {string} options.reason - Rejection reason
   * @param {Array} options.timesheetIds - Specific timesheet IDs to reject
   * @returns {Object} Rejection result
   */
  async rejectTimesheets(options = {}) {
    const {
      approvalRequestId,
      reason = 'Rejected via API',
      timesheetIds = null
    } = options;

    this.logger.info('Starting timesheet rejection process', {
      approvalRequestId,
      reason,
      timesheetIds: timesheetIds?.length || 'all'
    });

    return this.approveTimesheets({
      ...options,
      decision: 'Reject',
      comments: reason
    });
  }

  /**
   * Get timesheet status
   * @param {string} timesheetId - Timesheet ID
   * @returns {Object} Timesheet status information
   */
  async getTimesheetStatus(timesheetId) {
    try {
      const timesheets = await this.hubspot.getTimesheets([timesheetId]);
      if (!timesheets || timesheets.length === 0) {
        throw new Error(`Timesheet not found: ${timesheetId}`);
      }

      const timesheet = timesheets[0];
      const props = timesheet.properties || {};

      return {
        timesheetId,
        status: props.timesheet_status || 'unknown',
        approvalId: props.approval_id,
        consultantId: props.consultant_id,
        hoursWorked: props.hours_worked,
        hourlyRate: props.hourly_rate,
        totalAmount: props.total_amount,
        workDate: props.work_date,
        description: props.description,
        lastModified: timesheet.updatedAt
      };

    } catch (error) {
      this.logger.error('Failed to get timesheet status', {
        error: error.message,
        timesheetId
      });
      throw error;
    }
  }

  /**
   * Extract timesheet IDs from approval object
   * @param {Object} approval - Approval object
   * @returns {Array} Array of timesheet IDs
   */
  extractTimesheetIds(approval) {
    const props = approval.properties || {};
    // Try both property names for compatibility
    const timesheetIds = props.timesheet_ids || props.response_approval_timesheet_ids_array;

    if (!timesheetIds) {
      this.logger.warn('No timesheet IDs found in approval object');
      return [];
    }

    // Split comma-separated IDs and clean them
    const ids = timesheetIds.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    this.logger.debug('Extracted timesheet IDs', {
      raw: timesheetIds,
      parsed: ids,
      count: ids.length
    });

    return ids;
  }

  /**
   * Prepare timesheet updates for batch processing
   * @param {Array} timesheets - Array of timesheet objects
   * @param {Object} options - Update options
   * @returns {Array} Array of timesheet update objects
   */
  prepareTimesheetUpdates(timesheets, options) {
    const { decision, comments } = options;
    const status = decision === 'Approve' ? 'Approved' : 'Rejected';
    const processedDate = new Date().toISOString().split('T')[0]; // Use date only for midnight requirement

    return timesheets.map(timesheet => ({
      id: timesheet.id,
      properties: {
        timesheet_approval_status: status,
        processed_date: processedDate,
        timesheet_approval_comment: comments
      }
    }));
  }

  /**
   * Prepare approval object update
   * @param {Object} approval - Current approval object
   * @param {Object} options - Update options
   * @returns {Object} Approval update object
   */
  prepareApprovalUpdate(approval, options) {
    const { decision, comments } = options;
    const approvalStatus = decision === 'Approve' ? 'Approved' : 'Rejected';
    const processedDate = new Date().toISOString().split('T')[0]; // Use date only for midnight requirement

    const update = {
      approval_approve_reject: decision,
      approval_approval_status: approvalStatus,
      approval_processed_date: processedDate,
      response_approval_customer_comment: comments
    };

    // Add rejection reason if rejecting
    if (decision === 'Reject') {
      update.rejection_reason = comments;
    }

    return update;
  }

  /**
   * Calculate timesheet totals
   * @param {Array} timesheets - Array of timesheet objects
   * @returns {Object} Totals calculation
   */
  calculateTotals(timesheets) {
    let totalHours = 0;
    let totalAmount = 0;
    let validTimesheets = 0;

    timesheets.forEach(timesheet => {
      const props = timesheet.properties || {};
      const hours = parseFloat(props.hours_worked) || 0;
      const rate = parseFloat(props.hourly_rate) || 0;
      const amount = parseFloat(props.total_amount) || (hours * rate);

      totalHours += hours;
      totalAmount += amount;
      validTimesheets++;
    });

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      timesheetCount: validTimesheets,
      averageHours: validTimesheets > 0 ? Math.round((totalHours / validTimesheets) * 100) / 100 : 0,
      averageRate: validTimesheets > 0 ? Math.round((totalAmount / totalHours) * 100) / 100 : 0
    };
  }

  /**
   * Validate timesheet data
   * @param {Array} timesheets - Array of timesheet objects
   * @returns {Object} Validation result
   */
  validateTimesheets(timesheets) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalTimesheets: timesheets.length,
        validTimesheets: 0,
        invalidTimesheets: 0
      }
    };

    timesheets.forEach((timesheet, index) => {
      const props = timesheet.properties || {};
      const timesheetId = timesheet.id;
      let isValid = true;
      const timesheetErrors = [];

      // Required fields validation
      if (!props.hours_worked || isNaN(parseFloat(props.hours_worked))) {
        timesheetErrors.push('Invalid or missing hours_worked');
        isValid = false;
      }

      if (!props.hourly_rate || isNaN(parseFloat(props.hourly_rate))) {
        timesheetErrors.push('Invalid or missing hourly_rate');
        isValid = false;
      }

      if (!props.work_date) {
        timesheetErrors.push('Missing work_date');
        isValid = false;
      }

      // Business logic validation
      const hours = parseFloat(props.hours_worked) || 0;
      if (hours < 0) {
        timesheetErrors.push('Hours worked cannot be negative');
        isValid = false;
      }

      if (hours > 24) {
        timesheetErrors.push('Hours worked exceeds 24 hours per day');
        isValid = false;
      }

      const rate = parseFloat(props.hourly_rate) || 0;
      if (rate < 0) {
        timesheetErrors.push('Hourly rate cannot be negative');
        isValid = false;
      }

      // Update validation summary
      if (isValid) {
        validation.summary.validTimesheets++;
      } else {
        validation.summary.invalidTimesheets++;
        validation.errors.push({
          timesheetId,
          index,
          errors: timesheetErrors
        });
      }
    });

    validation.isValid = validation.summary.invalidTimesheets === 0;

    this.logger.info('Timesheet validation completed', validation.summary);
    return validation;
  }
}

module.exports = TimesheetService;
