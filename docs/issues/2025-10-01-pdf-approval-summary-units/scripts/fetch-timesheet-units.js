#!/usr/bin/env node

/**
 * Fetches HJ Timesheet records from HubSpot and summarizes unit-related fields.
 * The output markdown is written to ../hj-timesheet-unit-scout.md
 */

const fs = require('fs');
const path = require('path');

// Ensure approval API node_modules are on the resolution path (for winston dependency)
const rootDir = path.resolve(__dirname, '../../../..');
const approvalNodeModules = path.join(rootDir, 'src/approval-api/node_modules');
const currentNodePath = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [];
if (!currentNodePath.includes(approvalNodeModules)) {
  currentNodePath.unshift(approvalNodeModules);
  process.env.NODE_PATH = currentNodePath.join(path.delimiter);
  // eslint-disable-next-line global-require
  require('module').Module._initPaths();
}

// Load environment variables / token
if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN) {
  const tokenPath = path.join(rootDir, '.hubspot-token');
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    if (token) {
      process.env.HUBSPOT_PRIVATE_APP_TOKEN = token;
    }
  }
}

if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN) {
  // eslint-disable-next-line no-console
  console.error('Missing HUBSPOT_PRIVATE_APP_TOKEN. Aborting.');
  process.exit(1);
}

const HubspotService = require(path.join(rootDir, 'src/approval-api/src/services/hubspotService'));
const ValueFormattingService = require(path.join(rootDir, 'src/pdf-generator/src/services/valueFormattingService'));

const hubspotService = new HubspotService();
const valueFormatter = new ValueFormattingService();

const properties = [
  'timesheet_project_name',
  'timesheet_project_id',
  'timesheet_customer',
  'timesheet_operator',
  'timesheet_consultant_full_name',
  'timesheet_job_service',
  'timesheet_role',
  'timesheet_well',
  'timesheet_billing_frequency',
  'timesheet_constant_billing_frequency',
  'timesheet_quantity',
  'timesheet_price',
  'timesheet_hj_price',
  'timesheet_total_price',
  'timesheet_hj_total_price',
  'timesheet_start_date',
  'timesheet_end_date',
  'timesheet_approval_request_id',
  'timesheet_payment_deal_id'
];

const limit = 100; // HubSpot max page size for list endpoint

async function fetchAllTimesheets() {
  const results = [];
  let after = undefined;
  let page = 0;

  while (true) {
    page += 1;
    const params = {
      limit,
      properties: properties.join(','),
      archived: false
    };
    if (after) {
      params.after = after;
    }

    const response = await hubspotService.client.get(
      `${hubspotService.config.endpoints.objects}/${hubspotService.config.objectTypes.timesheet}`,
      { params }
    );

    const pageResults = response.data?.results || [];
    results.push(...pageResults);

    const pageInfo = {
      page,
      fetched: pageResults.length,
      totalSoFar: results.length
    };
    hubspotService.logger.info('Fetched timesheet page', pageInfo);

    after = response.data?.paging?.next?.after;
    if (!after) {
      break;
    }

    // Gentle delay to respect HubSpot rate limits
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return results;
}

function increment(map, key) {
  if (!key && key !== 0) {
    return;
  }
  const normalized = typeof key === 'string' ? key.trim() : key;
  if (normalized === '' || normalized === null || normalized === undefined) {
    return;
  }
  map.set(normalized, (map.get(normalized) || 0) + 1);
}

function toPercent(count, total) {
  if (total === 0) {
    return '0%';
  }
  return `${((count / total) * 100).toFixed(2)}%`;
}

function mapToTableRows(map, total, limitRows = null) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const sliced = limitRows ? entries.slice(0, limitRows) : entries;
  return sliced.map(([key, count]) => `| ${key} | ${count} | ${toPercent(count, total)} |`).join('\n');
}

(async () => {
  const records = await fetchAllTimesheets();
  const total = records.length;

  const billingFrequencyCounts = new Map();
  const constantFrequencyCounts = new Map();
  const jobServiceCounts = new Map();
  const derivedUnitCounts = new Map();
  const jobServiceUnitCounts = new Map();

  const missingUnitSamples = [];
  const unitSamples = new Map();

  records.forEach((record) => {
    const props = record.properties || {};
    const jobService = props.timesheet_job_service || 'N/A';
    const billingFrequency = props.timesheet_billing_frequency || null;
    const constantFrequency = props.timesheet_constant_billing_frequency || null;
    const quantity = props.timesheet_quantity || null;

    increment(jobServiceCounts, jobService);
    increment(billingFrequencyCounts, billingFrequency);
    increment(constantFrequencyCounts, constantFrequency);

    const derivedUnit = valueFormatter.deriveUnit(props);
    increment(derivedUnitCounts, derivedUnit || 'UNRESOLVED');

    const pairKey = `${jobService}__${derivedUnit || 'UNRESOLVED'}`;
    increment(jobServiceUnitCounts, pairKey);

    if (derivedUnit) {
      if (!unitSamples.has(derivedUnit)) {
        unitSamples.set(derivedUnit, {
          jobService,
          billingFrequency,
          constantFrequency,
          quantity
        });
      }
    } else if (missingUnitSamples.length < 10) {
      missingUnitSamples.push({
        jobService,
        billingFrequency,
        constantFrequency,
        quantity
      });
    }
  });

  const outputLines = [];
  outputLines.push('# HubSpot Timesheet Unit Analysis');
  outputLines.push(`Generated: ${new Date().toISOString()}`);
  outputLines.push('');
  outputLines.push(`Total records retrieved: **${total.toLocaleString()}**`);
  outputLines.push('');

  outputLines.push('## Billing Frequency Values');
  outputLines.push('| Billing Frequency | Count | Share |');
  outputLines.push('| --- | --- | --- |');
  outputLines.push(mapToTableRows(billingFrequencyCounts, total) || '| _None_ | 0 | 0% |');
  outputLines.push('');

  outputLines.push('## Constant Billing Frequency Values');
  outputLines.push('| Constant Billing Frequency | Count | Share |');
  outputLines.push('| --- | --- | --- |');
  outputLines.push(mapToTableRows(constantFrequencyCounts, total) || '| _None_ | 0 | 0% |');
  outputLines.push('');

  outputLines.push('## Derived Units (ValueFormattingService)');
  outputLines.push('| Derived Unit | Count | Share |');
  outputLines.push('| --- | --- | --- |');
  outputLines.push(mapToTableRows(derivedUnitCounts, total) || '| _None_ | 0 | 0% |');
  outputLines.push('');

  outputLines.push('## Top Service + Unit Combinations');
  outputLines.push('| Service | Unit | Count | Share |');
  outputLines.push('| --- | --- | --- | --- |');
  const topPairs = [...jobServiceUnitCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([key, count]) => {
      const [service, unit] = key.split('__');
      return `| ${service} | ${unit} | ${count} | ${toPercent(count, total)} |`;
    });
  outputLines.push(topPairs.join('\n') || '| _None_ | _None_ | 0 | 0% |');
  outputLines.push('');

  outputLines.push('## Sample Records by Derived Unit');
  if (unitSamples.size === 0) {
    outputLines.push('_No units resolved._');
  } else {
    unitSamples.forEach((sample, unit) => {
      outputLines.push(`- **${unit}** → Service: ${sample.jobService}, Billing Frequency: ${sample.billingFrequency || 'N/A'}, Constant Frequency: ${sample.constantFrequency || 'N/A'}, Qty: ${sample.quantity || 'N/A'}`);
    });
  }
  outputLines.push('');

  if (missingUnitSamples.length > 0) {
    outputLines.push('## Samples with Unresolved Units');
    missingUnitSamples.forEach((sample, idx) => {
      outputLines.push(`- ${idx + 1}. Service: ${sample.jobService}, Billing Frequency: ${sample.billingFrequency || 'N/A'}, Constant Frequency: ${sample.constantFrequency || 'N/A'}, Qty: ${sample.quantity || 'N/A'}`);
    });
    outputLines.push('');
  }

  outputLines.push('## Additional Notes');
  outputLines.push('- Billing frequency fields are free text; normalization still required.');
  outputLines.push('- `UNRESOLVED` entries highlight where ValueFormattingService heuristics need expansion.');
  outputLines.push('- Consider adding regression tests covering the unresolved samples once mapped.');
  outputLines.push('');

  const outputPath = path.join(__dirname, '..', 'hj-timesheet-unit-scout.md');
  fs.writeFileSync(outputPath, outputLines.join('\n'));
  hubspotService.logger.info('Unit analysis written to markdown', { outputPath });
})();
