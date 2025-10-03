import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.join('analysis/issues/2025-09-30-consultant-approval-api/data', `approval-context-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

async function hubspotRequest(pathname, { method = 'GET', body, query } = {}) {
  const tokenPath = path.resolve('.hubspot-token');
  if (!fs.existsSync(tokenPath)) throw new Error('Token file .hubspot-token not found.');
  const token = fs.readFileSync(tokenPath, 'utf8').trim();
  if (!token) throw new Error('Token file is empty.');

  const url = new URL(`https://api.hubapi.com${pathname}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HubSpot request failed (${res.status} ${res.statusText}): ${text}`);
  }
  return JSON.parse(text);
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const context = {
    contactId: '299151',
    timestamp: new Date().toISOString()
  };

  // 1. Fetch consultant contact properties
  const contactProps = [
    'approval_consultant_name','approval_consultant_email','approval_consultant_id',
    'approval_customer','approval_operator','approval_project_id','approval_project_name',
    'approval_sales_deal_id','approval_sales_deal_owner_email','approval_sales_deal_owner_full_name',
    'approver_full_name','approver_email','approver_unique_id','approver_is',
    'approval_from_date','approval_until_date','approval_processed_date',
    'approval_timesheet_ids_array','approval_request_id','approval_object_record_id',
    'submitted_as_timesheet_contact','main_contact_id','main_contact_email',
    'quote_customer_name'
  ];
  const contact = await hubspotRequest(`/crm/v3/objects/contacts/${context.contactId}`, {
    query: { properties: contactProps.join(',') }
  });
  context.contact = contact.properties;

  // Parse timesheet IDs
  const timesheetIdsCsv = contact.properties.approval_timesheet_ids_array || '';
  const timesheetIds = timesheetIdsCsv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  context.timesheetIds = timesheetIds;

  // 2. Fetch timesheet details via batch read (properties needed for updates)
  const timesheetProps = [
    'timesheet_well',
    'timesheet_project_id',
    'timesheet_total_price',
    'timesheet_hj_total_price',
    'timesheet_job_service',
    'timesheet_approval_status',
    'timesheet_approval_request_id',
    'approval_object_record_id',
    'processed_date',
    'invoice_number_second_part'
  ];
  const timesheetChunks = chunk(timesheetIds, 100);
  const timesheets = [];
  for (const idsChunk of timesheetChunks) {
    if (idsChunk.length === 0) continue;
    const resp = await hubspotRequest('/crm/v3/objects/2-26173281/batch/read', {
      method: 'POST',
      body: {
        properties: timesheetProps,
        inputs: idsChunk.map(id => ({ id }))
      }
    });
    if (Array.isArray(resp.results)) timesheets.push(...resp.results);
  }
  context.timesheets = timesheets.map(r => ({ id: r.id, properties: r.properties }));

  // Aggregate unique wells
  const uniqueWells = [...new Set(timesheets.map(r => r.properties?.timesheet_well).filter(Boolean))];
  context.uniqueWells = uniqueWells;

  // 3. Fetch approval object if present
  const approvalObjectId = contact.properties.approval_object_record_id;
  if (approvalObjectId) {
    const approvalProps = [
      'approval_request_id','approval_approval_status','approval_approval_from','approval_approval_until',
      'approval_status_date','approval_wells','approval_hj_task_id'
    ];
    const approval = await hubspotRequest(`/crm/v3/objects/2-26103010/${approvalObjectId}`, {
      query: { properties: approvalProps.join(',') }
    });
    context.approvalObject = approval.properties;
  }

  // 4. Fetch approver contact details
  const approverId = contact.properties.approver_unique_id;
  if (approverId) {
    const approverProps = [
      'email','firstname','lastname',
      'line_items_approval_link','send_approval_reminder',
      'send_approval_consultant_name','send_approval_from_date','send_approval_until_date','send_approval_well_names',
      'send_approval_customer','send_approval_operator'
    ];
    const approver = await hubspotRequest(`/crm/v3/objects/contacts/${approverId}`, {
      query: { properties: approverProps.join(',') }
    });
    context.approverContact = { id: approverId, properties: approver.properties };
  }

  // 5. Fetch sales deal metadata
  const salesDealId = contact.properties.approval_sales_deal_id;
  if (salesDealId) {
    const dealProps = [
      'dealname','hubspot_owner_id','owner_email','hj_primary_customer_contact_id','hj_approver_is'
    ];
    const deal = await hubspotRequest(`/crm/v3/objects/deals/${salesDealId}`, {
      query: { properties: dealProps.join(',') }
    });
    context.salesDeal = { id: salesDealId, properties: deal.properties };

    // fetch deal owner info (HubSpot owners API)
    const ownerId = deal.properties?.hubspot_owner_id;
    if (ownerId) {
      const ownersResp = await hubspotRequest('/crm/v3/owners/', {
        query: { id: ownerId }
      });
      context.salesDealOwner = ownersResp.results?.[0] || null;
    }

    const primaryContactId = deal.properties?.hj_primary_customer_contact_id;
    if (primaryContactId) {
      const primaryContact = await hubspotRequest(`/crm/v3/objects/contacts/${primaryContactId}`, {
        query: { properties: 'email' }
      });
      context.primaryCustomerContact = { id: primaryContactId, email: primaryContact.properties?.email };
    }
  }

  // Ensure data directory exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(context, null, 2));
  console.log(`Approval context saved to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Context fetch failed:', err);
  process.exit(1);
});
