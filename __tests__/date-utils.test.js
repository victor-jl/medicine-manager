// __tests__/date-utils.test.js
// 测试日期计算和业务边界条件

const {
  isExpiringWithin,
  isExpiringInThirtyDays,
  filterExpiringMedicines,
  isToday,
  filterTodayRecords,
  validateMedicineData,
  isMedicineValid
} = require('../utils/date-utils');

describe('isExpiringWithin', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  describe('边界情况', () => {
    it('空值应返回 false', () => {
      expect(isExpiringWithin(null, 30, now)).toBe(false);
      expect(isExpiringWithin(undefined, 30, now)).toBe(false);
      expect(isExpiringWithin('', 30, now)).toBe(false);
    });

    it('无效日期应返回 false', () => {
      expect(isExpiringWithin('invalid-date', 30, now)).toBe(false);
      expect(isExpiringWithin('not-a-date', 30, now)).toBe(false);
    });
  });

  describe('30天内过期检测', () => {
    it('正好30天后过期应返回 true', () => {
      const date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(true);
    });

    it('29天后过期应返回 true', () => {
      const date = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(true);
    });

    it('1天后过期应返回 true', () => {
      const date = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(true);
    });

    it('今天过期应返回 true', () => {
      const date = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(true);
    });

    it('31天后过期应返回 false', () => {
      const date = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(false);
    });

    it('昨天已过期应返回 false', () => {
      const date = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(false);
    });

    it('1年前已过期应返回 false', () => {
      const date = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date.toISOString(), 30, now)).toBe(false);
    });
  });

  describe('不同天数阈值', () => {
    it('7天阈值应正确工作', () => {
      const date6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      const date8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
      expect(isExpiringWithin(date6Days.toISOString(), 7, now)).toBe(true);
      expect(isExpiringWithin(date8Days.toISOString(), 7, now)).toBe(false);
    });
  });
});

describe('isExpiringInThirtyDays', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('是 isExpiringWithin 的 30 天快捷方式', () => {
    const date = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    expect(isExpiringInThirtyDays(date.toISOString(), now)).toBe(true);
  });
});

describe('filterExpiringMedicines', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('空数组应返回空', () => {
    expect(filterExpiringMedicines([], 30, now)).toEqual([]);
  });

  it('非数组输入应返回空', () => {
    expect(filterExpiringMedicines(null, 30, now)).toEqual([]);
    expect(filterExpiringMedicines(undefined, 30, now)).toEqual([]);
    expect(filterExpiringMedicines('not-array', 30, now)).toEqual([]);
  });

  it('应正确筛选30天内过期的药品', () => {
    const medicines = [
      { id: 1, name: '药A', expiryDate: new Date(now.getTime() + 10 * 86400000).toISOString() },
      { id: 2, name: '药B', expiryDate: new Date(now.getTime() + 40 * 86400000).toISOString() },
      { id: 3, name: '药C', expiryDate: new Date(now.getTime() + 25 * 86400000).toISOString() },
      { id: 4, name: '药D', expiryDate: null },
      { id: 5, name: '药E' }
    ];

    const result = filterExpiringMedicines(medicines, 30, now);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toEqual(expect.arrayContaining(['药A', '药C']));
  });

  it('无有效期的药品不应被包含', () => {
    const medicines = [
      { id: 1, name: '药A' },
      { id: 2, name: '药B', expiryDate: '' },
      { id: 3, name: '药C', expiryDate: new Date(now.getTime() + 5 * 86400000).toISOString() }
    ];

    const result = filterExpiringMedicines(medicines, 30, now);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('药C');
  });
});

describe('isToday', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  describe('边界情况', () => {
    it('空值应返回 false', () => {
      expect(isToday(null, now)).toBe(false);
      expect(isToday(undefined, now)).toBe(false);
      expect(isToday('', now)).toBe(false);
    });

    it('无效日期应返回 false', () => {
      expect(isToday('invalid', now)).toBe(false);
    });
  });

  describe('今日判断', () => {
    it('今天的日期应返回 true', () => {
      expect(isToday('2025-06-15T08:00:00Z', now)).toBe(true);
      expect(isToday('2025-06-15T23:59:59Z', now)).toBe(true);
      expect(isToday('2025-06-15T00:00:00Z', now)).toBe(true);
    });

    it('昨天的日期应返回 false', () => {
      expect(isToday('2025-06-14T23:59:59Z', now)).toBe(false);
    });

    it('明天的日期应返回 false', () => {
      expect(isToday('2025-06-16T00:00:00Z', now)).toBe(false);
    });
  });
});

describe('filterTodayRecords', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('空数组应返回空', () => {
    expect(filterTodayRecords([], now)).toEqual([]);
  });

  it('非数组输入应返回空', () => {
    expect(filterTodayRecords(null, now)).toEqual([]);
    expect(filterTodayRecords(undefined, now)).toEqual([]);
  });

  it('应正确筛选今日记录', () => {
    const records = [
      { id: 1, takeTime: '2025-06-15T08:00:00Z' },
      { id: 2, takeTime: '2025-06-14T20:00:00Z' },
      { id: 3, takeTime: '2025-06-15T12:30:00Z' },
      { id: 4, takeTime: null }
    ];

    const result = filterTodayRecords(records, now);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([1, 3]);
  });
});

describe('validateMedicineData', () => {
  describe('空值验证', () => {
    it('null 数据应返回错误', () => {
      const errors = validateMedicineData(null);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('undefined 数据应返回错误', () => {
      const errors = validateMedicineData(undefined);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('非对象数据应返回错误', () => {
      expect(validateMedicineData('string').length).toBeGreaterThan(0);
      expect(validateMedicineData(123).length).toBeGreaterThan(0);
    });
  });

  describe('药品名称验证', () => {
    it('无名称应返回错误', () => {
      const errors = validateMedicineData({});
      expect(errors).toContain('药品名称不能为空');
    });

    it('空字符串名称应返回错误', () => {
      const errors = validateMedicineData({ name: '' });
      expect(errors).toContain('药品名称不能为空');
    });

    it('仅空白字符的名称应返回错误', () => {
      const errors = validateMedicineData({ name: '   ' });
      expect(errors).toContain('药品名称不能为空');
    });

    it('有效名称不应返回错误', () => {
      const errors = validateMedicineData({ name: '阿莫西林' });
      expect(errors).not.toContain('药品名称不能为空');
    });
  });

  describe('有效期验证', () => {
    it('无效日期格式应返回错误', () => {
      const errors = validateMedicineData({ name: '药', expiryDate: 'not-a-date' });
      expect(errors).toContain('有效期格式无效');
    });

    it('无有效期不应返回错误', () => {
      const errors = validateMedicineData({ name: '药' });
      expect(errors).not.toContain('有效期格式无效');
    });

    it('有效日期不应返回错误', () => {
      const errors = validateMedicineData({ name: '药', expiryDate: '2025-12-31' });
      expect(errors).not.toContain('有效期格式无效');
    });
  });

  describe('综合验证', () => {
    it('完整有效数据应返回空错误列表', () => {
      const errors = validateMedicineData({
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31'
      });
      expect(errors).toEqual([]);
    });

    it('多个错误应全部返回', () => {
      const errors = validateMedicineData({
        name: '',
        expiryDate: 'invalid'
      });
      expect(errors).toContain('药品名称不能为空');
      expect(errors).toContain('有效期格式无效');
    });
  });
});

describe('isMedicineValid', () => {
  it('有效数据应返回 true', () => {
    expect(isMedicineValid({ name: '阿莫西林' })).toBe(true);
  });

  it('无效数据应返回 false', () => {
    expect(isMedicineValid({ name: '' })).toBe(false);
    expect(isMedicineValid(null)).toBe(false);
  });
});
