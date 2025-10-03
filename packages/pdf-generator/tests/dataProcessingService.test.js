const DataProcessingService = require('../src/services/dataProcessingService');

describe('DataProcessingService aggregation', () => {
  let service;
  let sampleTimesheets;

  beforeEach(() => {
    service = new DataProcessingService();
    sampleTimesheets = [
      {
        timesheet_job_service: 'Per Diem',
        timesheet_billing_frequency: 'Day',
        timesheet_quantity: '10',
        timesheet_hj_price: '75',
        timesheet_hj_total_price: '750',
        timesheet_price: '75',
        timesheet_total_price: '750',
        timesheet_start_date: '2025-09-01',
        timesheet_end_date: '2025-09-01',
        timesheet_start_time: '08:00',
        timesheet_end_time: '18:00',
        timesheet_payment_deal_id: 'AFE-123',
        timesheet_well: 'Well A',
        timesheet_ordinal_number: '1'
      },
      {
        timesheet_job_service: 'Per Diem',
        timesheet_billing_frequency: 'Day',
        timesheet_quantity: '2',
        timesheet_hj_price: '75',
        timesheet_hj_total_price: '150',
        timesheet_price: '75',
        timesheet_total_price: '150',
        timesheet_start_date: '2025-09-02',
        timesheet_end_date: '2025-09-02',
        timesheet_start_time: '08:00',
        timesheet_end_time: '18:00',
        timesheet_payment_deal_id: 'AFE-123',
        timesheet_well: 'Well A',
        timesheet_ordinal_number: '2'
      },
      {
        timesheet_job_service: 'Mileage',
        timesheet_billing_frequency: 'Per Mile',
        timesheet_quantity: '300',
        timesheet_hj_price: '1.50',
        timesheet_hj_total_price: '450',
        timesheet_price: '1.50',
        timesheet_total_price: '450',
        timesheet_start_date: '2025-09-03',
        timesheet_end_date: '2025-09-03',
        timesheet_start_time: '07:00',
        timesheet_end_time: '19:00',
        timesheet_payment_deal_id: 'AFE-123',
        timesheet_well: 'Well A',
        timesheet_ordinal_number: '3'
      },
      {
        timesheet_job_service: 'Solids Control Rig Audit',
        timesheet_billing_frequency: 'Fee/One Time',
        timesheet_quantity: '1',
        timesheet_hj_price: '500',
        timesheet_hj_total_price: '500',
        timesheet_price: '500',
        timesheet_total_price: '500',
        timesheet_start_date: '2025-09-04',
        timesheet_end_date: '2025-09-04',
        timesheet_start_time: '09:00',
        timesheet_end_time: '12:00',
        timesheet_payment_deal_id: 'AFE-900',
        timesheet_well: 'Well B',
        timesheet_ordinal_number: '4'
      }
    ];
  });

  it('aggregates service totals with normalized units and formatted values', () => {
    const totals = service.calculateServiceTotals(sampleTimesheets);

    const perDiem = totals.find((row) => row.serviceName === 'Per Diem');
    expect(perDiem).toBeDefined();
    expect(perDiem.unit).toBe('days');
    expect(perDiem.service).toBe('Per Diem (days)');
    expect(perDiem.quantity).toBeCloseTo(12);
    expect(perDiem.quantityDisplay).toBe('12');
    expect(perDiem.amountDisplay).toBe('$900.00');

    const audit = totals.find((row) => row.serviceName === 'Solids Control Rig Audit');
    expect(audit.unit).toBe('one-time fee');
    expect(audit.service).toBe('Solids Control Rig Audit (one-time fee)');
    expect(audit.quantityDisplay).toBe('1');
    expect(audit.amountDisplay).toBe('$500.00');
  });

  it('builds well breakdown entries with quantity and amount formatting', () => {
    const breakdown = service.calculateWellBreakdown(sampleTimesheets);

    const mileage = breakdown.find((row) => row.serviceName === 'Mileage');
    expect(mileage).toBeDefined();
    expect(mileage.unit).toBe('mi');
    expect(mileage.quantityDisplay).toBe('300');
    expect(mileage.amountDisplay).toBe('$450.00');

    const audit = breakdown.find((row) => row.serviceName === 'Solids Control Rig Audit');
    expect(audit.unit).toBe('one-time fee');
    expect(audit.quantityDisplay).toBe('1');
  });

  it('formats detailed line items with display units and quantities', () => {
    const tableData = service.prepareTimesheetTableData(sampleTimesheets);
    expect(tableData).toHaveLength(sampleTimesheets.length);

    const mileageRow = tableData.find((row) => row.job === 'Mileage');
    expect(mileageRow.unit).toBe('mi');
    expect(mileageRow.qty).toBe('300');
    expect(mileageRow.total).toBe('$450.00');

    const auditRow = tableData.find((row) => row.job === 'Solids Control Rig Audit');
    expect(auditRow.unit).toBe('one-time fee');
    expect(auditRow.qty).toBe('1');
    expect(auditRow.total).toBe('$500.00');
  });
});
