#!/usr/bin/env node

/**
 * Debug Send Approval Email
 * Trigger approval email notifications without running the full approval process.
 */

const ApprovalService = require('../src/approval-api/src/services/approvalService');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    decision: 'Approve',
    comments: 'Debug approval email',
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
      case '--project-id':
        parsed.projectId = args[i + 1];
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
      case '--recipient':
        parsed.overrideRecipient = args[i + 1];
        i += 1;
        break;
      case '--approver-id':
        parsed.overrideApproverId = args[i + 1];
        i += 1;
        break;
      case '--approver-email':
        parsed.overrideApproverEmail = args[i + 1];
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
  console.log(`Usage: node scripts/debug-send-approval-email.js \
  --approval-request-id <id> [--project-id <hubspotId>] [--url <approval-url>] \
  [--decision Approve|Reject] [--comments "message"] \
  [--recipient someone@example.com] [--approver-id <contactId>] [--approver-email <email>] [--dry-run]`);
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
    approvalUrl: args.approvalUrl,
    projectId: args.projectId
  };

  console.log('Resolving context...');
  const context = await approvalService.resolveContext(resolveOptions);

  console.log('Pulling related records...');
  const enrichedContext = await approvalService.pullRelatedRecords(context);

  const timesheetIds = enrichedContext.approvalTimesheetIds || [];

  if (args.overrideApproverId) {
    enrichedContext.approverId = args.overrideApproverId;
  }

  if (args.overrideApproverEmail) {
    enrichedContext.approverEmail = args.overrideApproverEmail;
  }

  const results = {
    decision: args.decision,
    comments: args.comments,
    pdfResult: enrichedContext.consultantApprovalUrl
      ? { url: enrichedContext.consultantApprovalUrl }
      : null,
    timesheetResult: {
      timesheetCount: timesheetIds.length,
      processedTimesheetIds: timesheetIds
    }
  };

  console.log('Sending notifications...');
  const notificationResult = await approvalService.sendApprovalNotifications(
    enrichedContext,
    results,
    {
      dryRun: args.dryRun,
      overrideRecipient: args.overrideRecipient,
      overrideApproverId: args.overrideApproverId,
      overrideApproverEmail: args.overrideApproverEmail
    }
  );

  console.log('Notification result:', JSON.stringify(notificationResult, null, 2));

  console.log('Done.');
}

main().catch(error => {
  console.error('Debug email send failed:', error.message);
  process.exit(1);
});
