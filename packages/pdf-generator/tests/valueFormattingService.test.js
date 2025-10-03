const ValueFormattingService = require('../src/services/valueFormattingService');

describe('ValueFormattingService', () => {
  let service;

  beforeEach(() => {
    service = new ValueFormattingService();
  });

  describe('formatCurrency', () => {
    it('formats positive numbers with two decimals', () => {
      expect(service.formatCurrency(1234)).toBe('$1,234.00');
      expect(service.formatCurrency(12.345)).toBe('$12.35');
    });

    it('handles string inputs and invalid values', () => {
      expect(service.formatCurrency('98.4')).toBe('$98.40');
      expect(service.formatCurrency('abc')).toBe('$0.00');
    });
  });

  describe('formatQuantity', () => {
    it('trims trailing decimals for whole numbers', () => {
      expect(service.formatQuantity(3000)).toBe('3,000');
      expect(service.formatQuantity('42')).toBe('42');
    });

    it('keeps two decimals for fractional quantities', () => {
      expect(service.formatQuantity(7.2)).toBe('7.20');
      expect(service.formatQuantity('0.157')).toBe('0.16');
    });
  });

  describe('deriveUnit', () => {
    it('pulls units from billing frequency', () => {
      const result = service.deriveUnit({ timesheet_billing_frequency: 'Per Mile' });
      expect(result).toBe('mi');
    });

    it('falls back to job service heuristics', () => {
      const result = service.deriveUnit({ timesheet_job_service: 'Per Diem (24 Hr Service)' });
      expect(result).toBe('days');
    });

    it('normalizes one-time fee phrasing', () => {
      const record = { timesheet_billing_frequency: 'Fee/One Time' };
      const result = service.deriveUnit(record);
      expect(result).toBe('one-time fee');
    });
  });

  describe('labelWithUnit', () => {
    it('appends display unit when not already present', () => {
      expect(service.labelWithUnit('Mileage', 'mi')).toBe('Mileage (mi)');
    });

    it('returns original label when unit missing', () => {
      expect(service.labelWithUnit('Per Diem', null)).toBe('Per Diem');
    });

    it('avoids duplicate suffixes', () => {
      expect(service.labelWithUnit('Per Diem (days)', 'days')).toBe('Per Diem (days)');
    });
  });
});
