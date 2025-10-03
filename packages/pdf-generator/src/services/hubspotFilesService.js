const axios = require('axios');
const FormData = require('form-data');
const ConfigManager = require('./configManager');
const logger = require('../utils/logger');

class HubSpotFilesService {
  constructor() {
    this.configManager = new ConfigManager();
    this.hubspotConfig = this.configManager.getHubSpotConfig();
    this.apiToken = this.hubspotConfig.apiToken;
    if (!this.apiToken) {
      logger.warn('HUBSPOT_PRIVATE_APP_TOKEN not set; HubSpot Files upload will fail');
    }
    this.baseURL = this.hubspotConfig.filesBaseUrl;
  }

  headers(extra = {}) {
    return Object.assign(
      {
        Authorization: `Bearer ${this.apiToken}`
      },
      extra
    );
  }

  async uploadPDF({ buffer, fileName, folderPath }) {
    const form = new FormData();
    form.append('file', buffer, { filename: fileName, contentType: 'application/pdf' });
    form.append('fileName', fileName);
    form.append('folderPath', folderPath);
    form.append('options', JSON.stringify({ access: 'PUBLIC_NOT_INDEXABLE', overwrite: false }));

    const response = await axios.post(`${this.baseURL}/files/v3/files`, form, {
      headers: this.headers(form.getHeaders()),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const data = response?.data || {};
    return { id: data.id || data.fileId || null, url: data.url || data.friendlyUrl || null };
  }
}

module.exports = HubSpotFilesService;

