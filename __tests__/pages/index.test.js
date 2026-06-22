function isExpiringSoon(medicine, now = new Date()) {
  if (!medicine.expiryDate) return false;
  const expiry = new Date(medicine.expiryDate);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  return expiry <= thirtyDaysLater && expiry >= startOfDay;
}

function getTodayRecords(records, today = new Date()) {
  const todayStr = today.toDateString();
  return records.filter(r => new Date(r.takeTime).toDateString() === todayStr);
}

describe('index page logic', () => {
  describe('isExpiringSoon', () => {
    it('should return false when expiryDate is empty', () => {
      const medicine = { name: 'Test', expiryDate: '' };
      expect(isExpiringSoon(medicine)).toBe(false);
    });

    it('should return false when expiryDate is null', () => {
      const medicine = { name: 'Test', expiryDate: null };
      expect(isExpiringSoon(medicine)).toBe(false);
    });

    it('should return true when medicine expires within 30 days', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const medicine = { name: 'Test', expiryDate: expiryDate.toISOString().split('T')[0] };
      expect(isExpiringSoon(medicine, now)).toBe(true);
    });

    it('should return true when medicine expires exactly 30 days later', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const medicine = { name: 'Test', expiryDate: expiryDate.toISOString().split('T')[0] };
      expect(isExpiringSoon(medicine, now)).toBe(true);
    });

    it('should return false when medicine expires more than 30 days later', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
      const medicine = { name: 'Test', expiryDate: expiryDate.toISOString().split('T')[0] };
      expect(isExpiringSoon(medicine, now)).toBe(false);
    });

    it('should return false when medicine has already expired', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const medicine = { name: 'Test', expiryDate: expiryDate.toISOString().split('T')[0] };
      expect(isExpiringSoon(medicine, now)).toBe(false);
    });

    it('should return true when medicine expires today', () => {
      const now = new Date();
      const medicine = { name: 'Test', expiryDate: now.toISOString().split('T')[0] };
      expect(isExpiringSoon(medicine, now)).toBe(true);
    });

    it('should correctly filter expiring medicines from list', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: 'Medicine A', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 2, name: 'Medicine B', expiryDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 3, name: 'Medicine C', expiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 4, name: 'Medicine D', expiryDate: '' }
      ];

      const expiring = medicines.filter(m => isExpiringSoon(m, now));
      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('Medicine A');
    });
  });

  describe('getTodayRecords', () => {
    it('should return empty array when no records', () => {
      expect(getTodayRecords([])).toEqual([]);
    });

    it('should return only today\'s records', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const records = [
        { id: 1, takeTime: today.toLocaleString() },
        { id: 2, takeTime: yesterday.toLocaleString() },
        { id: 3, takeTime: tomorrow.toLocaleString() }
      ];

      const todayRecords = getTodayRecords(records, today);
      expect(todayRecords.length).toBe(1);
      expect(todayRecords[0].id).toBe(1);
    });

    it('should handle records with same date but different times', () => {
      const today = new Date();
      const records = [
        { id: 1, takeTime: '2024/1/15 08:00:00' },
        { id: 2, takeTime: '2024/1/15 12:00:00' },
        { id: 3, takeTime: '2024/1/14 08:00:00' }
      ];

      const testDate = new Date('2024-01-15');
      const todayRecords = getTodayRecords(records, testDate);
      expect(todayRecords.length).toBe(2);
    });
  });
});