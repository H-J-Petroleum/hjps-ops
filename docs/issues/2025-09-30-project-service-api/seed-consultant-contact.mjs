import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

async function patchContact(contactId, properties, dryRun) {
  if (!properties || Object.keys(properties).length === 0) return;
  if (dryRun) {
    console.log(`[dry-run] Would patch contact ${contactId} with`, properties);
    return;
  }
  await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    body: { properties }
  });
}

async function createContact(properties, dryRun) {
  if (dryRun) {
    console.log('[dry-run] Would create contact with', properties);
    return { id: 'DRY_RUN_CONTACT_ID' };
  }
  return await hubspotRequest('/crm/v3/objects/contacts', {
    method: 'POST',
    body: { properties }
  });
}

function buildContactProperties(base) {
  const properties = { ...(base || {}) };
  if (!properties.firstname) properties.firstname = 'Contact';
  if (!properties.lastname) properties.lastname = 'Placeholder';
  if (!properties.email) properties.email = `placeholder.${Date.now()}@example.com`;
  if (!properties.phone) properties.phone = '+10000000000';
  return properties;
}

async function associateRecruitingDeal(dealId, contactId, associationTypeId, dryRun) {
  if (!associationTypeId) {
    throw new Error('associationTypeId is required to link recruiting deal and contact');
  }
  if (dryRun) {
    console.log(`[dry-run] Would associate recruiting deal ${dealId} with contact ${contactId} (type ${associationTypeId})`);
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

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node seed-consultant-contact.mjs <seed-context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);
  let contactId = context.contactId;

  const dryRun = Boolean(context.dryRun);
  const summary = {
    contactId: contactId || null,
    dryRun,
    steps: []
  };

  if (!contactId) {
    logStep('Creating contact');
    const res = await createContact(buildContactProperties(context.properties), dryRun);
    contactId = res.id;
    summary.contactId = contactId;
    summary.steps.push({ action: 'create', properties: context.properties || {} });
  } else if (context.properties) {
    logStep('Updating contact properties');
    await patchContact(contactId, context.properties, dryRun);
    summary.steps.push({ action: 'patch', properties: context.properties });
  }

  if (context.recruitingDeal) {
    const { dealId, associationTypeId } = context.recruitingDeal;
    if (!dealId) {
      throw new Error('recruitingDeal.dealId is required');
    }
    logStep(`Associating recruiting deal ${dealId}`);
    await associateRecruitingDeal(dealId, contactId, associationTypeId || 4, dryRun);
    summary.steps.push({ action: 'associateRecruitingDeal', dealId, associationTypeId: associationTypeId || 4 });
  }

  const outputPath = writeJson(path.dirname(path.resolve(contextPath)), 'seed-consultant-contact', summary);
  console.log(`\nSeed summary saved to ${outputPath}`);
}

main().catch(err => {
  console.error('seed-consultant-contact failed:', err);
  process.exit(1);
});
