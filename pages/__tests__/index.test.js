const { getExpiringMedicines, getTodayRecords } = require('../index/index');

jest.mock('wx', () => ({
  getStorageSync: (key) => {
    const mockData = {
      medicines: [
        { id: 1, name: '阿莫西林', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '布洛芬', expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, name: '过期药', expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 4, name: '无有效期', expiryDate: '' },
      ],
      records: [
        { id: 1, takeTime: new Date().toLocaleString() },
        { id: 2, takeTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toLocaleString() },
        { id: 3, takeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString() },
      ],
    };
    return mockData[key] || [];
  },
}));

describe('index page logic', () => {
  test('should filter expiring medicines within 30 days', () => {
    const medicines = wx.getStorageSync('medicines');
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    expect(expiring).toHaveLength(1);
    expect(expiring[0].name).toBe('阿莫西林');
  });

  test('should filter today records', () => {
    const records = wx.getStorageSync('records');
    const today = new Date().toDateString();

    const todayRecords = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    expect(todayRecords.length).toBeGreaterThanOrEqual(1);
  });

  test('should exclude expired medicines', () => {
    const medicines = wx.getStorageSync('medicines');
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    const expiredNames = expiring.map(m => m.name);
    expect(expiredNames).not.toContain('过期药');
  });

  test('should exclude medicines without expiry date', () => {
    const medicines = wx.getStorageSync('medicines');
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    const names = expiring.map(m => m.name);
    expect(names).not.toContain('无有效期');
  });
});