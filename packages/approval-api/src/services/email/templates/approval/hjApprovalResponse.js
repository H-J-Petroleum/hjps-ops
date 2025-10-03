/**
 * H&J Internal Approval Response Email Template
 * Sent to H&J staff for internal approvals
 * Uses actual email templates from HubSpot
 */

const { format } = require('date-fns');

module.exports = {
  metadata: {
    name: 'H&J Internal Approval Response',
    description: 'Email sent to H&J staff when internal timesheet is approved or rejected',
    category: 'approval',
    version: '1.0.0',
    requiredFields: [
      'approverId',
      'approvalRequestId',
      'projectId',
      'consultantName',
      'projectName',
      'fromDate',
      'untilDate',
      'approvalStatus'
    ],
    optionalFields: [
      'customer',
      'operator',
      'comment',
      'salesDealId',
      'taskId',
      'salesDealOwnerName',
      'consultantId',
      'approverEmail',
      'approverType'
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
      approvalRequestId,
      projectId,
      consultantName,
      projectName,
      fromDate,
      untilDate,
      customer = '',
      operator = '',
      comment = '',
      approvalStatus,
      salesDealId = '',
      taskId = '',
      salesDealOwnerName = '',
      consultantId,
      approverEmail,
      approverType
    } = data;

    const { baseUrl, appUrl } = config;

    // Format dates
    const formattedFromDate = format(new Date(fromDate), 'MM/dd/yyyy');
    const formattedUntilDate = format(new Date(untilDate), 'MM/dd/yyyy');

    // Create links
    const pageLink = `${baseUrl}/field-ticket-for-approval-step-01?project_id=${projectId}&approval_request_id=${approvalRequestId}&customer_email=${approverEmail}&consultant_id=${this._encryptConsultantId(consultantId)}&approver_is=${approverType}&sales_deal_id=${salesDealId}`;
    const pageLinkButton = this._createButton(pageLink, 'Approve or Reject The Timesheet');

    const salesDealLink = `${appUrl}${salesDealId}`;
    const salesDealLinkButton = this._createButton(salesDealLink, 'View Deal');

    const taskLink = `${appUrl}${salesDealId}?taskId=${taskId}`;
    const taskLinkButton = this._createButton(taskLink, 'View Task');

    const emailBody = `
      <p>Dear ${salesDealOwnerName},</p>
      <p>The Timesheet Approval Request for ${consultantName} for the period from ${this._formatDate(fromDate)} until ${this._formatDate(untilDate)} has been ${approvalStatus}.</p>
      ${pageLinkButton}
      ${salesDealLinkButton}
      ${taskLinkButton}
    `;

    return {
      subject: `${customer} Response to The Approval Request`,
      html: emailBody,
      text: this.generateTextContent({
        consultantName,
        projectName,
        fromDate: formattedFromDate,
        untilDate: formattedUntilDate,
        customer,
        operator,
        comment,
        approvalStatus,
        salesDealId,
        taskId,
        salesDealOwnerName
      }),
      metadata: {
        approverId,
        approvalRequestId,
        projectId,
        approvalStatus,
        generatedAt: new Date().toISOString()
      },
      // HubSpot properties for contact/approval object updates
      properties: {
        // Approval object properties
        approval_approve_reject: approvalStatus,
        response_approval_project_name: projectName,
        response_approval_consultant_name: consultantName,
        response_approval_from_date: formattedFromDate,
        response_approval_until_date: formattedUntilDate,
        response_approval_customer: customer,
        response_approval_operator: operator,
        response_approval_customer_comment: comment,
        // H&J specific properties
        line_items_approval_link: pageLinkButton,
        approval_internal_sales_deal_link: salesDealLinkButton,
        approval_reminder_task_link: taskLinkButton,
        approval_approver: approverType,
        send_approval_project_name: projectName,
        send_approval_sales_deal_owner_name: salesDealOwnerName,
        approval_request_type: 'Approval Request for H&J Petroleum',
        // Contact properties for personalization
        firstname: salesDealOwnerName.split(' ')[0] || salesDealOwnerName,
        lastname: salesDealOwnerName.split(' ').slice(1).join(' ') || '',
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
      comment,
      approvalStatus,
      salesDealId,
      taskId,
      salesDealOwnerName
    } = data;

    let text = 'H&J Internal Approval Response\n\n';
    text += `Dear ${salesDealOwnerName},\n\n`;
    text += `The Timesheet Approval Request for ${consultantName} for the period from ${fromDate} until ${untilDate} has been ${approvalStatus}.\n\n`;

    if (salesDealId) {
      text += `View Deal: ${salesDealId}\n`;
    }

    if (taskId) {
      text += `View Task: ${taskId}\n`;
    }

    text += `\nProject: ${projectName}\n`;
    text += `Consultant: ${consultantName}\n`;
    text += `Time Period: ${fromDate} - ${untilDate}\n`;
    text += `Customer: ${customer}\n`;
    text += `Operator: ${operator || 'Not specified'}\n`;

    if (comment) {
      text += `Comment: ${comment}\n`;
    }

    text += '\nThanks,\nH&J Petroleum Team';

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
