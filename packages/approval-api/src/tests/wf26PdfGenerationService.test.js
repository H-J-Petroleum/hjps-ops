/**
 * Tests for WF-26 PDF Generation Service
 * Tests the WF-26 Actions 6 & 7 PDF generation functionality using existing PDF generator
 */

const WF26PdfGenerationService = require('../services/wf26PdfGenerationService');

describe('WF-26 PDF Generation Service', () => {
  let pdfService;

  beforeEach(() => {
    pdfService = new WF26PdfGenerationService();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', () => {
      expect(pdfService).toBeDefined();
      expect(pdfService.pdfIntegrationService).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    test('should validate correct approval ID', () => {
      const result = pdfService.validateRequest('approval-123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing approval ID', () => {
      const result = pdfService.validateRequest();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId is required');
    });

    test('should reject non-string approval ID', () => {
      const result = pdfService.validateRequest(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId must be a string');
    });
  });

  describe('Customer Field Ticket Generation', () => {
    test('should generate customer field ticket using PDF integration service', async () => {
      // Mock the PDF integration service
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockResolvedValue({
        fileId: 'file-123',
        url: 'https://example.com/customer.pdf',
        fileName: 'Approved-Field-Ticket-John-Doe-req-456.pdf',
        folderPath: 'ApprovedFieldTickets'
      });

      const result = await pdfService.generateCustomerFieldTicket('approval-123');

      expect(result.success).toBe(true);
      expect(result.pdfType).toBe('customer');
      expect(result.fileId).toBe('file-123');
      expect(result.url).toBe('https://example.com/customer.pdf');
      expect(result.folderPath).toBe('ApprovedFieldTickets');
      expect(pdfService.pdfIntegrationService.generatePDF).toHaveBeenCalledWith({
        approvalId: 'approval-123',
        pdfType: 'customer'
      });
    });

    test('should handle PDF generation errors', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockRejectedValue(new Error('PDF generation failed'));

      await expect(pdfService.generateCustomerFieldTicket('approval-123'))
        .rejects.toThrow('PDF generation failed');
    });
  });

  describe('Consultant Field Ticket Generation', () => {
    test('should generate consultant field ticket using PDF integration service', async () => {
      // Mock the PDF integration service
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockResolvedValue({
        fileId: 'file-456',
        url: 'https://example.com/consultant.pdf',
        fileName: 'Approved-Timesheet-req-456.pdf',
        folderPath: 'BillForConsultants'
      });

      const result = await pdfService.generateConsultantFieldTicket('approval-123');

      expect(result.success).toBe(true);
      expect(result.pdfType).toBe('consultant');
      expect(result.fileId).toBe('file-456');
      expect(result.url).toBe('https://example.com/consultant.pdf');
      expect(result.folderPath).toBe('BillForConsultants');
      expect(pdfService.pdfIntegrationService.generatePDF).toHaveBeenCalledWith({
        approvalId: 'approval-123',
        pdfType: 'consultant'
      });
    });

    test('should handle PDF generation errors', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockRejectedValue(new Error('PDF generation failed'));

      await expect(pdfService.generateConsultantFieldTicket('approval-123'))
        .rejects.toThrow('PDF generation failed');
    });
  });

  describe('Both Field Tickets Generation', () => {
    test('should generate both field tickets', async () => {
      // Mock the PDF integration service
      pdfService.pdfIntegrationService.generatePDF = jest.fn()
        .mockResolvedValueOnce({
          fileId: 'customer-file-123',
          url: 'https://example.com/customer.pdf',
          fileName: 'Approved-Field-Ticket-John-Doe-req-456.pdf',
          folderPath: 'ApprovedFieldTickets'
        })
        .mockResolvedValueOnce({
          fileId: 'consultant-file-456',
          url: 'https://example.com/consultant.pdf',
          fileName: 'Approved-Timesheet-req-456.pdf',
          folderPath: 'BillForConsultants'
        });

      const result = await pdfService.generateBothFieldTickets('approval-123');

      expect(result.success).toBe(true);
      expect(result.results.customer).toBeDefined();
      expect(result.results.consultant).toBeDefined();
      expect(result.approvalId).toBe('approval-123');
      expect(pdfService.pdfIntegrationService.generatePDF).toHaveBeenCalledTimes(2);
    });

    test('should generate only customer PDF when consultant disabled', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockResolvedValue({
        fileId: 'customer-file-123',
        url: 'https://example.com/customer.pdf',
        fileName: 'Approved-Field-Ticket-John-Doe-req-456.pdf',
        folderPath: 'ApprovedFieldTickets'
      });

      const result = await pdfService.generateBothFieldTickets('approval-123', {
        generateCustomer: true,
        generateConsultant: false
      });

      expect(result.success).toBe(true);
      expect(result.results.customer).toBeDefined();
      expect(result.results.consultant).toBeUndefined();
      expect(pdfService.pdfIntegrationService.generatePDF).toHaveBeenCalledTimes(1);
    });

    test('should generate only consultant PDF when customer disabled', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockResolvedValue({
        fileId: 'consultant-file-456',
        url: 'https://example.com/consultant.pdf',
        fileName: 'Approved-Timesheet-req-456.pdf',
        folderPath: 'BillForConsultants'
      });

      const result = await pdfService.generateBothFieldTickets('approval-123', {
        generateCustomer: false,
        generateConsultant: true
      });

      expect(result.success).toBe(true);
      expect(result.results.customer).toBeUndefined();
      expect(result.results.consultant).toBeDefined();
      expect(pdfService.pdfIntegrationService.generatePDF).toHaveBeenCalledTimes(1);
    });

    test('should handle validation errors', async () => {
      await expect(pdfService.generateBothFieldTickets())
        .rejects.toThrow('Invalid PDF generation request: approvalId is required');
    });
  });

  describe('Error Handling', () => {
    test('should handle PDF integration service failures', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      await expect(pdfService.generateBothFieldTickets('approval-123'))
        .rejects.toThrow('Service unavailable');
    });

    test('should handle partial failures gracefully', async () => {
      pdfService.pdfIntegrationService.generatePDF = jest.fn()
        .mockResolvedValueOnce({
          fileId: 'customer-file-123',
          url: 'https://example.com/customer.pdf',
          fileName: 'Approved-Field-Ticket-John-Doe-req-456.pdf',
          folderPath: 'ApprovedFieldTickets'
        })
        .mockRejectedValueOnce(new Error('Consultant PDF failed'));

      await expect(pdfService.generateBothFieldTickets('approval-123'))
        .rejects.toThrow('Consultant PDF failed');
    });
  });
});