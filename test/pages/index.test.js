describe('Index Page Logic', () => {
  let originalGetStorageSync;
  let storageData = {};

  beforeEach(() => {
    originalGetStorageSync = wx.getStorageSync;
    wx.getStorageSync = (key) => storageData[key] || [];
  });

  afterEach(() => {
    wx.getStorageSync = originalGetStorageSync;
    storageData = {};
  });

  test('获取即将过期药品（30天内）', () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    storageData['medicines'] = [
      { id: 1, name: '药A', expiryDate: thirtyDaysLater.toISOString().split('T')[0] },
      { id: 2, name: '药B', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 3, name: '药C', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 4, name: '药D', expiryDate: '' }
    ];

    const medicines = wx.getStorageSync('medicines');
    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    expect(expiring.length).toBe(2);
    expect(expiring[0].id).toBe(1);
    expect(expiring[1].id).toBe(2);
  });

  test('获取今日服药记录', () => {
    const today = new Date().toDateString();
    
    storageData['records'] = [
      { id: 1, medicineName: '药A', takeTime: new Date().toLocaleString() },
      { id: 2, medicineName: '药B', takeTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toLocaleString() },
      { id: 3, medicineName: '药C', takeTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString() }
    ];

    const records = wx.getStorageSync('records');
    const todayRecords = records.filter(r => new Date(r.takeTime).toDateString() === today);

    expect(todayRecords.length).toBe(2);
  });

  test('药品列表限制显示5个', () => {
    storageData['medicines'] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `药${i + 1}`,
      expiryDate: '2025-12-31'
    }));

    const medicines = wx.getStorageSync('medicines');
    const limited = medicines.slice(0, 5);

    expect(limited.length).toBe(5);
    expect(limited[0].id).toBe(1);
    expect(limited[4].id).toBe(5);
  });
});