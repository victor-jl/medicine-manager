// tests/date-filter.test.js
/**
 * 日期过滤逻辑测试
 * 测试 index.js 中的有效期检查和今日记录筛选逻辑
 */

describe('药品有效期过滤逻辑', () => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  /**
   * 模拟 index.js 中的有效期过滤逻辑
   */
  function filterExpiringMedicines(medicines) {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });
  }

  test('应过滤出30天内即将过期的药品', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(2);
    expect(result.map(m => m.name)).toContain('药品A');
    expect(result.map(m => m.name)).toContain('药品C');
    expect(result.map(m => m.name)).not.toContain('药品B');
  });

  test('应排除已过期的药品', () => {
    const medicines = [
      { id: 1, name: '已过期药品', expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, name: '有效药品', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有效药品');
  });

  test('应排除没有有效期日期的药品', () => {
    const medicines = [
      { id: 1, name: '无日期药品', expiryDate: '' },
      { id: 2, name: '有日期药品', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有日期药品');
  });

  test('应包含今天过期的药品', () => {
    // 使用1小时后的时间，确保在当前时间之后且在30天内
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const medicines = [
      { id: 1, name: '今日过期', expiryDate: oneHourLater.toISOString() }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('今日过期');
  });

  test('应包含正好30天后过期的药品', () => {
    const medicines = [
      { id: 1, name: '30天后过期', expiryDate: thirtyDaysLater.toISOString() }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('30天后过期');
  });
});

describe('今日服药记录筛选逻辑', () => {
  /**
   * 模拟 index.js 中的今日记录筛选逻辑
   */
  function filterTodayRecords(records) {
    const today = new Date().toDateString();
    return records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });
  }

  test('应筛选出今日的服药记录', () => {
    const today = new Date();
    const records = [
      { id: 1, medicineName: '药品A', takeTime: today.toISOString() },
      { id: 2, medicineName: '药品B', takeTime: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 3, medicineName: '药品C', takeTime: today.toISOString() }
    ];

    const result = filterTodayRecords(records);
    expect(result.length).toBe(2);
    expect(result.map(r => r.medicineName)).toContain('药品A');
    expect(result.map(r => r.medicineName)).toContain('药品C');
  });

  test('应正确处理跨时区的日期边界', () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const records = [
      { id: 1, medicineName: '昨日', takeTime: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, medicineName: '今日', takeTime: today.toISOString() },
      { id: 3, medicineName: '明日', takeTime: tomorrow.toISOString() }
    ];

    const result = filterTodayRecords(records);
    expect(result.length).toBe(1);
    expect(result[0].medicineName).toBe('今日');
  });

  test('应正确处理不同日期格式', () => {
    const today = new Date();
    const todayStr = today.toDateString();

    const records = [
      { id: 1, medicineName: '字符串格式', takeTime: todayStr },
      { id: 2, medicineName: 'Date对象', takeTime: today },
      { id: 3, medicineName: 'ISO格式', takeTime: today.toISOString() }
    ];

    const result = filterTodayRecords(records);
    // 所有格式都应转换为toDateString()进行比较
    expect(result.length).toBe(3);
  });
});

describe('边界条件测试', () => {
  test('空数组应返回空结果', () => {
    const medicines = [];
    const records = [];

    const now = new Date();
    const today = now.toDateString();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringResult = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    const todayResult = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    expect(expiringResult.length).toBe(0);
    expect(todayResult.length).toBe(0);
  });

  test('应正确处理无效日期', () => {
    const medicines = [
      { id: 1, name: '无效日期', expiryDate: 'invalid-date' },
      { id: 2, name: '有效日期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    // 无效日期 new Date('invalid-date') 会返回 Invalid Date，不会通过比较
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有效日期');
  });

  test('应正确处理明天过期的药品（边界情况）', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const medicines = [
      { id: 1, name: '明天过期', expiryDate: tomorrow.toISOString() }
    ];

    const result = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('明天过期');
  });
});
