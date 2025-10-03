/**
 * Validates the minimal context required before proceeding.
 * Future implementation should raise descriptive errors that can be surfaced to operators.
 * @param {object} params
 * @param {object} params.context
 * @param {object} params.logger
 */
async function validateContext({ context, logger }) {
  if (!context) {
    throw new Error('Context payload is missing');
  }

  const missing = [];

  if (!context.approvalId) {
    missing.push('approvalId');
  }

  if (!context.approval || !context.approval.properties) {
    missing.push('approval');
  }

  if (!Array.isArray(context.timesheets)) {
    missing.push('timesheets');
  } else if (context.timesheets.length === 0) {
    missing.push('timesheetIds');
  }

  if (missing.length > 0) {
    const message = 'Context validation failed: missing ' + missing.join(', ');
    logger.error(message, { missing });
    throw new Error(message);
  }

  logger.debug('Context validation passed', {
    approvalId: context.approvalId,
    timesheetCount: context.timesheets.length,
    consultantId: context.consultant?.id || null,
  });
}

module.exports = {
  validateContext,
};
