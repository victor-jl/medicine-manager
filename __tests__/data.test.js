const {
  getExpiringMedicines,
  getTodayRecords,
  getMedicineRecords,
  validateMedicine
} = require('../utils/data');

describe('getExpiringMedicines', () => {
  const baseNow = new Date('2025-06-15T12:00:00Z');

  test('空数组返回空数组', () => {
    expect(getExpiringMedicines([], 30, baseNow)).toEqual([]);
  });

  test('非数组输入返回空数组', () => {
    expect(getExpiringMedicines(null, 30, baseNow)).toEqual([]);
    expect(getExpiringMedicines(undefined, 30, baseNow)).toEqual([]);
    expect(getExpiringMedicines('not-an-array', 30, baseNow)).toEqual([]);
  });

  test('过滤出30天内过期的药品', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: '2025-06-20' },
      { id: 2, name: 'B', expiryDate: '2025-07-10' },
      { id: 3, name: 'C', expiryDate: '2025-12-31' },
      { id: 4, name: 'D', expiryDate: '2025-06-10' }
    ];

    const result = getExpiringMedicines(medicines, 30, baseNow);
    expect(result.map(m => m.id)).toEqual([1, 2]);
  });

  test('排除没有有效期的药品', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: '2025-06-20' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C', expiryDate: '' },
      { id: 4, name: 'D', expiryDate: null }
    ];

    const result = getExpiringMedicines(medicines, 30, baseNow);
    expect(result.map(m => m.id)).toEqual([1]);
  });

  test('排除已过期的药品（早于当前时间）', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: '2025-06-14' },
      { id: 2, name: 'B', expiryDate: '2025-01-01' }
    ];

    const result = getExpiringMedicines(medicines, 30, baseNow);
    expect(result).toEqual([]);
  });

  test('边界情况：有效期恰好在阈值当天的药品应包含', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: '2025-07-15' }
    ];

    const result = getExpiringMedicines(medicines, 30, baseNow);
    expect(result.map(m => m.id)).toEqual([1]);
  });

  test('支持自定义过期天数阈值', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: '2025-06-20' },
      { id: 2, name: 'B', expiryDate: '2025-07-10' }
    ];

    const result = getExpiringMedicines(medicines, 7, baseNow);
    expect(result.map(m => m.id)).toEqual([1]);
  });

  test('无效日期格式的药品应被排除', () => {
    const medicines = [
      { id: 1, name: 'A', expiryDate: 'invalid-date' },
      { id: 2, name: 'B', expiryDate: '2025-06-20' }
    ];

    const result = getExpiringMedicines(medicines, 30, baseNow);
    expect(result.map(m => m.id)).toEqual([2]);
  });
});

describe('getTodayRecords', () => {
  const today = new Date('2025-06-15T12:00:00Z');

  test('空数组返回空数组', () => {
    expect(getTodayRecords([], today)).toEqual([]);
  });

  test('非数组输入返回空数组', () => {
    expect(getTodayRecords(null, today)).toEqual([]);
    expect(getTodayRecords(undefined, today)).toEqual([]);
  });

  test('只返回今天的服药记录', () => {
    const records = [
      { id: 1, medicineName: 'A', takeTime: '2025-06-15T08:00:00' },
      { id: 2, medicineName: 'B', takeTime: '2025-06-15T20:00:00' },
      { id: 3, medicineName: 'C', takeTime: '2025-06-14T08:00:00' },
      { id: 4, medicineName: 'D', takeTime: '2025-06-16T08:00:00' }
    ];

    const result = getTodayRecords(records, today);
    expect(result.map(r => r.id)).toEqual([1, 2]);
  });

  test('排除takeTime字段缺失或无效的记录', () => {
    const records = [
      { id: 1, medicineName: 'A', takeTime: '2025-06-15T08:00:00' },
      { id: 2, medicineName: 'B' },
      { id: 3, medicineName: 'C', takeTime: null },
      { id: 4, medicineName: 'D', takeTime: 'invalid' }
    ];

    const result = getTodayRecords(records, today);
    expect(result.map(r => r.id)).toEqual([1]);
  });
});

describe('getMedicineRecords', () => {
  test('空数组返回空数组', () => {
    expect(getMedicineRecords([], 1)).toEqual([]);
  });

  test('无效medicineId返回空数组', () => {
    expect(getMedicineRecords([{ id: 1, medicineId: 1 }], undefined)).toEqual([]);
    expect(getMedicineRecords([{ id: 1, medicineId: 1 }], null)).toEqual([]);
  });

  test('只返回指定药品的记录', () => {
    const records = [
      { id: 1, medicineId: 100, medicineName: 'A' },
      { id: 2, medicineId: 200, medicineName: 'B' },
      { id: 3, medicineId: 100, medicineName: 'A' }
    ];

    const result = getMedicineRecords(records, 100);
    expect(result.map(r => r.id)).toEqual([1, 3]);
  });
});

describe('validateMedicine', () => {
  test('有效药品数据返回空错误列表', () => {
    const medicine = {
      name: '阿莫西林胶囊',
      expiryDate: '2025-12-31',
      approvalNumber: 'H13021770'
    };
    expect(validateMedicine(medicine)).toEqual([]);
  });

  test('空名称返回错误', () => {
    expect(validateMedicine({ name: '' })).toContain('药品名称不能为空');
    expect(validateMedicine({ name: '   ' })).toContain('药品名称不能为空');
    expect(validateMedicine({})).toContain('药品名称不能为空');
  });

  test('名称过长返回错误', () => {
    const longName = 'A'.repeat(101);
    expect(validateMedicine({ name: longName })).toContain('药品名称不能超过100个字符');
  });

  test('无效有效期格式返回错误', () => {
    expect(validateMedicine({ name: 'A', expiryDate: 'not-a-date' })).toContain('有效期格式无效');
  });

  test('无效批准文号格式返回错误', () => {
    expect(validateMedicine({ name: 'A', approvalNumber: '123' })).toContain('批准文号格式无效');
  });

  test('非对象输入返回错误', () => {
    expect(validateMedicine(null)).toEqual(['药品数据无效']);
    expect(validateMedicine(undefined)).toEqual(['药品数据无效']);
  });
});
