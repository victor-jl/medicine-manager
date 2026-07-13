/**
 * utils/ai.js 测试
 * 测试药品信息分析和日期处理
 */

const { analyzeMedicineInfo, normalizeExpiryDate, formatExpiryDate } = require('../../utils/ai');

describe('ai.js', () => {
  describe('analyzeMedicineInfo', () => {
    test('应该从OCR文本中提取完整药品信息', () => {
      const text = `阿莫西林胶囊
规格：0.5g×12粒/盒
生产企业：某某制药有限公司
有效期至：2025-12-31
用法用量：口服，一次1粒，一日3次
国药准字H12345678
贮藏：密封，在干燥处保存
成分：阿莫西林三水合物`;

      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('阿莫西林胶囊');
      expect(result.expiryDate).toBe('2025-12-31');
      expect(result.specification).toBe('0.5g×12粒/盒');
      expect(result.manufacturer).toBe('某某制药有限公司');
      expect(result.usage).toBe('口服，一次1粒，一日3次');
      expect(result.approvalNumber).toBe('国药准字H12345678');
      expect(result.storage).toBe('密封，在干燥处保存');
      expect(result.ingredients).toBe('阿莫西林三水合物');
    });

    test('应该提取片剂药品名称', () => {
      const text = '布洛芬片\n有效期：2025-06-30';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('布洛芬片');
    });

    test('应该提取颗粒药品名称', () => {
      const text = '感冒灵颗粒\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('感冒灵颗粒');
    });

    test('应该提取口服液药品名称', () => {
      const text = '小儿止咳口服液\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('小儿止咳口服液');
    });

    test('应该提取注射液药品名称', () => {
      const text = '头孢注射液\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('头孢注射液');
    });

    test('应该处理有效期格式（YYYY-MM-DD）', () => {
      const text = '阿莫西林胶囊\n有效期至：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理有效期格式（YYYY/MM/DD）', () => {
      const text = '阿莫西林胶囊\n有效期至：2025/12/31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理有效期格式（YYYY年MM月DD日）', () => {
      const text = '阿莫西林胶囊\n有效期至：2025年12月31日';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理有效期格式（YYYYMM）', () => {
      const text = '阿莫西林胶囊\n有效期至：202512';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理有效期格式（YYYY.MM.DD）', () => {
      const text = '阿莫西林胶囊\n有效期至：2025.12.31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理EXP格式', () => {
      const text = '阿莫西林胶囊\nEXP:2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理失效期格式', () => {
      const text = '阿莫西林胶囊\n失效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应该处理无关键词时使用第一行作为名称', () => {
      const text = '这是第一行\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBe('这是第一行');
    });

    test('应该处理空文本', () => {
      const result = analyzeMedicineInfo('');
      
      expect(result.name).toBe('');
      expect(result.expiryDate).toBe('');
    });

    test('应该处理null值', () => {
      const result = analyzeMedicineInfo(null);
      
      expect(result.name).toBe('');
    });

    test('应该处理undefined值', () => {
      const result = analyzeMedicineInfo(undefined);
      
      expect(result.name).toBe('');
    });

    test('应该处理非字符串输入', () => {
      const result = analyzeMedicineInfo(123);
      
      expect(result.name).toBe('');
    });

    test('应该限制名称长度', () => {
      const longName = '这是一个非常长的药品名称超过三十个字符应该被截断部分内容';
      const text = longName + '\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name.length).toBeLessThanOrEqual(30);
    });

    test('应该提取生产企业', () => {
      const text = '阿莫西林胶囊\n生产企业：某某制药公司';
      const result = analyzeMedicineInfo(text);
      
      expect(result.manufacturer).toBe('某某制药公司');
    });

    test('应该提取生产厂家', () => {
      const text = '阿莫西林胶囊\n生产厂家：某某制药公司';
      const result = analyzeMedicineInfo(text);
      
      expect(result.manufacturer).toBe('某某制药公司');
    });

    test('应该提取用法', () => {
      const text = '阿莫西林胶囊\n用法：口服';
      const result = analyzeMedicineInfo(text);
      
      expect(result.usage).toBe('口服');
    });

    test('应该提取贮藏条件', () => {
      const text = '阿莫西林胶囊\n贮藏：密封保存';
      const result = analyzeMedicineInfo(text);
      
      expect(result.storage).toBe('密封保存');
    });

    test('应该提取成分', () => {
      const text = '阿莫西林胶囊\n成分：阿莫西林';
      const result = analyzeMedicineInfo(text);
      
      expect(result.ingredients).toBe('阿莫西林');
    });
  });

  describe('normalizeExpiryDate', () => {
    test('应该标准化YYYY-MM-DD格式', () => {
      expect(normalizeExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    test('应该标准化YYYY/MM/DD格式', () => {
      expect(normalizeExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    test('应该标准化YYYY年MM月DD日格式', () => {
      expect(normalizeExpiryDate('2025年12月31日')).toBe('2025-12-31');
    });

    test('应该标准化YYYY.MM.DD格式', () => {
      expect(normalizeExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    test('应该标准化YYYYMMDD格式', () => {
      expect(normalizeExpiryDate('20251231')).toBe('2025-12-31');
    });

    test('应该标准化YYYYMM格式（自动添加最后一天）', () => {
      expect(normalizeExpiryDate('202512')).toBe('2025-12-31');
    });

    test('应该标准化YYYY-MM格式（自动添加最后一天）', () => {
      expect(normalizeExpiryDate('2025-12')).toBe('2025-12-31');
    });

    test('应该处理2月（非闰年）', () => {
      expect(normalizeExpiryDate('2025-02')).toBe('2025-02-28');
    });

    test('应该处理2月（闰年）', () => {
      expect(normalizeExpiryDate('2024-02')).toBe('2024-02-29');
    });

    test('应该处理小月（4月）', () => {
      expect(normalizeExpiryDate('2025-04')).toBe('2025-04-30');
    });

    test('应该处理大月（1月）', () => {
      expect(normalizeExpiryDate('2025-01')).toBe('2025-01-31');
    });

    test('应该处理无效格式（返回原始值）', () => {
      expect(normalizeExpiryDate('invalid-date')).toBe('invalid-date');
    });

    test('应该处理空字符串', () => {
      expect(normalizeExpiryDate('')).toBe('');
    });

    test('应该处理null值', () => {
      expect(normalizeExpiryDate(null)).toBe('');
    });

    test('应该处理undefined值', () => {
      expect(normalizeExpiryDate(undefined)).toBe('');
    });
  });

  describe('formatExpiryDate', () => {
    test('应该保持标准格式不变', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    test('应该标准化非标准格式', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    test('应该标准化YYYYMMDD格式', () => {
      expect(formatExpiryDate('20251231')).toBe('2025-12-31');
    });

    test('应该处理空字符串', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    test('应该处理null值', () => {
      expect(formatExpiryDate(null)).toBe('');
    });

    test('应该处理undefined值', () => {
      expect(formatExpiryDate(undefined)).toBe('');
    });
  });
});