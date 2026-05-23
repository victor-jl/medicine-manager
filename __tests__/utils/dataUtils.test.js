const {
  deleteById,
  filterRecords,
  getRecordsByMedicineId,
  findById,
  addRecord,
  updateById,
  validateMedicine,
  validateRecord,
  generateId,
  createMedicine,
  createRecord,
  reverseArray
} = require('../../utils/dataUtils');

describe('deleteById', () => {
  test('应删除指定ID的记录', () => {
    const records = [
      { id: 1, name: '药品A' },
      { id: 2, name: '药品B' },
      { id: 3, name: '药品C' }
    ];

    const result = deleteById(records, 2);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.id === 2)).toBeUndefined();
  });

  test('应处理字符串ID', () => {
    const records = [
      { id: '1', name: '药品A' },
      { id: '2', name: '药品B' }
    ];

    const result = deleteById(records, '2');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('应处理不存在的ID', () => {
    const records = [
      { id: 1, name: '药品A' },
      { id: 2, name: '药品B' }
    ];

    const result = deleteById(records, 999);
    expect(result).toHaveLength(2);
  });

  test('应处理空数组', () => {
    expect(deleteById([], 1)).toEqual([]);
  });

  test('应处理非数组输入', () => {
    expect(deleteById(null, 1)).toEqual([]);
    expect(deleteById(undefined, 1)).toEqual([]);
    expect(deleteById('string', 1)).toEqual([]);
  });
});

describe('filterRecords', () => {
  const records = [
    { id: 1, name: '阿莫西林', type: '抗生素' },
    { id: 2, name: '布洛芬', type: '退烧药' },
    { id: 3, name: '头孢', type: '抗生素' }
  ];

  test('应根据条件过滤记录', () => {
    const result = filterRecords(records, r => r.type === '抗生素');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === '抗生素')).toBe(true);
  });

  test('应返回空数组当无匹配', () => {
    const result = filterRecords(records, r => r.type === '不存在');
    expect(result).toHaveLength(0);
  });

  test('应处理非函数条件', () => {
    const result = filterRecords(records, 'not a function');
    expect(result).toHaveLength(3);
  });

  test('应处理空数组', () => {
    expect(filterRecords([], r => true)).toEqual([]);
  });

  test('应处理非数组输入', () => {
    expect(filterRecords(null, r => true)).toEqual([]);
  });
});

describe('getRecordsByMedicineId', () => {
  const records = [
    { id: 1, medicineId: 100, medicineName: '阿莫西林', takeTime: '2024-01-15' },
    { id: 2, medicineId: 200, medicineName: '布洛芬', takeTime: '2024-01-15' },
    { id: 3, medicineId: 100, medicineName: '阿莫西林', takeTime: '2024-01-14' }
  ];

  test('应返回指定药品的所有记录', () => {
    const result = getRecordsByMedicineId(records, 100);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.medicineId === 100)).toBe(true);
  });

  test('应处理无匹配记录', () => {
    const result = getRecordsByMedicineId(records, 999);
    expect(result).toHaveLength(0);
  });

  test('应处理空数组', () => {
    expect(getRecordsByMedicineId([], 100)).toEqual([]);
  });
});

describe('findById', () => {
  const records = [
    { id: 1, name: '药品A' },
    { id: 2, name: '药品B' }
  ];

  test('应返回指定ID的记录', () => {
    const result = findById(records, 1);
    expect(result).toEqual({ id: 1, name: '药品A' });
  });

  test('应返回null当记录不存在', () => {
    const result = findById(records, 999);
    expect(result).toBeNull();
  });

  test('应处理空数组', () => {
    expect(findById([], 1)).toBeNull();
  });

  test('应处理非数组输入', () => {
    expect(findById(null, 1)).toBeNull();
  });
});

describe('addRecord', () => {
  test('应添加新记录到数组', () => {
    const records = [{ id: 1, name: '药品A' }];
    const newRecord = { id: 2, name: '药品B' };

    const result = addRecord(records, newRecord);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ id: 2, name: '药品B' });
  });

  test('应处理空数组', () => {
    const newRecord = { id: 1, name: '药品A' };
    const result = addRecord([], newRecord);
    expect(result).toHaveLength(1);
  });

  test('应处理非数组输入', () => {
    const newRecord = { id: 1, name: '药品A' };
    const result = addRecord(null, newRecord);
    expect(result).toHaveLength(1);
  });

  test('不应修改原数组', () => {
    const records = [{ id: 1, name: '药品A' }];
    const newRecord = { id: 2, name: '药品B' };

    addRecord(records, newRecord);
    expect(records).toHaveLength(1);
  });
});

describe('updateById', () => {
  const records = [
    { id: 1, name: '药品A', description: '原始描述' },
    { id: 2, name: '药品B', description: '原始描述' }
  ];

  test('应更新指定ID的记录', () => {
    const result = updateById(records, 1, { name: '更新的名称' });
    const updated = result.find(r => r.id === 1);
    expect(updated.name).toBe('更新的名称');
    expect(updated.description).toBe('原始描述');
  });

  test('不应修改其他记录', () => {
    const result = updateById(records, 1, { name: '更新' });
    const notUpdated = result.find(r => r.id === 2);
    expect(notUpdated.name).toBe('药品B');
  });

  test('应处理不存在的ID', () => {
    const result = updateById(records, 999, { name: '更新' });
    expect(result).toEqual(records);
  });

  test('应处理空数组', () => {
    const result = updateById([], 1, { name: '更新' });
    expect(result).toEqual([]);
  });
});

describe('validateMedicine', () => {
  test('应验证有效药品', () => {
    const medicine = {
      name: '阿莫西林胶囊',
      expiryDate: '2025-12-31',
      specification: '0.5g',
      manufacturer: '某某制药'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('应检测空名称', () => {
    const medicine = {
      name: '',
      expiryDate: '2025-12-31'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('应检测空格名称', () => {
    const medicine = {
      name: '   ',
      expiryDate: '2025-12-31'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('应检测超长名称', () => {
    const medicine = {
      name: 'a'.repeat(101),
      expiryDate: '2025-12-31'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能超过100个字符');
  });

  test('应检测无效日期', () => {
    const medicine = {
      name: '阿莫西林',
      expiryDate: 'invalid-date'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('有效期日期格式无效');
  });

  test('应检测超长规格', () => {
    const medicine = {
      name: '阿莫西林',
      specification: 'a'.repeat(51)
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('规格不能超过50个字符');
  });

  test('应检测超长厂家名称', () => {
    const medicine = {
      name: '阿莫西林',
      manufacturer: 'a'.repeat(101)
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('生产厂家不能超过100个字符');
  });

  test('应返回多个错误', () => {
    const medicine = {
      name: '',
      expiryDate: 'invalid'
    };

    const result = validateMedicine(medicine);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateRecord', () => {
  test('应验证有效记录', () => {
    const record = {
      medicineId: 1,
      medicineName: '阿莫西林',
      takeTime: '2024-01-15 08:00:00'
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('应检测空药品ID', () => {
    const record = {
      medicineId: '',
      medicineName: '阿莫西林',
      takeTime: '2024-01-15 08:00:00'
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品ID不能为空');
  });

  test('应检测空药品名称', () => {
    const record = {
      medicineId: 1,
      medicineName: '',
      takeTime: '2024-01-15 08:00:00'
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  test('应检测空服药时间', () => {
    const record = {
      medicineId: 1,
      medicineName: '阿莫西林',
      takeTime: ''
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('服药时间不能为空');
  });

  test('应检测无效时间格式', () => {
    const record = {
      medicineId: 1,
      medicineName: '阿莫西林',
      takeTime: 'invalid-time'
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('服药时间格式无效');
  });
});

describe('generateId', () => {
  test('应生成数字类型ID', () => {
    const id = generateId();
    expect(typeof id).toBe('number');
  });

  test('应生成大于0的ID', () => {
    const id = generateId();
    expect(id).toBeGreaterThan(0);
  });
});

describe('createMedicine', () => {
  test('应创建标准化的药品对象', () => {
    const data = {
      name: '阿莫西林',
      expiryDate: '2025-12-31',
      specification: '0.5g'
    };

    const medicine = createMedicine(data);
    expect(medicine.name).toBe('阿莫西林');
    expect(medicine.expiryDate).toBe('2025-12-31');
    expect(medicine.specification).toBe('0.5g');
    expect(medicine.id).toBeDefined();
    expect(medicine.createTime).toBeDefined();
  });

  test('应为缺失字段提供默认值', () => {
    const medicine = createMedicine({ name: '阿莫西林' });
    expect(medicine.description).toBe('');
    expect(medicine.specification).toBe('');
    expect(medicine.manufacturer).toBe('');
    expect(medicine.photos).toEqual([]);
  });

  test('应保留提供的ID', () => {
    const medicine = createMedicine({ id: 123, name: '阿莫西林' });
    expect(medicine.id).toBe(123);
  });
});

describe('createRecord', () => {
  test('应创建标准化的记录对象', () => {
    const data = {
      medicineId: 1,
      medicineName: '阿莫西林'
    };

    const record = createRecord(data);
    expect(record.medicineId).toBe(1);
    expect(record.medicineName).toBe('阿莫西林');
    expect(record.id).toBeDefined();
    expect(record.takeTime).toBeDefined();
  });

  test('应为缺失字段提供默认值', () => {
    const record = createRecord({ medicineId: 1, medicineName: '阿莫西林' });
    expect(record.takeTime).toBeDefined();
  });
});

describe('reverseArray', () => {
  test('应反转数组顺序', () => {
    const array = [1, 2, 3, 4, 5];
    const result = reverseArray(array);
    expect(result).toEqual([5, 4, 3, 2, 1]);
  });

  test('不应修改原数组', () => {
    const array = [1, 2, 3];
    reverseArray(array);
    expect(array).toEqual([1, 2, 3]);
  });

  test('应处理空数组', () => {
    expect(reverseArray([])).toEqual([]);
  });

  test('应处理单元素数组', () => {
    expect(reverseArray([1])).toEqual([1]);
  });

  test('应处理非数组输入', () => {
    expect(reverseArray(null)).toEqual([]);
    expect(reverseArray('string')).toEqual([]);
  });
});
