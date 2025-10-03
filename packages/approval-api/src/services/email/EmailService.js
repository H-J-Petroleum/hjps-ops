/**
 * Email Service
 * Main service for sending emails using the template registry
 * Each email type is its own module for maximum scalability
 */

const path = require('path');
const EmailTemplateRegistry = require('./EmailTemplateRegistry');
const EmailSender = require('./EmailSender');
const logger = require('../../utils/logger');

class EmailService {
  constructor(config = {}) {
    this.registry = new EmailTemplateRegistry();
    this.sender = new EmailSender(config);
    this.loadTemplates();
  }

  /**
   * Load all email templates from the templates directory
   */
  loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');
    this.registry.loadTemplatesFromDirectory(templatesDir);
  }

  /**
   * Get email template
   * @param {string} process - Business process (e.g., 'approval', 'timesheet')
   * @param {string} templateType - Template type (e.g., 'customerApprovalResponse')
   * @param {Object} data - Template data
   * @returns {Object} Generated email template
   */
  getEmailTemplate(process, templateType, data) {
    return this.registry.getTemplate(process, templateType, data);
  }

  /**
   * Send email using the email sender
   * @param {string} process - Business process
   * @param {string} templateType - Template type
   * @param {Object} data - Template data
   * @param {Object} options - Email options
   * @returns {Object} Send result
   */
  async sendEmail(process, templateType, data, options = {}) {
    try {
      // Generate email template
      const emailTemplate = this.getEmailTemplate(process, templateType, data);

      // Override recipient if specified in options
      if (options.recipientEmail) {
        emailTemplate.to = options.recipientEmail;
      }

      logger.debug('Prepared email template', {
        process,
        templateType,
        to: emailTemplate.to,
        provider: this.sender.config?.provider || 'console'
      });

      if (options.dryRun) {
        logger.info('Dry run email send skipped', {
          process,
          templateType,
          to: emailTemplate.to
        });

        return {
          success: true,
          dryRun: true,
          template: emailTemplate,
          sentAt: new Date().toISOString(),
          process,
          templateType
        };
      }

      // Send the email using the sender
      const sendResult = await this.sender.sendEmail(emailTemplate);

      logger.info('Email dispatched', {
        process,
        templateType,
        to: emailTemplate.to,
        provider: sendResult.provider,
        success: sendResult.success
      });

      return {
        success: sendResult.success,
        template: emailTemplate,
        sendResult,
        sentAt: new Date().toISOString(),
        process,
        templateType
      };
    } catch (error) {
      logger.error('Email send failed', {
        process,
        templateType,
        error: error.message
      });
      logger.debug('Email send failure detail', {
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        process,
        templateType
      };
    }
  }

  /**
   * Get all available processes
   * @returns {Array} List of processes
   */
  getAvailableProcesses() {
    return this.registry.getAvailableProcesses();
  }

  /**
   * Get all available templates for a process
   * @param {string} process - Business process
   * @returns {Array} List of template types
   */
  getAvailableTemplates(process) {
    return this.registry.getAvailableTemplates(process);
  }

  /**
   * Get template metadata
   * @param {string} process - Business process
   * @param {string} templateType - Template type
   * @returns {Object} Template metadata
   */
  getTemplateMetadata(process, templateType) {
    return this.registry.getTemplateMetadata(process, templateType);
  }

  /**
   * Validate all templates
   * @returns {Object} Validation results
   */
  validateTemplates() {
    return this.registry.validateTemplates();
  }

}

module.exports = EmailService;
