const {
  getExpiringMedicines,
  getTodayRecords,
  saveMedicine,
  deleteMedicine,
  createTakeRecord,
  getMedicineRecords,
  deleteRecord
} = require('../utils/storage');

describe('getExpiringMedicines', () => {
  const now = new Date('2025-01-15');

  test('返回30天内过期的药品', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: '2025-02-10' },
      { id: 2, name: '药品B', expiryDate: '2025-06-01' },
      { id: 3, name: '药品C', expiryDate: '2025-01-20' }
    ];
    const result = getExpiringMedicines(medicines, now);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toContain(1);
    expect(result.map(m => m.id)).toContain(3);
  });

  test('不包含已过期的药品', () => {
    const medicines = [
      { id: 1, name: '已过期', expiryDate: '2024-12-01' }
    ];
    const result = getExpiringMedicines(medicines, now);
    expect(result).toHaveLength(0);
  });

  test('不包含无有效期的药品', () => {
    const medicines = [
      { id: 1, name: '无有效期' }
    ];
    const result = getExpiringMedicines(medicines, now);
    expect(result).toHaveLength(0);
  });

  test('空数组返回空', () => {
    expect(getExpiringMedicines([], now)).toEqual([]);
  });

  test('非数组输入返回空', () => {
    expect(getExpiringMedicines(null, now)).toEqual([]);
    expect(getExpiringMedicines(undefined, now)).toEqual([]);
    expect(getExpiringMedicines('not-array', now)).toEqual([]);
  });

  test('支持自定义天数阈值', () => {
    const medicines = [
      { id: 1, name: '45天后过期', expiryDate: '2025-03-01' }
    ];
    const result30 = getExpiringMedicines(medicines, now, 30);
    const result60 = getExpiringMedicines(medicines, now, 60);
    expect(result30).toHaveLength(0);
    expect(result60).toHaveLength(1);
  });

  test('无效日期格式被过滤', () => {
    const medicines = [
      { id: 1, name: '无效日期', expiryDate: 'invalid-date' }
    ];
    const result = getExpiringMedicines(medicines, now);
    expect(result).toHaveLength(0);
  });
});

describe('getTodayRecords', () => {
  const now = new Date('2025-01-15T10:00:00');

  test('返回今日的服药记录', () => {
    const records = [
      { id: 1, medicineName: 'A', takeTime: '2025-01-15 08:00:00' },
      { id: 2, medicineName: 'B', takeTime: '2025-01-14 20:00:00' },
      { id: 3, medicineName: 'C', takeTime: '2025-01-15 12:00:00' }
    ];
    const result = getTodayRecords(records, now);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toContain(1);
    expect(result.map(r => r.id)).toContain(3);
  });

  test('空数组返回空', () => {
    expect(getTodayRecords([], now)).toEqual([]);
  });

  test('非数组输入返回空', () => {
    expect(getTodayRecords(null, now)).toEqual([]);
    expect(getTodayRecords(undefined, now)).toEqual([]);
  });

  test('无 takeTime 的记录被过滤', () => {
    const records = [
      { id: 1, medicineName: 'A' }
    ];
    const result = getTodayRecords(records, now);
    expect(result).toHaveLength(0);
  });
});

describe('saveMedicine', () => {
  test('成功保存药品', () => {
    const result = saveMedicine([], { name: '阿莫西林胶囊' });
    expect(result.success).toBe(true);
    expect(result.medicine.name).toBe('阿莫西林胶囊');
    expect(result.medicines).toHaveLength(1);
  });

  test('药品名称为空时失败', () => {
    const result = saveMedicine([], { name: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('请输入药品名称');
  });

  test('无数据时失败', () => {
    const result = saveMedicine([], null);
    expect(result.success).toBe(false);
  });

  test('追加到已有药品列表', () => {
    const existing = [{ id: 1, name: '药品A' }];
    const result = saveMedicine(existing, { name: '药品B' });
    expect(result.medicines).toHaveLength(2);
    expect(result.medicines[0].name).toBe('药品A');
    expect(result.medicines[1].name).toBe('药品B');
  });

  test('保存时包含所有扩展字段', () => {
    const result = saveMedicine([], {
      name: '布洛芬片',
      expiryDate: '2025-12-31',
      description: '止痛药',
      specification: '0.3g',
      manufacturer: '某制药厂',
      usage: '口服一次1片',
      approvalNumber: 'H12345678',
      storage: '遮光保存',
      ingredients: '布洛芬'
    });
    expect(result.success).toBe(true);
    expect(result.medicine.specification).toBe('0.3g');
    expect(result.medicine.manufacturer).toBe('某制药厂');
    expect(result.medicine.usage).toBe('口服一次1片');
    expect(result.medicine.approvalNumber).toBe('H12345678');
    expect(result.medicine.storage).toBe('遮光保存');
    expect(result.medicine.ingredients).toBe('布洛芬');
    expect(result.medicine.createTime).toBeDefined();
  });
});

describe('deleteMedicine', () => {
  test('删除指定ID的药品', () => {
    const medicines = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ];
    const result = deleteMedicine(medicines, 2);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual([1, 3]);
  });

  test('ID不存在时返回原数组', () => {
    const medicines = [{ id: 1, name: 'A' }];
    const result = deleteMedicine(medicines, 999);
    expect(result).toHaveLength(1);
  });

  test('非数组输入返回空', () => {
    expect(deleteMedicine(null, 1)).toEqual([]);
    expect(deleteMedicine(undefined, 1)).toEqual([]);
  });
});

describe('createTakeRecord', () => {
  test('成功创建服药记录', () => {
    const result = createTakeRecord(1, '阿莫西林胶囊');
    expect(result.success).toBe(true);
    expect(result.record.medicineId).toBe(1);
    expect(result.record.medicineName).toBe('阿莫西林胶囊');
    expect(result.record.takeTime).toBeDefined();
    expect(result.record.id).toBeDefined();
  });

  test('缺少参数时失败', () => {
    expect(createTakeRecord(null, 'A').success).toBe(false);
    expect(createTakeRecord(1, '').success).toBe(false);
  });
});

describe('getMedicineRecords', () => {
  test('返回指定药品的所有记录，按时间倒序', () => {
    const records = [
      { id: 1, medicineId: 1, takeTime: '2025-01-10' },
      { id: 2, medicineId: 2, takeTime: '2025-01-11' },
      { id: 3, medicineId: 1, takeTime: '2025-01-12' }
    ];
    const result = getMedicineRecords(records, 1);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(1);
  });

  test('无匹配记录返回空', () => {
    const records = [{ id: 1, medicineId: 2 }];
    expect(getMedicineRecords(records, 1)).toEqual([]);
  });

  test('非数组输入返回空', () => {
    expect(getMedicineRecords(null, 1)).toEqual([]);
  });
});

describe('deleteRecord', () => {
  test('删除指定ID的记录', () => {
    const records = [
      { id: 1, medicineId: 1 },
      { id: 2, medicineId: 1 },
      { id: 3, medicineId: 2 }
    ];
    const result = deleteRecord(records, 2);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([1, 3]);
  });

  test('非数组输入返回空', () => {
    expect(deleteRecord(null, 1)).toEqual([]);
  });
});
