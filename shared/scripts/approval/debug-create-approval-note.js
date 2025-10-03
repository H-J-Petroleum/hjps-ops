#!/usr/bin/env node

/**
 * Debug Create Approval Note
 * Generates (and optionally posts) an approval note without running the full workflow.
 */

const ApprovalService = require('../src/approval-api/src/services/approvalService');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    decision: 'Approve',
    comments: 'Debug approval note',
    dryRun: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    switch (arg) {
      case '--approval-request-id':
      case '--approvalId':
        parsed.approvalRequestId = args[i + 1];
        i += 1;
        break;
      case '--url':
        parsed.approvalUrl = args[i + 1];
        i += 1;
        break;
      case '--decision':
        parsed.decision = args[i + 1];
        i += 1;
        break;
      case '--comments':
        parsed.comments = args[i + 1];
        i += 1;
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      default:
        parsed._unknown = parsed._unknown || [];
        parsed._unknown.push(arg);
    }
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage: node scripts/debug-create-approval-note.js \
  --approval-request-id <id> [--url <approval-url>] \
  [--decision Approve|Reject] [--comments "message"] [--dry-run]`);
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    return;
  }

  if (!args.approvalRequestId && !args.approvalUrl) {
    printUsage();
    throw new Error('Provide --approval-request-id or --url');
  }

  const approvalService = new ApprovalService();

  const resolveOptions = {
    approvalRequestId: args.approvalRequestId,
    approvalUrl: args.approvalUrl
  };

  console.log('Resolving context...');
  const context = await approvalService.resolveContext(resolveOptions);

  console.log('Pulling related records...');
  const enrichedContext = await approvalService.pullRelatedRecords(context);

  console.log(args.dryRun ? 'Generating note (dry run)...' : 'Creating note in HubSpot...');
  const noteResult = await approvalService.createApprovalNote(
    enrichedContext,
    args.decision,
    args.comments,
    { dryRun: args.dryRun }
  );

  console.log('Note result:', JSON.stringify(noteResult, null, 2));
  console.log('Done.');
}

main().catch(error => {
  console.error('Debug note creation failed:', error.message);
  process.exit(1);
});
