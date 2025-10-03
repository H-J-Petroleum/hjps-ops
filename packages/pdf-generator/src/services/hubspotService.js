const axios = require('axios');
const logger = require('../utils/logger');
const ConfigManager = require('./configManager');

class HubSpotService {
  constructor() {
    this.configManager = new ConfigManager();
    this.hubspotConfig = this.configManager.getHubSpotConfig();
    this.apiToken = this.hubspotConfig.apiToken;
    this.baseURL = this.hubspotConfig.baseUrl;
    if (!this.apiToken) {
      logger.warn('HUBSPOT_PRIVATE_APP_TOKEN not set in env. API calls will fail.');
    }
  }

  headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getApprovalData(approvalIdOrRequestId) {
    const url = `${this.baseURL}/objects/${this.hubspotConfig.approvalObjectTypeId}/${approvalIdOrRequestId}`;
    const params = { properties: this.hubspotConfig.approvalProperties.join(',') };

    try {
      const response = await axios.get(url, { headers: this.headers(), params });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      if (status !== 404) {
        logger.error('Error fetching approval data', { message: error.message, status });
        throw error;
      }

      logger.warn('Approval not found by HubSpot object ID, attempting search by approval_request_id', {
        approvalIdentifier: approvalIdOrRequestId
      });

      const result = await this.searchApprovalByRequestId(approvalIdOrRequestId, params.properties);
      if (!result) {
        const notFoundErr = new Error(`Approval ${approvalIdOrRequestId} not found in HubSpot`);
        notFoundErr.status = 404;
        throw notFoundErr;
      }

      return result;
    }
  }

  async searchApprovalByRequestId(approvalRequestId, properties) {
    if (!approvalRequestId) {
      return null;
    }

    try {
      const searchUrl = `${this.baseURL}/objects/${this.hubspotConfig.approvalObjectTypeId}/search`;
      const response = await axios.post(searchUrl, {
        filterGroups: [
          {
            filters: [
              { propertyName: 'approval_request_id', operator: 'EQ', value: approvalRequestId }
            ]
          }
        ],
        properties: properties ? properties.split(',') : undefined,
        limit: 1
      }, {
        headers: this.headers()
      });

      const result = response.data?.results?.[0];
      if (result) {
        logger.info('Approval located via search fallback', {
          approvalRequestId,
          hubspotId: result.id
        });
      } else {
        logger.warn('Approval search returned no results', { approvalRequestId });
      }

      return result || null;
    } catch (searchError) {
      logger.error('Approval search request failed', { message: searchError.message });
      throw searchError;
    }
  }

  async getTimesheetData(projectId, approvalRequestId, consultantId) {
    try {
      const url = `${this.baseURL}/objects/${this.hubspotConfig.timesheetObjectTypeId}/search`;
      const body = {
        filterGroups: [
          {
            filters: [
              { propertyName: 'timesheet_project_id', operator: 'EQ', value: projectId },
              { propertyName: 'timesheet_approval_request_id', operator: 'EQ', value: approvalRequestId },
              { propertyName: 'timesheet_consultant_id', operator: 'EQ', value: consultantId }
            ]
          }
        ],
        properties: this.hubspotConfig.timesheetProperties,
        limit: 100
      };
      const response = await axios.post(url, body, { headers: this.headers() });
      return (response.data.results || []).map((record) => ({
        hs_object_id: record.id,
        ...(record.properties || {})
      }));
    } catch (error) {
      logger.error('Error fetching timesheet data', { message: error.message });
      throw error;
    }
  }

  async updateApprovalWithPDF(approvalId, pdfChunks, pdfType) {
    const propsList = this.hubspotConfig.pdfChunkProps[pdfType];
    if (!propsList) throw new Error(`Unsupported pdfType mapping: ${pdfType}`);
    const properties = {};
    for (let i = 0; i < propsList.length && i < pdfChunks.length; i += 1) {
      properties[propsList[i]] = pdfChunks[i];
    }
    // clear error field if exists
    properties.webbook_error = '';
    try {
      const url = `${this.baseURL}/objects/${this.hubspotConfig.approvalObjectTypeId}/${approvalId}`;
      const response = await axios.patch(url, { properties }, { headers: this.headers() });
      return response.data;
    } catch (error) {
      logger.error('Error updating approval with PDF', { message: error.message });
      throw error;
    }
  }

  async updateApprovalWithPDFUrl(approvalId, url, pdfType) {
    const propName = this.hubspotConfig.pdfUrlProps[pdfType];
    if (!propName) throw new Error(`No URL property configured for pdfType: ${pdfType}`);
    const properties = { [propName]: url, webbook_error: '' };
    try {
      const api = `${this.baseURL}/objects/${this.hubspotConfig.approvalObjectTypeId}/${approvalId}`;
      const resp = await axios.patch(api, { properties }, { headers: this.headers() });
      return resp.data;
    } catch (error) {
      logger.error('Error updating approval with PDF URL', { message: error.message, propName });
      throw error;
    }
  }

  async updateApprovalWithFileMeta(approvalId, pdfType, fileId, url) {
    const mapping = this.hubspotConfig.pdfFileMetaProps[pdfType];
    if (!mapping) throw new Error(`No file meta mapping for pdfType ${pdfType}`);
    const idProp = mapping.id || mapping.idProp;
    const urlProp = mapping.url || mapping.urlProp;
    if (!idProp || !urlProp) {
      throw new Error(`Invalid file meta mapping for pdfType ${pdfType}`);
    }
    const properties = { [idProp]: fileId, [urlProp]: url, webbook_error: '' };
    try {
      const api = `${this.baseURL}/objects/${this.hubspotConfig.approvalObjectTypeId}/${approvalId}`;
      const resp = await axios.patch(api, { properties }, { headers: this.headers() });
      return resp.data;
    } catch (error) {
      logger.error('Error updating approval with file metadata', { message: error.message, mapping });
      throw error;
    }
  }
}

module.exports = HubSpotService;
