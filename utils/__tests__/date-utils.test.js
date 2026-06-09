const { isExpiringWithinDays, isExpired, formatExpiryDate } = require('../date-utils');

describe('date-utils', () => {
  describe('isExpiringWithinDays', () => {
    it('should return false for null medicine', () => {
      expect(isExpiringWithinDays(null, 30)).toBe(false);
    });

    it('should return false for medicine without expiryDate', () => {
      expect(isExpiringWithinDays({ name: 'Medicine' }, 30)).toBe(false);
    });

    it('should return false for invalid date format', () => {
      expect(isExpiringWithinDays({ expiryDate: 'invalid-date' }, 30)).toBe(false);
    });

    it('should return true for medicine expiring within 30 days', () => {
      const thirtyDaysLater = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
      const expiryDate = thirtyDaysLater.toISOString().split('T')[0];
      expect(isExpiringWithinDays({ expiryDate }, 30)).toBe(true);
    });

    it('should return false for medicine expiring after 30 days', () => {
      const fortyDaysLater = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
      const expiryDate = fortyDaysLater.toISOString().split('T')[0];
      expect(isExpiringWithinDays({ expiryDate }, 30)).toBe(false);
    });

    it('should return false for already expired medicine', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiryDate = yesterday.toISOString().split('T')[0];
      expect(isExpiringWithinDays({ expiryDate }, 30)).toBe(false);
    });

    it('should handle edge case of exactly 30 days later', () => {
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const expiryDate = thirtyDaysLater.toISOString().split('T')[0];
      expect(isExpiringWithinDays({ expiryDate }, 30)).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return false for null medicine', () => {
      expect(isExpired(null)).toBe(false);
    });

    it('should return false for medicine without expiryDate', () => {
      expect(isExpired({ name: 'Medicine' })).toBe(false);
    });

    it('should return false for invalid date format', () => {
      expect(isExpired({ expiryDate: 'invalid-date' })).toBe(false);
    });

    it('should return true for already expired medicine', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiryDate = yesterday.toISOString().split('T')[0];
      expect(isExpired({ expiryDate })).toBe(true);
    });

    it('should return false for not yet expired medicine', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiryDate = tomorrow.toISOString().split('T')[0];
      expect(isExpired({ expiryDate })).toBe(false);
    });

    it('should return true for medicine expiring today', () => {
      const today = new Date();
      const expiryDate = today.toISOString().split('T')[0];
      expect(isExpired({ expiryDate })).toBe(true);
    });
  });

  describe('formatExpiryDate', () => {
    it('should return empty string for empty input', () => {
      expect(formatExpiryDate('')).toBe('');
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
    });

    it('should return original string for invalid date', () => {
      expect(formatExpiryDate('invalid-date')).toBe('invalid-date');
    });

    it('should format valid date correctly', () => {
      const date = new Date(2025, 11, 31);
      expect(formatExpiryDate(date)).toBe('2025-12-31');
    });

    it('should format ISO date string correctly', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    it('should handle single digit months and days', () => {
      const date = new Date(2025, 0, 5);
      expect(formatExpiryDate(date)).toBe('2025-01-05');
    });
  });
});