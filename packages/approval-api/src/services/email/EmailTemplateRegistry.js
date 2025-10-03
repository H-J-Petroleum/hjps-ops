/**
 * Email Template Registry
 * Central registry for managing email templates across all business processes
 * Each email type is its own module for maximum scalability
 */

const path = require('path');
const fs = require('fs');

class EmailTemplateRegistry {
  constructor() {
    this.templates = new Map();
    this.baseUrl = process.env.HUBSPOT_SITE_URL || 'https://hjpetro-1230608.hs-sites.com';
    this.appUrl = process.env.HUBSPOT_APP_URL || 'https://app.hubspot.com/contacts/1230608/record/0-3/';
  }

  /**
   * Register an email template
   * @param {string} process - Business process (e.g., 'approval', 'timesheet')
   * @param {string} templateType - Template type (e.g., 'customer_approval_response')
   * @param {Object} templateModule - Template module with generate method
   */
  registerTemplate(process, templateType, templateModule) {
    const key = `${process}:${templateType}`;
    this.templates.set(key, {
      process,
      templateType,
      module: templateModule,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Get email template
   * @param {string} process - Business process
   * @param {string} templateType - Template type
   * @param {Object} data - Template data
   * @returns {Object} Generated email template
   */
  getTemplate(process, templateType, data) {
    const key = `${process}:${templateType}`;
    const template = this.templates.get(key);

    if (!template) {
      throw new Error(`Template not found: ${process}:${templateType}`);
    }

    if (typeof template.module.generate !== 'function') {
      throw new Error(`Template module must have a 'generate' method: ${process}:${templateType}`);
    }

    return template.module.generate(data, {
      baseUrl: this.baseUrl,
      appUrl: this.appUrl
    });
  }

  /**
   * Auto-load templates from directory structure
   * @param {string} templatesDir - Directory containing template modules
   */
  loadTemplatesFromDirectory(templatesDir) {
    if (!fs.existsSync(templatesDir)) {
      console.warn(`Templates directory not found: ${templatesDir}`);
      return;
    }

    const processes = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const process of processes) {
      const processDir = path.join(templatesDir, process);
      const templateFiles = fs.readdirSync(processDir)
        .filter(file => file.endsWith('.js') && file !== 'index.js');

      for (const file of templateFiles) {
        const templateType = path.basename(file, '.js');
        const templatePath = path.join(processDir, file);

        try {
          const templateModule = require(templatePath);
          this.registerTemplate(process, templateType, templateModule);
          console.log(`Loaded template: ${process}:${templateType}`);
        } catch (error) {
          console.error(`Failed to load template ${process}:${templateType}:`, error.message);
        }
      }
    }
  }

  /**
   * Get all available processes
   * @returns {Array} List of processes
   */
  getAvailableProcesses() {
    const processes = new Set();
    for (const template of this.templates.values()) {
      processes.add(template.process);
    }
    return Array.from(processes);
  }

  /**
   * Get all available templates for a process
   * @param {string} process - Business process
   * @returns {Array} List of template types
   */
  getAvailableTemplates(process) {
    const templates = [];
    for (const template of this.templates.values()) {
      if (template.process === process) {
        templates.push(template.templateType);
      }
    }
    return templates;
  }

  /**
   * Get template metadata
   * @param {string} process - Business process
   * @param {string} templateType - Template type
   * @returns {Object} Template metadata
   */
  getTemplateMetadata(process, templateType) {
    const key = `${process}:${templateType}`;
    const template = this.templates.get(key);

    if (!template) {
      return null;
    }

    const baseMetadata = {
      process: template.process,
      templateType: template.templateType,
      registeredAt: template.registeredAt,
      hasGenerateMethod: typeof template.module.generate === 'function'
    };

    if (template.module.metadata && typeof template.module.metadata === 'object') {
      return {
        ...baseMetadata,
        ...template.module.metadata
      };
    }

    return {
      ...baseMetadata,
      name: template.templateType,
      category: template.process,
      version: 'unknown',
      requiredFields: [],
      optionalFields: []
    };
  }

  /**
   * Validate all registered templates
   * @returns {Object} Validation results
   */
  validateTemplates() {
    const results = {
      valid: 0,
      invalid: 0,
      errors: []
    };

    for (const [key, template] of this.templates.entries()) {
      try {
        if (typeof template.module.generate !== 'function') {
          throw new Error('Missing generate method');
        }

        const metadata = template.module.metadata || {};
        const requiredFields = Array.isArray(metadata.requiredFields) ? metadata.requiredFields : [];
        const sampleData = this.buildSampleData(requiredFields);

        // Ensure optional but critical fields exist when known
        if (metadata.optionalFields && metadata.optionalFields.includes('totalHours')) {
          sampleData.totalHours = sampleData.totalHours ?? 40;
        }

        template.module.generate(sampleData, { baseUrl: this.baseUrl, appUrl: this.appUrl });
        results.valid++;
      } catch (error) {
        results.invalid++;
        results.errors.push({
          template: key,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Build sample data for validation based on required fields
   * @param {Array<string>} requiredFields
   * @returns {Object}
   */
  buildSampleData(requiredFields) {
    const sample = {};
    const now = Date.now();

    requiredFields.forEach(field => {
      let value = `sample-${field}`;
      const lower = field.toLowerCase();

      if (lower.includes('email')) {
        value = 'test@example.com';
      } else if (lower.includes('name')) {
        value = 'Test Name';
      } else if (lower.endsWith('id') || lower.includes('id_')) {
        value = 'test-id';
      } else if (lower.includes('status')) {
        value = 'Approved';
      } else if (lower.includes('from') || lower.includes('until') || lower.includes('date')) {
        // Use ISO string for date checks; some templates expect MM/dd/yyyy, handle both
        value = '2024-01-01T00:00:00.000Z';
      } else if (lower.includes('period')) {
        value = '2024-01-01 to 2024-01-07';
      } else if (lower.includes('hours')) {
        value = 40;
      } else if (lower.includes('submissiondate')) {
        value = `${now}`;
      }

      sample[field] = value;
    });

    // Provide common aliases when required fields reference specific formats
    if (sample.fromDate) sample.fromDate = '2024-01-01';
    if (sample.untilDate) sample.untilDate = '2024-01-08';
    if (sample.submissionDate) sample.submissionDate = `${now}`;

    return sample;
  }
}

module.exports = EmailTemplateRegistry;
