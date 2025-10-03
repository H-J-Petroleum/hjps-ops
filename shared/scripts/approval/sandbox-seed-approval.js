#!/usr/bin/env node

const axios = require('axios');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { applyObjectIdsToEnv, normaliseEnvKey } = require('./utils/object-ids');

const CONSULTANT_DEFAULTS = {
  email: 'sandbox.consultant@example.com',
  firstName: 'Sandbox',
  lastName: 'Consultant',
};

function parseArgs(argv) {
  const options = {
    env: null,
    projectId: null,
    timesheets: 2,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith('--') && !options.projectId) {
      options.projectId = arg;
      continue;
    }

    if (arg === '--env' && i + 1 < argv.length) {
      options.env = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.indexOf('--env=') === 0) {
      options.env = arg.split('=')[1];
      continue;
    }

    if (arg === '--project' && i + 1 < argv.length) {
      options.projectId = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.indexOf('--project=') === 0) {
      options.projectId = arg.split('=')[1];
      continue;
    }

    if (arg === '--timesheets' && i + 1 < argv.length) {
      options.timesheets = Number(argv[i + 1]);
      i += 1;
      continue;
    }

    if (arg.indexOf('--timesheets=') === 0) {
      options.timesheets = Number(arg.split('=')[1]);
      continue;
    }
  }

  if (!Number.isFinite(options.timesheets) || options.timesheets < 1) {
    options.timesheets = 2;
  }

  return options;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return (
    date.getUTCFullYear() +
    '-' + pad2(date.getUTCMonth() + 1) +
    '-' + pad2(date.getUTCDate())
  );
}

async function searchProject(http, projectObjectId, projectId) {
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
    properties: [
      'hj_project_id',
      'hj_project_name',
      'hj_sales_deal_owner_email',
      'hj_sales_deal_owner_name',
      'hj_approver_name',
      'hj_approver_email',
      'hj_approver_is',
    ],
    limit: 1,
  };

  const response = await http.post('/crm/v3/objects/' + projectObjectId + '/search', body);
  return response.data && Array.isArray(response.data.results) && response.data.results[0]
    ? response.data.results[0]
    : null;
}

async function createProject(http, projectObjectId, projectId) {
  const projectName = 'Sandbox Project ' + projectId;
  const response = await http.post('/crm/v3/objects/' + projectObjectId, {
    properties: {
      hj_project_id: projectId,
      hj_project_name: projectName,
      hj_sales_deal_owner_name: 'Sandbox Owner',
      hj_sales_deal_owner_email: 'sandbox.owner@example.com',
      hj_approver_name: 'Sandbox Approver',
      hj_approver_email: 'approver@example.com',
      hj_approver_is: 'HJPetro',
      hj_customer: 'Sandbox Customer Co',
      hj_operator: 'Sandbox Operator',
      hj_customer_id: 'sandbox-customer',
    },
  });

  return response.data;
}

async function ensureProject(http, projectObjectId, projectId) {
  const existing = await searchProject(http, projectObjectId, projectId);
  if (existing) {
    return existing;
  }
  return createProject(http, projectObjectId, projectId);
}

async function searchContact(http, email) {
  if (!email) {
    return null;
  }

  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          },
        ],
      },
    ],
    properties: ['email', 'firstname', 'lastname', 'hubspot_owner_id'],
    limit: 1,
  };

  const response = await http.post('/crm/v3/objects/contacts/search', body);
  return response.data && Array.isArray(response.data.results) && response.data.results[0]
    ? response.data.results[0]
    : null;
}

async function createContact(http, { email, firstName, lastName }) {
  const response = await http.post('/crm/v3/objects/contacts', {
    properties: {
      email,
      firstname: firstName,
      lastname: lastName,
    },
  });
  return response.data;
}

async function ensureConsultantContact(http, { email, firstName, lastName }) {
  const existing = await searchContact(http, email);
  if (existing) {
    return existing;
  }
  return createContact(http, { email, firstName, lastName });
}

function buildConsultantProfile(contactRecord) {
  if (!contactRecord) {
    return {
      id: null,
      email: CONSULTANT_DEFAULTS.email,
      firstName: CONSULTANT_DEFAULTS.firstName,
      lastName: CONSULTANT_DEFAULTS.lastName,
      name: CONSULTANT_DEFAULTS.firstName + ' ' + CONSULTANT_DEFAULTS.lastName,
      ownerId: null,
      properties: {},
    };
  }

  const properties = contactRecord.properties || {};
  const firstName = properties.firstname || CONSULTANT_DEFAULTS.firstName;
  const lastName = properties.lastname || CONSULTANT_DEFAULTS.lastName;
  const email = properties.email || CONSULTANT_DEFAULTS.email;
  const ownerId = properties.hubspot_owner_id || null;
  const name = [firstName, lastName].filter(Boolean).join(' ') || (CONSULTANT_DEFAULTS.firstName + ' ' + CONSULTANT_DEFAULTS.lastName);

  return {
    id: contactRecord.id,
    email,
    firstName,
    lastName,
    name,
    ownerId,
    properties,
  };
}

function collectTimesheetDates(timesheets) {
  return timesheets
    .flatMap((record) => {
      const props = record.properties || {};
      return [props.timesheet_date, props.timesheet_start_date, props.timesheet_end_date];
    })
    .filter((value) => Boolean(value))
    .sort();
}

async function createTimesheet(http, timesheetObjectId, project, projectId, baseDate, index, consultant, options) {
  const date = new Date(baseDate.getTime());
  date.setUTCDate(baseDate.getUTCDate() - index);

  const consultantName = consultant?.name || (CONSULTANT_DEFAULTS.firstName + ' ' + CONSULTANT_DEFAULTS.lastName);
  const consultantEmail = consultant?.email || CONSULTANT_DEFAULTS.email;
  const consultantId = consultant?.id || 'sandbox-consultant';
  const projectName = (project && project.properties && project.properties.hj_project_name)
    || 'Sandbox Project ' + projectId;
  const dateString = formatDate(date);
  const useDateRange = options && options.useDateRange;

  const properties = {
    timesheet_project_id: projectId,
    timesheet_project_name: projectName,
    timesheet_quantity: '8',
    line_item_description: 'Sandbox timesheet entry ' + String(index + 1),
    timesheet_consultant_full_name: consultantName,
    timesheet_consultant_email: consultantEmail,
    timesheet_consultant_id: consultantId,
    timesheet_customer: 'Sandbox Customer Co',
    timesheet_operator: 'Sandbox Operator',
    timesheet_sales_deal_id: 'sandbox-deal',
    timesheet_approval_status: 'Submitted',
  };

  if (useDateRange) {
    properties.timesheet_start_date = dateString;
    properties.timesheet_end_date = dateString;
  } else {
    properties.timesheet_date = dateString;
    properties.timesheet_status = 'Submitted';
  }

  const response = await http.post('/crm/v3/objects/' + timesheetObjectId, {
    properties,
  });

  return response.data;
}

async function createApproval(http, approvalObjectId, project, timesheets, consultant) {
  const projectId = (project && project.properties && project.properties.hj_project_id) || project.id;
  const projectName = (project && project.properties && project.properties.hj_project_name) || 'Sandbox Project';
  const approverName = (project && project.properties && project.properties.hj_approver_name) || 'Sandbox Approver';
  const approverEmail = (project && project.properties && project.properties.hj_approver_email) || 'approver@example.com';
  const timesheetIds = timesheets.map((record) => record.id);
  const timeStrings = timesheetIds.join(',');

  const consultantName = consultant?.name || (CONSULTANT_DEFAULTS.firstName + ' ' + CONSULTANT_DEFAULTS.lastName);
  const consultantEmail = consultant?.email || CONSULTANT_DEFAULTS.email;
  const consultantId = consultant?.id || 'sandbox-consultant';
  const consultantFirstName = consultant?.firstName || CONSULTANT_DEFAULTS.firstName;
  const consultantLastName = consultant?.lastName || CONSULTANT_DEFAULTS.lastName;
  const consultantOwnerId = consultant?.ownerId || null;

  const dateCandidates = collectTimesheetDates(timesheets);
  const fromDate = dateCandidates[0] || formatDate(new Date());
  const untilDate = dateCandidates.length > 0 ? dateCandidates[dateCandidates.length - 1] : fromDate;

  const pdfBase = Buffer.from('Sandbox PDF for ' + projectId).toString('base64');
  const middle = Math.ceil(pdfBase.length / 2);
  const fieldTicketParts = [pdfBase.slice(0, middle), pdfBase.slice(middle)];
  const consultantPdfBase = Buffer.from('Sandbox Consultant PDF for ' + projectId).toString('base64');
  const consultantMiddle = Math.ceil(consultantPdfBase.length / 2);
  const consultantTicketParts = [consultantPdfBase.slice(0, consultantMiddle), consultantPdfBase.slice(consultantMiddle)];

  const requestId = projectId + '-' + Date.now();

  const properties = {
    approval_project_id: projectId,
    approval_project_name: projectName,
    project_name: projectName,
    approval_timesheet_ids_array: timeStrings,
    approval_approval_status: 'Submitted',
    approval_approve_reject: 'Pending',
    approval_approver_name: approverName,
    approval_approver_email: approverEmail,
    approval_approver_is_: 'HJPetro',
    approval_consultant_email: consultantEmail,
    approval_consultant_id: consultantId,
    approval_consultant_name: consultantName,
    approver_full_name: approverName,
    approver_email: approverEmail,
    approver_is: 'HJPetro',
    approver_unique_id: 'sandbox-approver',
    response_approval_project_id: projectId,
    response_approval_project_name: projectName,
    response_approval_timesheet_ids_array: timeStrings,
    response_approval_consultant_name: consultantName,
    response_approval_consultant_id: consultantId,
    response_approval_customer: 'Sandbox Customer Co',
    response_approval_operator: 'Sandbox Operator',
    response_approval_from_date: fromDate,
    response_approval_until_date: untilDate,
    response_approval_customer_comment: 'Seeded via sandbox-seed-approval.js',
    response_approval_request_id: requestId,
    response_approval_customer_id: 'sandbox-customer',
    response_approval_owner_id: 'sandbox-owner',
    quote_customer_primary_contact_id: '0701',
    field_ticket_pdf___01: fieldTicketParts[0],
    field_ticket_pdf___02: fieldTicketParts[1],
    consultant_field_ticket_pdf___01: consultantTicketParts[0],
    consultant_field_ticket_pdf___02: consultantTicketParts[1],
  };

  if (consultantId) {
    properties.contact_hs_object_id = consultantId;
  }
  if (consultantOwnerId) {
    properties.contact_hubspot_owner_id = consultantOwnerId;
  }
  if (consultantEmail) {
    properties.email = consultantEmail;
  }
  if (consultantFirstName) {
    properties.firstname = consultantFirstName;
  }
  if (consultantLastName) {
    properties.lastname = consultantLastName;
  }

  const response = await http.post('/crm/v3/objects/' + approvalObjectId, {
    properties,
  });

  return response.data;
}

function resolveToken(envPreference) {
  const envLower = (envPreference || '').toLowerCase();

  const tokenCandidates = [];
  if (envLower === 'betasandbox') {
    tokenCandidates.push(process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.PRIVATE_APP_TOKEN);
  } else if (envLower === 'sandbox' || envLower === 'standard_sandbox') {
    tokenCandidates.push(process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.PRIVATE_APP_TOKEN);
  } else {
    tokenCandidates.push(process.env.PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN);
    tokenCandidates.push(process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN);
  }

  const direct = tokenCandidates.find((value) => Boolean(value));
  if (direct) {
    return direct;
  }

  try {
    let command;
    if (envLower === 'betasandbox') {
      command = 'Get-Secret -Name HS_BETA_SANDBOX_PRIVATE_APP -AsPlainText';
    } else if (envLower === 'sandbox' || envLower === 'standard_sandbox') {
      command = 'Get-Secret -Name LEGACY_SANDBOX_PRIVATE_APP_TOKEN -AsPlainText';
    } else {
      command = 'Get-Secret -Name HS_PROD_PRIVATE_APP -AsPlainText';
    }
    const output = execSync('pwsh.exe -NoProfile -Command "' + command + '"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.trim();
  } catch (error) {
    return null;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rawEnvPreference = options.env || process.env.HUBSPOT_ENV || 'sandbox';
  const envPreference = normaliseEnvKey ? normaliseEnvKey(rawEnvPreference) : rawEnvPreference;
  process.env.HUBSPOT_ENV = envPreference;

  const ids = applyObjectIdsToEnv(envPreference);
  const isBetaEnvironment = (envPreference || '').toLowerCase() === 'betasandbox';
  const token = resolveToken(envPreference);

  if (!token) {
    console.error('Set BETA_SANDBOX_PRIVATE_APP_TOKEN, LEGACY_SANDBOX_PRIVATE_APP_TOKEN, or PRIVATE_APP_TOKEN before running.');
    process.exit(1);
  }

  const http = axios.create({
    baseURL: 'https://api.hubapi.com',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });

  const iso = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  const projectId = options.projectId || ('hjp-sandbox-' + iso + '-' + randomSuffix);

  try {
    const project = await ensureProject(http, ids.HJ_PROJECT_OBJECT_ID, projectId);

    const contactRecord = await ensureConsultantContact(http, CONSULTANT_DEFAULTS);
    const consultant = buildConsultantProfile(contactRecord);

    const baseDate = new Date();
    const timesheets = [];
    for (let i = 0; i < options.timesheets; i += 1) {
      const timesheet = await createTimesheet(
        http,
        ids.HJ_TIMESHEET_OBJECT_ID,
        project,
        projectId,
        baseDate,
        i,
        consultant,
        { useDateRange: isBetaEnvironment },
      );
      timesheets.push(timesheet);
    }

    const approval = await createApproval(
      http,
      ids.HJ_APPROVAL_OBJECT_ID,
      project,
      timesheets,
      consultant,
    );

    console.log(JSON.stringify({
      environment: envPreference,
      consultant: {
        id: consultant.id,
        email: consultant.email,
        firstName: consultant.firstName,
        lastName: consultant.lastName,
      },
      project: {
        id: project.id,
        properties: project.properties,
      },
      timesheets: timesheets.map((record) => ({
        id: record.id,
        properties: record.properties,
      })),
      approval: {
        id: approval.id,
        properties: approval.properties,
      },
    }, null, 2));
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Seeding failed:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Seeding failed:', error.message || error);
    }
    process.exit(1);
  }
}

main();
