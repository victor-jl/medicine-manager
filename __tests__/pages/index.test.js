describe('pages/index/index.js - 药品过期过滤逻辑', () => {
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  function filterExpiringMedicines(medicines) {
    const thirtyDaysLater = new Date(now.getTime() + thirtyDaysMs);
    return medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });
  }

  describe('过期药品筛选', () => {
    test('应在30天内过期的药品被筛选出来', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 15 * oneDayMs).toISOString() },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 25 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(2);
    });

    test('应在30天临界点边界内被筛选', () => {
      const medicines = [
        { id: 1, name: '正好30天', expiryDate: new Date(now.getTime() + thirtyDaysMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });

    test('应在31天后过期的药品不被筛选', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 31 * oneDayMs).toISOString() },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 60 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('已过期药品不应被筛选', () => {
      const medicines = [
        { id: 1, name: '昨天过期', expiryDate: new Date(now.getTime() - oneDayMs).toISOString() },
        { id: 2, name: '一周前过期', expiryDate: new Date(now.getTime() - 7 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('今天过期的药品应被筛选', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const medicines = [
        { id: 1, name: '今天过期', expiryDate: today.toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });
  });

  describe('边界条件处理', () => {
    test('无过期日期的药品应被排除', () => {
      const medicines = [
        { id: 1, name: '无日期', expiryDate: null },
        { id: 2, name: '有日期', expiryDate: new Date(now.getTime() + 10 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有日期');
    });

    test('空字符串过期日期应被排除', () => {
      const medicines = [
        { id: 1, name: '空日期', expiryDate: '' },
        { id: 2, name: '有日期', expiryDate: new Date(now.getTime() + 10 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });

    test('空数组应返回空结果', () => {
      const medicines = [];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('无效日期格式应被跳过', () => {
      const medicines = [
        { id: 1, name: '无效日期', expiryDate: 'invalid-date' },
        { id: 2, name: '有效日期', expiryDate: new Date(now.getTime() + 10 * oneDayMs).toISOString() }
      ];
      const result = filterExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });
  });

  describe('今日记录筛选', () => {
    function filterTodayRecords(records) {
      const today = new Date().toDateString();
      return records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
    }

    test('应筛选出今日记录', () => {
      const records = [
        { id: 1, medicineName: '药品A', takeTime: new Date().toISOString() },
        { id: 2, medicineName: '药品B', takeTime: new Date().toISOString() }
      ];
      const result = filterTodayRecords(records);
      expect(result).toHaveLength(2);
    });

    test('应排除昨日记录', () => {
      const yesterday = new Date(now.getTime() - oneDayMs);
      const records = [
        { id: 1, medicineName: '昨日记录', takeTime: yesterday.toISOString() }
      ];
      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('应排除明日记录', () => {
      const tomorrow = new Date(now.getTime() + oneDayMs);
      const records = [
        { id: 1, medicineName: '明日记录', takeTime: tomorrow.toISOString() }
      ];
      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('空数组应返回空结果', () => {
      const records = [];
      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('无效日期应被跳过', () => {
      const records = [
        { id: 1, medicineName: '无效日期', takeTime: 'invalid' },
        { id: 2, medicineName: '有效日期', takeTime: new Date().toISOString() }
      ];
      const result = filterTodayRecords(records);
      expect(result).toHaveLength(1);
    });
  });
});
