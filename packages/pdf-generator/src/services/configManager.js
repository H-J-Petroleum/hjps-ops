/**
 * Configuration Manager
 * Centralized configuration management for PDF Generator
 */

const logger = require('../utils/logger');

class ConfigManager {
  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from various sources
   * @returns {Object} Configuration object
   */
  loadConfiguration() {
    const config = {
      // PDF Configuration
      pdf: {
        pageSize: process.env.HJ_PDF_PAGE_SIZE || 'A4',
        margin: parseInt(process.env.HJ_PDF_MARGIN) || 50,
        chunkCount: parseInt(process.env.HJ_PDF_CHUNK_COUNT) || 5,
        filename: process.env.HJ_PDF_FILENAME || 'field-ticket.pdf'
      },

      // HubSpot Configuration
      hubspot: {
        baseUrl: process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com/crm/v3',
        filesBaseUrl: process.env.HUBSPOT_FILES_BASE_URL || 'https://api.hubapi.com',
        apiToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN,
        approvalObjectTypeId:
          process.env.HJ_APPROVAL_OBJECT_TYPE_ID
          || process.env.HUBSPOT_APPROVAL_OBJECT_TYPE_ID
          || '2-26103010',
        timesheetObjectTypeId:
          process.env.HJ_TIMESHEET_OBJECT_TYPE_ID
          || process.env.HUBSPOT_TIMESHEET_OBJECT_TYPE_ID
          || '2-26173281',
        // Properties to request for approval objects
        approvalProperties: [
          'approval_request_id',
          'approval_project_id',
          'approval_project_name',
          'project_name',
          'approval_customer',
          'approval_operator',
          'approval_wells',
          'approval_consultant_name',
          'approval_consultant_id',
          'approval_consultant_email',
          'approval_approver_name',
          'approval_approver_email',
          'approval_approver_is_',
          'approval_sales_deal_owner_email',
          'approval_approval_from',
          'approval_approval_until',
          'approval_timesheet_ids_array',
          'response_approval_timesheet_ids_array',
          'response_approval_from_date',
          'response_approval_until_date',
          'response_approval_sales_deal_id',
          'response_approval_customer',
          'response_approval_project_id',
          'response_approval_project_name',
          'response_approval_operator',
          'quote_customer_primary_contact_id',
          'signature_new',
          'consultant_timesheet_approval_url',
          'field_ticket_url',
          'field_ticket_id',
          'consultant_field_ticket_url',
          'consultant_field_ticket_id',
          'internal_field_ticket_url',
          'internal_field_ticket_id'
        ],
        // Properties to request for timesheet objects
        timesheetProperties: [
          'hs_object_id',
          'timesheet_project_id',
          'timesheet_project_name',
          'timesheet_customer',
          'timesheet_operator',
          'timesheet_well',
          'timesheet_well_name',
          'timesheet_role',
          'timesheet_job_service',
          'timesheet_billing_frequency',
          'timesheet_consultant_full_name',
          'timesheet_consultant_id',
          'timesheet_consultant_email',
          'timesheet_payment_deal_id',
          'timesheet_approval_request_id',
          'timesheet_quantity',
          'timesheet_price',
          'timesheet_hj_price',
          'timesheet_total_price',
          'timesheet_hj_total_price',
          'timesheet_start_date',
          'timesheet_end_date',
          'timesheet_start_time',
          'timesheet_end_time',
          'timesheet_all_dates',
          'timesheet_ordinal_number',
          'invoice_number_second_part'
        ],
        // PDF chunk properties for different PDF types
        pdfChunkProps: {
          customer: [
            'field_ticket_pdf___01',
            'field_ticket_pdf___02',
            'field_ticket_pdf___03',
            'field_ticket_pdf___04',
            'field_ticket_pdf___05'
          ],
          consultant: [
            'consultant_field_ticket_pdf___01',
            'consultant_field_ticket_pdf___02',
            'consultant_field_ticket_pdf___03',
            'consultant_field_ticket_pdf___04',
            'consultant_field_ticket_pdf___05'
          ],
          internal: [
            'internal_field_ticket_pdf___01',
            'internal_field_ticket_pdf___02',
            'internal_field_ticket_pdf___03',
            'internal_field_ticket_pdf___04',
            'internal_field_ticket_pdf___05'
          ]
        },
        // PDF URL properties for different PDF types
        pdfUrlProps: {
          customer: 'field_ticket_url',
          consultant: 'consultant_field_ticket_url',
          internal: 'internal_field_ticket_url'
        },
        // PDF file metadata properties for different PDF types
        pdfFileMetaProps: {
          customer: {
            urlProp: 'field_ticket_url',
            idProp: 'field_ticket_id'
          },
          consultant: {
            urlProp: 'consultant_field_ticket_url',
            idProp: 'consultant_field_ticket_id'
          },
          internal: {
            urlProp: 'internal_field_ticket_url',
            idProp: 'internal_field_ticket_id'
          }
        }
      },

      // Storage Configuration
      storage: {
        provider: process.env.HJ_STORAGE_PROVIDER || 'hubspot',
        bucket: process.env.HJ_ARTIFACTS_BUCKET || process.env.S3_BUCKET,
        region: process.env.HJ_S3_REGION || process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.HJ_S3_ENDPOINT || process.env.S3_ENDPOINT,
        accessKeyId: process.env.HJ_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.HJ_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
        forcePathStyle: (process.env.HJ_S3_FORCE_PATH_STYLE || 'true').toLowerCase() === 'true',
        presignExpirySeconds: parseInt(process.env.HJ_PRESIGN_EXPIRY_SECONDS) || 604800,
        localDir: process.env.HJ_LOCAL_ARTIFACT_DIR || 'data/artifacts'
      },

      // PDF Type Configuration
      pdfTypes: {
        customer: {
          title: 'Field Ticket',
          pricingStrategy: 'customer',
          includeServiceSummary: true,
          includeWellBreakdown: true,
          folderName: 'ApprovedFieldTickets',
          urlProperty: 'field_ticket_url',
          idProperty: 'field_ticket_id'
        },
        consultant: {
          title: 'Consultant Timesheet',
          pricingStrategy: 'consultant',
          includeServiceSummary: true,
          includeWellBreakdown: true,
          folderName: 'BillForConsultants',
          urlProperty: 'consultant_field_ticket_url',
          idProperty: 'consultant_field_ticket_id'
        },
        internal: {
          title: 'Internal Field Ticket',
          pricingStrategy: 'customer',
          includeServiceSummary: true,
          includeWellBreakdown: true,
          folderName: 'InternalTickets',
          urlProperty: 'internal_field_ticket_url',
          idProperty: 'internal_field_ticket_id'
        }
      },

      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
      },

      // Feature Flags
      features: {
        enableCaching: process.env.ENABLE_CACHING === 'true',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableDebugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
        enableSignatureValidation: process.env.ENABLE_SIGNATURE_VALIDATION !== 'false'
      }
    };

    logger.info('Configuration loaded', {
      pdfTypes: Object.keys(config.pdfTypes),
      storageProvider: config.storage.provider,
      nodeEnv: config.server.nodeEnv
    });

    return config;
  }

  /**
   * Get PDF type configuration
   * @param {string} pdfType - PDF type
   * @returns {Object} PDF type configuration
   */
  getPDFTypeConfig(pdfType) {
    const normalizedType = this.normalizePDFType(pdfType);

    if (!this.config.pdfTypes[normalizedType]) {
      const availableTypes = Object.keys(this.config.pdfTypes);
      throw new Error(`Unknown PDF type: ${pdfType}. Available types: ${availableTypes.join(', ')}`);
    }

    return this.config.pdfTypes[normalizedType];
  }

  /**
   * Get PDF configuration
   * @returns {Object} PDF configuration
   */
  getPDFConfig() {
    return this.config.pdf;
  }

  /**
   * Get HubSpot configuration
   * @returns {Object} HubSpot configuration
   */
  getHubSpotConfig() {
    return this.config.hubspot;
  }

  /**
   * Get storage configuration
   * @returns {Object} Storage configuration
   */
  getStorageConfig() {
    return this.config.storage;
  }

  /**
   * Get server configuration
   * @returns {Object} Server configuration
   */
  getServerConfig() {
    return this.config.server;
  }

  /**
   * Get feature flags
   * @returns {Object} Feature flags
   */
  getFeatureFlags() {
    return this.config.features;
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Feature name
   * @returns {boolean} True if feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.config.features[featureName] === true;
  }

  /**
   * Get all available PDF types
   * @returns {Array<string>} Array of PDF types
   */
  getAvailablePDFTypes() {
    return Object.keys(this.config.pdfTypes);
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Validate required environment variables
    if (!this.config.hubspot.apiToken) {
      errors.push('HUBSPOT_PRIVATE_APP_TOKEN is required');
    }

    // Validate storage configuration
    if (this.config.storage.provider === 's3' && !this.config.storage.bucket) {
      errors.push('S3 bucket must be configured for S3 storage provider');
    }

    // Validate PDF types
    const pdfTypes = this.getAvailablePDFTypes();
    if (pdfTypes.length === 0) {
      errors.push('At least one PDF type must be configured');
    }

    // Check for warnings
    if (this.config.server.nodeEnv === 'development' && this.config.features.enableDebugLogging) {
      warnings.push('Debug logging is enabled in development mode');
    }

    if (this.config.storage.provider === 'local' && this.config.server.nodeEnv === 'production') {
      warnings.push('Local storage is not recommended for production');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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
   * Get configuration summary (safe for logging)
   * @returns {Object} Configuration summary
   */
  getConfigSummary() {
    return {
      pdfTypes: this.getAvailablePDFTypes(),
      storageProvider: this.config.storage.provider,
      nodeEnv: this.config.server.nodeEnv,
      logLevel: this.config.server.logLevel,
      features: Object.keys(this.config.features).filter(key => this.config.features[key]),
      hasApiToken: !!this.config.hubspot.apiToken,
      port: this.config.server.port
    };
  }

  /**
   * Reload configuration (useful for testing)
   */
  reload() {
    this.config = this.loadConfiguration();
    logger.info('Configuration reloaded');
  }
}

module.exports = ConfigManager;
