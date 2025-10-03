const HUBSPOT_BASE_URL = 'https://api.hubapi.com/crm/v3';
const HUBSPOT_FILES_BASE_URL = 'https://api.hubapi.com';

// Object type IDs
// Approval object: 2-26103010
// Timesheet object: 2-26173281
// Keep configurable in case of ID changes between environments.
const APPROVAL_OBJECT_TYPE_ID = process.env.HJ_APPROVAL_OBJECT_TYPE_ID || '2-26103010';
const TIMESHEET_OBJECT_TYPE_ID = process.env.HJ_TIMESHEET_OBJECT_TYPE_ID || '2-26173281';

// Property mappings for PDF chunk storage
const PDF_CHUNK_PROPS = {
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
};

// Preferred URL properties (bypass chunking)
const PDF_URL_PROPS = {
  customer: process.env.HJ_APPROVAL_PDF_URL_PROP_CUSTOMER || 'field_ticket_url',
  consultant: process.env.HJ_APPROVAL_PDF_URL_PROP_CONSULTANT || 'consultant_field_ticket_url',
  internal: process.env.HJ_APPROVAL_PDF_URL_PROP_INTERNAL || 'internal_field_ticket_url'
};

// File id + url property mapping for HubSpot Files uploads
const PDF_FILE_META_PROPS = {
  customer: {
    id: process.env.HJ_APPROVAL_PDF_ID_PROP_CUSTOMER || 'field_ticket_id',
    url: process.env.HJ_APPROVAL_PDF_URL_PROP_CUSTOMER || 'field_ticket_url'
  },
  consultant: {
    id: process.env.HJ_APPROVAL_PDF_ID_PROP_CONSULTANT || 'consultant_field_ticket_id',
    url: process.env.HJ_APPROVAL_PDF_URL_PROP_CONSULTANT || 'consultant_field_ticket_url'
  },
  internal: {
    id: process.env.HJ_APPROVAL_PDF_ID_PROP_INTERNAL || 'internal_field_ticket_id',
    url: process.env.HJ_APPROVAL_PDF_URL_PROP_INTERNAL || 'internal_field_ticket_url'
  }
};

// Folder names for HubSpot Files
const PDF_FOLDERS = {
  customer: process.env.HJ_HS_FILES_FOLDER_CUSTOMER || 'ApprovedFieldTickets',
  consultant: process.env.HJ_HS_FILES_FOLDER_CONSULTANT || 'BillForConsultants',
  internal: process.env.HJ_HS_FILES_FOLDER_INTERNAL || 'InternalTickets'
};

// Approval object properties to request
const APPROVAL_PROPERTIES = [
  'approval_request_id',
  'approval_project_id',
  'approval_consultant_id',
  'approval_approver_name',
  'approval_approver_email',
  'approval_approver_is_',
  'signature_new',
  'consultant_timesheet_approval_url'
];

// Timesheet properties to request
const TIMESHEET_PROPERTIES = [
  'hs_object_id',
  'timesheet_project_name',
  'timesheet_customer',
  'timesheet_operator',
  'timesheet_consultant_id',
  'timesheet_consultant_email',
  'timesheet_consultant_full_name',
  'timesheet_well',
  'timesheet_role',
  'timesheet_job_service',
  'timesheet_billing_frequency',
  'timesheet_hj_price',
  'timesheet_price',
  'timesheet_quantity',
  'timesheet_hj_total_price',
  'timesheet_total_price',
  'timesheet_start_date',
  'timesheet_end_date',
  'timesheet_start_time',
  'timesheet_end_time',
  'timesheet_all_dates',
  'hs_createdate',
  'timesheet_approval_status',
  'timesheet_ordinal_number',
  'timesheet_payment_deal_id'
];

module.exports = {
  HUBSPOT_BASE_URL,
  HUBSPOT_FILES_BASE_URL,
  APPROVAL_OBJECT_TYPE_ID,
  TIMESHEET_OBJECT_TYPE_ID,
  PDF_CHUNK_PROPS,
  PDF_URL_PROPS,
  PDF_FILE_META_PROPS,
  PDF_FOLDERS,
  APPROVAL_PROPERTIES,
  TIMESHEET_PROPERTIES
};
