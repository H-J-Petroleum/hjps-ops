const axios = require('axios');

const DEFAULT_CARD_TITLE = 'WF-26 Internal Approval';

function buildFacts(context) {
  if (!context) {
    return [];
  }
  return Object.entries(context)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({ name: key, value: String(value) }));
}

function buildMessageCard({ level, message, context, title }) {
  const themeColor = level === 'error' ? 'C4314B' : level === 'warn' ? 'F3BB1C' : '2F6CAD';
  const payload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: title || DEFAULT_CARD_TITLE,
    themeColor,
    title: `${title || DEFAULT_CARD_TITLE} ${level.toUpperCase()}`,
    text: message,
  };

  const facts = buildFacts(context);
  if (facts.length > 0) {
    payload.sections = [{ facts }];
  }

  return payload;
}

function buildSimpleText({ level, message, context }) {
  const facts = buildFacts(context);
  const suffix = facts.length > 0
    ? '\n' + facts.map(({ name, value }) => `- ${name}: ${value}`).join('\n')
    : '';
  return {
    text: `[${level.toUpperCase()}] ${message}${suffix}`,
  };
}

/**
 * Sends a notification to Microsoft Teams via webhook/workflow endpoint.
 * @param {object} params
 * @param {string} params.webhookUrl
 * @param {string} params.level
 * @param {string} params.message
 * @param {object} [params.context]
 * @param {string} [params.mode='messageCard'] - 'messageCard' or 'text'
 * @param {string} [params.title]
 */
async function postTeamsAlert({ webhookUrl, level, message, context, mode = 'messageCard', title }) {
  if (!webhookUrl) {
    throw new Error('webhookUrl is required to post to Teams');
  }

  const payload = mode === 'text'
    ? buildSimpleText({ level, message, context })
    : buildMessageCard({ level, message, context, title });

  await axios.post(webhookUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
}

module.exports = {
  postTeamsAlert,
};
