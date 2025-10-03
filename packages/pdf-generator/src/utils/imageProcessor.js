const logger = require('./logger');

/**
 * Image Processor - Handles image processing and optimization for PDF generation
 */
class ImageProcessor {
  /**
   * Process image buffer for PDFKit compatibility
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Buffer|null} Processed image buffer or null if processing fails
   */
  static processImageForPDFKit(imageBuffer) {
    try {
      // Validate input
      if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        logger.warn('Invalid image buffer provided');
        return null;
      }

      // Check PNG header
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (!imageBuffer.subarray(0, 8).equals(pngHeader)) {
        logger.warn('Image buffer does not have valid PNG header');
        return null;
      }

      // For now, return the original buffer
      // In the future, we could implement image optimization here
      return imageBuffer;

    } catch (error) {
      logger.error('Image processing failed', { error: error.message });
      return null;
    }
  }

  /**
   * Create a simple text-based signature
   * @param {string} approverName - The approver's name
   * @returns {Object} Text signature data
   */
  static createTextSignature(approverName) {
    return {
      type: 'text',
      content: `Signature: ${approverName}`,
      name: approverName
    };
  }

  /**
   * Create a simple placeholder signature image
   * @param {string} approverName - The approver's name
   * @returns {Buffer|null} Simple signature image buffer
   */
  static createPlaceholderSignature() {
    try {
      // Create a simple 1x1 pixel PNG with signature text
      // This is a minimal PNG that PDFKit should handle
      const simplePNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64Data = simplePNG.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      logger.error('Failed to create placeholder signature', { error: error.message });
      return null;
    }
  }

  /**
   * Validate image buffer for PDFKit
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @returns {Object} Validation result
   */
  static validateImageBuffer(imageBuffer) {
    const result = {
      isValid: false,
      size: 0,
      format: 'unknown',
      error: null
    };

    try {
      if (!Buffer.isBuffer(imageBuffer)) {
        result.error = 'Not a buffer';
        return result;
      }

      result.size = imageBuffer.length;

      if (imageBuffer.length === 0) {
        result.error = 'Empty buffer';
        return result;
      }

      // Check PNG header
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (imageBuffer.subarray(0, 8).equals(pngHeader)) {
        result.format = 'PNG';
        result.isValid = true;
      } else {
        result.error = 'Invalid PNG header';
      }

    } catch (error) {
      result.error = error.message;
    }

    return result;
  }
}

module.exports = ImageProcessor;
