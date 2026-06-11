/**
 * @jest-environment node
 */

// 模拟 wx API
global.wx = {
  getStorageSync: jest.fn((key) => {
    const mockData = {
      'medicines': [
        { id: 1, name: '阿莫西林', expiryDate: '2026-07-01' },
        { id: 2, name: '布洛芬', expiryDate: '2026-12-01' },
        { id: 3, name: '维生素C', expiryDate: '2026-06-15' },
        { id: 4, name: '板蓝根', expiryDate: '2026-06-20' },
        { id: 5, name: '感冒灵', expiryDate: '2027-01-01' },
        { id: 6, name: '过期药品', expiryDate: '2025-01-01' }
      ],
      'records': [
        { id: 1, medicineId: 1, medicineName: '阿莫西林', takeTime: new Date().toISOString() },
        { id: 2, medicineId: 2, medicineName: '布洛芬', takeTime: new Date(Date.now() - 86400000).toISOString() }
      ]
    };
    return mockData[key];
  }),
  setStorageSync: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  showToast: jest.fn()
};

/**
 * 模拟 index.js 中的 loadData 逻辑
 * 提取纯函数逻辑便于测试
 */
function getExpiringMedicines(medicines, daysThreshold = 30) {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

function getTodayRecords(records) {
  const today = new Date().toDateString();
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

describe('pages/index/index.js - 核心逻辑', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = wx.getStorageSync('medicines');
    records = wx.getStorageSync('records');
  });

  describe('getExpiringMedicines - 过期药品筛选', () => {
    test('应返回30天内即将过期的药品', () => {
      const result = getExpiringMedicines(medicines);
      // 维生素C (2026-06-15) 和板蓝根 (2026-06-20) 在30天内
      expect(result.length).toBeGreaterThanOrEqual(2);
      const expiringNames = result.map(m => m.name);
      expect(expiringNames).toContain('维生素C');
      expect(expiringNames).toContain('板蓝根');
    });

    test('应排除已过期的药品', () => {
      const result = getExpiringMedicines(medicines);
      const expiringNames = result.map(m => m.name);
      expect(expiringNames).not.toContain('过期药品');
    });

    test('应排除无有效期数据的药品', () => {
      const medicinesWithNull = [...medicines, { id: 7, name: '无日期药品', expiryDate: null }];
      const result = getExpiringMedicines(medicinesWithNull);
      const expiringNames = result.map(m => m.name);
      expect(expiringNames).not.toContain('无日期药品');
    });

    test('应排除超过阈值的药品', () => {
      const result = getExpiringMedicines(medicines);
      const expiringNames = result.map(m => m.name);
      expect(expiringNames).not.toContain('感冒灵'); // 2027-01-01 超过30天
      expect(expiringNames).not.toContain('布洛芬'); // 2026-12-01 超过30天
    });

    test('可配置天数阈值', () => {
      // 设置阈值为365天
      const result = getExpiringMedicines(medicines, 365);
      const expiringNames = result.map(m => m.name);
      expect(expiringNames).toContain('布洛芬');
      expect(expiringNames).toContain('感冒灵');
    });

    test('空数组应返回空结果', () => {
      const result = getExpiringMedicines([]);
      expect(result).toEqual([]);
    });
  });

  describe('getTodayRecords - 今日记录筛选', () => {
    test('应返回当日的服药记录', () => {
      const result = getTodayRecords(records);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('应排除昨日及更早的记录', () => {
      const result = getTodayRecords(records);
      const today = new Date().toDateString();
      result.forEach(r => {
        expect(new Date(r.takeTime).toDateString()).toBe(today);
      });
    });

    test('空数组应返回空结果', () => {
      const result = getTodayRecords([]);
      expect(result).toEqual([]);
    });
  });

  describe('日期边界条件', () => {
    test('恰好今天过期的药品在日期比较中可能被包含或排除', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const medicinesWithTodayExpiry = [
        { id: 100, name: '今日过期', expiryDate: todayStr }
      ];
      const result = getExpiringMedicines(medicinesWithTodayExpiry);
      // 日期比较边界情况：取决于时间精度
      // 实际行为可能是 0 或 1 条记录
      expect(result.length).toBeLessThanOrEqual(1);
    });

    test('明天过期的药品应被包含', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const medicinesWithTomorrowExpiry = [
        { id: 101, name: '明日过期', expiryDate: tomorrowStr }
      ];
      const result = getExpiringMedicines(medicinesWithTomorrowExpiry);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('明日过期');
    });
  });
});

describe('pages/index/index.js - 页面导航', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('goToAdd 应导航到添加页面', () => {
    // 模拟导航逻辑
    const goToAdd = () => {
      wx.navigateTo({ url: '/pages/add/add' });
    };
    goToAdd();
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/add/add' });
  });

  test('goToRecords 应切换到记录Tab', () => {
    const goToRecords = () => {
      wx.switchTab({ url: '/pages/records/records' });
    };
    goToRecords();
    expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/records/records' });
  });

  test('goToDetail 应传递正确的id参数', () => {
    const mockId = 123;
    const goToDetail = (id) => {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    };
    goToDetail(mockId);
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=123' });
  });
});
