const logger = require('../utils/logger');

/**
 * Logo Service - Handles company logo loading and management
 */
class LogoService {
  constructor() {
    this.logo = null;
    this.dimensions = null;
    this.loadLogo();
  }

  /**
   * Load the H&J Petroleum logo
   */
  loadLogo() {
    try {
      const { getHJPLogo, getLogoDimensions } = require('../assets/hjp-logo');
      this.logo = getHJPLogo();
      this.dimensions = getLogoDimensions();
      logger.info('H&J Petroleum logo loaded successfully', {
        size: this.logo.length,
        dimensions: this.dimensions
      });
    } catch (error) {
      logger.error('Failed to load H&J logo', { error: error.message });
      this.logo = null;
      this.dimensions = null;
    }
  }

  /**
   * Get the logo buffer
   * @returns {Buffer|null} Logo buffer or null if not loaded
   */
  getLogo() {
    return this.logo;
  }

  /**
   * Get logo dimensions
   * @returns {Object|null} Logo dimensions {width, height} or null
   */
  getDimensions() {
    return this.dimensions;
  }

  /**
   * Check if logo is available
   * @returns {boolean} True if logo is loaded
   */
  hasLogo() {
    return this.logo !== null;
  }

  /**
   * Get recommended logo width for PDFs
   * @returns {number} Recommended width in pixels
   */
  getRecommendedWidth() {
    return this.dimensions ? this.dimensions.width : 150;
  }
}

module.exports = new LogoService();
