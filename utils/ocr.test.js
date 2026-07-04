const { extractMedicineName } = require('./ocr');

describe('ocr.js - extractMedicineName', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn().mockReturnValue(null),
      setStorageSync: jest.fn()
    };
  });

  test('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should extract medicine name containing capsule keyword', () => {
    const text = '阿莫西林胶囊 0.5g*20粒 国药准字H12345678';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name containing tablet keyword', () => {
    const text = '布洛芬片 0.2g*100片 口服';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  test('should extract medicine name containing granules keyword', () => {
    const text = '感冒灵颗粒 10g*9袋 华润三九';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  test('should extract medicine name with Chinese medicine keywords', () => {
    const text = '双黄连口服液 20ml*10支';
    const result = extractMedicineName(text);
    expect(result).toContain('双黄连');
    expect(result).toContain('口服液');
  });

  test('should extract medicine name with vitamin keyword', () => {
    const text = '维生素C片 100mg*60片';
    const result = extractMedicineName(text);
    expect(result).toContain('维生素');
  });

  test('should return first line when no keyword matches', () => {
    const text = '未知药品名称\n规格: 500mg\n生产厂家: 某药厂';
    const result = extractMedicineName(text);
    expect(result).toBe('未知药品名称');
  });

  test('should handle text with multiple lines', () => {
    const text = `复方氨酚烷胺片
    每片含对乙酰氨基酚250毫克
    国药准字H22026193
    有效期至2025-12-31`;
    const result = extractMedicineName(text);
    expect(result).toContain('复方氨酚烷胺');
    expect(result).toContain('片');
  });

  test('should handle case insensitivity', () => {
    const text = 'AMOXICILLIN CAPSULE 阿莫西林胶囊';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should truncate long names to 30 characters', () => {
    const longText = ''.padStart(50, '测试药品名称');
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});