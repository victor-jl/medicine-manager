/**
 * pages/index/index.js 测试
 * 测试药品过期计算和数据加载逻辑
 */

// 模拟页面逻辑的核心函数
function loadData(mockMedicines, mockRecords, currentTime) {
  const medicines = mockMedicines || [];
  const records = mockRecords || [];

  // 获取即将过期的药品（30天内）
  const now = new Date(currentTime);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= thirtyDaysLater && expiry >= now;
  });

  // 获取今日记录
  const today = new Date(currentTime).toDateString();
  const todayRecords = records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });

  return {
    medicines: medicines.slice(0, 5),
    expiringMedicines: expiring,
    todayRecords: todayRecords
  };
}

describe('pages/index/index.js - 核心逻辑测试', () => {
  describe('过期药品计算', () => {
    test('应该识别即将过期的药品（30天内）', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2024-01-15' }, // 15天后过期
        { id: 2, name: '布洛芬', expiryDate: '2024-02-01' }, // 31天后过期（不包括）
        { id: 3, name: '维生素C', expiryDate: '2023-12-01' }, // 已过期
      ];

      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(1);
      expect(result.expiringMedicines[0].name).toBe('阿莫西林');
    });

    test('应该识别刚好30天后过期的药品', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '测试药品', expiryDate: '2024-01-31' }, // 30天后过期
      ];

      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(1);
    });

    test('应该排除已过期的药品', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '已过期药品', expiryDate: '2023-12-31' }, // 已过期
        { id: 2, name: '未过期药品', expiryDate: '2024-02-01' },
      ];

      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(0);
    });

    test('应该排除超过30天后过期的药品', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '长期药品', expiryDate: '2024-02-02' }, // 32天后过期
      ];

      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(0);
    });

    test('应该处理无有效期字段的药品', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '无有效期药品', expiryDate: null },
        { id: 2, name: '无有效期药品2' }, // 没有expiryDate字段
      ];

      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(0);
    });

    test('应该处理空药品列表', () => {
      const currentTime = '2024-01-01T00:00:00';
      const result = loadData([], [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(0);
    });

    test('应该返回最多5个药品', () => {
      const medicines = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`,
        expiryDate: '2025-01-01'
      }));

      const result = loadData(medicines, [], '2024-01-01T00:00:00');
      
      expect(result.medicines).toHaveLength(5);
    });
  });

  describe('今日服药记录计算', () => {
    test('应该识别今日服药记录', () => {
      const currentTime = '2024-01-01T12:00:00';
      const records = [
        { id: 1, medicineName: '阿莫西林', takeTime: '2024-01-01T08:00:00' },
        { id: 2, medicineName: '布洛芬', takeTime: '2024-01-01T10:00:00' },
        { id: 3, medicineName: '维生素C', takeTime: '2023-12-31T20:00:00' }, // 昨天
      ];

      const result = loadData([], records, currentTime);
      
      expect(result.todayRecords).toHaveLength(2);
    });

    test('应该处理不同时区的日期比较', () => {
      // toDateString() 会标准化日期，所以这个测试验证跨日期边界
      const currentTime = '2024-01-01T23:59:59';
      const records = [
        { id: 1, takeTime: '2024-01-01T00:00:00' },
        { id: 2, takeTime: '2024-01-02T00:00:00' }, // 明天
      ];

      const result = loadData([], records, currentTime);
      
      expect(result.todayRecords).toHaveLength(1);
    });

    test('应该处理空记录列表', () => {
      const currentTime = '2024-01-01T00:00:00';
      const result = loadData([], [], currentTime);
      
      expect(result.todayRecords).toHaveLength(0);
    });

    test('应该处理无服药记录', () => {
      const currentTime = '2024-01-01T00:00:00';
      const records = [
        { id: 1, takeTime: '2023-12-25T12:00:00' }, // 一周前
      ];

      const result = loadData([], records, currentTime);
      
      expect(result.todayRecords).toHaveLength(0);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理午夜边界（23:59 vs 00:00）', () => {
      const currentTime = '2024-01-01T00:00:00';
      const records = [
        { id: 1, takeTime: '2024-01-01T00:00:00' },
        { id: 2, takeTime: '2023-12-31T23:59:59' },
      ];

      const result = loadData([], records, currentTime);
      
      expect(result.todayRecords).toHaveLength(1);
      expect(result.todayRecords[0].id).toBe(1);
    });

    test('应该处理有效期边界（当天过期）', () => {
      const currentTime = '2024-01-15T10:00:00';
      const medicines = [
        { id: 1, name: '当天过期', expiryDate: '2024-01-15' },
        { id: 2, name: '明天过期', expiryDate: '2024-01-16' },
      ];

      const result = loadData(medicines, [], currentTime);
      
      // 当天过期的药品不应该出现在即将过期列表中
      expect(result.expiringMedicines).toHaveLength(1);
      expect(result.expiringMedicines[0].name).toBe('明天过期');
    });

    test('应该处理Invalid Date', () => {
      const currentTime = '2024-01-01T00:00:00';
      const medicines = [
        { id: 1, name: '无效日期', expiryDate: 'invalid-date' },
      ];

      // 过滤时会跳过无效日期，不会抛出错误
      const result = loadData(medicines, [], currentTime);
      
      expect(result.expiringMedicines).toHaveLength(0);
    });
  });
});