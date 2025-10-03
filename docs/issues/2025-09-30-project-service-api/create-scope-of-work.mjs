import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

const SCOPE_PROPERTIES = [
  'consultant_id',
  'consultant_full_name',
  'consultant_email',
  'consultant_role',
  'consultant_title_job',
  'job_service',
  'well',
  'hj_project_id',
  'hj_project_name',
  'hj_project_billing_frequency',
  'hj_customer',
  'hj_operator',
  'daily_role_price',
  'hourly_role_price',
  'per_each_price',
  'per_mile_price',
  'fee_one_time_price',
  'hj_hj_daily_price',
  'hj_hj_hourly_price',
  'hj_hj_per_each_price',
  'hj_hj_per_mile_price',
  'hj_hj_fee_one_time_price',
  'hj_approved',
  'sales_deal_id',
  'consultant_deal_id',
  'payment_deal_id',
  'hj_unique_approval_request',
  'scope_of_work_approval_comment'
];

function toCamel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function extractProperties(scope) {
  const properties = {};
  SCOPE_PROPERTIES.forEach(key => {
    const camel = toCamel(key);
    const value = scope[key] ?? scope[camel];
    if (value !== undefined && value !== null && value !== '') {
      properties[key] = String(value);
    }
  });

  if (!properties.consultant_id) {
    throw new Error('Scope payload must include consultant_id');
  }
  if (!properties.hj_project_id) {
    throw new Error('Scope payload must include hj_project_id');
  }
  if (!properties.job_service) {
    throw new Error('Scope payload must include job_service');
  }
  if (!properties.hj_approved) {
    properties.hj_approved = 'Submitted for Approval';
  }
  return properties;
}

async function associateWithContact(scopeId, contactId) {
  await hubspotRequest(`/crm/v4/objects/2-26103040/${scopeId}/associations/contact/${contactId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: 'USER_DEFINED',
        associationTypeId: 179
      }
    ]
  });
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node create-scope-of-work.mjs <context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);

  const scopeInput = context.scope || context;
  const properties = extractProperties(scopeInput);
  const dryRun = Boolean(context.dryRun || scopeInput.dryRun);

  logStep('Creating scope of work (HJ Consultant) record');
  let scopeObjectId;
  if (dryRun) {
    console.log('[dry-run] Would create HJ Consultant (scope) with properties:', properties);
    scopeObjectId = context.mockScopeObjectId || 'DRY_RUN_SCOPE_ID';
  } else {
    const createRes = await hubspotRequest('/crm/v3/objects/2-26103040', {
      method: 'POST',
      body: { properties }
    });
    scopeObjectId = createRes.id;
  }
  const consultantContactId = scopeInput.contactId || scopeInput.consultantContactId || properties.consultant_id;
  const associations = [];

  if (consultantContactId) {
    logStep('Associating scope with consultant contact');
    if (dryRun) {
      console.log(`[dry-run] Would associate scope ${scopeObjectId} with contact ${consultantContactId}`);
      associations.push({ contactId: consultantContactId, associationTypeId: 179, status: 'skipped (dry-run)' });
    } else {
      await associateWithContact(scopeObjectId, consultantContactId);
      associations.push({ contactId: consultantContactId, associationTypeId: 179, status: 'associated' });
    }
  }

  const summary = {
    scopeObjectId,
    consultantId: properties.consultant_id,
    projectId: properties.hj_project_id,
    jobService: properties.job_service,
    associations,
    dryRun,
    generatedAt: new Date().toISOString()
  };
  const summaryPath = writeJson(path.join(path.dirname(path.resolve(contextPath))), 'scope-run', summary);

  console.log('\nScope creation completed.');
  console.log(`Scope object ID: ${scopeObjectId}`);
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => {
  console.error('create-scope-of-work failed:', err);
  process.exit(1);
});
