const { loadApprovalContext } = require('./lib/context');
const { validateContext } = require('./lib/validation');
const { applyStatusUpdates } = require('./lib/updates');
const { buildBillingPayloads } = require('./lib/billing');
const { processDocuments } = require('./lib/documents');
const { dispatchNotifications } = require('./lib/notifications');
const { ensureAssociations } = require('./lib/associations');
const { createLogger } = require('./lib/logger');

/**
 * HubSpot custom-coded action entry point.
 * @param {object} event - HubSpot workflow payload with input fields and secrets.
 * @returns {Promise<object>} - Optional data for downstream workflow actions.
 */
exports.main = async (event) => {
  const approvalId = event?.inputFields?.approvalId || event?.object?.objectId;
  const workflowId = event?.object?.workflowId;
  const correlationId = workflowId
    ? String(workflowId) + '-' + Date.now()
    : 'wf26-' + Date.now();

  const privateAppToken = event?.secrets?.PRIVATE_APP_TOKEN
    || process.env.PRIVATE_APP_TOKEN
    || process.env.BEARER_TOKEN;

  const teamsWebhookUrl = event?.secrets?.TEAMS_WEBHOOK_URL
    || process.env.TEAMS_WEBHOOK_URL;

  const logger = createLogger({
    approvalId,
    correlationId,
    telemetry: {
      teamsWebhookUrl,
      mode: event?.secrets?.TEAMS_WEBHOOK_MODE || process.env.TEAMS_WEBHOOK_MODE || 'messageCard',
      title: 'WF-26 Internal Approval',
    },
  });

  logger.info('Starting InternalApprovalHandler');

  try {
    const context = await loadApprovalContext({
      approvalId,
      logger,
      token: privateAppToken,
    });

    await validateContext({ context, logger });

    await applyStatusUpdates({ context, logger });
    await buildBillingPayloads({ context, logger });
    await processDocuments({ context, logger });
    await dispatchNotifications({ context, logger });
    await ensureAssociations({ context, logger });

    logger.info('InternalApprovalHandler complete');
    return {
      outputFields: {
        approvalId,
        correlationId,
        status: 'success',
      },
    };
  } catch (error) {
    logger.error('InternalApprovalHandler failed', { error: error?.message || error });
    throw error;
  }
};
