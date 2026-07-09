// tests/ai.test.js
// AI分析工具函数单元测试

const {
  analyzeMedicineInfo,
  formatExpiryDate,
  validateMedicine
} = require('../utils/ai');

describe('AI分析工具函数测试', () => {
  describe('analyzeMedicineInfo - 药品信息分析', () => {
    test('应正确提取完整的药品信息', () => {
      const text = `阿莫西林胶囊
规格: 0.5g×12粒
生产厂家: 华北制药股份有限公司
用法用量: 口服，一次1粒，一日3次
国药准字H12345678
贮藏: 密封，在阴凉处保存
成分: 阿莫西林
有效期至: 2025-12-31`;

      const result = analyzeMedicineInfo(text);

      expect(result.name).toContain('阿莫西林');
      expect(result.specification).toMatch(/0\.5g/);
      expect(result.manufacturer).toContain('华北制药');
      expect(result.usage).toContain('口服');
      expect(result.approvalNumber).toBe('国药准字H12345678');
      expect(result.storage).toContain('密封');
      expect(result.ingredients).toContain('阿莫西林');
      expect(result.expiryDate).toMatch(/2025/);
    });

    test('应处理不完整的信息', () => {
      const text = '阿莫西林胶囊\n规格: 0.5g';
      const result = analyzeMedicineInfo(text);

      expect(result.name).toContain('阿莫西林');
      expect(result.specification).toBeTruthy();
      expect(result.manufacturer).toBe('');
    });

    test('应处理空输入', () => {
      const result = analyzeMedicineInfo('');

      expect(result).toEqual({
        name: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: '',
        expiryDate: ''
      });
    });

    test('应处理null和undefined输入', () => {
      const nullResult = analyzeMedicineInfo(null);
      const undefinedResult = analyzeMedicineInfo(undefined);

      expect(nullResult.name).toBe('');
      expect(undefinedResult.name).toBe('');
    });

    test('应提取多种格式的有效期', () => {
      // 测试标准格式
      const result1 = analyzeMedicineInfo('有效期至: 2025-12-31');
      expect(result1.expiryDate).toBe('2025-12-31');

      // 测试中文格式（带年份）
      const result2 = analyzeMedicineInfo('有效期至: 2025年12月31日');
      expect(result2.expiryDate).toContain('2025');

      // 测试相对日期格式
      const result3 = analyzeMedicineInfo('有效期: 24个月');
      expect(result3.expiryDate).toContain('月');
    });

    test('应提取多种格式的国药准字', () => {
      const text = '国药准字H12345678\n国药准字Z87654321';
      const result = analyzeMedicineInfo(text);

      expect(result.approvalNumber).toBe('国药准字H12345678');
    });

    test('应处理多行文本并提取第一行作为名称', () => {
      const text = '布洛芬缓释胶囊\n其他信息\n更多内容';
      const result = analyzeMedicineInfo(text);

      expect(result.name).toContain('布洛芬');
    });

    test('应提取不同格式的用法用量', () => {
      const testCases = [
        '用法用量: 口服，一次1粒',
        '用法: 口服，一次1粒'
      ];

      testCases.forEach(text => {
        const result = analyzeMedicineInfo(text);
        expect(result.usage).toContain('口服');
      });
    });
  });

  describe('formatExpiryDate - 有效期格式化', () => {
    test('应格式化标准日期', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    test('应格式化中文日期格式', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });

    test('应格式化年月格式', () => {
      expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
    });

    test('应处理相对日期（月份）', () => {
      const result = formatExpiryDate('24个月');
      // 应该返回一个未来的日期
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const resultDate = new Date(result);
      const now = new Date();
      const expectedMonth = now.getMonth() + 24;

      // 简单验证是否在未来
      expect(resultDate.getTime()).toBeGreaterThan(now.getTime());
    });

    test('应处理缺少日的情况', () => {
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });

    test('应处理单数字月份', () => {
      expect(formatExpiryDate('2025年1月')).toBe('2025-01-01');
      expect(formatExpiryDate('2025-1')).toBe('2025-01-01');
    });

    test('应处理空输入', () => {
      expect(formatExpiryDate('')).toBe('');
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
    });

    test('应保留无法解析的值', () => {
      const invalidDate = 'invalid-date';
      expect(formatExpiryDate(invalidDate)).toBe(invalidDate);
    });
  });

  describe('validateMedicine - 药品数据验证', () => {
    test('应验证有效的药品数据', () => {
      const medicine = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应检测缺少名称的药品', () => {
      const medicine = {
        expiryDate: '2025-12-31'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应检测空名称', () => {
      const medicine = {
        name: '   ',
        expiryDate: '2025-12-31'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('应检测过长的名称', () => {
      const medicine = {
        name: 'a'.repeat(101)
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('药品名称过长');
    });

    test('应检测无效的有效期格式', () => {
      const medicine = {
        name: '测试药品',
        expiryDate: 'invalid-date'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('有效期格式不正确');
    });

    test('应允许可选的有效期', () => {
      const medicine = {
        name: '测试药品'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(true);
    });

    test('应累积多个验证错误', () => {
      const medicine = {
        name: '',
        expiryDate: 'invalid'
      };

      const result = validateMedicine(medicine);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});