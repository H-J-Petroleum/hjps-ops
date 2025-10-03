/**
 * Formatters utility for PDF generation
 * Contains static methods for formatting various data types
 */

const logger = require('./logger');
const ValueFormattingService = require('../services/valueFormattingService');

const valueFormattingService = new ValueFormattingService();

class Formatters {
  /**
   * Format currency amount to display string
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string (e.g., "$1,234.56")
   */
  static formatCurrency(amount) {
    return valueFormattingService.formatCurrency(amount);
  }

  /**
   * Format quantity with smart precision (0 or 2 decimals)
   * @param {number|string} quantity - Quantity value
   * @returns {string} Formatted quantity string
   */
  static formatQuantity(quantity) {
    return valueFormattingService.formatQuantity(quantity);
  }

  /**
   * Derive display-ready unit label
   * @param {string|null} unit - Raw or normalized unit
   * @returns {string|null} Display unit label
   */
  static formatUnit(unit) {
    return valueFormattingService.getUnitDisplay(unit);
  }

  /**
   * Format date and time to compact 24-hour format
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {string} time - Time string (HH:MM or HH:MM:SS)
   * @returns {string} Formatted date/time string (e.g., "09/29 14:30")
   */
  static formatDateTime(date, time) {
    if (!date) return 'N/A';

    try {
      const dateObj = new Date(date);

      if (time) {
        // Parse time string (format: "HH:MM" or "HH:MM:SS")
        const timeParts = time.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        dateObj.setHours(hours, minutes);
      }

      // Use 24-hour format (more compact)
      return dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      logger.warn('Date formatting failed', { date, time, error: error.message });
      return 'N/A';
    }
  }

  /**
   * Format date range to display string
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @returns {string} Formatted date range string (e.g., "09/29 - 10/01")
   */
  static formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const startStr = start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      const endStr = end.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });

      return `${startStr} - ${endStr}`;
    } catch (error) {
      logger.warn('Date range formatting failed', { startDate, endDate, error: error.message });
      return 'N/A';
    }
  }

  /**
   * Calculate date range from timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {string} Formatted date range string
   */
  static calculateDateRange(timesheetData) {
    if (!timesheetData || timesheetData.length === 0) return 'N/A';

    let minDate = null;
    let maxDate = null;

    timesheetData.forEach(t => {
      const startDate = t.timesheet_start_date ? new Date(t.timesheet_start_date) : null;
      const endDate = t.timesheet_end_date ? new Date(t.timesheet_end_date) : null;

      if (startDate) {
        if (!minDate || startDate < minDate) minDate = startDate;
        if (!maxDate || startDate > maxDate) maxDate = startDate;
      }
      if (endDate) {
        if (!minDate || endDate < minDate) minDate = endDate;
        if (!maxDate || endDate > maxDate) maxDate = endDate;
      }
    });

    if (!minDate || !maxDate) return 'N/A';

    const options = { month: '2-digit', day: '2-digit', year: 'numeric' };
    const startStr = minDate.toLocaleDateString('en-US', options);
    const endStr = maxDate.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
  }

  /**
   * Format table data for consistent display
   * @param {Object} data - Data object to format
   * @param {Object} config - Formatting configuration
   * @returns {Object} Formatted data object
   */
  static formatTableData(data, config = {}) {
    const formatted = { ...data };

    if (config.currencyFields) {
      config.currencyFields.forEach(field => {
        if (formatted[field] !== undefined) {
          formatted[field] = this.formatCurrency(formatted[field]);
        }
      });
    }

    if (config.dateTimeFields) {
      config.dateTimeFields.forEach(field => {
        if (formatted[field.date] && formatted[field.time]) {
          formatted[field.output] = this.formatDateTime(formatted[field.date], formatted[field.time]);
        }
      });
    }

    return formatted;
  }
}

module.exports = Formatters;
