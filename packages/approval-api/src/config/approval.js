/**
 * Approval Configuration
 * Configuration for approval workflow
 */

module.exports = {
  // Workflow Configuration
  workflow: {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    timeout: 300000, // 5 minutes
    batchSize: 50
  },

  // URL Parsing Configuration
  urlParsing: {
    // Regex patterns for different URL formats
    patterns: {
      approval: /\/approval\/([a-f0-9-]+)/i,
      timesheet: /\/timesheet\/([a-f0-9-]+)/i,
      deal: /\/deal\/([0-9]+)/i,
      contact: /\/contact\/([0-9]+)/i
    },
    // Base URLs for different environments
    baseUrls: {
      production: 'https://app.hubspot.com',
      staging: 'https://app.hubspot.com',
      development: 'https://app.hubspot.com'
    }
  },

  // Property Mapping
  properties: {
    // Approval object properties (28 properties from PowerShell scripts)
    approval: {
      // Core properties
      hs_object_id: 'hs_object_id',
      approval_status: 'approval_status',
      timesheet_ids: 'timesheet_ids',
      consultant_field_ticket_url: 'consultant_field_ticket_url',

      // Date properties
      approval_date: 'approval_date',
      created_date: 'createdate',
      modified_date: 'hs_lastmodifieddate',

      // Status properties
      approval_notes: 'approval_notes',
      approval_reason: 'approval_reason',
      rejection_reason: 'rejection_reason',

      // PDF properties
      pdf_url: 'pdf_url',
      pdf_file_id: 'pdf_file_id',
      pdf_generated_date: 'pdf_generated_date',

      // Contact properties
      contact_id: 'contact_id',
      contact_email: 'contact_email',
      contact_name: 'contact_name',

      // Deal properties
      deal_id: 'deal_id',
      deal_name: 'deal_name',
      deal_amount: 'deal_amount',

      // Timesheet properties
      timesheet_count: 'timesheet_count',
      total_hours: 'total_hours',
      total_amount: 'total_amount',

      // Consultant properties
      consultant_name: 'consultant_name',
      consultant_email: 'consultant_email',
      consultant_phone: 'consultant_phone',

      // Company properties
      company_id: 'company_id',
      company_name: 'company_name',
      company_domain: 'company_domain'
    },

    // Timesheet object properties
    timesheet: {
      hs_object_id: 'hs_object_id',
      timesheet_status: 'timesheet_status',
      approval_id: 'approval_id',
      consultant_id: 'consultant_id',
      hours_worked: 'hours_worked',
      hourly_rate: 'hourly_rate',
      total_amount: 'total_amount',
      work_date: 'work_date',
      description: 'description'
    }
  },

  // Status Values
  status: {
    approval: {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      processing: 'processing',
      failed: 'failed'
    },
    timesheet: {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      paid: 'paid'
    }
  },

  // PDF Configuration
  pdf: {
    types: ['customer', 'consultant', 'invoice', 'internal'],
    defaultType: 'customer',
    generatorUrl: process.env.PDF_GENERATOR_URL || 'http://localhost:3000',
    timeout: 60000, // 1 minute
    useMock: process.env.PDF_GENERATOR_USE_MOCK
      ? process.env.PDF_GENERATOR_USE_MOCK === 'true'
      : process.env.NODE_ENV !== 'production'
  },

  // Notification Configuration
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
    email: {
      from: process.env.EMAIL_FROM || 'noreply@hjpetroleum.com',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@hjpetroleum.com'
    },
    templates: {
      approval: 'approval-notification',
      rejection: 'rejection-notification',
      error: 'error-notification'
    }
  }
};
