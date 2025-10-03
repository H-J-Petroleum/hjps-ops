/**
 * Reminder Email Template
 * Generic reminder email for approval requests
 */

const { format } = require('date-fns');

module.exports = {
  metadata: {
    name: 'Reminder Email',
    description: 'Reminder email for approval requests (First, Second, Third)',
    category: 'approval',
    version: '1.0.0',
    requiredFields: [
      'approverId',
      'projectId',
      'approvalRequestId',
      'consultantName',
      'fromDate',
      'untilDate',
      'reminderType'
    ],
    optionalFields: [
      'wellNames',
      'customer',
      'operator',
      'consultantId',
      'approverEmail',
      'approverType',
      'salesDealId'
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
      approverId,
      projectId,
      approvalRequestId,
      consultantName,
      fromDate,
      untilDate,
      reminderType,
      wellNames = '',
      customer = '',
      operator = '',
      consultantId,
      approverEmail,
      approverType,
      salesDealId
    } = data;

    const { baseUrl } = config;

    // Create approval link
    const encryptedConsultantId = this._encryptConsultantId(consultantId);
    const marketingEmailLink = `${baseUrl}/field-ticket-for-approval-step-01?project_id=${projectId}&approval_request_id=${approvalRequestId}&customer_email=${approverEmail}&consultant_id=${encryptedConsultantId}&approver_is=${approverType}&sales_deal_id=${salesDealId}`;
    const marketingEmailButton = this._createButton(marketingEmailLink, 'Approve or Reject The Timesheet');

    const emailBody = `
      <p>Dear Approver,</p>
      <p>You have a new timesheet approval request from ${consultantName} for the period from ${this._formatDate(fromDate)} until ${this._formatDate(untilDate)}.</p>
      ${marketingEmailButton}
    `;

    return {
      approverId,
      email_subject: `Reminder: Timesheet Approval Request: ${consultantName} - ${this._formatDate(fromDate)} to ${this._formatDate(untilDate)}`,
      email_body: emailBody,
      recipient: approverEmail || approverId,
      properties: {
        send_approval_consultant_name: consultantName,
        send_approval_from_date: this._formatDate(fromDate),
        send_approval_until_date: this._formatDate(untilDate),
        send_approval_well_names: wellNames,
        send_approval_customer: customer,
        send_approval_operator: operator,
        line_items_approval_link: marketingEmailButton,
        approval_request_type: 'Approval Request for Customer',
        send_approval_reminder: reminderType
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

  _encryptConsultantId(consultantId) {
    return parseInt(consultantId) + 3522;
  },

  _formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return format(new Date(parseInt(timestamp)), 'MM/dd/yyyy');
  }
};
