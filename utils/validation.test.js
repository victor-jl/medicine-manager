// utils/validation.test.js
// 数据验证测试

const { validateMedicine, validateRecord, validateCase } = require('./validation');

// ==================== 测试部分 ====================

describe('validateMedicine - 药品数据验证', () => {
  
  describe('必填字段验证', () => {
    test('应该拒绝null值', () => {
      const result = validateMedicine(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品数据不能为空');
    });

    test('应该拒绝undefined值', () => {
      const result = validateMedicine(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品数据不能为空');
    });

    test('应该拒绝非对象类型', () => {
      const result = validateMedicine('string');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品数据不能为空');
    });

    test('应该拒绝空对象', () => {
      const result = validateMedicine({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应该拒绝空名称', () => {
      const result = validateMedicine({ name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应该拒绝只有空格的名称', () => {
      const result = validateMedicine({ name: '   ' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应该接受有效的最小药品数据', () => {
      const result = validateMedicine({ name: '阿莫西林' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('字段长度验证', () => {
    test('应该拒绝超长药品名称', () => {
      const result = validateMedicine({
        name: 'a'.repeat(51)
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称长度不能超过50个字符');
    });

    test('应该接受最大长度的药品名称', () => {
      const result = validateMedicine({
        name: 'a'.repeat(50)
      });
      expect(result.valid).toBe(true);
    });

    test('应该拒绝超长规格', () => {
      const result = validateMedicine({
        name: '药品',
        specification: 'a'.repeat(101)
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('规格长度不能超过100个字符');
    });

    test('应该拒绝超长生产厂家', () => {
      const result = validateMedicine({
        name: '药品',
        manufacturer: 'a'.repeat(101)
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('生产厂家长度不能超过100个字符');
    });

    test('应该拒绝超长用法用量', () => {
      const result = validateMedicine({
        name: '药品',
        usage: 'a'.repeat(201)
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('用法用量长度不能超过200个字符');
    });
  });

  describe('日期格式验证', () => {
    test('应该拒绝无效的有效期格式', () => {
      const result = validateMedicine({
        name: '药品',
        expiryDate: 'invalid-date'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('有效期格式不正确');
    });

    test('应该接受有效的有效期', () => {
      const result = validateMedicine({
        name: '药品',
        expiryDate: '2025-12-31'
      });
      expect(result.valid).toBe(true);
    });

    test('应该允许不填有效期', () => {
      const result = validateMedicine({
        name: '药品'
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('完整数据验证', () => {
    test('应该接受完整的有效药品数据', () => {
      const result = validateMedicine({
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        specification: '0.5g×12粒/盒',
        manufacturer: '华北制药股份有限公司',
        usage: '口服，一次1粒，一日3次',
        approvalNumber: 'H12345678',
        storage: '密封保存',
        ingredients: '阿莫西林'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该累积多个错误', () => {
      const result = validateMedicine({
        name: '',
        expiryDate: 'invalid',
        specification: 'a'.repeat(101)
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

describe('validateRecord - 服药记录验证', () => {
  
  describe('必填字段验证', () => {
    test('应该拒绝null值', () => {
      const result = validateRecord(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('记录数据不能为空');
    });

    test('应该拒绝空对象', () => {
      const result = validateRecord({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('应该拒绝缺少药品ID', () => {
      const result = validateRecord({
        medicineName: '阿莫西林'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品ID不能为空');
    });

    test('应该拒绝缺少药品名称', () => {
      const result = validateRecord({
        medicineId: 123
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应该接受有效的记录数据', () => {
      const result = validateRecord({
        medicineId: 123,
        medicineName: '阿莫西林'
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('服药时间验证', () => {
    test('应该拒绝无效的服药时间', () => {
      const result = validateRecord({
        medicineId: 123,
        medicineName: '阿莫西林',
        takeTime: 'invalid-time'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('服药时间格式不正确');
    });

    test('应该接受有效的服药时间', () => {
      const result = validateRecord({
        medicineId: 123,
        medicineName: '阿莫西林',
        takeTime: '2025-01-15 10:30:00'
      });
      expect(result.valid).toBe(true);
    });

    test('应该允许不填服药时间', () => {
      const result = validateRecord({
        medicineId: 123,
        medicineName: '阿莫西林'
      });
      expect(result.valid).toBe(true);
    });
  });
});

describe('validateCase - 病例数据验证', () => {
  
  describe('必填字段验证', () => {
    test('应该拒绝null值', () => {
      const result = validateCase(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('病例数据不能为空');
    });

    test('应该拒绝空对象', () => {
      const result = validateCase({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('病例内容不能为空');
    });

    test('应该拒绝空内容', () => {
      const result = validateCase({ content: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('病例内容不能为空');
    });

    test('应该拒绝只有空格的内容', () => {
      const result = validateCase({ content: '   ' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('病例内容不能为空');
    });

    test('应该接受有效的病例数据', () => {
      const result = validateCase({ content: '感冒发烧' });
      expect(result.valid).toBe(true);
    });
  });

  describe('内容长度验证', () => {
    test('应该拒绝超长内容', () => {
      const result = validateCase({
        content: 'a'.repeat(501)
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('病例内容长度不能超过500个字符');
    });

    test('应该接受最大长度的内容', () => {
      const result = validateCase({
        content: 'a'.repeat(500)
      });
      expect(result.valid).toBe(true);
    });
  });
});

describe('边界条件和极端情况', () => {
  test('应该处理包含特殊字符的药品名称', () => {
    const result = validateMedicine({
      name: '阿莫西林-胶囊（0.5g）'
    });
    expect(result.valid).toBe(true);
  });

  test('应该处理包含数字的药品名称', () => {
    const result = validateMedicine({
      name: '999感冒灵'
    });
    expect(result.valid).toBe(true);
  });

  test('应该处理包含英文的药品名称', () => {
    const result = validateMedicine({
      name: 'Amoxicillin Capsules'
    });
    expect(result.valid).toBe(true);
  });

  test('应该处理负数的药品ID', () => {
    const result = validateRecord({
      medicineId: -1,
      medicineName: '药品'
    });
    // 负数ID虽然不常见，但技术上有效
    expect(result.valid).toBe(true);
  });

  test('应该处理零值药品ID', () => {
    const result = validateRecord({
      medicineId: 0,
      medicineName: '药品'
    });
    // 零值ID在业务上可能无效，但验证逻辑现在允许（有值即可）
    expect(result.valid).toBe(true);
  });

  test('应该处理未来的服药时间', () => {
    const result = validateRecord({
      medicineId: 123,
      medicineName: '阿莫西林',
      takeTime: '2030-01-01 00:00:00'
    });
    expect(result.valid).toBe(true);
  });

  test('应该处理过去的服药时间', () => {
    const result = validateRecord({
      medicineId: 123,
      medicineName: '阿莫西林',
      takeTime: '2020-01-01 00:00:00'
    });
    expect(result.valid).toBe(true);
  });
});