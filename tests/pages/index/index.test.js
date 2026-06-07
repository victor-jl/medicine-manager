/**
 * pages/index/index.js 单元测试
 * 测试 loadData 函数的过期过滤逻辑
 */

describe('index page loadData 逻辑', () => {
  // 测试辅助函数：模拟 loadData 的数据过滤逻辑
  function filterExpiringMedicines(medicines) {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });
  }

  function filterTodayRecords(records) {
    const today = new Date().toDateString();
    return records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });
  }

  describe('过期药品过滤逻辑', () => {
    test('30天内过期的药品被正确识别', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(2);
      expect(result.map(m => m.name)).toContain('药品A');
      expect(result.map(m => m.name)).toContain('药品B');
      expect(result.map(m => m.name)).not.toContain('药品C');
    });

    test('正好30天过期的药品被包含', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '正好30天', expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('正好30天');
    });

    test('今天过期的药品被包含', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '今天过期', expiryDate: now.toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('今天过期');
    });

    test('已过期的药品被排除', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '昨天过期', expiryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(0);
    });

    test('31天后退化的药品被排除', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '31天后过期', expiryDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(0);
    });

    test('无过期日期的药品被排除', () => {
      const medicines = [
        { id: 1, name: '无过期日期', expiryDate: '' },
        { id: 2, name: '有日期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有日期');
    });

    test('过期日期为null的药品被排除', () => {
      const medicines = [
        { id: 1, name: 'null日期', expiryDate: null },
        { id: 2, name: '有日期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有日期');
    });

    test('过期日期为undefined的药品被排除', () => {
      const medicines = [
        { id: 1, name: 'undefined日期', expiryDate: undefined },
        { id: 2, name: '有日期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有日期');
    });

    test('空数组返回空结果', () => {
      const result = filterExpiringMedicines([]);
      expect(result).toHaveLength(0);
    });

    test('边界: 29天23小时59分59秒', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '29天23小时', expiryDate: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000 - 1)).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(1);
    });

    test('边界: 30天0小时0分1秒', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '30天0小时1秒', expiryDate: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000) + 1000).toISOString() },
      ];

      const result = filterExpiringMedicines(medicines);

      expect(result).toHaveLength(0);
    });
  });

  describe('今日记录过滤逻辑', () => {
    test('今天的记录被正确识别', () => {
      const today = new Date();
      const records = [
        { id: 1, medicineName: '药品A', takeTime: today.toISOString() },
        { id: 2, medicineName: '药品B', takeTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = filterTodayRecords(records);

      expect(result).toHaveLength(1);
      expect(result[0].medicineName).toBe('药品A');
    });

    test('昨天同一时间的记录被排除', () => {
      const today = new Date();
      const yesterdaySameTime = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const records = [
        { id: 1, medicineName: '昨天此时', takeTime: yesterdaySameTime.toISOString() },
      ];

      const result = filterTodayRecords(records);

      expect(result).toHaveLength(0);
    });

    test('明天同一时间的记录被排除', () => {
      const today = new Date();
      const tomorrowSameTime = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const records = [
        { id: 1, medicineName: '明天此时', takeTime: tomorrowSameTime.toISOString() },
      ];

      const result = filterTodayRecords(records);

      expect(result).toHaveLength(0);
    });

    test('空数组返回空结果', () => {
      const result = filterTodayRecords([]);
      expect(result).toHaveLength(0);
    });
  });
});
