import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

async function associate(serviceId, dealId, associationTypeId, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Would associate service ${serviceId} with deal ${dealId} (type ${associationTypeId})`);
    return;
  }
  await hubspotRequest(`/crm/v4/objects/2-26102982/${serviceId}/associations/deal/${dealId}`, {
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
    console.error('Usage: node assign-service-to-deal.mjs <context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);

  const dealId = context.dealId;
  if (!dealId) {
    throw new Error('Context must include dealId');
  }

  const serviceIds = context.serviceIds || context.services;
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new Error('Context must provide a non-empty serviceIds array');
  }

  const associationTypeId = context.associationTypeId || 145;
  const dryRun = Boolean(context.dryRun);

  logStep(`Associating ${serviceIds.length} service(s) to deal ${dealId}`);
  const results = [];
  for (const rawId of serviceIds) {
    const serviceId = typeof rawId === 'string' ? rawId : rawId?.id;
    if (!serviceId) {
      throw new Error('Encountered service entry without id');
    }
    await associate(serviceId, dealId, associationTypeId, dryRun);
    results.push({ serviceId, status: dryRun ? 'skipped (dry-run)' : 'associated', associationTypeId });
  }

  const summary = {
    dealId,
    results,
    dryRun,
    generatedAt: new Date().toISOString()
  };
  const summaryPath = writeJson(path.join(path.dirname(path.resolve(contextPath))), 'service-association-run', summary);

  console.log('\nService association completed.');
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => {
  console.error('assign-service-to-deal failed:', err);
  process.exit(1);
});
