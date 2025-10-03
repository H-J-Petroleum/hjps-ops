/**
 * Timesheet Submission Confirmation Note Content Generator
 * Generates notes for timesheet submission confirmations
 * Example of scalable note content generation
 */

module.exports = {
  metadata: {
    name: 'Timesheet Submission Confirmation Note',
    description: 'Creates notes confirming timesheet submissions',
    category: 'timesheet',
    version: '1.0.0',
    requiredFields: [
      'timesheetId',
      'consultantName',
      'projectName',
      'submissionDate',
      'salesDealId'
    ],
    optionalFields: [
      'totalHours',
      'customer',
      'operator',
      'wellNames',
      'comments'
    ]
  },

  /**
   * Validate required data for note creation
   */
  validateData(data) {
    const requiredFields = this.metadata.requiredFields;
    const missing = requiredFields.filter(field => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields for timesheet submission note: ${missing.join(', ')}`);
    }
  },

  /**
   * Generate note content for timesheet submission confirmation
   * 
   * @param {Object} data - Timesheet data
   * @param {Object} config - Configuration options
   * @returns {Object} Note content
   */
  generateContent(data, config = {}) {
    const { baseUrl = 'https://hjpetro-1230608.hs-sites.com' } = config;

    // Prepare and normalize data
    const noteData = this._prepareNoteData(data, baseUrl);

    // Create the note body HTML
    const noteBody = this._createNoteBody(noteData);

    // Prepare note properties
    const noteProperties = this._prepareNoteProperties(noteData, noteBody);

    // Create associations
    const associations = this._createAssociations(noteData.salesDealId);

    return {
      properties: noteProperties,
      associations,
      metadata: {
        noteType: 'timesheet',
        contentType: 'submissionConfirmation',
        timesheetId: noteData.timesheetId,
        salesDealId: noteData.salesDealId,
        generatedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Prepare and normalize note data
   */
  _prepareNoteData(data, baseUrl) {
    return {
      timesheetId: data.timesheetId,
      consultantName: data.consultantName,
      projectName: data.projectName,
      submissionDate: this._formatDate(data.submissionDate),
      salesDealId: data.salesDealId,
      totalHours: data.totalHours || 'N/A',
      customer: data.customer || '',
      operator: data.operator || '',
      wellNames: data.wellNames || '',
      comments: data.comments || '',
      baseUrl
    };
  },

  /**
   * Create the HTML note body
   */
  _createNoteBody(noteData) {
    const { baseUrl } = noteData;

    // Create timesheet view link
    const timesheetLink = `${baseUrl}/timesheet-details?timesheet_id=${noteData.timesheetId}`;

    // Format additional details if present
    let additionalDetails = '';
    if (noteData.wellNames) {
      additionalDetails += `
        <li>
          <p style="margin:0;">Well Names: <strong>${noteData.wellNames}</strong></p>
        </li>
      `;
    }

    if (noteData.comments) {
      additionalDetails += `
        <li>
          <p style="margin:0;">Comments: <strong>${noteData.comments}</strong></p>
        </li>
      `;
    }

    // Create the main note body HTML
    const noteBody = `
      <div style="" dir="auto" data-top-level="true">
        <p style="margin:0;">
          <strong><span style="color: rgb(194, 0, 0);">Timesheet Submission Confirmation</span></strong>
        </p><br>
        <p style="margin:0;">
          <span style="color: rgb(194, 0, 0);">Consultant: </span>
          <strong><span style="color: rgb(194, 0, 0);">${noteData.consultantName}</span></strong>
        </p><br>
        <p style="margin:0;">
          <strong><span style="color: rgb(51, 51, 51);">Submitted on: ${noteData.submissionDate}</span></strong>
        </p><br>
        <ul>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Project: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.projectName}</span></strong>
            </p>
          </li>
          <li style="color: rgb(51, 51, 51);">
            <p style="margin:0;">
              <span style="color: rgb(51, 51, 51);">Total Hours: </span>
              <strong><span style="color: rgb(51, 51, 51);">${noteData.totalHours}</span></strong>
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
          ${additionalDetails}
        </ul><br>
        <p style="margin:0;">
          <span style="color: rgb(51, 51, 51);">
            <span style="font-size: 11pt;">To view the complete timesheet, click the link below</span>
          </span>
        </p><br>
        <p style="margin:0;">
          <a href="${timesheetLink}" title="VIEW TIMESHEET" target="_blank">VIEW TIMESHEET</a>
        </p>
      </div>
    `;

    return noteBody;
  },

  /**
   * Prepare note properties for HubSpot
   */
  _prepareNoteProperties(noteData, noteBody) {
    const timestamp = new Date().getTime();

    return {
      hs_timestamp: timestamp,
      hs_note_body: noteBody,
      hubspot_owner_id: '75480756' // Default H&J owner ID
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
