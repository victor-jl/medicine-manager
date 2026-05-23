const {
  getExpiringMedicines,
  getExpiredMedicines,
  getTodayRecords,
  calculateRemainingDays,
  isExpiringSoon,
  isExpired,
  formatDate
} = require('../../utils/dateUtils');

describe('getExpiringMedicines', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应返回30天内即将过期的药品', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: '2024-02-10' },
      { id: 2, name: '药品B', expiryDate: '2024-03-15' },
      { id: 3, name: '药品C', expiryDate: '2024-12-31' }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('药品A');
  });

  test('应排除已过期的药品', () => {
    const medicines = [
      { id: 1, name: '过期药品', expiryDate: '2024-01-01' },
      { id: 2, name: '有效药品', expiryDate: '2024-02-10' }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('有效药品');
  });

  test('应排除没有有效期的产品', () => {
    const medicines = [
      { id: 1, name: '无有效期', expiryDate: '' },
      { id: 2, name: '有有效期', expiryDate: '2024-02-10' }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('有有效期');
  });

  test('应排除没有有效期字段的产品', () => {
    const medicines = [
      { id: 1, name: '无有效期字段' },
      { id: 2, name: '有有效期', expiryDate: '2024-02-10' }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('有有效期');
  });

  test('应处理自定义提醒天数', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: '2024-01-20' },
      { id: 2, name: '药品B', expiryDate: '2024-02-10' }
    ];

    const result7days = getExpiringMedicines(medicines, 7);
    expect(result7days).toHaveLength(1);
    expect(result7days[0].name).toBe('药品A');

    const result30days = getExpiringMedicines(medicines, 30);
    expect(result30days).toHaveLength(2);
  });

  test('应处理空数组', () => {
    const result = getExpiringMedicines([]);
    expect(result).toEqual([]);
  });

  test('应处理非数组输入', () => {
    expect(getExpiringMedicines(null)).toEqual([]);
    expect(getExpiringMedicines(undefined)).toEqual([]);
    expect(getExpiringMedicines('string')).toEqual([]);
    expect(getExpiringMedicines(123)).toEqual([]);
  });

  test('恰好30天过期的药品应被包含', () => {
    const futureDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const medicines = [
      { id: 1, name: '恰好30天', expiryDate: futureDate.toISOString().split('T')[0] }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
  });

  test('边界：刚好过期的药品应被排除', () => {
    const medicines = [
      { id: 1, name: '今天过期', expiryDate: baseDate.toISOString().split('T')[0] }
    ];

    const result = getExpiringMedicines(medicines, 30);
    expect(result).toHaveLength(1);
  });
});

describe('getExpiredMedicines', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应返回已过期的药品', () => {
    const medicines = [
      { id: 1, name: '已过期', expiryDate: '2024-01-01' },
      { id: 2, name: '未过期', expiryDate: '2024-12-31' }
    ];

    const result = getExpiredMedicines(medicines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('已过期');
  });

  test('应排除未过期药品', () => {
    const medicines = [
      { id: 1, name: '今日过期', expiryDate: baseDate.toISOString().split('T')[0] },
      { id: 2, name: '未来过期', expiryDate: '2024-12-31' }
    ];

    const result = getExpiredMedicines(medicines);
    expect(result).toHaveLength(0);
  });

  test('应处理无有效期字段', () => {
    const medicines = [
      { id: 1, name: '无有效期', expiryDate: '' },
      { id: 2, name: '有有效期', expiryDate: '2024-01-01' }
    ];

    const result = getExpiredMedicines(medicines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('有有效期');
  });
});

describe('getTodayRecords', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应返回今日记录', () => {
    const records = [
      { id: 1, medicineName: '药品A', takeTime: '2024-01-15 08:00:00' },
      { id: 2, medicineName: '药品B', takeTime: '2024-01-14 08:00:00' }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(1);
    expect(result[0].medicineName).toBe('药品A');
  });

  test('应处理多个今日记录', () => {
    const records = [
      { id: 1, medicineName: '药品A', takeTime: '2024-01-15 08:00:00' },
      { id: 2, medicineName: '药品B', takeTime: '2024-01-15 12:00:00' },
      { id: 3, medicineName: '药品C', takeTime: '2024-01-14 08:00:00' }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(2);
  });

  test('应处理无记录时间的记录', () => {
    const records = [
      { id: 1, medicineName: '无时间' },
      { id: 2, medicineName: '有时间', takeTime: '2024-01-15 08:00:00' }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(1);
  });

  test('应处理空数组', () => {
    expect(getTodayRecords([])).toEqual([]);
  });

  test('应处理非数组输入', () => {
    expect(getTodayRecords(null)).toEqual([]);
    expect(getTodayRecords(undefined)).toEqual([]);
  });
});

describe('calculateRemainingDays', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应正确计算未来日期的剩余天数', () => {
    const futureDate = '2024-01-25';
    const result = calculateRemainingDays(futureDate);
    expect(result).toBe(10);
  });

  test('应正确计算过去日期的剩余天数', () => {
    const pastDate = '2024-01-10';
    const result = calculateRemainingDays(pastDate);
    expect(result).toBe(-5);
  });

  test('应正确计算今天剩余天数', () => {
    const today = '2024-01-15';
    const result = calculateRemainingDays(today);
    expect(result).toBe(0);
  });

  test('应处理空输入', () => {
    expect(calculateRemainingDays('')).toBeNull();
    expect(calculateRemainingDays(null)).toBeNull();
    expect(calculateRemainingDays(undefined)).toBeNull();
  });

  test('应处理无效日期', () => {
    expect(calculateRemainingDays('invalid-date')).toBeNull();
    expect(calculateRemainingDays('2024-13-45')).toBeNull();
  });

  test('应处理Date对象', () => {
    const futureDate = new Date('2024-01-25');
    const result = calculateRemainingDays(futureDate);
    expect(result).toBe(10);
  });

  test('应处理包含时间的日期字符串', () => {
    const futureDate = '2024-01-20 00:00:00';
    const result = calculateRemainingDays(futureDate);
    expect(result).toBeGreaterThanOrEqual(4);
  });

  test('应向上取整天数', () => {
    const futureDate = '2024-01-25 00:00:00';
    const result = calculateRemainingDays(futureDate);
    expect(result).toBeGreaterThanOrEqual(9);
  });
});

describe('isExpiringSoon', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应正确识别即将过期', () => {
    expect(isExpiringSoon('2024-01-20')).toBe(true);
  });

  test('应正确识别未即将过期', () => {
    expect(isExpiringSoon('2024-12-31')).toBe(false);
  });

  test('应正确识别已过期', () => {
    expect(isExpiringSoon('2024-01-01')).toBe(false);
  });

  test('应使用自定义阈值', () => {
    expect(isExpiringSoon('2024-01-20', 10)).toBe(true);
    expect(isExpiringSoon('2024-01-30', 5)).toBe(false);
  });

  test('应处理空输入', () => {
    expect(isExpiringSoon('')).toBe(false);
    expect(isExpiringSoon(null)).toBe(false);
  });

  test('今天应被判定为即将过期', () => {
    expect(isExpiringSoon('2024-01-15')).toBe(true);
  });

  test('恰好30天应被判定为即将过期', () => {
    const date30DaysLater = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(isExpiringSoon(date30DaysLater.toISOString().split('T')[0])).toBe(true);
  });
});

describe('isExpired', () => {
  const baseDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应正确识别已过期', () => {
    expect(isExpired('2024-01-01')).toBe(true);
  });

  test('应正确识别未过期', () => {
    expect(isExpired('2024-12-31')).toBe(false);
  });

  test('今天不应被判定为已过期', () => {
    expect(isExpired('2024-01-15')).toBe(false);
  });

  test('应处理空输入', () => {
    expect(isExpired('')).toBe(false);
    expect(isExpired(null)).toBe(false);
  });

  test('应处理无效日期', () => {
    expect(isExpired('invalid')).toBe(false);
  });
});

describe('formatDate', () => {
  test('应格式化日期为 YYYY-MM-DD', () => {
    expect(formatDate('2024-01-15')).toBe('2024-01-15');
  });

  test('应处理Date对象', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('2024-01-15');
  });

  test('应补零月份和日期', () => {
    expect(formatDate('2024-3-5')).toBe('2024-03-05');
  });

  test('应处理空输入', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  test('应处理无效日期', () => {
    expect(formatDate('invalid')).toBe('');
    expect(formatDate('2024-13-45')).toBe('');
  });

  test('应处理中文日期格式', () => {
    const result = formatDate('2024/01/15');
    expect(result).toMatch(/2024/);
  });
});
