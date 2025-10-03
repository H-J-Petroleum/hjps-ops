import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function associateDealToCompany(dealId, companyId, associationTypeId, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Would associate deal ${dealId} with company ${companyId} (type ${associationTypeId})`);
    return;
  }
  await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/company/${companyId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: 'USER_DEFINED',
        associationTypeId
      }
    ]
  });
}

async function associateDealToContact(dealId, contactId, associationTypeId, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Would associate deal ${dealId} with contact ${contactId} (type ${associationTypeId})`);
    return;
  }
  await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/contact/${contactId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: associationTypeId >= 100 ? 'USER_DEFINED' : 'HUBSPOT_DEFINED',
        associationTypeId
      }
    ]
  });
}

async function patchDeal(dealId, properties, dryRun) {
  if (!properties || Object.keys(properties).length === 0) return;
  if (dryRun) {
    console.log(`[dry-run] Would patch deal ${dealId} with`, properties);
    return;
  }
  await hubspotRequest(`/crm/v3/objects/deals/${dealId}`, {
    method: 'PATCH',
    body: { properties }
  });
}

async function createDeal(properties, dryRun) {
  if (dryRun) {
    console.log('[dry-run] Would create deal with', properties);
    return { id: 'DRY_RUN_DEAL_ID' };
  }
  return await hubspotRequest('/crm/v3/objects/deals', {
    method: 'POST',
    body: { properties }
  });
}

function buildDealProperties(base) {
  const properties = { ...(base || {}) };
  if (!properties.dealname) properties.dealname = `Project ${Date.now()}`;
  if (!properties.pipeline) properties.pipeline = 'default';
  if (!properties.dealstage) properties.dealstage = 'appointmentscheduled';
  if (!properties.hubspot_owner_id) properties.hubspot_owner_id = 'REPLACE_OWNER_ID';
  if (!properties.terms) properties.terms = 'Net 30';
  if (!properties.taxable) properties.taxable = 'N';
  if (!properties.class) properties.class = 'General';
  return properties;
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node seed-sales-deal.mjs <seed-context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);
  let dealId = context.dealId;

  const dryRun = Boolean(context.dryRun);
  const summary = {
    dealId: dealId || null,
    dryRun,
    steps: []
  };

  if (!dealId) {
    logStep('Creating deal');
    const res = await createDeal(buildDealProperties(context.properties), dryRun);
    dealId = res.id;
    summary.dealId = dealId;
    summary.steps.push({ action: 'create', properties: context.properties || {} });
  } else if (context.properties) {
    logStep('Updating deal properties');
    await patchDeal(dealId, context.properties, dryRun);
    summary.steps.push({ action: 'patch', properties: context.properties });
  }

  const customerAssociations = toArray(context.customerAssociations);
  for (const assoc of customerAssociations) {
    const companyId = assoc.companyId || assoc.id;
    if (!companyId) continue;
    const associationTypeId = assoc.associationTypeId || 207; // default Customer label
    logStep(`Associating customer company ${companyId}`);
    await associateDealToCompany(dealId, companyId, associationTypeId, dryRun);
    summary.steps.push({ action: 'associateCustomer', companyId, associationTypeId });
  }

  const operatorAssociations = toArray(context.operatorAssociations);
  for (const assoc of operatorAssociations) {
    const companyId = assoc.companyId || assoc.id;
    if (!companyId) continue;
    const associationTypeId = assoc.associationTypeId || 205; // default Operator label
    logStep(`Associating operator company ${companyId}`);
    await associateDealToCompany(dealId, companyId, associationTypeId, dryRun);
    summary.steps.push({ action: 'associateOperator', companyId, associationTypeId });
  }

  const contactAssociations = toArray(context.contactAssociations);
  for (const assoc of contactAssociations) {
    const contactId = assoc.contactId || assoc.id;
    if (!contactId) continue;
    const associationTypeId = assoc.associationTypeId;
    if (!associationTypeId) {
      console.warn(`Skipping contact ${contactId}: associationTypeId is required`);
      continue;
    }
    logStep(`Associating contact ${contactId}`);
    await associateDealToContact(dealId, contactId, associationTypeId, dryRun);
    summary.steps.push({ action: 'associateContact', contactId, associationTypeId });
  }

  const outputPath = writeJson(path.dirname(path.resolve(contextPath)), 'seed-sales-deal', summary);
  console.log(`\nSeed summary saved to ${outputPath}`);
}

main().catch(err => {
  console.error('seed-sales-deal failed:', err);
  process.exit(1);
});
