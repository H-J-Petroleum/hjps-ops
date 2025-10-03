const { HubSpotClient } = require('./hubspotClient');

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

async function fetchApproval(client, approvalId) {
  return await client.getApproval(approvalId, APPROVAL_PROPERTIES);
}

async function fetchContact(client, contactId) {
  return await client.getContact(contactId, CONTACT_PROPERTIES);
}

async function fetchProject(client, projectId) {
  return await client.searchProjectById(projectId, PROJECT_PROPERTIES);
}

async function fetchTimesheets(client, timesheetIds) {
  return await client.getTimesheetsBatch(timesheetIds, TIMESHEET_PROPERTIES);
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

  // Create HubSpot client using toolkit patterns
  const client = new HubSpotClient({ token, logger });
  logger.debug('Loading approval record', { approvalId });

  const approvalResponse = await fetchApproval(client, approvalId);
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
  const consultantResponse = await fetchContact(client, consultantId);

  logger.debug('Loading project record', { projectId });
  const projectResponse = await fetchProject(client, projectId);

  logger.debug('Loading timesheets', { count: timesheetIds.length });
  const timesheetResponses = await fetchTimesheets(client, timesheetIds);

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
