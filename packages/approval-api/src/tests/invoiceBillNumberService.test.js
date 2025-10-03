/**
 * Tests for InvoiceBillNumberService
 * Tests WF-26 Actions 4 & 5: Invoice and Bill Number Generation
 */

const InvoiceBillNumberService = require('../services/invoiceBillNumberService');

// Mock the HubspotService
jest.mock('../services/hubspotService', () => {
  return jest.fn().mockImplementation(() => ({
    getApprovalObject: jest.fn(),
    getTimesheets: jest.fn(),
    updateTimesheets: jest.fn()
  }));
});

describe('InvoiceBillNumberService', () => {
  let service;
  let mockHubspotService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock HubSpot service
    mockHubspotService = {
      getApprovalObject: jest.fn(),
      getTimesheets: jest.fn(),
      updateTimesheets: jest.fn()
    };

    // Create service instance with mocked HubSpot service
    service = new InvoiceBillNumberService(mockHubspotService);
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number successfully', async () => {
      // Mock HubSpot service calls
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: 'ts1,ts2,ts3',
          response_approval_from_date: '03/15/2024',
          response_approval_until_date: '03/20/2024',
          quote_customer_primary_contact_id: '67890'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue([
        { properties: { invoice_number_second_part: '0001' } },
        { properties: { invoice_number_second_part: '0001' } },
        { properties: { invoice_number_second_part: '0001' } }
      ]);

      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: [{ id: 'ts1' }, { id: 'ts2' }, { id: 'ts3' }]
      });

      // Call the method
      const result = await service.generateInvoiceNumber('12345');

      // Assertions
      expect(result.success).toBe(true);
      expect(result.numberType).toBe('invoice');
      expect(result.invoiceNumber).toBe('0001-67890-0315-0320');
      expect(result.timesheetCount).toBe(3);
      expect(result.timesheetIds).toEqual(['ts1', 'ts2', 'ts3']);

      // Verify HubSpot service calls
      expect(mockHubspotService.getApprovalObject).toHaveBeenCalledWith('12345');
      expect(mockHubspotService.getTimesheets).toHaveBeenCalledWith(['ts1', 'ts2', 'ts3']);
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledWith([
        { id: 'ts1', properties: { invoice_number: '0001-67890-0315-0320' } },
        { id: 'ts2', properties: { invoice_number: '0001-67890-0315-0320' } },
        { id: 'ts3', properties: { invoice_number: '0001-67890-0315-0320' } }
      ]);
    });

    it('should handle missing approval data', async () => {
      mockHubspotService.getApprovalObject.mockResolvedValue(null);

      await expect(service.generateInvoiceNumber('12345'))
        .rejects.toThrow('Approval not found: 12345');
    });

    it('should handle missing timesheet IDs', async () => {
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: null,
          response_approval_from_date: '03/15/2024',
          response_approval_until_date: '03/20/2024',
          quote_customer_primary_contact_id: '67890'
        }
      });

      await expect(service.generateInvoiceNumber('12345'))
        .rejects.toThrow('Missing response_approval_timesheet_ids_array in approval data');
    });

    it('should handle missing sequential counter', async () => {
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: 'ts1',
          response_approval_from_date: '03/15/2024',
          response_approval_until_date: '03/20/2024',
          quote_customer_primary_contact_id: '67890'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue([
        { properties: { invoice_number_second_part: null } }
      ]);

      await expect(service.generateInvoiceNumber('12345'))
        .rejects.toThrow('Missing invoice_number_second_part in timesheet data');
    });
  });

  describe('generateBillNumber', () => {
    it('should generate bill number successfully', async () => {
      // Mock approval data
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: 'ts1,ts2',
          response_approval_from_date: '04/08/2024',
          response_approval_until_date: '04/12/2024',
          quote_customer_primary_contact_id: '12345'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue([
        { properties: { invoice_number_second_part: '0668' } },
        { properties: { invoice_number_second_part: '0668' } }
      ]);

      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: [{ id: 'ts1' }, { id: 'ts2' }]
      });

      // Call the method
      const result = await service.generateBillNumber('12345');

      // Assertions
      expect(result.success).toBe(true);
      expect(result.numberType).toBe('bill');
      expect(result.billNumber).toBe('0668-12345-0408-0412');
      expect(result.timesheetCount).toBe(2);

      // Verify HubSpot service calls
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledWith([
        { id: 'ts1', properties: { bill_number: '0668-12345-0408-0412' } },
        { id: 'ts2', properties: { bill_number: '0668-12345-0408-0412' } }
      ]);
    });
  });

  describe('generateBothNumbers', () => {
    it('should generate both invoice and bill numbers', async () => {
      // Mock approval data
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: 'ts1',
          response_approval_from_date: '09/11/2024',
          response_approval_until_date: '09/22/2024',
          quote_customer_primary_contact_id: '99999'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue([
        { properties: { invoice_number_second_part: '0669' } }
      ]);

      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: [{ id: 'ts1' }]
      });

      // Call the method
      const result = await service.generateBothNumbers('12345');

      // Assertions
      expect(result.success).toBe(true);
      expect(result.results.invoice.success).toBe(true);
      expect(result.results.bill.success).toBe(true);
      expect(result.results.invoice.invoiceNumber).toBe('0669-99999-0911-0922');
      expect(result.results.bill.billNumber).toBe('0669-99999-0911-0922');

      // Should call updateTimesheets twice (once for invoice, once for bill)
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledTimes(2);
    });

    it('should generate only invoice number when bill generation is disabled', async () => {
      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: 'ts1',
          response_approval_from_date: '03/15/2024',
          response_approval_until_date: '03/20/2024',
          quote_customer_primary_contact_id: '67890'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue([
        { properties: { invoice_number_second_part: '0001' } }
      ]);

      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: [{ id: 'ts1' }]
      });

      const result = await service.generateBothNumbers('12345', { generateBill: false });

      expect(result.success).toBe(true);
      expect(result.results.invoice).toBeDefined();
      expect(result.results.bill).toBeUndefined();
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(service.formatDate('03/15/2024')).toBe('0315');
      expect(service.formatDate('04/08/2024')).toBe('0408');
      expect(service.formatDate('09/11/2024')).toBe('0911');
      expect(service.formatDate('12/31/2024')).toBe('1231');
    });

    it('should handle date with time component', () => {
      expect(service.formatDate('03/15/2024 08:00:00')).toBe('0315');
      expect(service.formatDate('04/08/2024 14:30:00')).toBe('0408');
    });

    it('should handle edge cases', () => {
      expect(service.formatDate('01/01/2024')).toBe('0101');
      expect(service.formatDate('12/31/2024')).toBe('1231');
    });

    it('should throw error for invalid date format', () => {
      expect(() => service.formatDate('2024-03-15')).toThrow('Invalid date format: expected MMDD, got 2024-03-15');
      expect(() => service.formatDate('3/15/2024')).toThrow('Invalid date format: expected MMDD, got 315');
      expect(() => service.formatDate('')).toThrow('Date string is required');
      expect(() => service.formatDate(null)).toThrow('Date string is required');
    });
  });

  describe('generateNumber', () => {
    it('should generate number with correct format', () => {
      const result = service.generateNumber('0001', '12345', '03/15/2024', '03/20/2024');
      expect(result).toBe('0001-12345-0315-0320');
    });

    it('should generate number with different sequential counters', () => {
      expect(service.generateNumber('0668', '67890', '04/08/2024', '04/12/2024'))
        .toBe('0668-67890-0408-0412');
      expect(service.generateNumber('0669', '99999', '09/11/2024', '09/22/2024'))
        .toBe('0669-99999-0911-0922');
    });

    it('should handle single digit months and days', () => {
      const result = service.generateNumber('0001', '12345', '01/01/2024', '01/05/2024');
      expect(result).toBe('0001-12345-0101-0105');
    });
  });

  describe('validateRequest', () => {
    it('should validate valid approval ID', () => {
      const result = service.validateRequest('12345');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing approval ID', () => {
      const result = service.validateRequest(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId is required');
    });

    it('should reject non-string approval ID', () => {
      const result = service.validateRequest(12345);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId must be a string');
    });

    it('should reject empty approval ID', () => {
      const result = service.validateRequest('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId cannot be empty');
    });

    it('should reject whitespace-only approval ID', () => {
      const result = service.validateRequest('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('approvalId cannot be empty');
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when HubSpot is connected', async () => {
      mockHubspotService.getApprovalObject.mockResolvedValue({});

      const result = await service.getHealthStatus();

      expect(result.service).toBe('invoice-bill-number-service');
      expect(result.status).toBe('healthy');
      expect(result.dependencies.hubspot).toBe('connected');
    });

    it('should return unhealthy status when HubSpot is not connected', async () => {
      mockHubspotService.getApprovalObject.mockRejectedValue(new Error('Connection failed'));

      const result = await service.getHealthStatus();

      expect(result.service).toBe('invoice-bill-number-service');
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('updateTimesheetsWithNumber', () => {
    it('should update timesheets successfully', async () => {
      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: [{ id: 'ts1' }, { id: 'ts2' }]
      });

      const result = await service.updateTimesheetsWithNumber(
        ['ts1', 'ts2'],
        'invoice_number',
        '0001-12345-0315-0320'
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledWith([
        { id: 'ts1', properties: { invoice_number: '0001-12345-0315-0320' } },
        { id: 'ts2', properties: { invoice_number: '0001-12345-0315-0320' } }
      ]);
    });

    it('should handle empty timesheet IDs array', async () => {
      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: []
      });

      const result = await service.updateTimesheetsWithNumber(
        [],
        'bill_number',
        '0001-12345-0315-0320'
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledWith([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world production data examples', async () => {
      // Test with actual production examples from the prompt
      const testCases = [
        {
          sequentialCounter: '0001',
          customerId: '0408',
          fromDate: '04/08/2024',
          untilDate: '04/12/2024',
          expected: '0001-0408-0408-0412'
        },
        {
          sequentialCounter: '0668',
          customerId: '0815',
          fromDate: '08/15/2024',
          untilDate: '09/21/2024',
          expected: '0668-0815-0815-0921'
        },
        {
          sequentialCounter: '0669',
          customerId: '0911',
          fromDate: '09/11/2024',
          untilDate: '09/22/2024',
          expected: '0669-0911-0911-0922'
        }
      ];

      testCases.forEach(testCase => {
        const result = service.generateNumber(
          testCase.sequentialCounter,
          testCase.customerId,
          testCase.fromDate,
          testCase.untilDate
        );
        expect(result).toBe(testCase.expected);
      });
    });

    it('should handle batch updates with many timesheets', async () => {
      const manyTimesheetIds = Array.from({ length: 50 }, (_, i) => `ts${i + 1}`);

      mockHubspotService.getApprovalObject.mockResolvedValue({
        properties: {
          response_approval_timesheet_ids_array: manyTimesheetIds.join(','),
          response_approval_from_date: '03/15/2024',
          response_approval_until_date: '03/20/2024',
          quote_customer_primary_contact_id: '67890'
        }
      });

      mockHubspotService.getTimesheets.mockResolvedValue(
        manyTimesheetIds.map(() => ({
          properties: { invoice_number_second_part: '0001' }
        }))
      );

      mockHubspotService.updateTimesheets.mockResolvedValue({
        results: manyTimesheetIds.map(id => ({ id }))
      });

      const result = await service.generateInvoiceNumber('12345');

      expect(result.success).toBe(true);
      expect(result.timesheetCount).toBe(50);
      expect(mockHubspotService.updateTimesheets).toHaveBeenCalledWith(
        manyTimesheetIds.map(id => ({
          id,
          properties: { invoice_number: '0001-67890-0315-0320' }
        }))
      );
    });
  });
});
