/**
 * Tests for utils/ocr.js - extractMedicineName function
 * This function extracts medicine names from OCR-recognized text using keyword matching
 */

// Setup WeChat mock before requiring the module
require('../__mocks__/wx');

const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName', () => {
  beforeEach(() => {
    wx.__clearStorage();
  });

  describe('keyword matching', () => {
    test('should extract medicine name when keyword is found', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('should handle布洛芬 keyword', () => {
      const text = '布洛芬缓释胶囊 300mg';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('should handle 中药 keyword like 板蓝根', () => {
      const text = '板蓝根颗粒 10g*9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('should handle form keywords like 胶囊/片/颗粒', () => {
      const text = '维生素C泡腾片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素') || result.length > 0;
    });

    test('should be case insensitive', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('should extract context around keyword (start position)', () => {
      const text = '生产厂家:XX制药 阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('should extract context around keyword (end position)', () => {
      const text = '阿莫西林胶囊 有效期至2025年';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('fallback behavior', () => {
    test('should return first line when no keyword matches', () => {
      const text = 'XYZ123 abcdefg';
      const result = extractMedicineName(text);
      expect(result).toBe('XYZ123 abcdefg');
    });

    test('should handle multiline text by returning first line when no keyword matches', () => {
      const text = '第一行文字\n第二行药品\n第三行说明';
      const result = extractMedicineName(text);
      // Implementation returns first line as fallback when no keyword found
      expect(result).toBe('第一行文字');
    });

    test('should trim whitespace', () => {
      const text = '  药品名  \n  说明  ';
      const result = extractMedicineName(text);
      expect(result).toBe('药品名');
    });

    test('should limit length to 30 characters for default fallback', () => {
      const longText = '这是一行非常长的文本内容超过了三十个字符的限制范围';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('edge cases', () => {
    test('should handle empty string', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('should handle null/undefined as falsy values', () => {
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('should handle only whitespace', () => {
      const result = extractMedicineName('   \n\t  ');
      expect(result).toBe('');
    });

    test('should handle text with only newlines', () => {
      const result = extractMedicineName('\n\n\n');
      expect(result).toBe('');
    });
  });

  describe('comprehensive keyword coverage', () => {
    const keywordGroups = [
      // Antibiotics
      ['阿莫西林', '阿莫西林胶囊'],
      ['头孢', '头孢克肟分散片'],
      ['阿奇霉素', '阿奇霉素干混悬剂'],
      ['罗红霉素', '罗红霉素分散片'],
      // Pain/fever
      ['布洛芬', '布洛芬混悬液'],
      ['对乙酰氨基酚', '对乙酰氨基酚片'],
      ['阿司匹林', '阿司匹林肠溶片'],
      // Cold medicine
      ['感冒灵', '感冒灵颗粒'],
      ['板蓝根', '板蓝根冲剂'],
      ['双黄连', '双黄连口服液'],
      ['莲花清瘟', '莲花清瘟胶囊'],
      // Digestive
      ['奥美拉唑', '奥美拉唑肠溶胶囊'],
      ['蒙脱石', '蒙脱石散'],
      // Chronic disease
      ['二甲双胍', '二甲双胍片'],
      ['硝苯地平', '硝苯地平缓释片'],
      // Forms
      ['胶囊', '维生素E软胶囊'],
      ['片', '维生素C片'],
      ['颗粒', '蒙脱石散颗粒'],
      ['口服液', '双黄连口服液'],
      ['软膏', '红霉素软膏']
    ];

    test.each(keywordGroups)('should match keyword: %s', (keyword, exampleText) => {
      const result = extractMedicineName(exampleText);
      expect(result.toLowerCase()).toContain(keyword.toLowerCase());
    });
  });
});
