// __tests__/ai.test.js
const {
  analyzeMedicineInfo,
  formatExpiryDate,
  isExpiringSoon,
  isExpired
} = require('../utils/ai');

describe('AI Utility Functions', () => {
  describe('analyzeMedicineInfo', () => {
    test('应正确提取完整药品信息', () => {
      const text = `阿莫西林胶囊
规格：0.5g*24粒
生产企业：华北制药股份有限公司
用法用量：口服，一次0.5g，每6~8小时1次
国药准字H13022558
有效期至2025-12-31
贮藏：遮光，密封保存
成分：本品主要成分为阿莫西林`;

      const result = analyzeMedicineInfo(text);

      expect(result.name).toContain('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g*24粒');
      expect(result.manufacturer).toContain('华北制药');
      expect(result.usage).toContain('口服');
      expect(result.approvalNumber).toBe('国药准字H13022558');
      expect(result.expiryDate).toContain('2025-12-31');
      expect(result.storage).toContain('密封保存');
      expect(result.ingredients).toContain('阿莫西林');
    });

    test('应处理空的输入', () => {
      expect(analyzeMedicineInfo('')).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });

      expect(analyzeMedicineInfo(null)).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });

      expect(analyzeMedicineInfo(undefined)).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });

    test('应提取不同类型的药品名称', () => {
      const testCases = [
        { text: '布洛芬片 0.1g', expectedName: '布洛芬片' },
        { text: '感冒灵颗粒', expectedName: '感冒灵颗粒' },
        { text: '维生素口服液', expectedName: '维生素口服液' },
        { text: '阿奇霉素注射液', expectedName: '阿奇霉素注射液' }
      ];

      testCases.forEach(({ text, expectedName }) => {
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain(expectedName);
      });
    });

    test('应正确提取有效期（多种格式）', () => {
      const testCases = [
        { text: '有效期至2025-12-31', expected: '2025-12-31' },
        { text: '有效期至2025/12/31', expected: '2025/12/31' },
        { text: '有效日期：2025年12月31日', expected: '2025年12月31日' },
        { text: '失效日期2025-12-31', expected: '2025-12-31' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = analyzeMedicineInfo(text);
        expect(result.expiryDate).toContain(expected);
      });
    });

    test('应处理不完整的药品信息', () => {
      const text = '阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);

      expect(result.name).toContain('阿莫西林胶囊');
      expect(result.specification).toBe('');
      expect(result.manufacturer).toBe('');
    });

    test('应限制字段长度防止异常数据', () => {
      const longText = '阿莫西林胶囊 ' + 'x'.repeat(500);
      const result = analyzeMedicineInfo(longText);

      expect(result.name.length).toBeLessThanOrEqual(30);
    });

    test('应提取国药准字（不同格式）', () => {
      const testCases = [
        { text: '国药准字H13022558', expected: '国药准字H13022558' },
        { text: '批准文号：国药准字Z45021487', expected: '国药准字Z45021487' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = analyzeMedicineInfo(text);
        expect(result.approvalNumber).toBe(expected);
      });
    });
  });

  describe('formatExpiryDate', () => {
    test('应格式化标准日期格式', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    test('应处理中文日期格式', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });

    test('应处理只有年月的日期', () => {
      expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
      expect(formatExpiryDate('2025/12')).toBe('2025-12-01');
    });

    test('应处理无效输入', () => {
      expect(formatExpiryDate('')).toBe('');
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
      expect(formatExpiryDate(123)).toBe('');
    });

    test('应补齐月份和日期', () => {
      expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
      expect(formatExpiryDate('2025/1/5')).toBe('2025-01-05');
    });

    test('应处理不规则格式', () => {
      // 无法解析的格式返回原字符串
      const result = formatExpiryDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('isExpiringSoon', () => {
    beforeEach(() => {
      // Mock 当前日期为 2025-01-15
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('应识别即将过期的药品（30天内）', () => {
      expect(isExpiringSoon('2025-02-10', 30)).toBe(true);
      expect(isExpiringSoon('2025-01-20', 30)).toBe(true);
      expect(isExpiringSoon('2025-01-15', 30)).toBe(true);
    });

    test('应识别未即将过期的药品', () => {
      expect(isExpiringSoon('2025-12-31', 30)).toBe(false);
      expect(isExpiringSoon('2026-06-01', 30)).toBe(false);
    });

    test('应识别已过期药品', () => {
      expect(isExpiringSoon('2024-12-01', 30)).toBe(false);
      expect(isExpiringSoon('2025-01-10', 30)).toBe(false);
    });

    test('应处理自定义预警天数', () => {
      // 当前日期 2025-01-15，过期日期 2025-02-01（距离16天）
      expect(isExpiringSoon('2025-02-01', 20)).toBe(true);
      expect(isExpiringSoon('2025-02-01', 10)).toBe(false);
    });

    test('应处理无效日期', () => {
      expect(isExpiringSoon('')).toBe(false);
      expect(isExpiringSoon(null)).toBe(false);
      expect(isExpiringSoon('invalid-date')).toBe(false);
    });
  });

  describe('isExpired', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('应识别已过期药品', () => {
      expect(isExpired('2025-01-10')).toBe(true);
      expect(isExpired('2024-12-31')).toBe(true);
    });

    test('应识别未过期药品', () => {
      expect(isExpired('2025-12-31')).toBe(false);
      expect(isExpired('2025-02-01')).toBe(false);
    });

    test('应处理当天为临界点', () => {
      expect(isExpired('2025-01-15')).toBe(false);
    });

    test('应处理无效日期', () => {
      expect(isExpired('')).toBe(false);
      expect(isExpired(null)).toBe(false);
      expect(isExpired(undefined)).toBe(false);
    });
  });

  describe('边界条件测试', () => {
    test('应处理特殊字符的药品名称', () => {
      const text = '复方α-酮酸片';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('酮酸片');
    });

    test('应处理多行有效期信息', () => {
      const text = `阿莫西林胶囊
有效期至 2025-12-31
批号：20230101`;
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toContain('2025-12-31');
    });

    test('应正确处理字段值为空的情况', () => {
      const text = `阿莫西林胶囊
规格：
生产厂家：`;
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
    });
  });
});