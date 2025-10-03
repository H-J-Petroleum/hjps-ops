/**
 * Returns API access token for specified environment.
 * Tokens are supplied via environment variables:
 * - API_ACCESS_SANDBOX
 * - API_ACCESS_PRODUCTION
 *
 * @param {('sandbox'|'production')} environment - target environment
 * @returns {string} API access token
 */
function getApiAccessToken(environment = 'sandbox') {
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error(`Invalid environment: ${environment}. Must be 'sandbox' or 'production'.`);
  }
  const tokens = {
    sandbox: process.env.API_ACCESS_SANDBOX,
    production: process.env.API_ACCESS_PRODUCTION
  };

  const token = tokens[environment];
  if (!token) {
    throw new Error(`Missing API access token for ${environment}`);
  }
  return token;
}

module.exports = { getApiAccessToken };

