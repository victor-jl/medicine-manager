const {
  getExpiringMedicines,
  getTodayRecords,
  validateMedicine,
  validateRecord,
  createMedicine,
  createRecord,
  deleteById,
  sortByTimeDesc,
  getMedicineRecords
} = require('../utils/data-logic');

describe('getExpiringMedicines - 即将过期药品筛选', () => {
  const now = new Date('2025-06-15T00:00:00Z');

  describe('边界条件', () => {
    it('空数组应返回空数组', () => {
      expect(getExpiringMedicines([], now)).toEqual([]);
    });

    it('非数组输入应返回空数组', () => {
      expect(getExpiringMedicines(null, now)).toEqual([]);
      expect(getExpiringMedicines(undefined, now)).toEqual([]);
      expect(getExpiringMedicines('not-array', now)).toEqual([]);
    });

    it('药品没有expiryDate应被排除', () => {
      const meds = [{ id: 1, name: '药品A' }];
      expect(getExpiringMedicines(meds, now)).toEqual([]);
    });

    it('无效日期格式应被排除', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '无效日期' }];
      expect(getExpiringMedicines(meds, now)).toEqual([]);
    });
  });

  describe('30天阈值筛选', () => {
    it('10天后过期的药品应被包含', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '2025-06-25' }];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('药品A');
    });

    it('29天后过期的药品应被包含', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '2025-07-14' }];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(1);
    });

    it('31天后过期的药品应被排除', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '2025-07-16' }];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(0);
    });

    it('今天过期的药品应被包含', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '2025-06-15' }];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(1);
    });

    it('已过期的药品应被排除', () => {
      const meds = [{ id: 1, name: '药品A', expiryDate: '2025-06-10' }];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(0);
    });
  });

  describe('自定义阈值', () => {
    it('7天阈值应只包含7天内过期的药品', () => {
      const meds = [
        { id: 1, name: '5天后', expiryDate: '2025-06-20' },
        { id: 2, name: '10天后', expiryDate: '2025-06-25' }
      ];
      const result = getExpiringMedicines(meds, now, 7);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('5天后');
    });
  });

  describe('多药品混合场景', () => {
    it('应正确筛选混合列表中的过期药品', () => {
      const meds = [
        { id: 1, name: '正常药品', expiryDate: '2026-12-31' },
        { id: 2, name: '即将过期', expiryDate: '2025-07-01' },
        { id: 3, name: '已过期', expiryDate: '2025-01-01' },
        { id: 4, name: '无有效期' }
      ];
      const result = getExpiringMedicines(meds, now);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('即将过期');
    });
  });
});

describe('getTodayRecords - 今日记录筛选', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  describe('边界条件', () => {
    it('空数组应返回空数组', () => {
      expect(getTodayRecords([], now)).toEqual([]);
    });

    it('非数组应返回空数组', () => {
      expect(getTodayRecords(null, now)).toEqual([]);
    });

    it('没有takeTime的记录应被排除', () => {
      const records = [{ id: 1, medicineName: '药品A' }];
      expect(getTodayRecords(records, now)).toEqual([]);
    });

    it('无效日期应被排除', () => {
      const records = [{ id: 1, medicineName: '药品A', takeTime: '无效' }];
      expect(getTodayRecords(records, now)).toEqual([]);
    });
  });

  describe('日期匹配', () => {
    it('今天的记录应被包含', () => {
      const records = [{
        id: 1, medicineName: '药品A',
        takeTime: new Date('2025-06-15T08:00:00Z').toLocaleString()
      }];
      const result = getTodayRecords(records, now);
      expect(result.length).toBe(1);
    });

    it('昨天的记录应被排除', () => {
      const records = [{
        id: 1, medicineName: '药品A',
        takeTime: new Date('2025-06-14T23:59:59Z').toLocaleString()
      }];
      const result = getTodayRecords(records, now);
      expect(result.length).toBe(0);
    });

    it('明天的记录应被排除', () => {
      const records = [{
        id: 1, medicineName: '药品A',
        takeTime: new Date('2025-06-16T00:00:01Z').toLocaleString()
      }];
      const result = getTodayRecords(records, now);
      expect(result.length).toBe(0);
    });
  });

  describe('多条记录场景', () => {
    it('应返回所有今日记录', () => {
      const records = [
        { id: 1, medicineName: '早药', takeTime: new Date('2025-06-15T08:00:00Z').toLocaleString() },
        { id: 2, medicineName: '午药', takeTime: new Date('2025-06-15T12:00:00Z').toLocaleString() },
        { id: 3, medicineName: '昨日药', takeTime: new Date('2025-06-14T20:00:00Z').toLocaleString() }
      ];
      const result = getTodayRecords(records, now);
      expect(result.length).toBe(2);
      expect(result.map(r => r.medicineName)).toEqual(['早药', '午药']);
    });
  });
});

describe('validateMedicine - 药品数据验证', () => {
  describe('必填字段验证', () => {
    it('null应返回无效', () => {
      const result = validateMedicine(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('空对象应返回无效（无名称）', () => {
      const result = validateMedicine({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    it('空名称应返回无效', () => {
      const result = validateMedicine({ name: '' });
      expect(result.valid).toBe(false);
    });

    it('仅空白名称应返回无效', () => {
      const result = validateMedicine({ name: '   ' });
      expect(result.valid).toBe(false);
    });

    it('有效名称应通过', () => {
      const result = validateMedicine({ name: '阿莫西林' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('长度验证', () => {
    it('超长名称应返回无效', () => {
      const longName = '药'.repeat(101);
      const result = validateMedicine({ name: longName });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能超过100个字符');
    });

    it('100字符名称应通过', () => {
      const name = '药'.repeat(100);
      const result = validateMedicine({ name });
      expect(result.valid).toBe(true);
    });
  });

  describe('有效期格式验证', () => {
    it('无效有效期应返回错误', () => {
      const result = validateMedicine({ name: '药品', expiryDate: '不是日期' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('有效期格式不正确');
    });

    it('有效日期应通过', () => {
      const result = validateMedicine({ name: '药品', expiryDate: '2025-12-31' });
      expect(result.valid).toBe(true);
    });

    it('无有效期应通过（选填）', () => {
      const result = validateMedicine({ name: '药品' });
      expect(result.valid).toBe(true);
    });
  });
});

describe('validateRecord - 服药记录验证', () => {
  describe('必填字段验证', () => {
    it('null应返回无效', () => {
      const result = validateRecord(null);
      expect(result.valid).toBe(false);
    });

    it('缺少medicineId应返回无效', () => {
      const result = validateRecord({ medicineName: '药品' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('必须关联药品ID');
    });

    it('缺少medicineName应返回无效', () => {
      const result = validateRecord({ medicineId: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    it('完整数据应通过', () => {
      const result = validateRecord({ medicineId: 123, medicineName: '阿莫西林' });
      expect(result.valid).toBe(true);
    });

    it('medicineId为0应通过（合法ID）', () => {
      const result = validateRecord({ medicineId: 0, medicineName: '药品' });
      expect(result.valid).toBe(true);
    });
  });
});

describe('createMedicine - 创建药品对象', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('应创建包含所有字段的药品对象', () => {
    const data = {
      name: '阿莫西林',
      expiryDate: '2025-12-31',
      description: '抗生素',
      specification: '0.25g*24粒'
    };
    const result = createMedicine(data, now);
    expect(result.name).toBe('阿莫西林');
    expect(result.expiryDate).toBe('2025-12-31');
    expect(result.description).toBe('抗生素');
    expect(result.specification).toBe('0.25g*24粒');
    expect(typeof result.id).toBe('number');
    expect(result.createTime).toBe(now.toLocaleString());
    expect(result.photos).toEqual([]);
  });

  it('缺失字段应填充默认值', () => {
    const result = createMedicine({ name: '药品' }, now);
    expect(result.expiryDate).toBe('');
    expect(result.description).toBe('');
    expect(result.manufacturer).toBe('');
    expect(result.usage).toBe('');
  });
});

describe('createRecord - 创建服药记录', () => {
  const now = new Date('2025-06-15T12:00:00Z');
  const medicine = { id: 123, name: '阿莫西林' };

  it('应创建包含正确关联的记录', () => {
    const result = createRecord(medicine, now);
    expect(result.medicineId).toBe(123);
    expect(result.medicineName).toBe('阿莫西林');
    expect(typeof result.id).toBe('number');
    expect(result.takeTime).toBe(now.toLocaleString());
  });
});

describe('deleteById - 按ID删除', () => {
  it('应删除指定ID的项目', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ];
    const result = deleteById(items, 2);
    expect(result.length).toBe(2);
    expect(result.find(i => i.id === 2)).toBeUndefined();
    expect(result.find(i => i.id === 1)).toBeDefined();
  });

  it('ID不存在时返回原数组', () => {
    const items = [{ id: 1, name: 'A' }];
    const result = deleteById(items, 999);
    expect(result.length).toBe(1);
  });

  it('非数组输入应返回空数组', () => {
    expect(deleteById(null, 1)).toEqual([]);
  });

  it('不应修改原数组', () => {
    const items = [{ id: 1 }, { id: 2 }];
    deleteById(items, 1);
    expect(items.length).toBe(2);
  });
});

describe('sortByTimeDesc - 按时间倒序排列', () => {
  it('应反转数组顺序', () => {
    const items = [
      { id: 1, createTime: '2025-06-01' },
      { id: 2, createTime: '2025-06-15' }
    ];
    const result = sortByTimeDesc(items);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(1);
  });

  it('不应修改原数组', () => {
    const items = [1, 2, 3];
    sortByTimeDesc(items);
    expect(items).toEqual([1, 2, 3]);
  });

  it('非数组应返回空数组', () => {
    expect(sortByTimeDesc(null)).toEqual([]);
  });
});

describe('getMedicineRecords - 获取指定药品的记录', () => {
  it('应返回指定药品ID的所有记录', () => {
    const records = [
      { id: 1, medicineId: 100, medicineName: '阿莫西林' },
      { id: 2, medicineId: 200, medicineName: '布洛芬' },
      { id: 3, medicineId: 100, medicineName: '阿莫西林' }
    ];
    const result = getMedicineRecords(records, 100);
    expect(result.length).toBe(2);
    expect(result.every(r => r.medicineId === 100)).toBe(true);
  });

  it('无匹配记录应返回空数组', () => {
    const records = [{ id: 1, medicineId: 100 }];
    expect(getMedicineRecords(records, 999)).toEqual([]);
  });

  it('非数组应返回空数组', () => {
    expect(getMedicineRecords(null, 1)).toEqual([]);
  });
});
