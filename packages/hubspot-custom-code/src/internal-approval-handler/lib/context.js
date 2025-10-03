const axios = require('axios');

const DEFAULT_OBJECT_IDS = {
  production: {
    HJ_APPROVAL_OBJECT_ID: '2-26103010',
    HJ_PROJECT_OBJECT_ID: '2-26102958',
    HJ_TIMESHEET_OBJECT_ID: '2-26173281',
  },
  sandbox: {
    HJ_APPROVAL_OBJECT_ID: '2-43857574',
    HJ_PROJECT_OBJECT_ID: '2-43857563',
    HJ_TIMESHEET_OBJECT_ID: '2-43857566',
  },
  betaSandbox: {
    HJ_APPROVAL_OBJECT_ID: '2-50490319',
    HJ_PROJECT_OBJECT_ID: '2-50490320',
    HJ_TIMESHEET_OBJECT_ID: '2-50490321',
  },
};

function normaliseEnvKey(value) {
  if (!value) {
    return null;
  }

  const lower = String(value).toLowerCase();
  if (lower === 'production' || lower === 'prod') {
    return 'production';
  }
  if (lower === 'sandbox' || lower === 'standard_sandbox') {
    return 'sandbox';
  }
  if (lower === 'beta' || lower === 'beta_sandbox' || lower === 'betasandbox') {
    return 'betaSandbox';
  }
  return value;
}

function resolveDefaultIds() {
  const envHint = normaliseEnvKey(process.env.HUBSPOT_ENV);
  if (envHint && DEFAULT_OBJECT_IDS[envHint]) {
    return DEFAULT_OBJECT_IDS[envHint];
  }

  if (!process.env.HJ_APPROVAL_OBJECT_ID) {
    if (process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN && DEFAULT_OBJECT_IDS.betaSandbox) {
      return DEFAULT_OBJECT_IDS.betaSandbox;
    }
    if (process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN && DEFAULT_OBJECT_IDS.sandbox) {
      return DEFAULT_OBJECT_IDS.sandbox;
    }
  }

  return DEFAULT_OBJECT_IDS.production;
}

const DEFAULT_IDS = resolveDefaultIds();

const APPROVAL_OBJECT = process.env.HJ_APPROVAL_OBJECT_ID || DEFAULT_IDS.HJ_APPROVAL_OBJECT_ID;
const PROJECT_OBJECT = process.env.HJ_PROJECT_OBJECT_ID || DEFAULT_IDS.HJ_PROJECT_OBJECT_ID;
const TIMESHEET_OBJECT = process.env.HJ_TIMESHEET_OBJECT_ID || DEFAULT_IDS.HJ_TIMESHEET_OBJECT_ID;

const APPROVAL_PROPERTIES = [
  'approval_approve_reject',
  'approval_approval_status',
  'approval_processed_date',
  'approval_timesheet_ids_array',
  'approval_project_id',
  'approval_customer_comment',
  'approval_consultant_email',
  'approval_consultant_id',
  'approval_consultant_name',
  'approval_project_name',
  'response_approval_timesheet_ids_array',
  'response_approval_consultant_id',
  'response_approval_consultant_name',
  'response_approval_consultant_email',
  'response_approval_customer',
  'response_approval_customer_comment',
  'response_approval_project_id',
  'response_approval_sales_deal_id',
  'response_approval_deal_owner_email',
  'response_approval_from_date',
  'response_approval_until_date',
  'response_approval_operator',
  'response_approval_request_id',
  'response_approval_customer_id',
  'response_approval_owner_id',
  'quote_customer_primary_contact_id',
  'field_ticket_pdf___01',
  'field_ticket_pdf___02',
  'field_ticket_pdf___03',
  'field_ticket_pdf___04',
  'field_ticket_pdf___05',
  'consultant_field_ticket_pdf___01',
  'consultant_field_ticket_pdf___02',
  'consultant_field_ticket_pdf___03',
  'consultant_field_ticket_pdf___04',
  'consultant_field_ticket_pdf___05',
  'field_ticket_url',
  'field_ticket_id',
  'consultant_field_ticket_url',
  'consultant_field_ticket_id',
  'consultant_timesheet_url',
  'contact_hs_object_id',
];

const CONTACT_PROPERTIES = [
  'firstname',
  'lastname',
  'email',
  'hubspot_owner_id',
];

const PROJECT_PROPERTIES = [
  'hj_project_id',
  'hj_project_name',
  'hj_sales_deal_owner_name',
  'hj_sales_deal_owner_email',
  'hj_customer_id',
];

const TIMESHEET_PROPERTIES = [
  'timesheet_approval_status',
  'processed_date',
  'timesheet_approval_comment',
  'invoice_number',
  'bill_number',
  'timesheet_date',
  'timesheet_start_date',
  'timesheet_end_date',
  'timesheet_consultant_email',
  'timesheet_consultant_full_name',
  'timesheet_consultant_id',
  'timesheet_project_id',
  'timesheet_project_name',
  'timesheet_status',
  'timesheet_quantity',
  'line_item_description',
];

function createHttpClient(token) {
  if (!token) {
    throw new Error('PRIVATE_APP_TOKEN secret is required');
  }

  return axios.create({
    baseURL: 'https://api.hubapi.com',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

async function fetchApproval(httpClient, approvalId) {
  const response = await httpClient.get(`/crm/v3/objects/${APPROVAL_OBJECT}/${approvalId}`, {
    params: {
      properties: APPROVAL_PROPERTIES.join(','),
    },
  });
  return response.data;
}

async function fetchContact(httpClient, contactId) {
  if (!contactId) {
    return null;
  }
  const response = await httpClient.get(`/crm/v3/objects/contacts/${contactId}`, {
    params: {
      properties: CONTACT_PROPERTIES.join(','),
    },
  });
  return response.data;
}

async function fetchProject(httpClient, projectId) {
  if (!projectId) {
    return null;
  }

  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'hj_project_id',
            operator: 'EQ',
            value: projectId,
          },
        ],
      },
    ],
    properties: PROJECT_PROPERTIES,
    limit: 1,
  };

  const response = await httpClient.post(`/crm/v3/objects/${PROJECT_OBJECT}/search`, body);
  return response.data.results?.[0] || null;
}

async function fetchTimesheets(httpClient, timesheetIds) {
  if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
    return [];
  }

  const inputs = timesheetIds.map((id) => ({ id }));
  const body = {
    properties: TIMESHEET_PROPERTIES,
    inputs,
  };

  const response = await httpClient.post(`/crm/v3/objects/${TIMESHEET_OBJECT}/batch/read`, body);
  return response.data.results || [];
}

function parseTimesheetIds(approvalProperties) {
  const raw = approvalProperties.response_approval_timesheet_ids_array
    || approvalProperties.approval_timesheet_ids_array;

  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function loadApprovalContext({ approvalId, logger, token }) {
  if (!approvalId) {
    throw new Error('approvalId is required to load approval context');
  }

  const httpClient = createHttpClient(token);
  logger.debug('Loading approval record', { approvalId });

  const approvalResponse = await fetchApproval(httpClient, approvalId);
  const approval = {
    id: approvalResponse.id,
    properties: approvalResponse.properties || {},
  };

  const consultantId = approval.properties.response_approval_consultant_id
    || approval.properties.contact_hs_object_id
    || null;

  const projectId = approval.properties.response_approval_project_id
    || approval.properties.approval_project_id
    || null;

  const timesheetIds = parseTimesheetIds(approval.properties);

  logger.debug('Loading consultant contact', { consultantId });
  const consultantResponse = await fetchContact(httpClient, consultantId);

  logger.debug('Loading project record', { projectId });
  const projectResponse = await fetchProject(httpClient, projectId);

  logger.debug('Loading timesheets', { count: timesheetIds.length });
  const timesheetResponses = await fetchTimesheets(httpClient, timesheetIds);

  return {
    approvalId,
    approval,
    consultant: consultantResponse
      ? { id: consultantResponse.id, properties: consultantResponse.properties || {} }
      : null,
    project: projectResponse
      ? { id: projectResponse.id, properties: projectResponse.properties || {} }
      : null,
    timesheets: timesheetResponses.map((record) => ({
      id: record.id,
      properties: record.properties || {},
    })),
    httpClient,
    objectIds: {
      approval: APPROVAL_OBJECT,
      project: PROJECT_OBJECT,
      timesheet: TIMESHEET_OBJECT,
    },
  };
}

module.exports = {
  loadApprovalContext,
};
