/**
 * Customer Approval Request Email Template
 * Initial request sent to approvers
 */

const { format } = require('date-fns');

module.exports = {
  metadata: {
    name: 'Customer Approval Request',
    description: 'Initial approval request email sent to approvers',
    category: 'approval',
    version: '1.0.0',
    requiredFields: [
      'approverId',
      'projectId',
      'approvalRequestId',
      'consultantName',
      'fromDate',
      'untilDate'
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
      subject: `Timesheet Approval Request: ${consultantName} - ${this._formatDate(fromDate)} to ${this._formatDate(untilDate)}`,
      html: emailBody,
      text: this.generateTextContent({
        consultantName,
        projectName: data.projectName || 'Unknown Project',
        fromDate: this._formatDate(fromDate),
        untilDate: this._formatDate(untilDate),
        customer,
        operator,
        wellNames,
        marketingEmailLink
      }),
      metadata: {
        approverId,
        approvalRequestId,
        projectId,
        generatedAt: new Date().toISOString()
      },
      // HubSpot properties for contact/approval object updates
      properties: {
        // Approval request properties
        send_approval_consultant_name: consultantName,
        send_approval_from_date: this._formatDate(fromDate),
        send_approval_until_date: this._formatDate(untilDate),
        send_approval_well_names: wellNames,
        send_approval_customer: customer,
        send_approval_operator: operator,
        line_items_approval_link: marketingEmailButton,
        approval_request_type: 'Approval Request for Customer',
        // Contact properties for personalization
        firstname: approverEmail ? approverEmail.split('@')[0] : 'Approver',
        lastname: '',
        email: approverEmail || approverId
      }
    };
  },

  generateTextContent(data) {
    const {
      consultantName,
      projectName,
      fromDate,
      untilDate,
      customer,
      operator,
      wellNames,
      marketingEmailLink
    } = data;

    let text = 'Timesheet Approval Request\n\n';
    text += 'Dear Approver,\n\n';
    text += `You have a new timesheet approval request from ${consultantName} for the period from ${fromDate} until ${untilDate}.\n\n`;
    text += `Project: ${projectName}\n`;
    text += `Consultant: ${consultantName}\n`;
    text += `Time Period: ${fromDate} - ${untilDate}\n`;
    text += `Customer: ${customer}\n`;
    text += `Operator: ${operator}\n`;

    if (wellNames) {
      text += `Well Names: ${wellNames}\n`;
    }

    text += `\nTo approve or reject this timesheet, please visit:\n${marketingEmailLink}\n\n`;
    text += 'Thanks,\nH&J Petroleum Team';

    return text;
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
