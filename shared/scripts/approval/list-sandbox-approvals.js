#!/usr/bin/env node

const axios = require('axios');
const { applyObjectIdsToEnv, normaliseEnvKey } = require('./utils/object-ids');

function parseArgs(argv) {
  const options = {
    env: null,
    limit: 25,
  };

  argv.forEach((arg, index) => {
    if (index === 0 && !arg.startsWith('--')) {
      const maybeLimit = Number(arg);
      if (Number.isFinite(maybeLimit) && maybeLimit > 0) {
        options.limit = maybeLimit;
      }
      return;
    }

    if (arg === '--env' && argv[index + 1]) {
      options.env = argv[index + 1];
    } else if (arg.startsWith('--env=')) {
      options.env = arg.split('=')[1];
    }
  });

  return options;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rawEnvPreference = args.env
    || process.env.HUBSPOT_ENV
    || (process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN ? 'betaSandbox'
      : process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN ? 'sandbox' : null);

  const envPreference = normaliseEnvKey ? normaliseEnvKey(rawEnvPreference) : rawEnvPreference;

  if (envPreference) {
    process.env.HUBSPOT_ENV = envPreference;
  }

  const ids = applyObjectIdsToEnv(envPreference);

  const envLower = (envPreference || '').toLowerCase();
  const tokenCandidates = (() => {
    if (envLower === 'betasandbox') {
      return [
        process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN,
        process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN,
        process.env.PRIVATE_APP_TOKEN,
      ];
    }
    if (envLower === 'sandbox' || envLower === 'standard_sandbox') {
      return [
        process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN,
        process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN,
        process.env.PRIVATE_APP_TOKEN,
      ];
    }
    return [
      process.env.PRIVATE_APP_TOKEN,
      process.env.LEGACY_SANDBOX_PRIVATE_APP_TOKEN,
      process.env.BETA_SANDBOX_PRIVATE_APP_TOKEN,
    ];
  })();

  const token = tokenCandidates.find((value) => Boolean(value));
  if (!token) {
    console.error('Set BETA_SANDBOX_PRIVATE_APP_TOKEN, LEGACY_SANDBOX_PRIVATE_APP_TOKEN, or PRIVATE_APP_TOKEN.');
    process.exit(1);
  }

  const approvalObjectId = process.env.HJ_APPROVAL_OBJECT_ID || ids.HJ_APPROVAL_OBJECT_ID;
  const limit = Number.isFinite(args.limit) ? args.limit : 25;

  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/' + approvalObjectId, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
      params: {
        limit,
        properties: [
          'approval_approve_reject',
          'approval_project_id',
          'approval_timesheet_ids_array',
          'response_approval_timesheet_ids_array',
          'response_approval_consultant_id',
          'response_approval_consultant_name',
          'response_approval_project_id',
          'contact_hs_object_id',
          'createdate',
          'hs_lastmodifieddate',
        ].join(','),
      },
    });

    const results = Array.isArray(response.data?.results) ? response.data.results : [];
    if (results.length === 0) {
      console.log('No approvals found for object', approvalObjectId);
      return;
    }

    results.forEach((record) => {
      console.log(JSON.stringify({
        id: record.id,
        properties: record.properties,
      }, null, 2));
    });
  } catch (error) {
    console.error('Error listing approvals:', error?.response?.data || error?.message || error);
    process.exit(1);
  }
}

main();
