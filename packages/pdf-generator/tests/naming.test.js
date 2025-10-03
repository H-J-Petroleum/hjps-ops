const { buildFileNameForType } = require('../src/utils/naming');

describe('naming helpers', () => {
  test('customer filename includes consultant and request id', () => {
    const name = buildFileNameForType('customer', { requestId: 'AR-123', consultantName: 'Jane Doe' });
    expect(name).toMatch(/^Approved-Field-Ticket-/);
    expect(name).toMatch(/Jane-Doe/);
    expect(name).toMatch(/AR-123/);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  test('consultant filename includes request id', () => {
    const name = buildFileNameForType('consultant', { requestId: 'REQ-999' });
    expect(name).toBe('Approved-Timesheet-REQ-999.pdf');
  });
});

