describe('首页逻辑', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;

  beforeEach(() => {
    originalGetStorageSync = wx.getStorageSync;
    originalSetStorageSync = wx.setStorageSync;
  });

  afterEach(() => {
    wx.getStorageSync = originalGetStorageSync;
    wx.setStorageSync = originalSetStorageSync;
  });

  describe('过期药品筛选逻辑', () => {
    test('筛选30天内过期的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '药品A', expiryDate: thirtyDaysLater.toISOString().split('T')[0] },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 4, name: '药品D', expiryDate: null }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(2);
      expect(expiring.map(m => m.name)).toEqual(['药品A', '药品B']);
    });

    test('排除已过期的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '已过期', expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 2, name: '即将过期', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('即将过期');
    });

    test('处理无效日期格式', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '无效日期', expiryDate: '2024/13/01' },
        { id: 2, name: '有效日期', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return !isNaN(expiry.getTime()) && expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('有效日期');
    });
  });

  describe('今日记录筛选', () => {
    test('筛选指定日期的服药记录', () => {
      const targetDate = new Date('2024-01-15');
      const targetDateStr = targetDate.toDateString();
      
      const records = [
        { id: 1, medicineName: '药品A', takeTime: '2024-01-15T10:00:00Z' },
        { id: 2, medicineName: '药品B', takeTime: '2024-01-15T20:00:00Z' },
        { id: 3, medicineName: '药品C', takeTime: '2024-01-14T10:00:00Z' }
      ];

      const filteredRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === targetDateStr;
      });

      expect(filteredRecords).toHaveLength(2);
      expect(filteredRecords.map(r => r.medicineName)).toEqual(['药品A', '药品B']);
    });

    test('排除非目标日期的记录', () => {
      const targetDate = new Date('2024-01-15');
      const targetDateStr = targetDate.toDateString();
      
      const records = [
        { id: 1, medicineName: '今日药品', takeTime: '2024-01-15T10:00:00Z' },
        { id: 2, medicineName: '昨日药品', takeTime: '2024-01-14T10:00:00Z' },
        { id: 3, medicineName: '明日药品', takeTime: '2024-01-16T10:00:00Z' }
      ];

      const filteredRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === targetDateStr;
      });

      expect(filteredRecords).toHaveLength(1);
      expect(filteredRecords[0].medicineName).toBe('今日药品');
    });
  });
});