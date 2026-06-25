/**
 * utils/ai.js 测试
 * 重点测试：
 * - 药品信息解析逻辑
 * - 日期格式转换
 * - 各种药品包装文本格式
 * - 边界条件和错误处理
 */

const ai = require('../../utils/ai');

describe('ai.js', () => {
  describe('analyzeMedicineInfo', () => {
    test('应该正确解析完整的药品信息', () => {
      const text = `阿莫西林胶囊
规格: 0.5g×12粒
生产企业: 华北制药股份有限公司
用法用量: 口服，一次0.5g，一日3次
有效期至: 2025-12-31
国药准字: 国药准字H12345678
贮藏: 密封，在阴凉处保存
成分: 阿莫西林`;

      const result = ai.analyzeMedicineInfo(text);

      expect(result.name).toContain('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g×12粒');
      expect(result.manufacturer).toBe('华北制药股份有限公司');
      expect(result.usage).toBe('口服，一次0.5g，一日3次');
      expect(result.expiryDate).toBe('2025-12-31');
      expect(result.approvalNumber).toBe('国药准字H12345678');
      expect(result.storage).toBe('密封，在阴凉处保存');
      expect(result.ingredients).toBe('阿莫西林');
    });

    test('应该处理空输入', () => {
      const result = ai.analyzeMedicineInfo('');
      expect(result).toEqual({
        name: '',
        specification: '',
        manufacturer: '',
        usage: '',
        expiryDate: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });

    test('应该处理null输入', () => {
      const result = ai.analyzeMedicineInfo(null);
      expect(result.name).toBe('');
    });

    test('应该处理缺少部分信息的药品文本', () => {
      const text = '布洛芬片 规格: 200mg';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.name).toContain('布洛芬片');
      expect(result.specification).toBe('200mg');
      expect(result.manufacturer).toBe('');
    });

    test('应该提取隐含的规格信息', () => {
      const text = '阿莫西林胶囊 0.5g×12粒/盒';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.specification).toMatch(/0\.5g/);
    });

    test('应该提取隐含的国药准字', () => {
      const text = '药品信息 国药准字H12345678';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('国药准字H12345678');
    });

    test('应该处理多行文本', () => {
      const text = `药品名称: 阿莫西林胶囊
规格: 0.5g×12粒
生产企业: 华北制药`;
      const result = ai.analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g×12粒');
    });

    test('应该处理中文冒号和英文冒号', () => {
      const text1 = '规格：0.5g';
      const text2 = '规格: 0.5g';

      const result1 = ai.analyzeMedicineInfo(text1);
      const result2 = ai.analyzeMedicineInfo(text2);

      expect(result1.specification).toBe('0.5g');
      expect(result2.specification).toBe('0.5g');
    });

    test('应该处理日期格式', () => {
      const text = '有效期至: 2025年12月31日';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025年12月31日');
    });
  });

  describe('formatExpiryDate', () => {
    test('应该保持标准格式 YYYY-MM-DD', () => {
      const result = ai.formatExpiryDate('2025-12-31');
      expect(result).toBe('2025-12-31');
    });

    test('应该转换中文日期格式 YYYY年MM月DD日', () => {
      const result = ai.formatExpiryDate('2025年12月31日');
      expect(result).toBe('2025-12-31');
    });

    test('应该转换中文日期格式（无日字）', () => {
      const result = ai.formatExpiryDate('2025年12月31');
      expect(result).toBe('2025-12-31');
    });

    test('应该转换斜杠日期格式 YYYY/MM/DD', () => {
      const result = ai.formatExpiryDate('2025/12/31');
      expect(result).toBe('2025-12-31');
    });

    test('应该转换点号日期格式 YYYY.MM.DD', () => {
      const result = ai.formatExpiryDate('2025.12.31');
      expect(result).toBe('2025-12-31');
    });

    test('应该补齐月份和日期', () => {
      const result = ai.formatExpiryDate('2025年1月5日');
      expect(result).toBe('2025-01-05');
    });

    test('应该处理空输入', () => {
      expect(ai.formatExpiryDate('')).toBe('');
      expect(ai.formatExpiryDate(null)).toBe('');
      expect(ai.formatExpiryDate(undefined)).toBe('');
    });

    test('应该处理无法解析的日期格式', () => {
      const result = ai.formatExpiryDate('有效期一年');
      expect(result).toBe('有效期一年');
    });

    test('应该处理部分日期', () => {
      const result = ai.formatExpiryDate('2025-12');
      expect(result).toBe('2025-12');
    });

    test('应该处理带文字的日期', () => {
      const result = ai.formatExpiryDate('有效期至2025年12月31日');
      expect(result).toBe('2025-12-31');
    });
  });

  describe('extractMedicineName', () => {
    test('应该提取胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.5g';
      const result = ai.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应该提取片剂类药品', () => {
      const text = '布洛芬片 200mg';
      const result = ai.extractMedicineName(text);
      expect(result).toContain('布洛芬片');
    });

    test('应该处理空输入', () => {
      expect(ai.extractMedicineName('')).toBe('');
      expect(ai.extractMedicineName(null)).toBe('');
    });

    test('应该返回第一行作为默认', () => {
      const text = '未知药品\n其他信息';
      const result = ai.extractMedicineName(text);
      expect(result).toBe('未知药品');
    });

    test('应该截断超长名称', () => {
      const text = '这是一个非常非常非常非常非常长的药品名称描述';
      const result = ai.extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理只有规格信息的文本', () => {
      const text = '规格: 0.5g';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.specification).toBe('0.5g');
      expect(result.name).toBe('规格: 0.5g');
    });

    test('应该处理混合格式的文本', () => {
      const text = `阿莫西林胶囊
规格：0.5g×12粒
生产企业: 华北制药股份有限公司
有效期至: 2025/12/31`;

      const result = ai.analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g×12粒');
      expect(result.manufacturer).toBe('华北制药股份有限公司');
    });

    test('应该处理重复的关键词', () => {
      const text = '规格: 0.5g 规格: 0.5g';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.specification).toContain('0.5g');
    });

    test('应该处理特殊字符', () => {
      const text = '阿莫西林胶囊【规格】0.5g×12粒';
      const result = ai.analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林胶囊');
    });
  });
});