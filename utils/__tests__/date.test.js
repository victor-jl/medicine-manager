const { getExpiringMedicines, isExpired, formatExpiryDate } = require('../date');

describe('date utilities', () => {
  describe('getExpiringMedicines', () => {
    it('should return empty array for null or undefined input', () => {
      expect(getExpiringMedicines(null)).toEqual([]);
      expect(getExpiringMedicines(undefined)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(getExpiringMedicines('not an array')).toEqual([]);
      expect(getExpiringMedicines({})).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(getExpiringMedicines([])).toEqual([]);
    });

    it('should filter medicines expiring within 30 days', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      const expired = new Date(now.getTime() - 1000);

      const medicines = [
        { id: 1, name: '药A', expiryDate: in15Days.toISOString().split('T')[0] },
        { id: 2, name: '药B', expiryDate: in45Days.toISOString().split('T')[0] },
        { id: 3, name: '药C', expiryDate: expired.toISOString().split('T')[0] },
        { id: 4, name: '药D' }
      ];

      const result = getExpiringMedicines(medicines);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle custom days parameter', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药A', expiryDate: in15Days.toISOString().split('T')[0] },
        { id: 2, name: '药B', expiryDate: in45Days.toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines, 50);
      expect(result.length).toBe(2);
    });

    it('should exclude medicines without expiryDate', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药A', expiryDate: in15Days.toISOString().split('T')[0] },
        { id: 2, name: '药B' },
        { id: 3, name: '药C', expiryDate: null }
      ];

      const result = getExpiringMedicines(medicines);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle invalid date formats gracefully', () => {
      const medicines = [
        { id: 1, name: '药A', expiryDate: 'invalid-date' },
        { id: 2, name: '药B', expiryDate: '2025-12-31' }
      ];

      const result = getExpiringMedicines(medicines);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isExpired', () => {
    it('should return false for null or undefined', () => {
      expect(isExpired(null)).toBe(false);
      expect(isExpired(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isExpired('')).toBe(false);
    });

    it('should return true for expired date', () => {
      expect(isExpired('2020-01-01')).toBe(true);
    });

    it('should return false for future date', () => {
      const future = new Date(Date.now() + 1000);
      expect(isExpired(future.toISOString().split('T')[0])).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isExpired(today.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('formatExpiryDate', () => {
    it('should return empty string for null or undefined', () => {
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
    });

    it('should return original date string for valid input', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });
  });
});