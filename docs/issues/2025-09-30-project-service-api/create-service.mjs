import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

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

function buildServicePayload(input) {
  const payload = {};
  SERVICE_PROPERTIES.forEach(key => {
    if (input[key] !== undefined && input[key] !== null && input[key] !== '') {
      payload[key] = String(input[key]);
    }
  });
  if (!payload.hj_service_name) {
    throw new Error('Service name (hj_service_name) is required');
  }
  return payload;
}

async function associateServiceToDeal(serviceId, dealId) {
  await hubspotRequest(`/crm/v4/objects/2-26102982/${serviceId}/associations/deal/${dealId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: 'USER_DEFINED',
        associationTypeId: 145
      }
    ]
  });
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node create-service.mjs <context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);

  const serviceInput = context.service || context;
  const properties = buildServicePayload(serviceInput);
  const dryRun = Boolean(context.dryRun || serviceInput.dryRun);

  logStep('Creating HJ Service');
  let serviceObjectId;
  if (dryRun) {
    console.log('[dry-run] Would create HJ Service with properties:', properties);
    serviceObjectId = context.mockServiceObjectId || 'DRY_RUN_SERVICE_ID';
  } else {
    const createRes = await hubspotRequest('/crm/v3/objects/2-26102982', {
      method: 'POST',
      body: { properties }
    });
    serviceObjectId = createRes.id;
  }
  const associations = [];

  const dealId = context.dealId || serviceInput.dealId;
  if (dealId) {
    logStep('Associating service with deal');
    if (dryRun) {
      console.log(`[dry-run] Would associate service ${serviceObjectId} with deal ${dealId}`);
      associations.push({ dealId, typeId: 145, status: 'skipped (dry-run)' });
    } else {
      await associateServiceToDeal(serviceObjectId, dealId);
      associations.push({ dealId, typeId: 145, status: 'associated' });
    }
  }

  const summary = {
    serviceObjectId,
    properties,
    associations,
    dryRun,
    generatedAt: new Date().toISOString()
  };
  const summaryPath = writeJson(path.join(path.dirname(path.resolve(contextPath))), 'service-run', summary);

  console.log('\nService creation completed.');
  console.log(`Service object ID: ${serviceObjectId}`);
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => {
  console.error('create-service failed:', err);
  process.exit(1);
});
