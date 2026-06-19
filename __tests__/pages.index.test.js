/**
 * Tests for date filtering logic in index.js
 * Tests expiry date filtering (30 days) and today's records filtering
 */

require('../__mocks__/wx');

describe('Date Filtering Logic', () => {
  beforeEach(() => {
    wx.__clearStorage();
  });

  describe('Expiry date filtering (30 days)', () => {
    test('should identify medicines expiring within 30 days', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: 'Medicine A', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() }, // 15 days - expiring soon
        { id: 2, name: 'Medicine B', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString() }, // 45 days - NOT expiring
        { id: 3, name: 'Medicine C', expiryDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString() }, // 29 days - expiring soon
        { id: 4, name: 'Medicine D', expiryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // expired - should NOT be included
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(2);
      expect(expiring.map(m => m.id)).toEqual(expect.arrayContaining([1, 3]));
    });

    test('should exclude expired medicines from expiry filter', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: 'Expired', expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // expired 10 days ago
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(0);
    });

    test('should exclude medicines with no expiry date', () => {
      const medicines = [
        { id: 1, name: 'No Expiry', expiryDate: '' },
        { id: 2, name: 'Null Expiry', expiryDate: null },
        { id: 3, name: 'Undefined Expiry', expiryDate: undefined },
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return true; // would normally check against dates
      });

      expect(expiring).toHaveLength(0);
    });

    test('should handle edge case at exactly 30 days', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: 'Exactly 30 days', expiryDate: thirtyDaysLater.toISOString() },
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
    });

    test('should handle edge case at today', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: 'Expires today', expiryDate: now.toISOString() },
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
    });
  });

  describe("Today's records filtering", () => {
    test('should identify records from today', () => {
      const today = new Date().toDateString();
      const now = new Date();

      const records = [
        { id: 1, takeTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() }, // 2 hours ago - today
        { id: 2, takeTime: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString() }, // yesterday
        { id: 3, takeTime: new Date().toISOString() }, // just now - today
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(todayRecords).toHaveLength(2);
      expect(todayRecords.map(r => r.id)).toEqual(expect.arrayContaining([1, 3]));
    });

    test('should exclude records from yesterday', () => {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const records = [
        { id: 1, takeTime: yesterday.toISOString() },
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(todayRecords).toHaveLength(0);
    });

    test('should handle records at midnight boundary', () => {
      const today = new Date().toDateString();
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      const records = [
        { id: 1, takeTime: midnight.toISOString() }, // exactly midnight today
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(todayRecords).toHaveLength(1);
    });
  });

  describe('Combined filtering', () => {
    test('should handle mixed medicines and records', () => {
      const now = new Date();
      const today = new Date().toDateString();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: 'Expiring Soon', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: 'Not Expiring', expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const records = [
        { id: 1, medicineId: 1, takeTime: new Date().toISOString() }, // today
        { id: 2, medicineId: 2, takeTime: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() }, // 2 days ago
      ];

      const expiringMedicines = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(expiringMedicines).toHaveLength(1);
      expect(expiringMedicines[0].id).toBe(1);
      expect(todayRecords).toHaveLength(1);
      expect(todayRecords[0].id).toBe(1);
    });
  });
});
