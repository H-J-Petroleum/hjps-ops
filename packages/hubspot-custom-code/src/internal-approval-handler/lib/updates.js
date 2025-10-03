const APPROVAL_STATUS_APPROVED = 'Approved';
const TIMESHEET_STATUS_APPROVED = 'Approved';

function formatHubSpotDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function resolveComment(properties) {
  if (!properties) {
    return null;
  }

  const candidates = [
    properties.approval_customer_comment,
    properties.response_approval_customer_comment,
  ];

  const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return match ? match.trim() : null;
}

function resolveObjectId(context, contextKey, envKey, fallback) {
  if (context?.objectIds && context.objectIds[contextKey]) {
    return context.objectIds[contextKey];
  }
  if (envKey && process.env[envKey]) {
    return process.env[envKey];
  }
  return fallback;
}

async function applyStatusUpdates({ context, logger }) {
  if (!context) {
    throw new Error('Context is required when applying status updates');
  }

  const approvalId = context.approvalId;
  if (!approvalId) {
    logger.warn('Skipping status updates – approvalId missing');
    return;
  }

  const httpClient = context.httpClient;
  if (!httpClient) {
    logger.warn('Skipping status updates – httpClient not available', { approvalId });
    return;
  }

  const approvalObjectId = resolveObjectId(context, 'approval', 'HJ_APPROVAL_OBJECT_ID', '2-26103010');
  const timesheetObjectId = resolveObjectId(context, 'timesheet', 'HJ_TIMESHEET_OBJECT_ID', '2-26173281');

  const approvalProps = context.approval?.properties || {};
  const processedDate = formatHubSpotDate(new Date());
  const approvalComment = resolveComment(approvalProps);

  const approvalUpdates = {};
  if (approvalProps.approval_approval_status !== APPROVAL_STATUS_APPROVED) {
    approvalUpdates.approval_approval_status = APPROVAL_STATUS_APPROVED;
  }
  if (approvalProps.approval_approve_reject !== APPROVAL_STATUS_APPROVED) {
    approvalUpdates.approval_approve_reject = APPROVAL_STATUS_APPROVED;
  }
  if (approvalProps.approval_processed_date !== processedDate) {
    approvalUpdates.approval_processed_date = processedDate;
  }

  let approvalPatched = false;
  if (Object.keys(approvalUpdates).length > 0) {
    const approvalPath = '/crm/v3/objects/' + approvalObjectId + '/' + approvalId;
    await httpClient.patch(approvalPath, {
      properties: approvalUpdates,
    });
    Object.assign(approvalProps, approvalUpdates);
    approvalPatched = true;
  }

  const timesheetInputs = [];
  const nextTimesheets = (context.timesheets || []).map((record) => {
    const properties = Object.assign({}, record.properties || {});
    const update = {};

    if (properties.timesheet_approval_status !== TIMESHEET_STATUS_APPROVED) {
      update.timesheet_approval_status = TIMESHEET_STATUS_APPROVED;
    }
    if (properties.processed_date !== processedDate) {
      update.processed_date = processedDate;
    }
    if (approvalComment && properties.timesheet_approval_comment !== approvalComment) {
      update.timesheet_approval_comment = approvalComment;
    }

    if (Object.keys(update).length > 0) {
      timesheetInputs.push({ id: record.id, properties: update });
      Object.assign(properties, update);
    }

    return {
      id: record.id,
      properties,
    };
  });

  let timesheetsPatched = false;
  if (timesheetInputs.length > 0) {
    const batchPath = '/crm/v3/objects/' + timesheetObjectId + '/batch/update';
    await httpClient.post(batchPath, {
      inputs: timesheetInputs,
    });
    context.timesheets = nextTimesheets;
    timesheetsPatched = true;
  }

  context.approval = context.approval || { id: approvalId, properties: approvalProps };

  logger.info('Status updates applied', {
    approvalId,
    approvalPatched,
    timesheetsPatched,
    timesheetUpdates: timesheetInputs.length,
  });
}

module.exports = {
  applyStatusUpdates,
};
