const {
  isMedicineExpiring,
  isMedicineExpired,
  filterExpiringMedicines,
  filterTodayRecords,
  validateMedicine,
  getMedicineById,
  filterRecordsByMedicineId
} = require('../medicine');

describe('isMedicineExpiring', () => {
  test('should return false for null medicine', () => {
    expect(isMedicineExpiring(null)).toBe(false);
  });

  test('should return false for medicine without expiryDate', () => {
    expect(isMedicineExpiring({ name: '药名' })).toBe(false);
  });

  test('should return true for medicine expiring within 30 days', () => {
    const thirtyDaysLater = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: thirtyDaysLater.toISOString() };
    expect(isMedicineExpiring(medicine)).toBe(true);
  });

  test('should return false for medicine expiring after 30 days', () => {
    const fortyDaysLater = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: fortyDaysLater.toISOString() };
    expect(isMedicineExpiring(medicine)).toBe(false);
  });

  test('should return false for already expired medicine', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: yesterday.toISOString() };
    expect(isMedicineExpiring(medicine)).toBe(false);
  });

  test('should work with custom days threshold', () => {
    const sixtyDaysLater = new Date(Date.now() + 50 * 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: sixtyDaysLater.toISOString() };
    expect(isMedicineExpiring(medicine, 60)).toBe(true);
    expect(isMedicineExpiring(medicine, 30)).toBe(false);
  });
});

describe('isMedicineExpired', () => {
  test('should return false for null medicine', () => {
    expect(isMedicineExpired(null)).toBe(false);
  });

  test('should return false for medicine without expiryDate', () => {
    expect(isMedicineExpired({ name: '药名' })).toBe(false);
  });

  test('should return true for already expired medicine', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: yesterday.toISOString() };
    expect(isMedicineExpired(medicine)).toBe(true);
  });

  test('should return false for medicine expiring in future', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const medicine = { expiryDate: tomorrow.toISOString() };
    expect(isMedicineExpired(medicine)).toBe(false);
  });

  test('should return false for medicine expiring today', () => {
    const today = new Date();
    const medicine = { expiryDate: today.toISOString() };
    expect(isMedicineExpired(medicine)).toBe(false);
  });
});

describe('filterExpiringMedicines', () => {
  test('should return empty array for non-array input', () => {
    expect(filterExpiringMedicines(null)).toEqual([]);
    expect(filterExpiringMedicines({})).toEqual([]);
    expect(filterExpiringMedicines('string')).toEqual([]);
  });

  test('should filter only expiring medicines', () => {
    const now = Date.now();
    const medicines = [
      { id: 1, name: '药1', expiryDate: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, name: '药2', expiryDate: new Date(now + 50 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 3, name: '药3', expiryDate: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 4, name: '药4' }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  test('should return empty array when no medicines are expiring', () => {
    const now = Date.now();
    const medicines = [
      { id: 1, name: '药1', expiryDate: new Date(now + 50 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, name: '药2', expiryDate: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    const result = filterExpiringMedicines(medicines);
    expect(result).toEqual([]);
  });
});

describe('filterTodayRecords', () => {
  test('should return empty array for non-array input', () => {
    expect(filterTodayRecords(null)).toEqual([]);
    expect(filterTodayRecords({})).toEqual([]);
  });

  test('should filter only today records', () => {
    const now = new Date();
    const records = [
      { id: 1, takeTime: now.toISOString() },
      { id: 2, takeTime: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString() },
      { id: 3, takeTime: new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString() },
      { id: 4 }
    ];
    const result = filterTodayRecords(records);
    expect(result.length).toBe(2);
    expect(result.some(r => r.id === 1)).toBe(true);
    expect(result.some(r => r.id === 3)).toBe(true);
  });

  test('should handle records without takeTime', () => {
    const records = [
      { id: 1, takeTime: new Date().toISOString() },
      { id: 2 },
      { id: 3, takeTime: null }
    ];
    const result = filterTodayRecords(records);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});

describe('validateMedicine', () => {
  test('should return invalid for null input', () => {
    const result = validateMedicine(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品数据必须是对象');
  });

  test('should return invalid for non-object input', () => {
    const result = validateMedicine('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品数据必须是对象');
  });

  test('should return invalid for medicine without name', () => {
    const result = validateMedicine({ expiryDate: '2026-12-31' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('should return invalid for medicine with empty name', () => {
    const result = validateMedicine({ name: '', expiryDate: '2026-12-31' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('should return invalid for medicine with whitespace only name', () => {
    const result = validateMedicine({ name: '   ', expiryDate: '2026-12-31' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('should return invalid for medicine with invalid expiry date', () => {
    const result = validateMedicine({ name: '药名', expiryDate: 'invalid-date' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('有效期格式不正确');
  });

  test('should return valid for medicine with valid data', () => {
    const result = validateMedicine({ name: '阿莫西林胶囊', expiryDate: '2026-12-31' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('should return valid for medicine without expiry date', () => {
    const result = validateMedicine({ name: '阿莫西林胶囊' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('getMedicineById', () => {
  test('should return null for non-array input', () => {
    expect(getMedicineById(null, 1)).toBe(null);
    expect(getMedicineById({}, 1)).toBe(null);
  });

  test('should return null when medicine not found', () => {
    const medicines = [{ id: 1, name: '药1' }, { id: 2, name: '药2' }];
    expect(getMedicineById(medicines, 999)).toBe(null);
  });

  test('should return medicine when found by numeric id', () => {
    const medicines = [{ id: 1, name: '药1' }, { id: 2, name: '药2' }];
    const result = getMedicineById(medicines, 2);
    expect(result).not.toBe(null);
    expect(result.name).toBe('药2');
  });

  test('should return medicine when found by string id', () => {
    const medicines = [{ id: 1, name: '药1' }, { id: 2, name: '药2' }];
    const result = getMedicineById(medicines, '2');
    expect(result).not.toBe(null);
    expect(result.name).toBe('药2');
  });

  test('should handle empty medicines array', () => {
    expect(getMedicineById([], 1)).toBe(null);
  });
});

describe('filterRecordsByMedicineId', () => {
  test('should return empty array for non-array input', () => {
    expect(filterRecordsByMedicineId(null, 1)).toEqual([]);
    expect(filterRecordsByMedicineId({}, 1)).toEqual([]);
  });

  test('should filter records by numeric medicineId', () => {
    const records = [
      { id: 1, medicineId: 1, medicineName: '药1' },
      { id: 2, medicineId: 1, medicineName: '药1' },
      { id: 3, medicineId: 2, medicineName: '药2' }
    ];
    const result = filterRecordsByMedicineId(records, 1);
    expect(result.length).toBe(2);
    expect(result.every(r => r.medicineId === 1)).toBe(true);
  });

  test('should filter records by string medicineId', () => {
    const records = [
      { id: 1, medicineId: 1, medicineName: '药1' },
      { id: 2, medicineId: 2, medicineName: '药2' }
    ];
    const result = filterRecordsByMedicineId(records, '1');
    expect(result.length).toBe(1);
    expect(result[0].medicineId).toBe(1);
  });

  test('should return empty array when no records match', () => {
    const records = [{ id: 1, medicineId: 1, medicineName: '药1' }];
    const result = filterRecordsByMedicineId(records, 999);
    expect(result).toEqual([]);
  });

  test('should handle empty records array', () => {
    expect(filterRecordsByMedicineId([], 1)).toEqual([]);
  });
});