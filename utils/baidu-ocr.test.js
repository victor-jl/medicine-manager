const { extractMedicineName } = require('./baidu-ocr');

describe('baidu-ocr.js - extractMedicineName', () => {
  test('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should extract medicine name containing capsule keyword', () => {
    const text = '头孢克肟胶囊 0.1g*6粒';
    const result = extractMedicineName(text);
    expect(result).toContain('头孢克肟');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name containing tablet keyword', () => {
    const text = '对乙酰氨基酚片 0.5g*24片';
    const result = extractMedicineName(text);
    expect(result).toContain('对乙酰氨基酚');
    expect(result).toContain('片');
  });

  test('should extract medicine name with fever keyword', () => {
    const text = '退烧药 布洛芬缓释胶囊';
    const result = extractMedicineName(text);
    expect(result).toContain('退烧');
  });

  test('should extract medicine name with cold keyword', () => {
    const text = '感冒药 复方感冒灵片';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒');
  });

  test('should extract medicine name with vitamins keyword', () => {
    const text = '钙片 碳酸钙D3片';
    const result = extractMedicineName(text);
    expect(result).toContain('钙片');
  });

  test('should return first line when no keyword matches', () => {
    const text = '新型药品\n规格: 100mg\n生产厂家: 新药厂';
    const result = extractMedicineName(text);
    expect(result).toBe('新型药品');
  });

  test('should handle text with multiple lines and mixed content', () => {
    const text = `阿奇霉素分散片
    每片0.25克
    用于治疗敏感细菌所引起的感染
    国药准字H10980180`;
    const result = extractMedicineName(text);
    expect(result).toContain('阿奇霉素');
    expect(result).toContain('分散片');
  });

  test('should handle case insensitivity for keywords', () => {
    const text = 'AMOXICILLIN CAPSULE 阿莫西林胶囊';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should truncate long names to 20 characters when no keyword matches', () => {
    const longText = ''.padStart(30, 'x');
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test('should handle text with various line endings', () => {
    const textWithCr = '感冒灵颗粒\r10g*9袋\r华润三九';
    const textWithLf = '感冒灵颗粒\n10g*9袋\n华润三九';
    const textWithCrLf = '感冒灵颗粒\r\n10g*9袋\r\n华润三九';
    
    expect(extractMedicineName(textWithCr)).toContain('感冒灵');
    expect(extractMedicineName(textWithLf)).toContain('感冒灵');
    expect(extractMedicineName(textWithCrLf)).toContain('感冒灵');
  });

  test('should filter out empty lines', () => {
    const text = '\n\n布洛芬缓释胶囊\n\n0.3g*10粒\n\n';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
    expect(result).toContain('缓释胶囊');
  });
});