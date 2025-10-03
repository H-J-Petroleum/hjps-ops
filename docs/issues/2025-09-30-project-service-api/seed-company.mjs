import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

async function patchCompany(companyId, properties, dryRun) {
  if (!properties || Object.keys(properties).length === 0) return;
  if (dryRun) {
    console.log(`[dry-run] Would patch company ${companyId} with`, properties);
    return;
  }
  await hubspotRequest(`/crm/v3/objects/companies/${companyId}`, {
    method: 'PATCH',
    body: { properties }
  });
}

async function createCompany(properties, dryRun) {
  if (dryRun) {
    console.log('[dry-run] Would create company with', properties);
    return { id: 'DRY_RUN_COMPANY_ID' };
  }
  return await hubspotRequest('/crm/v3/objects/companies', {
    method: 'POST',
    body: { properties }
  });
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node seed-company.mjs <seed-context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);
  let companyId = context.companyId;

  const dryRun = Boolean(context.dryRun);
  const summary = {
    companyId: companyId || null,
    dryRun,
    properties: context.properties || {}
  };

  if (!companyId) {
    logStep('Creating company');
    const res = await createCompany(context.properties || {}, dryRun);
    companyId = res.id;
    summary.companyId = companyId;
    summary.created = true;
  } else if (context.properties) {
    logStep('Updating company properties');
    await patchCompany(companyId, context.properties, dryRun);
  }

  const outputPath = writeJson(path.dirname(path.resolve(contextPath)), 'seed-company', summary);
  console.log(`\nSeed summary saved to ${outputPath}`);
}

main().catch(err => {
  console.error('seed-company failed:', err);
  process.exit(1);
});
