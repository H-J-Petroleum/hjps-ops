const EmailService = require('../services/email/EmailService');

describe('Scalable Email Service', () => {
  let emailService;

  beforeEach(() => {
    emailService = new EmailService();
    // Mock process.env for consistent testing
    process.env.HUBSPOT_SITE_URL = 'https://hjpetro-1230608.hs-sites.com';
    process.env.HUBSPOT_APP_URL = 'https://app.hubspot.com/contacts/1230608/record/0-3/';
  });

  afterEach(() => {
    delete process.env.HUBSPOT_SITE_URL;
    delete process.env.HUBSPOT_APP_URL;
  });

  describe('Template Discovery', () => {
    test('should discover available processes', () => {
      const processes = emailService.getAvailableProcesses();
      expect(processes).toContain('approval');
      expect(processes).toContain('timesheet');
    });

    test('should discover available templates for approval process', () => {
      const templates = emailService.getAvailableTemplates('approval');
      expect(templates).toContain('customerApprovalResponse');
      expect(templates).toContain('hjApprovalResponse');
      expect(templates).toContain('customerApprovalRequest');
      expect(templates).toContain('reminderEmail');
    });

    test('should discover available templates for timesheet process', () => {
      const templates = emailService.getAvailableTemplates('timesheet');
      expect(templates).toContain('submissionConfirmation');
    });

    test('should get template metadata', () => {
      const metadata = emailService.getTemplateMetadata('approval', 'customerApprovalResponse');
      expect(metadata).toHaveProperty('name', 'Customer Approval Response');
      expect(metadata).toHaveProperty('category', 'approval');
      expect(metadata).toHaveProperty('version', '1.0.0');
      expect(metadata).toHaveProperty('requiredFields');
      expect(metadata.requiredFields).toContain('consultantId');
      expect(metadata.requiredFields).toContain('approvalRequestId');
    });
  });

  describe('Approval Process Templates', () => {
    test('should generate customer approval response email', () => {
      const data = {
        consultantId: '123',
        approvalRequestId: 'AR-456',
        projectId: 'P-789',
        consultantName: 'John Doe',
        projectName: 'Test Project',
        fromDate: '2024-01-01',
        untilDate: '2024-01-08',
        approvalStatus: 'Approved'
      };

      const email = emailService.getEmailTemplate('approval', 'customerApprovalResponse', data);

      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
      expect(email).toHaveProperty('metadata');
      expect(email.metadata).toHaveProperty('consultantId', '123');
      expect(email.metadata).toHaveProperty('approvalStatus', 'Approved');
    });

    test('should generate H&J approval response email', () => {
      const data = {
        approverId: '456',
        approvalRequestId: 'AR-789',
        projectId: 'P-012',
        consultantName: 'Jane Smith',
        projectName: 'Internal Project',
        fromDate: '2024-01-01',
        untilDate: '2024-01-08',
        approvalStatus: 'Approved',
        consultantId: '123',
        approverEmail: 'matt.hood@hjpetroleum.com',
        approverType: 'HJPetro'
      };

      const email = emailService.getEmailTemplate('approval', 'hjApprovalResponse', data);

      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
      expect(email).toHaveProperty('metadata');
      expect(email.metadata).toHaveProperty('approverId', '456');
      expect(email.metadata).toHaveProperty('approvalStatus', 'Approved');
    });

    test('should generate customer approval request email', () => {
      const data = {
        approverId: '789',
        projectId: 'P-111',
        approvalRequestId: 'AR-222',
        consultantName: 'Bob Wilson',
        fromDate: '2024-01-01',
        untilDate: '2024-01-08',
        consultantId: '123',
        approverEmail: 'customer@example.com',
        approverType: 'Customer',
        salesDealId: 'D-777'
      };

      const email = emailService.getEmailTemplate('approval', 'customerApprovalRequest', data);

      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
      expect(email).toHaveProperty('metadata');
      expect(email).toHaveProperty('properties');
      expect(email.metadata).toHaveProperty('approverId', '789');
      expect(email.properties).toHaveProperty('send_approval_consultant_name', 'Bob Wilson');
    });

    test('should generate reminder email', () => {
      const data = {
        approverId: '789',
        projectId: 'P-111',
        approvalRequestId: 'AR-222',
        consultantName: 'Bob Wilson',
        fromDate: '2024-01-01',
        untilDate: '2024-01-08',
        reminderType: 'FirstReminder',
        consultantId: '123',
        approverEmail: 'customer@example.com',
        approverType: 'Customer',
        salesDealId: 'D-777'
      };

      const email = emailService.getEmailTemplate('approval', 'reminderEmail', data);

      expect(email).toHaveProperty('email_subject');
      expect(email.email_subject).toContain('Reminder:');
      expect(email.properties).toHaveProperty('send_approval_reminder', 'FirstReminder');
    });
  });

  describe('Timesheet Process Templates', () => {
    test('should generate timesheet submission confirmation email', () => {
      const data = {
        consultantId: '123',
        consultantName: 'John Doe',
        timesheetId: 'TS-456',
        period: '2025-01-01 to 2025-01-07',
        submissionDate: '1704585600000',
        totalHours: 40,
        projectName: 'Test Project'
      };

      const email = emailService.getEmailTemplate('timesheet', 'submissionConfirmation', data);

      expect(email).toHaveProperty('consultantId', '123');
      expect(email).toHaveProperty('email_subject');
      expect(email.email_subject).toContain('Timesheet Submitted');
      expect(email).toHaveProperty('email_body');
      expect(email).toHaveProperty('properties');
      expect(email.properties).toHaveProperty('timesheet_id', 'TS-456');
      expect(email.properties).toHaveProperty('timesheet_period', '2025-01-01 to 2025-01-07');
      expect(email.properties).toHaveProperty('timesheet_total_hours', 40);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unknown process', () => {
      expect(() => {
        emailService.getEmailTemplate('unknown_process', 'template_type', {});
      }).toThrow('Template not found: unknown_process:template_type');
    });

    test('should throw error for unknown template type', () => {
      expect(() => {
        emailService.getEmailTemplate('approval', 'unknown_template', {});
      }).toThrow('Template not found: approval:unknown_template');
    });

    test('should throw error for missing required fields', () => {
      expect(() => {
        emailService.getEmailTemplate('approval', 'customerApprovalResponse', {
          // Missing required fields
        });
      }).toThrow('Missing required fields: consultantId, approvalRequestId, projectId, consultantName, projectName, fromDate, untilDate, approvalStatus');
    });
  });


  describe('Template Validation', () => {
    test('should validate all templates', () => {
      const validation = emailService.validateTemplates();

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('invalid');
      expect(validation).toHaveProperty('errors');
      expect(validation.valid).toBeGreaterThan(0);
      expect(validation.invalid).toBe(0);
    });
  });

  describe('Email Sending', () => {
    test('should send email successfully', async () => {
      const data = {
        consultantId: '123',
        approvalRequestId: 'AR-456',
        projectId: 'P-789',
        consultantName: 'John Doe',
        projectName: 'Test Project',
        fromDate: '2024-01-01',
        untilDate: '2024-01-08',
        approvalStatus: 'Approved'
      };

      const result = await emailService.sendEmail('approval', 'customerApprovalResponse', data);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('template');
      expect(result).toHaveProperty('sentAt');
      expect(result).toHaveProperty('process', 'approval');
      expect(result).toHaveProperty('templateType', 'customerApprovalResponse');
    });

    test('should handle email sending errors', async () => {
      const result = await emailService.sendEmail('approval', 'customerApprovalResponse', {
        // Missing required fields
      });

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('process', 'approval');
      expect(result).toHaveProperty('templateType', 'customerApprovalResponse');
    });
  });
});
