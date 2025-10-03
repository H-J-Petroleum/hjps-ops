/**
 * Value formatting service for PDF generation
 * Provides reusable helpers for currency, quantity, and unit derivation
 */

const logger = require('../utils/logger');

const UNIT_ALIASES = {
  day: 'days',
  days: 'days',
  daily: 'days',
  'per day': 'days',
  'per diem': 'days',
  diem: 'days',
  hour: 'hours',
  hours: 'hours',
  hourly: 'hours',
  'per hour': 'hours',
  week: 'weeks',
  weeks: 'weeks',
  weekly: 'weeks',
  month: 'months',
  months: 'months',
  monthly: 'months',
  mile: 'mi',
  miles: 'mi',
  'per mile': 'mi',
  mi: 'mi',
  'line mile': 'mi',
  'linear mile': 'mi',
  each: 'each',
  'per each': 'each',
  'per item': 'each',
  item: 'each',
  unit: 'units',
  units: 'units',
  quantity: 'units',
  'per unit': 'units',
  'per well': 'units',
  flat: 'one-time fee',
  'flat fee': 'one-time fee',
  'one time': 'one-time fee',
  'one-time': 'one-time fee',
  'one time fee': 'one-time fee',
  'one-time fee': 'one-time fee',
  fee: 'one-time fee',
  'fee/one time': 'one-time fee',
  'fee one time': 'one-time fee',
  shift: 'shifts',
  shifts: 'shifts'
};

const UNIT_DISPLAY = {
  days: 'days',
  hours: 'hours',
  weeks: 'weeks',
  months: 'months',
  mi: 'mi',
  each: 'ea',
  units: 'units',
  'one-time fee': 'one-time fee',
  shifts: 'shifts'
};

class ValueFormattingService {
  constructor() {
    this.currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format a currency value using USD-style dollars
   * @param {number|string} value - Numeric value to format
   * @returns {string} Formatted currency (e.g., "$1,234.56")
   */
  formatCurrency(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '$0.00';
    }

    const rounded = Math.round(numeric * 100) / 100;
    return this.currencyFormatter.format(rounded);
  }

  /**
   * Format a quantity with smart precision (0 or 2 decimal places)
   * @param {number|string} value - Quantity to format
   * @returns {string} Formatted quantity string
   */
  formatQuantity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '0';
    }

    const rounded = Math.round(numeric * 100) / 100;
    const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9;

    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2
    });

    return formatter.format(rounded);
  }

  /**
   * Derive a normalized unit from a timesheet record
   * @param {Object} timesheet - Timesheet data record
   * @returns {string|null} Normalized unit identifier
   */
  deriveUnit(timesheet = {}) {
    if (!timesheet || typeof timesheet !== 'object') {
      return null;
    }

    const source = timesheet.properties && typeof timesheet.properties === 'object'
      ? { ...timesheet.properties, ...timesheet }
      : timesheet;

    const candidateKeys = [
      'timesheet_unit_label',
      'timesheet_unit',
      'timesheet_units',
      'timesheet_unit_type',
      'timesheet_unit_name',
      'timesheet_unit_description',
      'timesheet_billing_frequency',
      'hj_project_billing_frequency',
      'timesheet_price_type',
      'timesheet_price_description',
      'timesheet_hj_price_description'
    ];

    for (const key of candidateKeys) {
      const candidate = source[key];
      const normalized = this.normalizeUnit(candidate);
      if (normalized) {
        return normalized;
      }
    }

    const jobService = source.timesheet_job_service || source.job_service;
    const jobDerived = this.normalizeUnit(jobService) || this.fallbackUnitFromService(jobService);
    if (jobDerived) {
      return jobDerived;
    }

    return null;
  }

  /**
   * Select a consistent unit for aggregated data
   * @param {Set<string>|Array<string>} units - Collection of units encountered
   * @param {Object} context - Optional context for logging
   * @returns {string|null} Selected unit
   */
  selectAggregationUnit(units, context = {}) {
    if (!units) {
      return null;
    }

    const values = Array.from(units instanceof Set ? units : [].concat(units))
      .filter(unit => typeof unit === 'string' && unit.trim().length > 0);

    if (values.length === 0) {
      return null;
    }

    const unique = [...new Set(values)];

    if (unique.length === 1) {
      return unique[0];
    }

    logger.warn('Mixed units encountered during aggregation; defaulting to unitless output', {
      ...context,
      units: unique
    });

    return null;
  }

  /**
   * Append a unit label to a base service label
   * @param {string} label - Base label
   * @param {string|null} unit - Unit identifier
   * @returns {string} Labeled string
   */
  labelWithUnit(label, unit) {
    if (!unit) {
      return label;
    }

    const displayUnit = this.getUnitDisplay(unit);
    if (!displayUnit) {
      return label;
    }

    const normalizedLabel = (label || '').toLowerCase();
    if (normalizedLabel.includes(`(${displayUnit.toLowerCase()})`)) {
      return label;
    }

    return `${label} (${displayUnit})`;
  }

  /**
   * Convert a normalized unit into a display label
   * @param {string|null} unit - Normalized unit identifier
   * @returns {string|null} Display label
   */
  getUnitDisplay(unit) {
    if (!unit) {
      return null;
    }
    return UNIT_DISPLAY[unit] || unit;
  }

  /**
   * Normalize a raw unit string using alias mapping and heuristics
   * @param {string} raw - Raw unit string
   * @returns {string|null} Normalized unit
   */
  normalizeUnit(raw) {
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    const cleaned = raw.replace(/[\n\r]/g, ' ').trim();
    if (!cleaned) {
      return null;
    }

    const lower = cleaned.toLowerCase();
    const candidates = [lower];

    this.extractParenthetical(lower).forEach(part => candidates.push(part));

    lower.split(/[\s/\\-]+/).forEach(part => {
      if (part) {
        candidates.push(part);
      }
    });

    for (const candidate of candidates) {
      if (UNIT_ALIASES[candidate]) {
        return UNIT_ALIASES[candidate];
      }
    }

    if (lower.includes('mile')) {
      return 'mi';
    }
    if (lower.includes('diem')) {
      return 'days';
    }
    if (lower.includes('day')) {
      return 'days';
    }
    if (lower.includes('hour')) {
      return 'hours';
    }
    if (lower.includes('week')) {
      return 'weeks';
    }
    if (lower.includes('month')) {
      return 'months';
    }
    if (lower.includes('shift')) {
      return 'shifts';
    }
    if (lower.includes('flat')) {
      return 'one-time fee';
    }
    if (lower.includes('fee')) {
      return 'one-time fee';
    }

    return null;
  }

  /**
   * Heuristic fallback when service names imply the unit
   * @param {string} jobService - Service label
   * @returns {string|null} Normalized unit
   */
  fallbackUnitFromService(jobService) {
    if (!jobService || typeof jobService !== 'string') {
      return null;
    }

    const lower = jobService.toLowerCase();

    if (lower.includes('mileage') || lower.includes('mile')) {
      return 'mi';
    }
    if (lower.includes('per diem') || lower.includes('diem')) {
      return 'days';
    }
    if (lower.includes('hour')) {
      return 'hours';
    }
    if (lower.includes('day')) {
      return 'days';
    }

    return null;
  }

  /**
   * Extract parenthetical segments for unit detection
   * @param {string} value - Source string
   * @returns {Array<string>} Extracted segments
   */
  extractParenthetical(value) {
    const matches = [];
    const regex = /\(([^)]+)\)/g;
    let result;
    while ((result = regex.exec(value)) !== null) {
      const part = result[1].trim();
      if (part) {
        matches.push(part);
      }
    }
    return matches;
  }
}

module.exports = ValueFormattingService;
