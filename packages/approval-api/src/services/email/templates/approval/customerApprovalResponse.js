/**
 * Customer Approval Response Email Template
 * Sent to consultants when their timesheet is approved/rejected
 * Uses actual email templates from HubSpot
 */

const { format } = require('date-fns');
const fs = require('fs');
const path = require('path');

module.exports = {
  metadata: {
    name: 'Customer Approval Response',
    description: 'Email sent to consultants when their timesheet is approved or rejected',
    category: 'approval',
    version: '1.0.0',
    requiredFields: [
      'consultantId',
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
      'pdfUrl',
      'approvalPageLink',
      'approvalDealLink'
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
      pdfUrl = '',
      approvalPageLink = '',
      approvalDealLink = ''
    } = data;

    const { baseUrl } = config;

    // Format dates
    const formattedFromDate = format(new Date(fromDate), 'MM/dd/yyyy');
    const formattedUntilDate = format(new Date(untilDate), 'MM/dd/yyyy');

    // Determine subject based on approval status - using actual HubSpot subject format
    const subject = `${customer} Response to your Approval Request`;

    // Generate HTML content using actual HubSpot templates
    const html = this.generateHtmlContent({
      consultantName,
      projectName,
      fromDate: formattedFromDate,
      untilDate: formattedUntilDate,
      customer,
      operator,
      comment,
      approvalStatus,
      pdfUrl,
      approvalPageLink,
      approvalDealLink,
      baseUrl,
      approvalRequestId,
      projectId
    });

    // Generate text content
    const text = this.generateTextContent({
      consultantName,
      projectName,
      fromDate: formattedFromDate,
      untilDate: formattedUntilDate,
      customer,
      operator,
      comment,
      approvalStatus,
      pdfUrl,
      approvalPageLink,
      approvalDealLink
    });

    return {
      subject,
      html,
      text,
      metadata: {
        consultantId,
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
        response_approval_from_date: this._formatDate(fromDate),
        response_approval_until_date: this._formatDate(untilDate),
        response_approval_customer: customer,
        response_approval_operator: operator,
        response_approval_customer_comment: comment,
        consultant_field_ticket_url: pdfUrl,
        response_approval_hj_page_link: `${baseUrl}/hj-approval-response-page?approval_request_id=${approvalRequestId}&project_id=${projectId}`,
        response_approval_hj_deal_link: `${baseUrl}/deals/${data.salesDealId || ''}`,
        response_approval_consultant_page_link: `${baseUrl}/customers-response-to-the-approval-request-consultant-01?approval_request_id=${approvalRequestId}&project_id=${projectId}&approver_is=PrimaryContact`,
        // Contact properties for personalization
        firstname: consultantName.split(' ')[0] || consultantName,
        lastname: consultantName.split(' ').slice(1).join(' ') || '',
        email: data.consultantEmail || consultantId
      }
    };
  },

  /**
   * Generate HTML content using actual HubSpot templates
   */
  generateHtmlContent(data) {
    const {
      consultantName,
      projectName,
      fromDate,
      untilDate,
      customer,
      operator,
      comment,
      approvalStatus,
      pdfUrl,
      approvalPageLink,
      approvalDealLink,
      baseUrl,
      approvalRequestId,
      projectId
    } = data;

    // Load the appropriate template
    const templateDir = path.join(__dirname, '../../../../email-templates');
    let template;

    try {
      if (approvalStatus === 'Approved') {
        template = fs.readFileSync(path.join(templateDir, 'consultant-approval-approved.html'), 'utf8');
      } else {
        template = fs.readFileSync(path.join(templateDir, 'approval-response-rejected.html'), 'utf8');
      }
    } catch (error) {
      // Fallback to inline template if file not found
      return this.generateFallbackHtml(data);
    }

    // Create consultant notification link
    const consultantLink = `${baseUrl}/customers-response-to-the-approval-request-consultant-01?approval_request_id=${approvalRequestId}&project_id=${projectId}&approver_is=PrimaryContact`;

    // Create consultant page link button
    const consultantPageLinkButton = `
      <p>
        <a style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;" 
           href="${consultantLink}" 
           rel="nofollow noopener">
          Customer's Response to your Approval Request
        </a>
      </p>
    `;

    // Replace placeholders with actual data
    template = template.replace(/\{\{approverName\}\}/g, consultantName);
    template = template.replace(/\{\{projectName\}\}/g, projectName);
    template = template.replace(/\{\{consultantName\}\}/g, consultantName);
    template = template.replace(/\{\{fromDate\}\}/g, fromDate);
    template = template.replace(/\{\{untilDate\}\}/g, untilDate);
    template = template.replace(/\{\{customerName\}\}/g, customer);
    template = template.replace(/\{\{operatorName\}\}/g, operator || '');
    template = template.replace(/\{\{fieldTicketUrl\}\}/g, pdfUrl || '#');
    template = template.replace(/\{\{customerComment\}\}/g, comment || 'No comment provided');
    template = template.replace(/\{\{approvalPageLink\}\}/g, approvalPageLink || consultantPageLinkButton);
    template = template.replace(/\{\{approvalDealLink\}\}/g, approvalDealLink || '#');
    template = template.replace(/\{\{consultantPageLink\}\}/g, consultantPageLinkButton);
    template = template.replace(/\{\{companyAddress\}\}/g, '123 Main St');
    template = template.replace(/\{\{companyCity\}\}/g, 'Houston');
    template = template.replace(/\{\{companyState\}\}/g, 'TX');
    template = template.replace(/\{\{companyZip\}\}/g, '77001');
    template = template.replace(/\{\{unsubscribeLink\}\}/g, '#');
    template = template.replace(/\{\{viewAsPageUrl\}\}/g, '#');

    return template;
  },

  /**
   * Generate fallback HTML content if template files are not available
   */
  generateFallbackHtml(data) {
    const {
      consultantName,
      projectName,
      fromDate,
      untilDate,
      customer,
      operator = '',
      comment,
      approvalStatus,
      pdfUrl
    } = data;

    if (approvalStatus === 'Approved') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Approval Response - APPROVED</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { background-color: #333; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .details { background-color: #f8f9fa; border-left: 4px solid #c20000; padding: 15px; margin: 20px 0; }
            .button { background-color: #c20000; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; display: inline-block; margin: 10px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>H&J Petroleum</h1>
          </div>
          <div class="content">
            <h2>Customer's Response to your Approval Request</h2>
            <div class="success">
              <p><strong>Good Job!</strong></p>
              <p>Please, find the link below to see your <strong>approved</strong> Timesheet for this Approval Request.</p>
            </div>
            <div style="text-align: center;">
              <a href="${pdfUrl}" class="button" target="_blank">Get Approved Timesheet</a>
            </div>
            <div class="details">
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Consultant:</strong> ${consultantName}</p>
              <p><strong>Time Period:</strong> ${fromDate} - ${untilDate}</p>
              <p><strong>Customer:</strong> ${customer}</p>
              <p><strong>Operator:</strong> ${operator || 'Not specified'}</p>
            </div>
            ${comment ? `
            <div style="background-color: #e9ecef; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
              <p><strong>Customer's Comment:</strong></p>
              <p>${comment}</p>
            </div>
            ` : ''}
            <p>Thanks,<br>H&J Petroleum Team</p>
          </div>
          <div class="footer">
            <p>H&J Petroleum<br>123 Main St, Houston, TX 77001</p>
          </div>
        </body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Approval Response - REJECTED</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { background-color: #333; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .details { background-color: #f8f9fa; border-left: 4px solid #c20000; padding: 15px; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>H&J Petroleum</h1>
          </div>
          <div class="content">
            <h2>Customer's Response to your Approval Request</h2>
            <div class="warning">
              <p>Unfortunately, Timesheet for this Approval Request is <strong>rejected</strong>.</p>
              <p>Please, find links below to continue with the process.</p>
            </div>
            <div class="details">
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Consultant:</strong> ${consultantName}</p>
              <p><strong>Time Period:</strong> ${fromDate} - ${untilDate}</p>
              <p><strong>Customer:</strong> ${customer}</p>
              <p><strong>Operator:</strong> ${operator || 'Not specified'}</p>
            </div>
            ${comment ? `
            <div style="background-color: #e9ecef; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
              <p><strong>Customer's Comment:</strong></p>
              <p>${comment}</p>
            </div>
            ` : ''}
            <p>Thanks,<br>H&J Petroleum Team</p>
          </div>
          <div class="footer">
            <p>H&J Petroleum<br>123 Main St, Houston, TX 77001</p>
          </div>
        </body>
        </html>
      `;
    }
  },

  /**
   * Generate text content for customer approval response
   */
  generateTextContent(data) {
    const {
      consultantName,
      projectName,
      fromDate,
      untilDate,
      customer,
      operator = '',
      comment,
      approvalStatus,
      pdfUrl,
      approvalPageLink,
      approvalDealLink
    } = data;

    let text = 'Customer\'s Response to your Approval Request\n\n';

    if (approvalStatus === 'Approved') {
      text += 'Good Job!\n';
      text += 'Please, find the link below to see your approved Timesheet for this Approval Request.\n\n';
      text += `Get Approved Timesheet: ${pdfUrl || 'Link not available'}\n\n`;
    } else {
      text += 'Unfortunately, Timesheet for this Approval Request is rejected.\n';
      text += 'Please, find links below to continue with the process.\n\n';
      text += `Approval Page: ${approvalPageLink || 'Link not available'}\n`;
      text += `Approval Deal: ${approvalDealLink || 'Link not available'}\n\n`;
    }

    text += `Project: ${projectName}\n`;
    text += `Consultant: ${consultantName}\n`;
    text += `Time Period: ${fromDate} - ${untilDate}\n`;
    text += `Customer: ${customer}\n`;
    text += `Operator: ${operator || 'Not specified'}\n\n`;

    if (comment) {
      text += `Customer's Comment: ${comment}\n\n`;
    }

    text += 'Thanks,\nH&J Petroleum Team\n\n';
    text += 'H&J Petroleum\n123 Main St, Houston, TX 77001';

    return text;
  },

  _formatDate(dateString) {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MM/dd/yyyy');
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString; // Return original if formatting fails
    }
  }
};
