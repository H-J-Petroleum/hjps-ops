import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

const DEAL_PROPERTIES = [
  'hs_object_id',
  'dealname',
  'amount',
  'hj_customer_name',
  'hj_customer_id',
  'hj_operator_name',
  'hj_operator_id',
  'hj_primary_customer_contact_name',
  'hj_primary_contact_email',
  'hj_primary_customer_contact_id',
  'hubspot_owner_id',
  'owner_name',
  'owner_email',
  'owner_contact_id',
  'approver_full_name',
  'approver_contact_email',
  'approver_unique_id',
  'hj_approver_is',
  'project_object_id',
  'project_unique_id',
  'terms',
  'taxable',
  'class'
];

const CONTACT_PROPERTIES = [
  'hs_object_id',
  'firstname',
  'lastname',
  'email',
  'phone',
  'submitted_as_timesheet_contact',
  'main_contact_id',
  'main_contact_email'
];

const PROJECT_PROPERTIES = [
  'hj_project_id',
  'hj_project_name',
  'hj_customer',
  'hj_customer_id',
  'hj_operator',
  'hj_operator_id',
  'hj_primary_contact_name',
  'hj_primary_contact_email',
  'hj_primary_contact_id',
  'hj_sales_deal_owner_name',
  'hj_sales_deal_owner_email',
  'hj_sales_deal_owner_contact_id',
  'hj_sales_deal_record_id',
  'hj_approver_name',
  'hj_approver_email',
  'hj_approver_id',
  'hj_approver_is',
  'hj_terms',
  'hj_taxable',
  'hj_class',
  'hubspot_owner_id'
];

const SERVICE_PROPERTIES = [
  'hj_service_name',
  'hj_sku',
  'hj_billing_frequency',
  'hj_hourly_price',
  'hj_daily_price',
  'hj_per_each_price',
  'hj_per_mile_price',
  'hj_fee_one_time_price',
  'hj_hj_hourly_price',
  'hj_hj_daily_price',
  'hj_hj_per_each_price',
  'hj_hj_per_mile_price',
  'hj_hj_fee_one_time_price'
];

const TIMESHEET_PROPERTIES = [
  'timesheet_project_id',
  'timesheet_project_name',
  'timesheet_consultant_id',
  'timesheet_consultant_email',
  'timesheet_consultant_full_name',
  'timesheet_job_service',
  'timesheet_role',
  'timesheet_billing_frequency',
  'timesheet_well',
  'timesheet_quantity',
  'timesheet_total_price',
  'timesheet_hj_total_price',
  'timesheet_approval_status',
  'processed_date',
  'invoice_number_second_part',
  'payment_deal_id',
  'sales_deal_id'
];

const OBJECT_PATHS = {
  deal: 'deals',
  contact: 'contacts',
  project: '2-26103074',
  service: '2-26102982',
  timesheet: '2-26173281'
};

function propertyQuery(properties) {
  return { properties: properties.join(',') };
}

async function fetchObject(objectType, id, properties) {
  const res = await hubspotRequest(`/crm/v3/objects/${objectType}/${id}`, {
    query: propertyQuery(properties)
  });
  return {
    id: res.id,
    properties: res.properties || {}
  };
}

async function searchObject(objectType, propertyName, value, properties) {
  const res = await hubspotRequest(`/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    body: {
      filterGroups: [
        {
          filters: [
            {
              propertyName,
              operator: 'EQ',
              value
            }
          ]
        }
      ],
      properties,
      limit: 1
    }
  });
  const record = (res.results && res.results[0]) || null;
  return record ? { id: record.id, properties: record.properties || {} } : null;
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node collect-project-service-context.mjs <request-context.json>');
    process.exit(1);
  }
  const request = readJson(contextPath);
  const outputDir = request.outputDir
    ? path.resolve(request.outputDir)
    : path.dirname(path.resolve(contextPath));

  const summary = {
    generatedAt: new Date().toISOString()
  };

  if (request.dealId) {
    logStep(`Fetching deal ${request.dealId}`);
    summary.deal = await fetchObject(OBJECT_PATHS.deal, request.dealId, DEAL_PROPERTIES);
  }

  if (request.projectId) {
    logStep(`Fetching project ${request.projectId}`);
    summary.project = await fetchObject(OBJECT_PATHS.project, request.projectId, PROJECT_PROPERTIES);
  } else if (request.projectSearch) {
    logStep(`Searching for project ${request.projectSearch.property}=${request.projectSearch.value}`);
    summary.project = await searchObject(
      OBJECT_PATHS.project,
      request.projectSearch.property,
      request.projectSearch.value,
      PROJECT_PROPERTIES
    );
  }

  if (Array.isArray(request.contactIds) && request.contactIds.length) {
    logStep(`Fetching ${request.contactIds.length} contact(s)`);
    summary.contacts = [];
    for (const contactId of request.contactIds) {
      const contact = await fetchObject(OBJECT_PATHS.contact, contactId, CONTACT_PROPERTIES);
      summary.contacts.push(contact);
    }
  }

  if (Array.isArray(request.serviceIds) && request.serviceIds.length) {
    logStep(`Fetching ${request.serviceIds.length} service(s)`);
    summary.services = [];
    for (const serviceId of request.serviceIds) {
      const service = await fetchObject(OBJECT_PATHS.service, serviceId, SERVICE_PROPERTIES);
      summary.services.push(service);
    }
  } else if (request.serviceSearch) {
    logStep(`Searching for service ${request.serviceSearch.property}=${request.serviceSearch.value}`);
    const service = await searchObject(
      OBJECT_PATHS.service,
      request.serviceSearch.property,
      request.serviceSearch.value,
      SERVICE_PROPERTIES
    );
    if (service) {
      summary.services = [service];
    }
  }

  if (Array.isArray(request.timesheetIds) && request.timesheetIds.length) {
    logStep(`Fetching ${request.timesheetIds.length} timesheet(s)`);
    summary.timesheets = [];
    for (const timesheetId of request.timesheetIds) {
      const timesheet = await fetchObject(OBJECT_PATHS.timesheet, timesheetId, TIMESHEET_PROPERTIES);
      summary.timesheets.push(timesheet);
    }
  }

  const outputPath = writeJson(outputDir, 'project-service-context', summary);
  console.log(`\nContext saved to ${outputPath}`);
}

main().catch(err => {
  console.error('collect-project-service-context failed:', err);
  process.exit(1);
});
