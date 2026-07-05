const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  it('should return empty string when input is empty', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should extract medicine name containing 胶囊 keyword', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*20粒');
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  it('should extract medicine name containing 片 keyword', () => {
    const result = extractMedicineName('布洛芬片 0.2g*100片');
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  it('should extract medicine name containing 颗粒 keyword', () => {
    const result = extractMedicineName('感冒灵颗粒 10g*9袋');
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  it('should return first line when no keywords match', () => {
    const result = extractMedicineName('维生素C\n100mg*30片\n有效期至2025年12月');
    expect(result).toBe('维生素C');
  });

  it('should return truncated text when no keywords match and single line', () => {
    const result = extractMedicineName('Some long medicine name without keyword');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('should extract medicine around keyword with context', () => {
    const result = extractMedicineName('复方对乙酰氨基酚片');
    expect(result).toContain('对乙酰氨基酚');
    expect(result).toContain('片');
  });

  it('should handle multi-line text correctly', () => {
    const text = `头孢克肟胶囊
规格：0.1g*6粒
生产厂家：XX制药
有效期至2025-12-31`;
    const result = extractMedicineName(text);
    expect(result).toContain('头孢');
    expect(result).toContain('胶囊');
  });
});