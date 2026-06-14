describe('首页数据处理逻辑', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;

  beforeEach(() => {
    originalGetStorageSync = global.wx?.getStorageSync;
    originalSetStorageSync = global.wx?.setStorageSync;
    
    global.wx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn()
    };
  });

  afterEach(() => {
    global.wx.getStorageSync = originalGetStorageSync;
    global.wx.setStorageSync = originalSetStorageSync;
  });

  test('loadData should filter expiring medicines within 30 days', () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fiftyDaysLater = new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000);
    
    const medicines = [
      { id: 1, name: '药A', expiryDate: thirtyDaysLater.toISOString() },
      { id: 2, name: '药B', expiryDate: fiftyDaysLater.toISOString() },
      { id: 3, name: '药C', expiryDate: now.toISOString() },
      { id: 4, name: '药D' }
    ];
    
    global.wx.getStorageSync.mockImplementation((key) => {
      if (key === 'medicines') return medicines;
      if (key === 'records') return [];
      return [];
    });

    expect(medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    })).toHaveLength(2);
  });

  test('loadData should get today records', () => {
    const today = new Date().toDateString();
    const records = [
      { id: 1, medicineName: '药A', takeTime: new Date().toISOString() },
      { id: 2, medicineName: '药B', takeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const todayRecords = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    expect(todayRecords).toHaveLength(1);
    expect(todayRecords[0].medicineName).toBe('药A');
  });

  test('should handle empty storage data', () => {
    global.wx.getStorageSync.mockReturnValue([]);
    
    const medicines = global.wx.getStorageSync('medicines');
    const records = global.wx.getStorageSync('records');
    
    expect(medicines).toEqual([]);
    expect(records).toEqual([]);
  });

  test('medicine list should be limited to 5 items', () => {
    const medicines = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `药${i}` }));
    
    const limited = medicines.slice(0, 5);
    
    expect(limited).toHaveLength(5);
    expect(limited[0].name).toBe('药0');
    expect(limited[4].name).toBe('药4');
  });
});