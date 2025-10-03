/**
 * Pricing Strategy Pattern
 * Clean separation of customer vs consultant pricing logic
 */

const logger = require('../utils/logger');

/**
 * Base pricing strategy class
 */
class PricingStrategy {
  /**
   * Get price for a timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} Price amount
   */
  getPrice() {
    throw new Error('getPrice() must be implemented by subclass');
  }

  /**
   * Get total price for a timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} Total price amount
   */
  getTotalPrice() {
    throw new Error('getTotalPrice() must be implemented by subclass');
  }

  /**
   * Get strategy name
   * @returns {string} Strategy name
   */
  getStrategyName() {
    throw new Error('getStrategyName() must be implemented by subclass');
  }

  /**
   * Validate timesheet data for pricing
   * @param {Object} timesheet - Timesheet object
   * @returns {Object} Validation result
   */
  validateTimesheet(timesheet) {
    const errors = [];

    if (!timesheet) {
      errors.push('Timesheet data is required');
      return { isValid: false, errors };
    }

    if (typeof timesheet.timesheet_quantity !== 'number' && !timesheet.timesheet_quantity) {
      errors.push('Timesheet quantity is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Customer pricing strategy (uses H&J prices)
 */
class CustomerPricingStrategy extends PricingStrategy {
  /**
   * Get H&J price for timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} H&J price
   */
  getPrice(timesheet) {
    const validation = this.validateTimesheet(timesheet);
    if (!validation.isValid) {
      logger.warn('Invalid timesheet for customer pricing', { errors: validation.errors });
      return 0;
    }

    // Prefer H&J price, fallback to regular price
    const hjPrice = parseFloat(timesheet.timesheet_hj_price);
    const regularPrice = parseFloat(timesheet.timesheet_price);
    
    if (!isNaN(hjPrice) && hjPrice > 0) {
      return hjPrice;
    }
    
    if (!isNaN(regularPrice) && regularPrice > 0) {
      logger.info('Using regular price as fallback for H&J price', { 
        timesheetId: timesheet.hs_object_id,
        hjPrice,
        regularPrice
      });
      return regularPrice;
    }

    logger.warn('No valid price found for timesheet', { 
      timesheetId: timesheet.hs_object_id,
      hjPrice,
      regularPrice
    });
    return 0;
  }

  /**
   * Get H&J total price for timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} H&J total price
   */
  getTotalPrice(timesheet) {
    const validation = this.validateTimesheet(timesheet);
    if (!validation.isValid) {
      logger.warn('Invalid timesheet for customer total pricing', { errors: validation.errors });
      return 0;
    }

    // Prefer H&J total price, fallback to regular total price
    const hjTotalPrice = parseFloat(timesheet.timesheet_hj_total_price);
    const regularTotalPrice = parseFloat(timesheet.timesheet_total_price);
    
    if (!isNaN(hjTotalPrice) && hjTotalPrice > 0) {
      return hjTotalPrice;
    }
    
    if (!isNaN(regularTotalPrice) && regularTotalPrice > 0) {
      logger.info('Using regular total price as fallback for H&J total price', { 
        timesheetId: timesheet.hs_object_id,
        hjTotalPrice,
        regularTotalPrice
      });
      return regularTotalPrice;
    }

    logger.warn('No valid total price found for timesheet', { 
      timesheetId: timesheet.hs_object_id,
      hjTotalPrice,
      regularTotalPrice
    });
    return 0;
  }

  /**
   * Get strategy name
   * @returns {string} Strategy name
   */
  getStrategyName() {
    return 'customer';
  }
}

/**
 * Consultant pricing strategy (uses consultant prices)
 */
class ConsultantPricingStrategy extends PricingStrategy {
  /**
   * Get consultant price for timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} Consultant price
   */
  getPrice(timesheet) {
    const validation = this.validateTimesheet(timesheet);
    if (!validation.isValid) {
      logger.warn('Invalid timesheet for consultant pricing', { errors: validation.errors });
      return 0;
    }

    const consultantPrice = parseFloat(timesheet.timesheet_price);
    
    if (!isNaN(consultantPrice) && consultantPrice > 0) {
      return consultantPrice;
    }

    logger.warn('No valid consultant price found for timesheet', { 
      timesheetId: timesheet.hs_object_id,
      consultantPrice
    });
    return 0;
  }

  /**
   * Get consultant total price for timesheet entry
   * @param {Object} timesheet - Timesheet object
   * @returns {number} Consultant total price
   */
  getTotalPrice(timesheet) {
    const validation = this.validateTimesheet(timesheet);
    if (!validation.isValid) {
      logger.warn('Invalid timesheet for consultant total pricing', { errors: validation.errors });
      return 0;
    }

    const consultantTotalPrice = parseFloat(timesheet.timesheet_total_price);
    
    if (!isNaN(consultantTotalPrice) && consultantTotalPrice > 0) {
      return consultantTotalPrice;
    }

    logger.warn('No valid consultant total price found for timesheet', { 
      timesheetId: timesheet.hs_object_id,
      consultantTotalPrice
    });
    return 0;
  }

  /**
   * Get strategy name
   * @returns {string} Strategy name
   */
  getStrategyName() {
    return 'consultant';
  }
}

/**
 * Pricing strategy factory
 */
class PricingStrategyFactory {
  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize available pricing strategies
   */
  initializeStrategies() {
    this.strategies.set('customer', new CustomerPricingStrategy());
    this.strategies.set('consultant', new ConsultantPricingStrategy());
    this.strategies.set('invoice', new ConsultantPricingStrategy()); // Alias for consultant
    this.strategies.set('internal', new CustomerPricingStrategy()); // Reuse customer for now
    
    logger.info('Pricing strategies initialized', {
      availableStrategies: Array.from(this.strategies.keys())
    });
  }

  /**
   * Get pricing strategy for PDF type
   * @param {string} pdfType - PDF type
   * @returns {PricingStrategy} Pricing strategy instance
   */
  getStrategy(pdfType) {
    const normalizedType = this.normalizePDFType(pdfType);
    
    if (!this.strategies.has(normalizedType)) {
      const availableTypes = Array.from(this.strategies.keys());
      throw new Error(`No pricing strategy found for type: ${pdfType}. Available types: ${availableTypes.join(', ')}`);
    }

    const strategy = this.strategies.get(normalizedType);
    logger.info('Pricing strategy selected', { 
      requestedType: pdfType, 
      normalizedType, 
      strategyName: strategy.getStrategyName() 
    });
    
    return strategy;
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
   * Get available strategy types
   * @returns {Array<string>} Array of available strategy types
   */
  getAvailableTypes() {
    return Array.from(this.strategies.keys());
  }
}

module.exports = {
  PricingStrategy,
  CustomerPricingStrategy,
  ConsultantPricingStrategy,
  PricingStrategyFactory
};
