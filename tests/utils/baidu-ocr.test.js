const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('should extract medicine name with capsule keyword', () => {
    const text = '阿莫西林胶囊';
    expect(extractMedicineName(text)).toContain('阿莫西林');
  });

  test('should extract medicine name with tablet keyword', () => {
    const text = '对乙酰氨基酚片';
    expect(extractMedicineName(text)).toContain('对乙酰氨基酚');
  });

  test('should extract medicine name with injection keyword', () => {
    const text = '头孢注射液';
    expect(extractMedicineName(text)).toContain('头孢');
  });

  test('should return first line when no keyword matches', () => {
    const text = '新药名称\n生产厂家\n有效期';
    expect(extractMedicineName(text)).toBe('新药名称');
  });

  test('should handle empty input', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('should handle null input', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('should handle undefined input', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return substring with keyword context', () => {
    const text = '药品说明：布洛芬缓释胶囊，用于缓解疼痛';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
  });

  test('should limit result when no keyword found', () => {
    const text = '无关键词药品名称测试文本内容较长';
    const result = extractMedicineName(text);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test('should handle fever and cold keywords', () => {
    expect(extractMedicineName('感冒灵')).toContain('感冒灵');
    expect(extractMedicineName('退烧药')).toContain('退烧');
  });

  test('should handle vitamin and supplement keywords', () => {
    expect(extractMedicineName('维生素D钙片')).toContain('维生素');
    expect(extractMedicineName('钙片')).toContain('钙片');
  });
});