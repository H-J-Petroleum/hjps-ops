/**
 * Timesheet Submission Confirmation Email Template
 * Sent to consultants when they submit a timesheet
 */

const { format } = require('date-fns');

module.exports = {
  metadata: {
    name: 'Timesheet Submission Confirmation',
    description: 'Email sent to consultants when they submit a timesheet',
    category: 'timesheet',
    version: '1.0.0',
    requiredFields: [
      'consultantId',
      'consultantName',
      'timesheetId',
      'period',
      'submissionDate'
    ],
    optionalFields: [
      'projectName',
      'totalHours',
      'approverName',
      'approverEmail'
    ]
  },

  generate(data, config) {
    // Validate required fields
    const requiredFields = this.metadata.requiredFields;
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    const {
      consultantId,
      consultantName,
      timesheetId,
      period,
      submissionDate,
      projectName = '',
      totalHours = 0,
      approverName = '',
      approverEmail = ''
    } = data;

    const { baseUrl } = config;

    // Create timesheet view link
    const timesheetLink = `${baseUrl}/timesheet-details?timesheet_id=${timesheetId}&consultant_id=${consultantId}`;
    const timesheetButton = this._createButton(timesheetLink, 'View Timesheet Details');

    const emailBody = `
      <p>Dear ${consultantName},</p>
      <p>Your timesheet for the period ${period} has been successfully submitted.</p>
      <p><strong>Submission Details:</strong></p>
      <ul>
        <li>Timesheet ID: ${timesheetId}</li>
        <li>Period: ${period}</li>
        <li>Total Hours: ${totalHours}</li>
        <li>Submitted: ${this._formatDate(submissionDate)}</li>
        ${projectName ? `<li>Project: ${projectName}</li>` : ''}
      </ul>
      <p>Your timesheet is now pending approval.</p>
      ${timesheetButton}
    `;

    return {
      consultantId,
      email_subject: `Timesheet Submitted - ${period}`,
      email_body: emailBody,
      recipient: data.consultant_email || consultantId,
      properties: {
        timesheet_id: timesheetId,
        timesheet_period: period,
        timesheet_total_hours: totalHours,
        timesheet_submission_date: this._formatDate(submissionDate),
        timesheet_project_name: projectName,
        timesheet_approver_name: approverName,
        timesheet_approver_email: approverEmail,
        timesheet_status: 'Submitted',
        timesheet_view_link: timesheetButton
      }
    };
  },

  _createButton(link, text, color = '#c20000') {
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

  _formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return format(new Date(parseInt(timestamp)), 'MM/dd/yyyy');
  }
};
