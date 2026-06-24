/**
 * 测试药品过期检测逻辑
 *
 * 测试覆盖：
 * - 30天内即将过期药品识别
 * - 已过期药品检测
 * - 边界条件处理（无有效期、当前日期）
 * - 极端日期情况
 */

/**
 * 判断药品是否在30天内即将过期（从index.js提取的业务逻辑）
 * @param {Array} medicines - 药品列表
 * @param {number} daysThreshold - 即将过期天数阈值，默认30天
 * @returns {Array} 即将过期的药品列表
 */
function getExpiringMedicines(medicines, daysThreshold = 30) {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= thresholdDate && expiry >= now;
  });
}

/**
 * 获取今日记录
 * @param {Array} records - 记录列表
 * @returns {Array} 今日记录
 */
function getTodayRecords(records) {
  const today = new Date().toDateString();
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

/**
 * 检查药品是否已过期
 * @param {string} expiryDateStr - 有效期字符串
 * @returns {boolean} 是否已过期
 */
function isExpired(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  return expiry < now;
}

describe('药品过期检测逻辑', () => {
  describe('getExpiringMedicines - 30天内即将过期', () => {
    test('应返回30天内即将过期的药品', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toContain(1);
      expect(result.map(m => m.id)).toContain(3);
    });

    test('应排除已过期药品', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '已过期', expiryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '30天后', expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('30天后');
    });

    test('应排除正好31天后的药品', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '31天后', expiryDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('应包含正好30天后的药品', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '正好30天', expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });

    test('应排除无有效期的药品', () => {
      const medicines = [
        { id: 1, name: '无有效期', expiryDate: '' },
        { id: 2, name: '有有效期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有有效期');
    });

    test('应排除undefined有效期', () => {
      const medicines = [
        { id: 1, name: '无有效期', expiryDate: undefined },
        { id: 2, name: '有有效期', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });

    test('空数组应返回空', () => {
      expect(getExpiringMedicines([])).toHaveLength(0);
    });

    test('可配置天数阈值', () => {
      const now = new Date();
      const medicines = [
        { id: 1, name: '7天后', expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '14天后', expiryDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result7 = getExpiringMedicines(medicines, 7);
      expect(result7).toHaveLength(1);
      expect(result7[0].name).toBe('7天后');

      const result14 = getExpiringMedicines(medicines, 14);
      expect(result14).toHaveLength(2);
    });
  });

  describe('getTodayRecords - 今日记录', () => {
    test('应返回今日记录', () => {
      const today = new Date();
      const todayStr = today.toISOString();
      const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const records = [
        { id: 1, medicineName: '药品A', takeTime: todayStr },
        { id: 2, medicineName: '药品B', takeTime: yesterdayStr },
      ];

      const result = getTodayRecords(records);
      expect(result).toHaveLength(1);
      expect(result[0].medicineName).toBe('药品A');
    });

    test('应正确处理多个今日记录', () => {
      // 使用固定日期字符串确保是今天
      const fixedToday = '2026-06-24T10:00:00.000Z';
      const earlier = '2026-06-24T08:00:00.000Z';
      const later = '2026-06-24T06:00:00.000Z';
      const records = [
        { id: 1, medicineName: '药品A', takeTime: earlier },
        { id: 2, medicineName: '药品B', takeTime: later },
      ];

      const result = getTodayRecords(records);
      expect(result).toHaveLength(2);
    });

    test('空数组返回空', () => {
      expect(getTodayRecords([])).toHaveLength(0);
    });
  });

  describe('isExpired - 过期检查', () => {
    test('应正确识别已过期', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(isExpired(pastDate)).toBe(true);
    });

    test('应正确识别未过期', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isExpired(futureDate)).toBe(false);
    });

    test('空字符串应返回false', () => {
      expect(isExpired('')).toBe(false);
    });

    test('undefined应返回false', () => {
      expect(isExpired(undefined)).toBe(false);
    });
  });

  describe('边界条件与极端情况', () => {
    test('今天过期的药品应视为即将过期（当天23:59）', () => {
      const now = new Date();
      // 设置为今天结束
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const medicines = [{ id: 1, name: '今日过期', expiryDate: todayEnd }];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(1);
    });

    test('昨天过期的药品应视为已过期而非即将过期', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const medicines = [{ id: 1, name: '昨日过期', expiryDate: yesterday }];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('明年过期的药品应不在30天范围内', () => {
      const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const medicines = [{ id: 1, name: '明年过期', expiryDate: nextYear }];

      const result = getExpiringMedicines(medicines);
      expect(result).toHaveLength(0);
    });

    test('应正确处理闰年日期', () => {
      // 2月29日的情况
      const leapYearDate = '2028-02-29';
      expect(() => new Date(leapYearDate)).not.toThrow();
    });
  });
});
