const PdfIntegrationService = require('../../../src/services/pdfIntegrationService');

describe('PdfIntegrationService.prepareTimesheetData', () => {
  it('returns formatted quantities, units, and totals', () => {
    const service = new PdfIntegrationService();

    const timesheets = [
      {
        id: '123',
        createdAt: '2025-09-01T00:00:00Z',
        updatedAt: '2025-09-01T12:00:00Z',
        properties: {
          timesheet_job_service: 'Mileage',
          timesheet_billing_frequency: 'Per Mile',
          timesheet_quantity: '300',
          timesheet_hj_price: '1.5',
          timesheet_hj_total_price: '450',
          timesheet_consultant_full_name: 'Chris Example',
          timesheet_consultant_id: '456'
        }
      }
    ];

    const [result] = service.prepareTimesheetData(timesheets);

    expect(result.timesheetId).toBe('123');
    expect(result.serviceName).toBe('Mileage');
    expect(result.unit).toBe('mi');
    expect(result.unitDisplay).toBe('mi');
    expect(result.serviceLabel).toBe('Mileage (mi)');
    expect(result.quantity).toBe(300);
    expect(result.quantityFormatted).toBe('300');
    expect(result.totalAmount).toBe(450);
    expect(result.totalAmountFormatted).toBe('$450.00');
    expect(result.priceFormatted).toBe('$1.50');
    expect(result.raw.timesheet_job_service).toBe('Mileage');
  });
});
