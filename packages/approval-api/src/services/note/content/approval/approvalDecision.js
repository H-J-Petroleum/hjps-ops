/**
 * Approval Decision Note Content Generator
 * Generates comprehensive sales deal notes for timesheet approval decisions
 * Based on WF-26 Action 9 functionality
 */

const HubSpotService = require('../../../hubspotService');

module.exports = {
  metadata: {
    name: 'Approval Decision Note',
    description: 'Creates comprehensive sales deal notes for timesheet approval decisions',
    category: 'approval',
    version: '1.0.0',
    requiredFields: [
      'approvalRequestId',
      'consultantName',
      'customer',
      'projectName',
      'projectId',
      'salesDealId',
      'fromDate',
      'untilDate',
      'approvalStatus',
      'approverFirstName',
      'approverLastName',
      'approverEmail'
    ],
    optionalFields: [
      'operator',
      'comment',
      'fieldTicketId',
      'consultantFieldTicketId',
      'approvalObjectId'
    ]
  },

  /**
   * Validate required data for note creation
   */
  validateData(data) {
    const requiredFields = this.metadata.requiredFields;
    const missing = requiredFields.filter(field => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields for approval decision note: ${missing.join(', ')}`);
    }
  },

  /**
   * Generate note content for approval decision
   * 
   * @param {Object} data - Approval data
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Note content
   */
  async generateContent(data, config = {}) {
    const { baseUrl = 'https://hjpetro-1230608.hs-sites.com' } = config;

    // Prepare and normalize data
    const noteData = this._prepareNoteData(data, baseUrl);

    // Get sales deal owner information
    const dealOwner = await this._getSalesDealOwner(noteData.salesDealId);

    // Create the note body HTML
    const noteBody = this._createNoteBody(noteData);

    // Prepare note properties
    const noteProperties = this._prepareNoteProperties(noteData, dealOwner, noteBody);

    // Create associations
    const associations = this._createAssociations(noteData.salesDealId);

    return {
      properties: noteProperties,
      associations,
      metadata: {
        noteType: 'approval',
        contentType: 'approvalDecision',
        salesDealId: noteData.salesDealId,
        dealOwnerId: dealOwner.hubspot_owner_id,
        generatedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Execute post-creation actions
   * Updates approval object with notification links
   */
  async executePostCreationActions(data, noteResult, config = {}) {
    const { baseUrl = 'https://hjpetro-1230608.hs-sites.com' } = config;

    if (!data.approvalObjectId) {
      console.warn('No approval object ID provided, skipping link updates');
      return;
    }

    try {
      const hubspotService = new HubSpotService();

      // Create notification links
      const hjPageLink = `${baseUrl}/customers-response-to-the-approval-request-hj-petro-01?approval_request_id=${data.approvalRequestId}&project_id=${data.projectId}&owner_email=${data.approverEmail}&approver_is=HJPetro`;
      const salesDealLink = `https://app.hubspot.com/contacts/1230608/record/0-3/${data.salesDealId}`;
      const consultantLink = `${baseUrl}/customers-response-to-the-approval-request-consultant-01?approval_request_id=${data.approvalRequestId}&project_id=${data.projectId}&approver_is=HJPetro`;

      // Create styled button links
      const hjPageLinkButton = this._createButtonLink(hjPageLink, 'H&J Petroleum\'s Response to The Approval Request');
      const salesDealLinkButton = this._createButtonLink(salesDealLink, 'View Deal');
      const consultantPageLinkButton = this._createButtonLink(consultantLink, 'H&J Petroleum\'s Response to your Approval Request');

      // Update approval object properties
      const updateProperties = {
        response_approval_hj_page_link: hjPageLinkButton,
        response_approval_hj_deal_link: salesDealLinkButton,
        response_approval_consultant_page_link: consultantPageLinkButton
      };

      await hubspotService.updateApprovalObject(data.approvalObjectId, updateProperties);
      console.log('Updated approval object with notification links');
    } catch (error) {
      console.error('Error updating approval object with links:', error);
      // Don't throw - note creation was successful
    }
  },

  /**
   * Prepare and normalize note data
   */
  _prepareNoteData(data, baseUrl) {
    return {
      approvalRequestId: data.approvalRequestId,
      consultantName: data.consultantName,
      customer: data.customer || '',
      operator: data.operator || '',
      projectName: data.projectName,
      projectId: data.projectId,
      salesDealId: data.salesDealId,
      fromDate: this._formatDate(data.fromDate),
      untilDate: this._formatDate(data.untilDate),
      approvalStatus: this._normalizeApprovalStatus(data.approvalStatus),
      approverFirstName: data.approverFirstName,
      approverLastName: data.approverLastName,
      approverEmail: data.approverEmail,
      comment: data.comment || '',
      fieldTicketId: data.fieldTicketId || '',
      consultantFieldTicketId: data.consultantFieldTicketId || '',
      baseUrl
    };
  },

  /**
   * Get sales deal owner information
   */
  async _getSalesDealOwner(salesDealId) {
    try {
      const hubspotService = new HubSpotService();
      const deal = await hubspotService.getDeal(salesDealId, ['hubspot_owner_id']);
      return {
        hubspot_owner_id: deal.properties.hubspot_owner_id
      };
    } catch (error) {
      console.error('Error getting sales deal owner:', error);
      // Return default owner if unable to fetch
      return {
        hubspot_owner_id: '75480756' // Default H&J owner ID from WF-26
      };
    }
  },

  /**
   * Create the HTML note body
   * Based on WF-26 Action 9 note structure
   */
  _createNoteBody(noteData) {
    const { baseUrl } = noteData;

    // Create the main note link
    const noteLink = `${baseUrl}/customers-response-to-the-approval-request-hj-petro-01?approval_request_id=${noteData.approvalRequestId}&project_id=${noteData.projectId}&owner_email=${noteData.approverEmail}&approver_is=HJPetro`;

    // Format approver comment if present
    let commentSection = '';
    if (noteData.comment) {
      commentSection = `
        <p style="margin:0;">
          <strong><span style="font-size: 11pt;">Approver's Comment/Note</span><br></strong>
          <span style="font-size: 11pt;">${noteData.comment}</span>
        </p><br>
      `;
    }

    // Create the main note body HTML
    const noteBody = `
      <div style="" dir="auto" data-top-level="true">
        <p style="margin:0;">
          <strong><span style="color: rgb(194, 0, 0);">H&J Petroleum's response to the Timesheet Approval Request</span></strong>
        </p><br>
        <p style="margin:0;">
          <span style="color: rgb(194, 0, 0);">Consultant: </span>
          <strong><span style="color: rgb(194, 0, 0);">${noteData.consultantName}</span></strong>
        </p><br>
        <p style="margin:0;">
          <strong><span style="color: rgb(51, 51, 51);">${noteData.approvalStatus}</span></strong>
        </p><br>
        <ul>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Time Period: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.fromDate} - ${noteData.untilDate}</span></strong>
            </p>
          </li>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Project/Sales Deal: </span>
              <strong>${noteData.projectName}</strong>
            </p>
          </li>
          <li>
            <p style="margin:0;">Customer: <strong>${noteData.customer}</strong></p>
          </li>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Operator: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.operator}</span></strong>
            </p>
          </li>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Approver Name: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.approverFirstName} ${noteData.approverLastName}</span></strong>
            </p>
          </li>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Approver Email: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.approverEmail}</span></strong>
            </p>
          </li>
        </ul><br>
        ${commentSection}
        <p style="margin:0;">
          <span style="color: rgb(51, 51, 51);">
            <span style="font-size: 11pt;">If you want to know more, click on the link below</span>
          </span>
        </p><br>
        <p style="margin:0;">
          <a href="${noteLink}" title="CHECK OUT TIMESHEET" target="_blank">CHECK OUT TIMESHEET</a>
        </p>
      </div>
    `;

    return noteBody;
  },

  /**
   * Prepare note properties for HubSpot
   */
  _prepareNoteProperties(noteData, dealOwner, noteBody) {
    const timestamp = new Date().getTime();

    // Prepare attachment IDs (field ticket PDFs)
    let attachmentIds = '';
    if (noteData.fieldTicketId && noteData.consultantFieldTicketId) {
      attachmentIds = `${noteData.fieldTicketId};${noteData.consultantFieldTicketId}`;
    } else if (noteData.fieldTicketId) {
      attachmentIds = noteData.fieldTicketId;
    } else if (noteData.consultantFieldTicketId) {
      attachmentIds = noteData.consultantFieldTicketId;
    }

    return {
      hs_timestamp: timestamp,
      hs_note_body: noteBody,
      hs_attachment_ids: attachmentIds,
      hubspot_owner_id: dealOwner.hubspot_owner_id
    };
  },

  /**
   * Create associations for the note
   */
  _createAssociations(salesDealId) {
    return [
      {
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 214 // Deal-Note association type
          }
        ],
        to: {
          id: salesDealId
        }
      }
    ];
  },

  /**
   * Create styled button link HTML
   */
  _createButtonLink(link, text, color = '#c20000') {
    return `
      <p>
        <a style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: ${color}; margin-top: 16px; margin-bottom: 24px;" 
           href="${link}" 
           rel="nofollow noopener">
          ${text}
        </a>
      </p>
    `;
  },

  /**
   * Normalize approval status
   */
  _normalizeApprovalStatus(status) {
    if (status === 'Approve') return 'Approved';
    if (status === 'Reject') return 'Rejected';
    return status;
  },

  /**
   * Format date for display
   */
  _formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
};
