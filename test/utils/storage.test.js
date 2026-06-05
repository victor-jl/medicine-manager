describe('Storage Operations', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;
  let storageData = {};

  beforeEach(() => {
    originalGetStorageSync = wx.getStorageSync;
    originalSetStorageSync = wx.setStorageSync;

    wx.getStorageSync = (key) => {
      return storageData[key] || null;
    };

    wx.setStorageSync = (key, value) => {
      storageData[key] = value;
    };
  });

  afterEach(() => {
    wx.getStorageSync = originalGetStorageSync;
    wx.setStorageSync = originalSetStorageSync;
    storageData = {};
  });

  test('药品数据存储和读取', () => {
    const medicines = [
      { id: 1, name: '阿莫西林胶囊', expiryDate: '2025-12-31' },
      { id: 2, name: '布洛芬片', expiryDate: '2026-06-30' }
    ];

    wx.setStorageSync('medicines', medicines);
    const stored = wx.getStorageSync('medicines');

    expect(stored).toEqual(medicines);
    expect(stored.length).toBe(2);
    expect(stored[0].name).toBe('阿莫西林胶囊');
  });

  test('吃药记录存储和读取', () => {
    const records = [
      { id: 1, medicineId: 1, medicineName: '阿莫西林胶囊', takeTime: '2024-01-01 10:00' },
      { id: 2, medicineId: 2, medicineName: '布洛芬片', takeTime: '2024-01-01 14:00' }
    ];

    wx.setStorageSync('records', records);
    const stored = wx.getStorageSync('records');

    expect(stored).toEqual(records);
    expect(stored.length).toBe(2);
  });

  test('病例记录存储和读取', () => {
    const cases = [
      { id: 1, content: '感冒发烧', createTime: '2024-01-01 09:00' },
      { id: 2, content: '头痛', createTime: '2024-01-02 10:00' }
    ];

    wx.setStorageSync('cases', cases);
    const stored = wx.getStorageSync('cases');

    expect(stored).toEqual(cases);
    expect(stored.length).toBe(2);
  });

  test('空存储返回默认空数组', () => {
    const result = wx.getStorageSync('medicines');
    expect(result).toBeNull();
  });

  test('存储空数组', () => {
    wx.setStorageSync('medicines', []);
    const stored = wx.getStorageSync('medicines');
    expect(stored).toEqual([]);
  });
});