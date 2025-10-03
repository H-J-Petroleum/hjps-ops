import fs from 'fs';
import path from 'path';

async function main() {
  const payloadPath = process.argv[2];
  if (!payloadPath) {
    console.error('Usage: node submit-timesheet-payload.mjs <payload.json>');
    process.exit(1);
  }

  const absPayloadPath = path.resolve(payloadPath);
  if (!fs.existsSync(absPayloadPath)) {
    console.error(`Payload file not found: ${absPayloadPath}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(absPayloadPath, 'utf8'));
  if (!Array.isArray(payload.inputs) || payload.inputs.length === 0) {
    console.error('Payload must contain an "inputs" array with at least one item.');
    process.exit(1);
  }

  const tokenPath = path.resolve('.hubspot-token');
  if (!fs.existsSync(tokenPath)) {
    console.error('Token file .hubspot-token not found.');
    process.exit(1);
  }
  const token = fs.readFileSync(tokenPath, 'utf8').trim();
  if (!token) {
    console.error('Token file is empty.');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log(`Submitting ${payload.inputs.length} timesheet records...`);
  const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/2-26173281/batch/create', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    console.error('Create request failed:', JSON.stringify(createJson, null, 2));
    process.exit(1);
  }
  if (!Array.isArray(createJson.results)) {
    console.error('Unexpected create response:', JSON.stringify(createJson, null, 2));
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const createOutPath = path.join(path.dirname(absPayloadPath), `timesheet-create-response-${timestamp}.json`);
  fs.writeFileSync(createOutPath, JSON.stringify(createJson, null, 2));
  console.log(`Create response saved to ${createOutPath}`);

  const inputs = payload.inputs;
  const results = createJson.results;
  if (results.length !== inputs.length) {
    console.warn(`Warning: response count (${results.length}) differs from input count (${inputs.length}).`);
  }

  const updateInputs = results.map((result, idx) => {
    const input = inputs[idx] || { properties: {} };
    const projectId = input.properties?.timesheet_project_id || 'unknown-project';
    return {
      id: result.id,
      properties: {
        timesheet_unique_id: `${projectId}-${result.id}`
      }
    };
  });

  console.log('Updating timesheet_unique_id for new records...');
  const updateRes = await fetch('https://api.hubapi.com/crm/v3/objects/2-26173281/batch/update', {
    method: 'POST',
    headers,
    body: JSON.stringify({ inputs: updateInputs })
  });
  const updateJson = await updateRes.json();
  if (!updateRes.ok) {
    console.error('Update request failed:', JSON.stringify(updateJson, null, 2));
    process.exit(1);
  }
  const updateOutPath = path.join(path.dirname(absPayloadPath), `timesheet-update-response-${timestamp}.json`);
  fs.writeFileSync(updateOutPath, JSON.stringify(updateJson, null, 2));
  console.log(`Update response saved to ${updateOutPath}`);

  console.log(`Created ${results.length} records. IDs: ${results.map(r => r.id).join(', ')}`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
