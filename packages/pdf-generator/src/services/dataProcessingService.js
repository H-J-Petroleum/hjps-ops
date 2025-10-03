/**
 * Data Processing Service for PDF generation
 * Handles calculation and data preparation for PDF templates
 */

const logger = require('../utils/logger');
const Formatters = require('../utils/formatters');
const { PricingStrategyFactory } = require('./pricingStrategies');
const ValueFormattingService = require('./valueFormattingService');

class DataProcessingService {
  constructor() {
    this.pricingFactory = new PricingStrategyFactory();
    this.valueFormatting = new ValueFormattingService();
  }
  /**
   * Calculate service totals from timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @param {string} pdfType - PDF type for pricing strategy
   * @returns {Array} Array of service total objects
   */
  calculateServiceTotals(timesheetData, pdfType = 'customer') {
    if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
      logger.warn('No timesheet data for service totals calculation');
      return [];
    }

    const pricingStrategy = this.pricingFactory.getStrategy(pdfType);
    const serviceMap = new Map();

    timesheetData.forEach(timesheet => {
      const serviceName = timesheet.timesheet_job_service || 'N/A';
      const quantity = parseFloat(timesheet.timesheet_quantity) || 0;
      const amount = pricingStrategy.getTotalPrice(timesheet);
      const startDate = timesheet.timesheet_start_date;
      const endDate = timesheet.timesheet_end_date;
      const unit = this.valueFormatting.deriveUnit(timesheet);

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          serviceName,
          rawQuantity: 0,
          rawAmount: 0,
          startDate,
          endDate,
          units: new Set()
        });
      }

      const serviceData = serviceMap.get(serviceName);
      serviceData.rawQuantity += quantity;
      serviceData.rawAmount += amount;
      if (unit) {
        serviceData.units.add(unit);
      }

      if (startDate && (!serviceData.startDate || startDate < serviceData.startDate)) {
        serviceData.startDate = startDate;
      }
      if (endDate && (!serviceData.endDate || endDate > serviceData.endDate)) {
        serviceData.endDate = endDate;
      }
    });

    return Array.from(serviceMap.values()).map(serviceData => {
      const resolvedUnit = this.valueFormatting.selectAggregationUnit(serviceData.units, {
        service: serviceData.serviceName
      });
      const labeledService = this.valueFormatting.labelWithUnit(serviceData.serviceName, resolvedUnit);

      return {
        service: labeledService,
        serviceName: serviceData.serviceName,
        unit: resolvedUnit,
        unitDisplay: Formatters.formatUnit(resolvedUnit),
        quantity: serviceData.rawQuantity,
        quantityDisplay: this.valueFormatting.formatQuantity(serviceData.rawQuantity),
        amount: serviceData.rawAmount,
        amountDisplay: this.valueFormatting.formatCurrency(serviceData.rawAmount),
        dateRange: Formatters.formatDateRange(serviceData.startDate, serviceData.endDate)
      };
    });
  }

  /**
   * Calculate well breakdown from timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @param {string} pdfType - PDF type for pricing strategy
   * @returns {Array} Array of well breakdown objects
   */
  calculateWellBreakdown(timesheetData, pdfType = 'customer') {
    if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
      logger.warn('No timesheet data for well breakdown calculation');
      return [];
    }

    const pricingStrategy = this.pricingFactory.getStrategy(pdfType);
    const wellMap = new Map();

    timesheetData.forEach(timesheet => {
      const service = timesheet.timesheet_job_service || 'N/A';
      const well = timesheet.timesheet_well || 'N/A';
      const afe = timesheet.timesheet_payment_deal_id || 'N/A';
      const quantity = parseFloat(timesheet.timesheet_quantity) || 0;
      const amount = pricingStrategy.getTotalPrice(timesheet);
      const startDate = timesheet.timesheet_start_date;
      const endDate = timesheet.timesheet_end_date;
      const unit = this.valueFormatting.deriveUnit(timesheet);

      const key = `${service}|${well}|${afe}`;

      if (!wellMap.has(key)) {
        wellMap.set(key, {
          service,
          well,
          afe,
          rawQuantity: 0,
          rawAmount: 0,
          startDate,
          endDate,
          units: new Set()
        });
      }

      const wellData = wellMap.get(key);
      wellData.rawQuantity += quantity;
      wellData.rawAmount += amount;
      if (unit) {
        wellData.units.add(unit);
      }

      if (startDate && (!wellData.startDate || startDate < wellData.startDate)) {
        wellData.startDate = startDate;
      }
      if (endDate && (!wellData.endDate || endDate > wellData.endDate)) {
        wellData.endDate = endDate;
      }
    });

    return Array.from(wellMap.values()).map(wellData => {
      const resolvedUnit = this.valueFormatting.selectAggregationUnit(wellData.units, {
        service: wellData.service,
        well: wellData.well,
        afe: wellData.afe
      });
      const labeledService = this.valueFormatting.labelWithUnit(wellData.service, resolvedUnit);

      return {
        service: labeledService,
        serviceName: wellData.service,
        well: wellData.well,
        afe: wellData.afe,
        unit: resolvedUnit,
        unitDisplay: Formatters.formatUnit(resolvedUnit),
        quantity: wellData.rawQuantity,
        quantityDisplay: this.valueFormatting.formatQuantity(wellData.rawQuantity),
        amount: wellData.rawAmount,
        amountDisplay: this.valueFormatting.formatCurrency(wellData.rawAmount),
        dateRange: Formatters.formatDateRange(wellData.startDate, wellData.endDate)
      };
    });
  }

  /**
   * Calculate date range from timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {string} Formatted date range string
   */
  calculateDateRange(timesheetData) {
    return Formatters.calculateDateRange(timesheetData);
  }

  /**
   * Prepare approval data for display
   * @param {Object} approvalData - Raw approval data
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Object} Processed approval data
   */
  prepareApprovalData(approvalData, timesheetData = []) {
    const consultant = timesheetData?.[0]?.timesheet_consultant_full_name || approvalData.timesheet_consultant_full_name || 'N/A';
    const project = timesheetData?.[0]?.timesheet_project_name || 'N/A';
    const customer = timesheetData?.[0]?.timesheet_customer || 'N/A';
    const dateRange = this.calculateDateRange(timesheetData);
    const generated = new Date().toLocaleString();

    return {
      approvalRequest: approvalData.approval_request_id || 'N/A',
      projectId: approvalData.approval_project_id || 'N/A',
      consultant,
      project,
      customer,
      approver: approvalData.approval_approver_name || 'N/A',
      approverEmail: approvalData.approval_approver_email || 'N/A',
      approverRole: approvalData.approval_approver_is_ || 'N/A',
      dateRange,
      generated
    };
  }

  /**
   * Prepare timesheet table data for rendering (customer PDF - uses H&J prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Array} Processed timesheet data for table rendering
   */
  prepareTimesheetTableData(timesheetData) {
    if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
      logger.warn('No timesheet data for table preparation');
      return [];
    }

    const sorted = timesheetData
      .slice()
      .sort((a, b) => Number(a.timesheet_ordinal_number || 0) - Number(b.timesheet_ordinal_number || 0));

    return sorted.map((t, idx) => {
      const derivedUnit = this.valueFormatting.deriveUnit(t);
      const unitDisplay = Formatters.formatUnit(derivedUnit)
        || (t.timesheet_billing_frequency ? t.timesheet_billing_frequency.toString() : null);

      return {
        ordinal: `${t.timesheet_ordinal_number || idx + 1}`,
        consultant: t.timesheet_consultant_full_name || 'N/A',
        job: t.timesheet_job_service || 'N/A',
        start: Formatters.formatDateTime(t.timesheet_start_date, t.timesheet_start_time),
        end: Formatters.formatDateTime(t.timesheet_end_date, t.timesheet_end_time),
        wellAfe: t.timesheet_payment_deal_id || 'N/A',
        well: t.timesheet_well || 'N/A',
        unit: unitDisplay || 'N/A',
        unitNormalized: derivedUnit || null,
        qty: Formatters.formatQuantity(t.timesheet_quantity || 0),
        qtyRaw: Number(t.timesheet_quantity) || 0,
        price: Formatters.formatCurrency(t.timesheet_hj_price || t.timesheet_price || 0),
        total: Formatters.formatCurrency(t.timesheet_hj_total_price || t.timesheet_total_price || 0)
      };
    });
  }

  /**
   * Prepare consultant timesheet table data for rendering (uses consultant prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Array} Processed timesheet data for consultant table rendering
   */
  prepareConsultantTimesheetTableData(timesheetData) {
    if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
      logger.warn('No timesheet data for consultant table preparation');
      return [];
    }

    const sorted = timesheetData
      .slice()
      .sort((a, b) => Number(a.timesheet_ordinal_number || 0) - Number(b.timesheet_ordinal_number || 0));

    return sorted.map((t, idx) => {
      const derivedUnit = this.valueFormatting.deriveUnit(t);
      const unitDisplay = Formatters.formatUnit(derivedUnit)
        || (t.timesheet_billing_frequency ? t.timesheet_billing_frequency.toString() : null);

      return {
        ordinal: `${t.timesheet_ordinal_number || idx + 1}`,
        consultant: t.timesheet_consultant_full_name || 'N/A',
        job: t.timesheet_job_service || 'N/A',
        start: Formatters.formatDateTime(t.timesheet_start_date, t.timesheet_start_time),
        end: Formatters.formatDateTime(t.timesheet_end_date, t.timesheet_end_time),
        wellAfe: t.timesheet_payment_deal_id || 'N/A',
        well: t.timesheet_well || 'N/A',
        unit: unitDisplay || 'N/A',
        unitNormalized: derivedUnit || null,
        qty: Formatters.formatQuantity(t.timesheet_quantity || 0),
        qtyRaw: Number(t.timesheet_quantity) || 0,
        price: Formatters.formatCurrency(t.timesheet_price || 0),
        total: Formatters.formatCurrency(t.timesheet_total_price || 0)
      };
    });
  }

  /**
   * Calculate total amount from timesheet data (customer PDF - uses H&J prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {number} Total amount
   */
  calculateTotalAmount(timesheetData, pdfType = 'customer') {
    if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
      return 0;
    }

    const pricingStrategy = this.pricingFactory.getStrategy(pdfType);
    return timesheetData.reduce((total, timesheet) => {
      return total + pricingStrategy.getTotalPrice(timesheet);
    }, 0);
  }

  /**
   * Calculate consultant total amount from timesheet data (uses consultant prices)
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {number} Consultant total amount
   */
  calculateConsultantTotalAmount(timesheetData) {
    return this.calculateTotalAmount(timesheetData, 'consultant');
  }

  /**
   * Validate timesheet data
   * @param {Array} timesheetData - Array of timesheet objects
   * @returns {Object} Validation result with isValid and errors
   */
  validateTimesheetData(timesheetData) {
    const errors = [];

    if (!Array.isArray(timesheetData)) {
      errors.push('Timesheet data must be an array');
      return { isValid: false, errors };
    }

    if (timesheetData.length === 0) {
      errors.push('No timesheet data provided');
      return { isValid: false, errors };
    }

    timesheetData.forEach((timesheet, index) => {
      if (!timesheet.timesheet_job_service) {
        errors.push(`Timesheet ${index + 1}: Missing job service`);
      }
      if (!timesheet.timesheet_quantity) {
        errors.push(`Timesheet ${index + 1}: Missing quantity`);
      }
      if (!timesheet.timesheet_start_date) {
        errors.push(`Timesheet ${index + 1}: Missing start date`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DataProcessingService;
