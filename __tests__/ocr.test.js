// __tests__/ocr.test.js
require('../test/wx.mock');
const { extractMedicineName } = require('../utils/ocr');

describe('OCR Utility Functions', () => {
  describe('extractMedicineName', () => {
    test('应从关键词提取药品名称（胶囊类）', () => {
      const testCases = [
        { text: '阿莫西林胶囊', expected: '阿莫西林胶囊' },
        { text: '头孢克肟胶囊 0.1g', expected: '头孢克肟胶囊' },
        { text: '感冒灵胶囊', expected: '感冒灵胶囊' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应从关键词提取药品名称（片剂类）', () => {
      const testCases = [
        { text: '布洛芬片 0.1g', expected: '布洛芬片' },
        { text: '阿司匹林肠溶片', expected: '阿司匹林肠溶片' },
        { text: '维生素c片', expected: '维生素c片' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应从关键词提取药品名称（颗粒类）', () => {
      const testCases = [
        { text: '感冒清热颗粒', expected: '感冒清热颗粒' },
        { text: '小儿氨酚黄那敏颗粒', expected: '颗粒' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应从关键词提取药品名称（口服液类）', () => {
      const testCases = [
        { text: '双黄连口服液', expected: '双黄连口服液' },
        { text: '藿香正气口服液', expected: '藿香正气口服液' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应识别常见药品品牌名', () => {
      const testCases = [
        { text: '阿莫西林分散片', expected: '阿莫西林' },
        { text: '布洛芬缓释胶囊', expected: '布洛芬' },
        { text: '对乙酰氨基酚片', expected: '对乙酰氨基酚' },
        { text: '头孢拉定胶囊', expected: '头孢' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应处理多行文本', () => {
      const text = `产品名称
阿莫西林胶囊
规格：0.5g*24粒`;
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应处理不包含关键词的文本', () => {
      const text = '这是一个普通的文本';
      const result = extractMedicineName(text);
      // 应该返回第一行（限制长度）
      expect(result).toBe(text.substring(0, 30));
    });

    test('应处理空输入', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应限制返回名称长度', () => {
      const longText = '这是一个非常非常非常非常非常非常非常非常非常非常非常长的药品名称';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('应正确处理大小写', () => {
      const text = 'AMOXICILLIN 胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别包含关键词的完整词组', () => {
      const text = '批准文号 国药准字H13022558 产品名称 阿莫西林胶囊 规格 0.5g*24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应处理特殊字符和空格', () => {
      const text = '阿莫西林胶囊（分散片）';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应识别注射液类型', () => {
      const text = '头孢曲松钠注射液 1.0g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏和贴剂', () => {
      const testCases = [
        { text: '红霉素软膏', expected: '软膏' },
        { text: '麝香壮骨膏贴剂', expected: '贴剂' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应识别滴眼液和糖浆', () => {
      const testCases = [
        { text: '左氧氟沙星滴眼液', expected: '滴眼液' },
        { text: '止咳糖浆', expected: '糖浆' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = extractMedicineName(text);
        expect(result).toContain(expected);
      });
    });

    test('应优先匹配最具体的药品类型', () => {
      const text = '感冒灵颗粒 胶囊';
      const result = extractMedicineName(text);
      // 应该匹配到第一个找到的关键词
      expect(result).toMatch(/颗粒|胶囊/);
    });

    test('应处理混合信息文本', () => {
      const text = `批准文号：国药准字H13022558
产品名称：阿莫西林胶囊
规格：0.5g*24粒
生产企业：华北制药股份有限公司
有效期至：2025-12-31`;
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });
  });

  describe('OCR 结果处理边界条件', () => {
    test('应处理包含数字的药品名称', () => {
      const text = '维生素C片 0.1g';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应处理包含英文名称的药品', () => {
      const text = 'Ibuprofen 布洛芬片';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应处理重复关键词', () => {
      const text = '阿莫西林胶囊胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });
});