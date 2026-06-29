const { extractMedicineName } = require('../../utils/ocr');

describe('ocr.js - extractMedicineName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return empty string when input is null', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('should return empty string when input is undefined', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return empty string when input is empty', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('should extract medicine name with 胶囊 keyword', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*20粒');
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with 片 keyword', () => {
    const result = extractMedicineName('布洛芬片 0.1g*100片');
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  test('should extract medicine name with 颗粒 keyword', () => {
    const result = extractMedicineName('感冒灵颗粒 10g*9袋');
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  test('should extract medicine name with 口服液 keyword', () => {
    const result = extractMedicineName('双黄连口服液 10ml*10支');
    expect(result).toContain('双黄连');
    expect(result).toContain('口服液');
  });

  test('should extract medicine name with 注射液 keyword', () => {
    const result = extractMedicineName('维生素C注射液 2ml:0.5g*10支');
    expect(result).toContain('维生素C');
    expect(result).toContain('注射液');
  });

  test('should extract medicine name with western medicine keywords', () => {
    const result = extractMedicineName('阿莫西林分散片 0.5g*12片');
    expect(result).toContain('阿莫西林');
  });

  test('should extract medicine name with traditional Chinese medicine keywords', () => {
    const result = extractMedicineName('板蓝根颗粒 10g*20袋');
    expect(result).toContain('板蓝根');
  });

  test('should return first line when no keyword matches', () => {
    const text = '不明药品\n规格：500mg\n生产日期：2023-01-01';
    const result = extractMedicineName(text);
    expect(result).toBe('不明药品');
  });

  test('should handle text with newline characters', () => {
    const text = '药品名称\n阿莫西林胶囊\n规格：0.5g\n有效期至：2025-12-31';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should handle text with special characters', () => {
    const text = '【药品名称】布洛芬缓释胶囊\n【规格】0.3g';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
    expect(result).toContain('胶囊');
  });

  test('should return truncated text when no keyword matches and text is long', () => {
    const text = '这是一段很长的文本，没有任何药品关键词，用于测试默认截取行为。这是一段很长的文本，没有任何药品关键词，用于测试默认截取行为。';
    const result = extractMedicineName(text);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('should handle case-insensitive keyword matching', () => {
    const result = extractMedicineName('AMOXICILLIN胶囊 0.5g');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with vitamin keyword', () => {
    const result = extractMedicineName('维生素D3软胶囊 1000IU*60粒');
    expect(result).toContain('维生素');
  });

  test('should extract medicine name with calcium keyword', () => {
    const result = extractMedicineName('钙片 600mg*30片');
    expect(result).toContain('钙片');
  });

  test('should extract medicine name with 感冒 keyword', () => {
    const result = extractMedicineName('感冒清热颗粒 12g*6袋');
    expect(result).toContain('感冒清热');
    expect(result).toContain('颗粒');
  });

  test('should extract medicine name with 消炎 keyword', () => {
    const result = extractMedicineName('消炎利胆片 0.25g*100片');
    expect(result).toContain('消炎');
    expect(result).toContain('片');
  });

  test('should extract medicine name with 退烧 keyword', () => {
    const result = extractMedicineName('对乙酰氨基酚退热栓 0.3g*10枚');
    expect(result).toContain('对乙酰氨基酚');
  });

  test('should extract medicine name with 止痛 keyword', () => {
    const result = extractMedicineName('布洛芬止痛片 0.2g*20片');
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });
});
