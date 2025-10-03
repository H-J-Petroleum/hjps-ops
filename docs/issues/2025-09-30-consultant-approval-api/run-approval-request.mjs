import fs from 'fs';
import path from 'path';

// --- Helpers ---------------------------------------------------------------
const TOKEN_PATH = path.resolve('.hubspot-token');
if (!fs.existsSync(TOKEN_PATH)) {
  console.error('Token file .hubspot-token not found.');
  process.exit(1);
}
const TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
if (!TOKEN) {
  console.error('Token file is empty.');
  process.exit(1);
}

async function hubspotRequest(pathname, { method = 'GET', body, query } = {}) {
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
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HubSpot request failed (${res.status} ${res.statusText}): ${text}`);
  }
  return JSON.parse(text || '{}');
}

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const ensureArray = csv => (csv || '').split(',').map(s => s.trim()).filter(Boolean);

const logStep = msg => console.log(`\n=== ${msg} ===`);

// --- Individual operations (mirroring WF-13) ---------------------------------
async function createApprovalObject(context, contactProps, uniqueId) {
  logStep('Creating approval object');
  const consultantId = context.consultantId;
  const consultantEmail = contactProps.approval_consultant_email || context.primaryEmail;
  const res = await hubspotRequest('/crm/v3/objects/2-26103010', {
    method: 'POST',
    body: {
      properties: {
        project_name: contactProps.approval_project_name,
        approval_customer: contactProps.approval_customer,
        approval_operator: contactProps.approval_operator,
        approval_project_id: contactProps.approval_project_id,
        approval_request_id: uniqueId,
        approval_approval_status: 'Submitted',
        approval_status_date: contactProps.approval_processed_date,
        approval_approval_from: contactProps.approval_from_date,
        approval_approval_until: contactProps.approval_until_date,
        approval_consultant_name: contactProps.approval_consultant_name,
        approval_consultant_email: consultantEmail,
        approval_consultant_id: consultantId,
        approval_approver_name: contactProps.approver_full_name,
        approval_approver_is_: contactProps.approver_is,
        approval_approver_email: contactProps.approver_email,
        approval_approver_id: contactProps.approver_unique_id,
        approval_sales_deal_id: contactProps.approval_sales_deal_id,
        approval_sales_deal_owner_name: contactProps.approval_sales_deal_owner_full_name,
        approval_sales_deal_owner_email: contactProps.approval_sales_deal_owner_email
      }
    }
  });
  context.approvalObjectId = res.id;
  return res.id;
}

async function updateConsultantContact(context, contactProps, uniqueId) {
  logStep('Updating consultant contact');
  const consultantPayload = {
    approval_request_id: uniqueId,
    approval_object_record_id: context.approvalObjectId,
    approval_timesheet_ids_array: contactProps.approval_timesheet_ids_array,
    approval_from_date: contactProps.approval_from_date,
    approval_until_date: contactProps.approval_until_date,
    approval_processed_date: contactProps.approval_processed_date,
    approval_customer: contactProps.approval_customer,
    approval_operator: contactProps.approval_operator,
    approval_project_id: contactProps.approval_project_id,
    approval_project_name: contactProps.approval_project_name,
    approval_sales_deal_id: contactProps.approval_sales_deal_id,
    approval_sales_deal_owner_email: contactProps.approval_sales_deal_owner_email,
    approval_sales_deal_owner_full_name: contactProps.approval_sales_deal_owner_full_name,
    approval_consultant_name: contactProps.approval_consultant_name,
    approver_full_name: contactProps.approver_full_name,
    approver_email: contactProps.approver_email,
    approver_is: contactProps.approver_is,
    approver_unique_id: contactProps.approver_unique_id
  };
  await hubspotRequest(`/crm/v3/objects/contacts/${context.contactId}`, {
    method: 'PATCH',
    body: { properties: consultantPayload }
  });
}

async function updateTimesheets(context, contactProps, uniqueId, timesheets) {
  logStep('Updating timesheet records');
  const batches = chunk(timesheets, 100);
  for (const batch of batches) {
    const inputs = batch.map(ts => ({
      id: ts.id,
      properties: {
        timesheet_approval_status: 'Submitted',
        timesheet_approval_request_id: uniqueId,
        approval_object_record_id: context.approvalObjectId,
        processed_date: contactProps.approval_processed_date,
        invoice_number_second_part: contactProps.quote_customer_name
      }
    }));
    await hubspotRequest('/crm/v3/objects/2-26173281/batch/update', {
      method: 'POST',
      body: { inputs }
    });
  }
}

async function updateApprovalAndApprover(context, timesheets, contactProps) {
  logStep('Updating approval object + approver contact');
  const uniqueWells = [...new Set(timesheets.map(ts => ts.properties?.timesheet_well).filter(Boolean))];
  const wellsCsv = uniqueWells.join(', ');

  await hubspotRequest(`/crm/v3/objects/2-26103010/${context.approvalObjectId}`, {
    method: 'PATCH',
    body: {
      properties: {
        approval_wells: wellsCsv,
        send_approval_consultant_name: contactProps.approval_consultant_name,
        send_approval_from_date: contactProps.approval_from_date,
        send_approval_until_date: contactProps.approval_until_date,
        send_approval_well_names: wellsCsv,
        send_approval_customer: contactProps.approval_customer,
        send_approval_operator: contactProps.approval_operator,
        send_approval_customer_email: contactProps.approver_email
      }
    }
  });

  const approverId = contactProps.approver_unique_id;
  if (approverId) {
    await hubspotRequest(`/crm/v3/objects/contacts/${approverId}`, {
      method: 'PATCH',
      body: {
        properties: {
          send_approval_consultant_name: contactProps.approval_consultant_name,
          send_approval_from_date: contactProps.approval_from_date,
          send_approval_until_date: contactProps.approval_until_date,
          send_approval_well_names: wellsCsv,
          send_approval_customer: contactProps.approval_customer,
          send_approval_operator: contactProps.approval_operator,
          send_approval_customer_email: contactProps.approver_email
        }
      }
    });
  }
}

function buildCustomerLink(projectId, approvalRequestId, approverEmail, consultantId, approverIs, salesDealId) {
  const encryptedId = Number(consultantId) + 3522;
  const params = new URLSearchParams({
    project_id: projectId,
    approval_request_id: approvalRequestId,
    customer_email: approverEmail,
    consultant_id: encryptedId.toString(),
    approver_is: approverIs || '',
    sales_deal_id: salesDealId || ''
  });
  return `https://hjpetro-1230608.hs-sites.com/field-ticket-for-approval-step-01?${params.toString()}`;
}

async function updateApproverLink(context, contactProps) {
  const approverId = contactProps.approver_unique_id;
  if (!approverId) return;

  logStep('Updating approver contact with portal link');
  const link = buildCustomerLink(
    contactProps.approval_project_id,
    context.approvalRequestId,
    contactProps.approver_email,
    context.consultantId,
    contactProps.approver_is,
    contactProps.approval_sales_deal_id
  );
  const button = `<p><a style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;" href="${link}" rel="nofollow noopener">Approve or Reject The Timesheet</a></p>`;

  await hubspotRequest(`/crm/v3/objects/contacts/${approverId}`, {
    method: 'PATCH',
    body: {
      properties: {
        send_approval_reminder: 'FirstTime',
        line_items_approval_link: button,
        approval_request_type: 'Approval Request for Customer'
      }
    }
  });

  context.approverLink = button;
}

async function createDealNote(context, contactProps, salesDeal) {
  const salesDealId = contactProps.approval_sales_deal_id;
  if (!salesDealId) return;

  logStep('Creating note on sales deal');
  const portalLink = `https://hjpetro-1230608.hs-sites.com/consultant-requested-line-items-approval-01?project_id=${contactProps.approval_project_id}&approval_request_id=${context.approvalRequestId}&approver_is=${contactProps.approver_is}`;
  const noteBody = `<div dir=\"auto\" data-top-level=\"true\"><p style=\"margin:0;\"><strong><span style=\"color: #c20000;\">${contactProps.approval_consultant_name} has submitted Approval Request</span></strong></p><br><ul><li>Time Period: <strong>${contactProps.approval_from_date} - ${contactProps.approval_until_date}</strong></li><li>Project/Sales Deal: <strong>${contactProps.approval_project_name}</strong></li><li>Customer: <strong>${contactProps.approval_customer}</strong></li><li>Operator: <strong>${contactProps.approval_operator}</strong></li></ul><br><p>If you want to know more, click on the link below</p><br><p><a href=\"${portalLink}\" target=\"_blank\" title=\"VIEW APPROVAL REQUEST\">VIEW APPROVAL REQUEST</a></p></div>`;
  const dealOwnerId = salesDeal?.properties?.hubspot_owner_id || null;
  const noteResp = await hubspotRequest('/crm/v3/objects/notes', {
    method: 'POST',
    body: {
      properties: {
        hs_timestamp: Date.now(),
        hs_note_body: noteBody,
        ...(dealOwnerId ? { hubspot_owner_id: dealOwnerId } : {})
      },
      associations: [
        {
          to: { id: salesDealId },
          types: [
            { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }
          ]
        }
      ]
    }
  });
  context.dealNoteId = noteResp.properties?.hs_object_id || noteResp.id || null;
}

async function createFollowUpTask(context, contactProps, salesDeal, salesDealOwner, primaryContact) {
  if (contactProps.approver_is !== 'HJPetro') return; // only for internal approvers

  logStep('Creating internal follow-up task');
  const salesDealId = contactProps.approval_sales_deal_id;
  const ownerEmail = contactProps.approver_email || salesDealOwner?.email;
  const ownerResp = await hubspotRequest('/crm/v3/owners/', {
    query: { email: ownerEmail }
  });
  const approverOwnerId = ownerResp.results?.[0]?.id;
  const encryptedId = Number(contactProps.approval_consultant_id) + 3522;
  const customerEmail = primaryContact?.email || contactProps.approver_email;
  const pageLink = `https://hjpetro-1230608.hs-sites.com/hj-field-ticket-for-approval-step-01?project_id=${contactProps.approval_project_id}&approval_request_id=${context.approvalRequestId}&customer_email=${customerEmail}&consultant_id=${encryptedId}&approver_is=${contactProps.approver_is}&sales_deal_id=${salesDealId}`;
  const button = `<a href=\"${pageLink}\" title=\"Approve or Reject The Timesheet\" target=\"_blank\">Approve or Reject The Timesheet</a>`;
  const innerText = `Consultant </span><strong><span style=\"color: #333333;\">${contactProps.approval_consultant_name}</span></strong><span style=\"color: #333333;\"> has requested Approval for the Timesheet for period from ${contactProps.approval_from_date} until ${contactProps.approval_until_date}</span><br><span style=\"color: #333333;\"> Approver is H&J Petroleum`;
  const bodyHtml = `<div dir=\"auto\" data-top-level=\"true\"><p style=\"margin:0; text-transform: none;\"><span style=\"color: #333333;\">${innerText}</span></p><br><p style=\"margin:0; text-transform: uppercase;\">${button}</p></div>`;
  const subject = `${contactProps.approval_consultant_name} Approval Request - ${contactProps.approval_from_date}-${contactProps.approval_until_date}`;
  const dueDate = Date.now() + 86400000; // next day

  const taskResp = await hubspotRequest('/crm/v3/objects/tasks', {
    method: 'POST',
    body: {
      properties: {
        hs_timestamp: dueDate,
        hs_task_body: bodyHtml,
        hubspot_owner_id: approverOwnerId,
        hs_task_subject: subject,
        hs_task_status: 'NOT_STARTED',
        hs_task_priority: 'HIGH',
        hs_task_type: 'TODO'
      },
      associations: [
        {
          to: { id: salesDealId },
          types: [
            { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 216 }
          ]
        }
      ]
    }
  });

  const taskId = taskResp.properties?.hs_object_id || taskResp.id || null;
  if (taskId) {
    await hubspotRequest(`/crm/v3/objects/2-26103010/${context.approvalObjectId}`, {
      method: 'PATCH',
      body: {
        properties: {
          approval_hj_task_id: taskId
        }
      }
    });
  }

  const internalPageLink = `<p><a style=\"font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;\" href=\"${pageLink}\" rel=\"nofollow noopener\">Approve or Reject The Timesheet</a></p>`;
  const dealLink = `https://app.hubspot.com/contacts/1230608/record/0-3/${salesDealId}`;
  const internalDealLink = `<p><a style=\"font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;\" href=\"${dealLink}\" rel=\"nofollow noopener\">View Deal</a></p>`;

  await hubspotRequest(`/crm/v3/objects/contacts/${context.contactId}`, {
    method: 'PATCH',
    body: {
      properties: {
        approval_internal_page_link: internalPageLink,
        approval_internal_sales_deal_link: internalDealLink,
        approval_approver: contactProps.approver_is || 'HJPetro'
      }
    }
  });

  context.internalTaskId = taskId;
}

// --- Main execution -------------------------------------------------------
async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node run-approval-request.mjs <approval-context.json>');
    process.exit(1);
  }
  const absContextPath = path.resolve(contextPath);
  const contextData = JSON.parse(fs.readFileSync(absContextPath, 'utf8'));

  const contactProps = contextData.contact;
  const timesheets = contextData.timesheets;
  const salesDeal = contextData.salesDeal;
  const salesDealOwner = contextData.salesDealOwner;
  const primaryContact = contextData.primaryCustomerContact;

  const consultantId = contactProps.submitted_as_timesheet_contact === 'Yes'
    ? (contactProps.main_contact_id || contextData.contactId)
    : contextData.contactId;
  if (!contactProps.approval_consultant_email) {
    const fallback = await hubspotRequest(`/crm/v3/objects/contacts/${consultantId}`, {
      query: 'email'
    });
    contactProps.approval_consultant_email = fallback.properties?.email || null;
  }

  const context = {
    contactId: contextData.contactId,
    consultantId,
    primaryEmail: contactProps.approval_consultant_email,
    originalApprovalObjectId: contactProps.approval_object_record_id,
    approvalRequestId: `${contactProps.approval_project_id}-${consultantId}-${Date.now()}`
  };

  // If we reuse existing approval object, delete or skip. For now create new.
  await createApprovalObject(context, contactProps, context.approvalRequestId);
  await updateConsultantContact(context, contactProps, context.approvalRequestId);
  await updateTimesheets(context, contactProps, context.approvalRequestId, timesheets);
  await updateApprovalAndApprover(context, timesheets, contactProps);
  await updateApproverLink(context, contactProps);
  await createDealNote(context, contactProps, salesDeal);
  await createFollowUpTask(context, contactProps, salesDeal, salesDealOwner, primaryContact);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(path.dirname(absContextPath), `approval-run-${timestamp}.json`);
  const summary = {
    approvalObjectId: context.approvalObjectId,
    approvalRequestId: context.approvalRequestId,
    consultantId: context.consultantId,
    timesheetsUpdated: timesheets.map(ts => ts.id),
    dealNoteId: context.dealNoteId,
    internalTaskId: context.internalTaskId,
    approverLink: context.approverLink || null,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log('\nApproval request script completed.');
  console.log(`Approval object ID: ${context.approvalObjectId}`);
  console.log(`Approval request ID: ${context.approvalRequestId}`);
  console.log(`Summary saved to ${outputPath}`);
}

main().catch(err => {
  console.error('Approval request script failed:', err);
  process.exit(1);
});
