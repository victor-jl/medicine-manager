const { filterExpiringMedicines, filterTodayRecords, validateMedicine, generateMedicineId } = require('../../utils/helpers');

describe('helpers.js - filterExpiringMedicines', () => {
  test('should return empty array when input is empty', () => {
    const result = filterExpiringMedicines([]);
    expect(result).toEqual([]);
  });

  test('should return empty array when input is null', () => {
    const result = filterExpiringMedicines(null);
    expect(result).toEqual([]);
  });

  test('should return empty array when input is undefined', () => {
    const result = filterExpiringMedicines(undefined);
    expect(result).toEqual([]);
  });

  test('should filter out medicines without expiryDate', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: '' },
      { id: 2, name: '药品B', expiryDate: undefined },
      { id: 3, name: '药品C' }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result).toEqual([]);
  });

  test('should include medicines expiring within 30 days', () => {
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const medicines = [
      { id: 1, name: '药品A', expiryDate: thirtyDaysLater.toISOString() }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('药品A');
  });

  test('should exclude medicines expiring more than 30 days from now', () => {
    const thirtyOneDaysLater = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    const medicines = [
      { id: 1, name: '药品A', expiryDate: thirtyOneDaysLater.toISOString() }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result).toEqual([]);
  });

  test('should exclude medicines already expired', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const medicines = [
      { id: 1, name: '药品A', expiryDate: yesterday.toISOString() }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result).toEqual([]);
  });

  test('should handle mixed expiring and non-expiring medicines', () => {
    const now = new Date();
    const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const fortyDaysLater = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const medicines = [
      { id: 1, name: '即将过期', expiryDate: tenDaysLater.toISOString() },
      { id: 2, name: '不会过期', expiryDate: fortyDaysLater.toISOString() },
      { id: 3, name: '已过期', expiryDate: yesterday.toISOString() },
      { id: 4, name: '无有效期' }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('即将过期');
  });

  test('should handle custom days parameter', () => {
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const tenDaysLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const medicines = [
      { id: 1, name: '5天后过期', expiryDate: fiveDaysLater.toISOString() },
      { id: 2, name: '10天后过期', expiryDate: tenDaysLater.toISOString() }
    ];

    const result = filterExpiringMedicines(medicines, 7);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('5天后过期');
  });

  test('should handle expiryDate as string in different formats', () => {
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const medicines = [
      { id: 1, name: 'ISO格式', expiryDate: oneWeekLater.toISOString() },
      { id: 2, name: 'Locale格式', expiryDate: oneWeekLater.toLocaleString() },
      { id: 3, name: 'YYYY-MM-DD', expiryDate: oneWeekLater.toISOString().split('T')[0] }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(3);
  });
});

describe('helpers.js - filterTodayRecords', () => {
  test('should return empty array when input is empty', () => {
    const result = filterTodayRecords([]);
    expect(result).toEqual([]);
  });

  test('should return empty array when input is null', () => {
    const result = filterTodayRecords(null);
    expect(result).toEqual([]);
  });

  test('should return empty array when input is undefined', () => {
    const result = filterTodayRecords(undefined);
    expect(result).toEqual([]);
  });

  test('should include records from today', () => {
    const today = new Date();
    const records = [
      { id: 1, medicineName: '药品A', takeTime: today.toLocaleString() }
    ];
    const result = filterTodayRecords(records);
    expect(result.length).toBe(1);
    expect(result[0].medicineName).toBe('药品A');
  });

  test('should exclude records from yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const records = [
      { id: 1, medicineName: '药品A', takeTime: yesterday.toLocaleString() }
    ];
    const result = filterTodayRecords(records);
    expect(result).toEqual([]);
  });

  test('should exclude records from tomorrow', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const records = [
      { id: 1, medicineName: '药品A', takeTime: tomorrow.toLocaleString() }
    ];
    const result = filterTodayRecords(records);
    expect(result).toEqual([]);
  });

  test('should handle mixed records from different days', () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const records = [
      { id: 1, medicineName: '今天记录', takeTime: today.toLocaleString() },
      { id: 2, medicineName: '昨天记录', takeTime: yesterday.toLocaleString() },
      { id: 3, medicineName: '明天记录', takeTime: tomorrow.toLocaleString() },
      { id: 4, medicineName: '今天记录2', takeTime: today.toISOString() }
    ];

    const result = filterTodayRecords(records);
    expect(result.length).toBe(2);
    expect(result.map(r => r.medicineName)).toContain('今天记录');
    expect(result.map(r => r.medicineName)).toContain('今天记录2');
  });
});

describe('helpers.js - validateMedicine', () => {
  test('should return invalid when medicine is null', () => {
    const result = validateMedicine(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return invalid when medicine is undefined', () => {
    const result = validateMedicine(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return invalid when name is empty', () => {
    const result = validateMedicine({ name: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return invalid when name is whitespace', () => {
    const result = validateMedicine({ name: '   ' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return invalid when name is null', () => {
    const result = validateMedicine({ name: null });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return invalid when name is undefined', () => {
    const result = validateMedicine({});
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('should return valid when name is provided', () => {
    const result = validateMedicine({ name: '阿莫西林胶囊' });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should return valid when name has leading/trailing whitespace', () => {
    const result = validateMedicine({ name: '  布洛芬片  ' });
    expect(result.valid).toBe(true);
  });

  test('should return valid when medicine has all fields', () => {
    const result = validateMedicine({
      name: '阿莫西林胶囊',
      expiryDate: '2025-12-31',
      specification: '0.5g*20粒',
      manufacturer: '某制药厂'
    });
    expect(result.valid).toBe(true);
  });
});

describe('helpers.js - generateMedicineId', () => {
  test('should return a number', () => {
    const id = generateMedicineId();
    expect(typeof id).toBe('number');
  });

  test('should return a valid timestamp', () => {
    const id = generateMedicineId();
    const now = Date.now();
    expect(id).toBeLessThanOrEqual(now);
    expect(id).toBeGreaterThan(now - 1000);
  });

  test('should return unique IDs when called with delay', async () => {
    const id1 = generateMedicineId();
    await new Promise(resolve => setTimeout(resolve, 1));
    const id2 = generateMedicineId();
    expect(id2).toBeGreaterThanOrEqual(id1);
  });
});
