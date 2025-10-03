import crypto from 'crypto';
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

function ensure(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function generateProjectId(dealId, customerId) {
  const base = `${customerId || '00000'}-${dealId || ''}-${Date.now()}`;
  const hash = crypto.createHash('sha1').update(base).digest('hex');
  return `hjp-${hash.slice(0, 5)}-${hash.slice(5, 10)}`;
}

async function fetchDeal(dealId) {
  const res = await hubspotRequest(`/crm/v3/objects/deals/${dealId}`, {
    query: { properties: DEAL_PROPERTIES.join(',') }
  });
  return {
    id: res.id,
    properties: res.properties || {}
  };
}

async function associate(objectType, objectId, targetType, targetId, associationTypeId, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Associate ${objectType}:${objectId} -> ${targetType}:${targetId} (type ${associationTypeId})`);
    return;
  }
  await hubspotRequest(`/crm/v4/objects/${objectType}/${objectId}/associations/${targetType}/${targetId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: 'USER_DEFINED',
        associationTypeId
      }
    ]
  });
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node create-project.mjs <context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);

  const dealId = context.dealId || context.deal?.id;
  if (!dealId) {
    throw new Error('Context must provide dealId or deal.id');
  }

  const deal = context.deal || await fetchDeal(dealId);
  const props = deal.properties || {};

  const dryRun = Boolean(context.dryRun);

  if (props.project_object_id && context.skipIfExists !== false) {
    console.log('Project already exists on deal; skipping creation.');
    return;
  }

  const projectName = context.projectName || props.dealname || `Project ${dealId}`;
  const projectId = context.projectId || generateProjectId(props.hs_object_id, props.hj_customer_id);

  const customerId = context.customerCompanyId || props.hj_customer_id;
  const operatorId = context.operatorCompanyId || props.hj_operator_id;

  const projectProperties = {
    hj_project_name: projectName,
    hj_project_id: projectId,
    hj_customer: props.hj_customer_name || '',
    hj_customer_id: customerId || '',
    hj_operator: props.hj_operator_name || '',
    hj_operator_id: operatorId || '',
    hj_primary_contact_name: props.hj_primary_customer_contact_name || '',
    hj_primary_contact_email: props.hj_primary_contact_email || '',
    hj_primary_contact_id: props.hj_primary_customer_contact_id || '',
    hj_sales_deal_owner_name: props.owner_name || '',
    hj_sales_deal_owner_email: props.owner_email || '',
    hj_sales_deal_owner_contact_id: props.owner_contact_id || '',
    hj_sales_deal_record_id: props.hs_object_id || dealId,
    hubspot_owner_id: props.hubspot_owner_id || '',
    hj_approver_name: props.approver_full_name || '',
    hj_approver_email: props.approver_contact_email || '',
    hj_approver_id: props.approver_unique_id || '',
    hj_approver_is: props.hj_approver_is || '',
    hj_terms: props.terms || '',
    hj_taxable: ensure(props.taxable, ''),
    hj_class: props.class || ''
  };

  logStep('Creating HJ Project');
  let projectRes;
  if (dryRun) {
    console.log('[dry-run] Would create project with properties:', projectProperties);
    projectRes = { id: context.mockProjectObjectId || 'DRY_RUN_PROJECT_ID' };
  } else {
    projectRes = await hubspotRequest('/crm/v3/objects/2-26103074', {
      method: 'POST',
      body: { properties: projectProperties }
    });
  }

  const projectObjectId = projectRes.id;

  logStep('Associating project with deal');
  await associate('2-26103074', projectObjectId, 'deal', props.hs_object_id || dealId, 197, dryRun);

  if (customerId && operatorId && customerId === operatorId) {
    logStep('Associating project with combined customer/operator company');
    if (dryRun) {
      console.log(`[dry-run] Would associate project ${projectObjectId} with company ${customerId} as customer/operator`);
    } else {
      await hubspotRequest(`/crm/v4/objects/2-26103074/${projectObjectId}/associations/company/${customerId}`, {
        method: 'PUT',
        body: [
          { associationCategory: 'USER_DEFINED', associationTypeId: 207 },
          { associationCategory: 'USER_DEFINED', associationTypeId: 205 }
        ]
      });
    }
  } else {
    if (customerId) {
      logStep('Associating project with customer company');
      await associate('2-26103074', projectObjectId, 'company', customerId, 207, dryRun);
    }

    if (operatorId) {
      logStep('Associating project with operator company');
      await associate('2-26103074', projectObjectId, 'company', operatorId, 205, dryRun);
    }
  }

  logStep('Updating deal with project references');
  if (dryRun) {
    console.log(`[dry-run] Would patch deal ${props.hs_object_id || dealId} with project_object_id=${projectObjectId}, project_unique_id=${projectId}`);
  } else {
    await hubspotRequest(`/crm/v3/objects/deals/${props.hs_object_id || dealId}`, {
      method: 'PATCH',
      body: {
        properties: {
          project_object_id: projectObjectId,
          project_unique_id: projectId
        }
      }
    });
  }

  const summary = {
    projectObjectId,
    projectId,
    dealId: props.hs_object_id || dealId,
    customerId: customerId || null,
    operatorId: operatorId || null,
    dryRun,
    generatedAt: new Date().toISOString()
  };
  const summaryPath = writeJson(path.join(path.dirname(path.resolve(contextPath))), 'project-run', summary);
  console.log('\nProject creation completed.');
  console.log(`Project object ID: ${projectObjectId}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => {
  console.error('create-project failed:', err);
  process.exit(1);
});
