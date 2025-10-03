/**
 * HubSpot Configuration
 * Configuration for HubSpot API integration
 */

module.exports = {
  // HubSpot API Configuration
  baseUrl: process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com',
  apiKey: process.env.HUBSPOT_PRIVATE_APP_TOKEN,

  // Object Type IDs
  objectTypes: {
    approval: process.env.HUBSPOT_APPROVAL_OBJECT_TYPE_ID || '2-26103010',
    timesheet: process.env.HUBSPOT_TIMESHEET_OBJECT_TYPE_ID || '2-26173281',
    project: process.env.HUBSPOT_PROJECT_OBJECT_TYPE_ID || '2-26103074',
    contact: '0-1',
    deal: '0-3',
    company: '0-2'
  },

  // API Endpoints
  endpoints: {
    objects: '/crm/v3/objects',
    associations: '/crm/v4/associations',
    files: '/filemanager/api/v3/files',
    batch: '/crm/v3/batch'
  },

  // Rate Limiting
  rateLimit: {
    requestsPerSecond: 10,
    burstLimit: 100
  },

  // Retry Configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    backoffMultiplier: 2
  },

  // Timeout Configuration
  timeout: {
    request: 30000, // 30 seconds
    connection: 10000 // 10 seconds
  },

  // Validation
  validate: {
    requiredProperties: [
      'hs_object_id',
      'approval_status',
      'timesheet_ids',
      'consultant_field_ticket_url'
    ],
    optionalProperties: [
      'approval_date',
      'approval_notes',
      'pdf_url',
      'pdf_file_id'
    ]
  }
};
