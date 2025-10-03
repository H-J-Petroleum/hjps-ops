const logger = require('../utils/logger');
const ImageProcessor = require('../utils/imageProcessor');
const SignatureConverter = require('../utils/signatureConverter');

/**
 * Signature Service - Handles signature processing and validation
 */
class SignatureService {
  constructor() {
    this.signatures = new Map();
    this.loadSignatures();
  }

  /**
   * Load all available signatures
   */
  loadSignatures() {
    try {
      // Load the JPEG signature (best compatibility)
      const { getMattHoodSignature, isMattHood } = require('../assets/matt-hood-signature-jpeg');
      this.signatures.set('matt-hood', {
        getSignature: getMattHoodSignature,
        isMatch: isMattHood,
        name: 'Matt Hood',
        type: 'jpeg'
      });
      logger.info('JPEG signature loaded successfully');
    } catch (error) {
      logger.error('Failed to load signatures', { error: error.message });
    }
  }

  /**
   * Get signature for a specific approver
   * @param {string} approverName - The approver's name
   * @returns {Object|null} Signature data or null if not found
   */
  getSignatureForApprover(approverName) {
    if (!approverName) return null;

    for (const [key, signature] of this.signatures) {
      if (signature.isMatch(approverName)) {
        try {
          const buffer = signature.getSignature();
          return {
            buffer,
            name: signature.name,
            type: 'image'
          };
        } catch (error) {
          logger.warn(`Failed to get signature for ${approverName}`, {
            error: error.message,
            signatureKey: key
          });
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Validate signature buffer
   * @param {Buffer} buffer - Signature buffer
   * @returns {boolean} True if valid
   */
  validateSignatureBuffer(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      logger.warn('Signature is not a buffer');
      return false;
    }

    if (buffer.length === 0) {
      logger.warn('Signature buffer is empty');
      return false;
    }

    // Check PNG header (89 50 4E 47 0D 0A 1A 0A)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const isPNG = buffer.length >= 8 && buffer.subarray(0, 8).equals(pngHeader);

    // Check JPEG header (FF D8 FF)
    const isJPEG = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    if (!isPNG && !isJPEG) {
      logger.warn('Signature buffer is neither PNG nor JPEG', {
        firstBytes: buffer.length >= 4 ? Array.from(buffer.subarray(0, 4)) : [],
        size: buffer.length
      });
      return false;
    }

    logger.info('Signature buffer validated successfully', {
      format: isPNG ? 'PNG' : 'JPEG',
      size: buffer.length
    });
    return true;
  }

  /**
   * Process signature for PDF generation
   * @param {string} approverName - The approver's name
   * @param {Object} fallbackSignature - Fallback signature data from HubSpot
   * @returns {Object|null} Processed signature data
   */
  processSignature(approverName, fallbackSignature = null) {
    logger.info('Processing signature', { approverName });

    // Try to get custom signature first
    const customSignature = this.getSignatureForApprover(approverName);

    if (customSignature && this.validateSignatureBuffer(customSignature.buffer)) {
      // Try to convert the signature to a working format
      const convertedBuffer = SignatureConverter.convertSignature(customSignature.buffer);

      if (convertedBuffer) {
        logger.info('Using converted signature', {
          approverName,
          signatureName: customSignature.name,
          bufferSize: convertedBuffer.length
        });
        return {
          buffer: convertedBuffer,
          name: customSignature.name,
          type: 'image'
        };
      } else {
        logger.warn('Signature conversion failed, using text fallback', { approverName });
        return ImageProcessor.createTextSignature(approverName);
      }
    }

    // Fall back to HubSpot signature
    if (fallbackSignature) {
      logger.info('Using fallback signature', { approverName });
      return {
        buffer: fallbackSignature,
        name: approverName,
        type: 'fallback'
      };
    }

    // Create text signature as final fallback
    logger.info('Creating text signature fallback', { approverName });
    return ImageProcessor.createTextSignature(approverName);
  }

  /**
   * Test signature processing
   * @param {string} approverName - The approver's name
   * @returns {Object} Test results
   */
  testSignature(approverName) {
    const results = {
      approverName,
      hasCustomSignature: false,
      customSignatureValid: false,
      customSignatureSize: 0,
      error: null
    };

    try {
      const customSignature = this.getSignatureForApprover(approverName);

      if (customSignature) {
        results.hasCustomSignature = true;
        results.customSignatureSize = customSignature.buffer.length;
        results.customSignatureValid = this.validateSignatureBuffer(customSignature.buffer);
      }
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }
}

module.exports = new SignatureService();
