/**
 * Email Sender Service
 * Handles actual email sending using various providers
 */

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailSender {
  constructor(config = {}) {
    this.config = {
      // Default to console logging for testing
      provider: config.provider || 'console',
      smtp: config.smtp || {},
      sendgrid: config.sendgrid || {},
      ...config
    };

    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter based on provider
   */
  initializeTransporter() {
    switch (this.config.provider) {
    case 'smtp': {
      const smtpConfig = this.config.smtp || {};
      const {
        host,
        port,
        secure,
        auth = {},
        user,
        pass,
        ...smtpExtras
      } = smtpConfig;

      const smtpUser = user || auth.user;
      const smtpPass = pass || auth.pass;

      const transporterOptions = {
        host,
        port,
        secure,
        ...smtpExtras
      };

      if (smtpUser && smtpPass) {
        transporterOptions.auth = {
          user: smtpUser,
          pass: smtpPass
        };
      }

      this.transporter = nodemailer.createTransport(transporterOptions);
      break;
    }

    case 'sendgrid':
      // For SendGrid, we'd use their API directly
      this.transporter = 'sendgrid';
      break;

    case 'console':
    default:
      // For testing, just log emails to console
      this.transporter = 'console';
      break;
    }
  }

  /**
   * Send an email
   * @param {Object} emailData - Email data
   * @returns {Object} Send result
   */
  async sendEmail(emailData) {
    const {
      to,
      from = 'timesheets@hjpetro.com', // Default sender
      subject,
      html,
      text,
      attachments = []
    } = emailData;

    logger.debug('Preparing email send', {
      provider: this.config.provider,
      to,
      from,
      subject,
      hasHtml: Boolean(html),
      hasText: Boolean(text),
      attachmentCount: attachments.length
    });

    try {
      if (this.transporter === 'console') {
        return await this.sendConsoleEmail(emailData);
      } else if (this.transporter === 'sendgrid') {
        return await this.sendSendGridEmail(emailData);
      } else {
        return await this.sendSmtpEmail(emailData);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.config.provider
      };
    }
  }

  /**
   * Send email via console (for testing)
   */
  async sendConsoleEmail(emailData) {
    const { to, from, subject, html, text, attachments = [] } = emailData;

    console.log('\n📧 EMAIL SENT (Console Mode):');
    console.log('===============================');
    console.log(`Attachments: ${attachments.length}`);
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log('---');
    console.log('HTML Content:');
    console.log(html);
    console.log('---');
    console.log('Text Content:');
    console.log(text);
    console.log('===============================\n');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: 'console',
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Send email via SendGrid API
   */
  async sendSendGridEmail(emailData) {
    const { to, from, subject, html, text, attachments = [] } = emailData;

    // This would integrate with SendGrid API
    // For now, just log that we would send via SendGrid
    logger.debug('SendGrid email payload prepared', {
      to,
      from,
      subject,
      hasHtml: Boolean(html),
      hasText: Boolean(text),
      attachmentCount: attachments.length
    });

    console.log(`📧 Would send email via SendGrid to: ${to}`);
    console.log(`Attachments: ${attachments.length}`);

    return {
      success: true,
      messageId: `sendgrid-${Date.now()}`,
      provider: 'sendgrid',
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Send email via SMTP
   */
  async sendSmtpEmail(emailData) {
    const { to, from, subject, html, text, attachments } = emailData;

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text,
      attachments
    };

    const result = await this.transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp',
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (this.transporter === 'console') {
        return { success: true, message: 'Console email mode active' };
      } else if (this.transporter === 'sendgrid') {
        return { success: true, message: 'SendGrid mode active' };
      } else {
        await this.transporter.verify();
        return { success: true, message: 'SMTP connection verified' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailSender;
