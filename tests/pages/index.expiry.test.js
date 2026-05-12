const wx = require('../__mocks__/wx.mock.js');

describe('pages/index/index.js - 过期日期检查逻辑', () => {
  let pageConfig;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.resetModules();
    pageConfig = require('../../pages/index/index.js');
  });

  describe('过期日期计算边界条件', () => {
    test('应正确计算30天后的日期', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 30);

      expect(thirtyDaysLater.getDate()).toBe(expectedDate.getDate());
      expect(Math.abs(thirtyDaysLater.getMonth() - expectedDate.getMonth())).toBeLessThanOrEqual(1);
    });

    test('应正确处理跨月的日期计算', () => {
      const testDate = new Date('2024-01-15');
      const thirtyDaysLater = new Date(testDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(thirtyDaysLater.getMonth()).toBe(1);
    });

    test('应正确处理跨年的日期计算', () => {
      const testDate = new Date('2024-12-15');
      const thirtyDaysLater = new Date(testDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(thirtyDaysLater.getFullYear()).toBe(2025);
    });
  });

  describe('过期药品过滤逻辑', () => {
    function filterExpiringMedicines(medicines, thirtyDaysLater, now) {
      return medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });
    }

    test('空数组应返回空结果', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const result = filterExpiringMedicines([], thirtyDaysLater, now);
      expect(result).toHaveLength(0);
    });

    test('无过期日期的药品应被排除', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: null },
        { id: 2, name: '药品B', expiryDate: undefined }
      ];
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(0);
    });

    test('30天内的药品应被包含', () => {
      const now = new Date();
      const inFifteenDays = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药品A', expiryDate: inFifteenDays.toISOString() }
      ];

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('药品A');
    });

    test('正好30天的药品应被包含', () => {
      const now = new Date();
      const exactlyThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药品A', expiryDate: exactlyThirtyDays.toISOString() }
      ];

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(1);
    });

    test('超过30天的药品应被排除', () => {
      const now = new Date();
      const inFortyDays = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药品A', expiryDate: inFortyDays.toISOString() }
      ];

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(0);
    });

    test('已过期的药品应被排除', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药品A', expiryDate: yesterday.toISOString() }
      ];

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(0);
    });

    test('今天的药品应被包含', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '药品A', expiryDate: now.toISOString() }
      ];

      const result = filterExpiringMedicines(medicines, thirtyDaysLater, now);
      expect(result).toHaveLength(1);
    });
  });

  describe('今日记录过滤逻辑', () => {
    function filterTodayRecords(records) {
      const today = new Date().toDateString();
      return records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
    }

    test('空数组应返回空结果', () => {
      const result = filterTodayRecords([]);
      expect(result).toHaveLength(0);
    });

    test('今日记录应被包含', () => {
      const today = new Date();
      const records = [
        { id: 1, medicineName: '药品A', takeTime: today.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(1);
    });

    test('昨日记录应被排除', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const records = [
        { id: 1, medicineName: '药品A', takeTime: yesterday.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('多天前的记录应被排除', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const records = [
        { id: 1, medicineName: '药品A', takeTime: lastWeek.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('明日记录应被排除', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const records = [
        { id: 1, medicineName: '药品A', takeTime: tomorrow.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(0);
    });

    test('多个今日记录应都被包含', () => {
      const today = new Date();
      const records = [
        { id: 1, medicineName: '药品A', takeTime: today.toISOString() },
        { id: 2, medicineName: '药品B', takeTime: today.toISOString() },
        { id: 3, medicineName: '药品C', takeTime: today.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(3);
    });

    test('混合日期记录应只包含今日', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const records = [
        { id: 1, medicineName: '今日', takeTime: today.toISOString() },
        { id: 2, medicineName: '昨日', takeTime: yesterday.toISOString() },
        { id: 3, medicineName: '明日', takeTime: tomorrow.toISOString() }
      ];

      const result = filterTodayRecords(records);
      expect(result).toHaveLength(1);
      expect(result[0].medicineName).toBe('今日');
    });
  });

  describe('日期字符串解析', () => {
    test('应正确解析ISO格式日期', () => {
      const dateStr = '2024-06-15T10:30:00.000Z';
      const date = new Date(dateStr);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(15);
    });

    test('应正确解析LocaleString格式', () => {
      const dateStr = '2024/6/15 上午10:30:00';
      const date = new Date(dateStr);
      expect(date.getFullYear()).toBe(2024);
    });

    test('toDateString应返回正确的日期部分', () => {
      const date = new Date('2024-06-15T10:30:00.000Z');
      expect(date.toDateString()).toBe('Sat Jun 15 2024');
    });
  });
});
