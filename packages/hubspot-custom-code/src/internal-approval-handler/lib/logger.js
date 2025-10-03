const { postTeamsAlert } = require('./telemetry');

function createLogger({ approvalId, correlationId, telemetry } = {}) {
  const baseMeta = {
    approvalId: approvalId || null,
    correlationId: correlationId || null,
  };

  const logToConsole = (level, message, meta) => {
    const payload = Object.assign({ level, message }, baseMeta, meta || {});
    try {
      console.log(JSON.stringify(payload));
    } catch (error) {
      console.log(level + ': ' + message);
    }
  };

  const maybeAlertTeams = async (level, message, meta) => {
    if (!telemetry || !telemetry.teamsWebhookUrl) {
      return;
    }
    if (level !== 'error' && level !== 'warn') {
      return;
    }
    try {
      await postTeamsAlert({
        webhookUrl: telemetry.teamsWebhookUrl,
        level,
        message,
        context: Object.assign({}, baseMeta, meta || {}),
        mode: telemetry.mode || 'messageCard',
        title: telemetry.title || 'WF-26 Internal Approval',
      });
    } catch (error) {
      console.log('telemetry-error: ' + error.message);
    }
  };

  const log = (level, message, meta) => {
    logToConsole(level, message, meta);
    maybeAlertTeams(level, message, meta);
  };

  return {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
  };
}

module.exports = {
  createLogger,
};
