const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  it('should extract medicine name containing common keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*10粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬片 200mg')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
  });

  it('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should extract substring around keyword', () => {
    const result = extractMedicineName('复方板蓝根颗粒 国药准字Z44021469');
    expect(result.length).toBeGreaterThan(2);
  });

  it('should return first line if no keywords found', () => {
    const result = extractMedicineName('Unknown Medicine\nSome description');
    expect(result).toBe('Unknown Medicine');
  });

  it('should handle case-insensitive matching', () => {
    expect(extractMedicineName('AMOXICILLIN 胶囊')).toContain('胶囊');
    expect(extractMedicineName('Ibuprofen 片')).toContain('片');
  });

  it('should handle edge cases with special characters', () => {
    expect(extractMedicineName('维生素C片 ￥28.00')).toContain('维生素');
    expect(extractMedicineName('头孢克肟分散片\\n规格:100mg')).toContain('头孢');
  });

  it('should limit result length', () => {
    const longText = '这是一个非常长的药品名称测试文本'.repeat(10);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});