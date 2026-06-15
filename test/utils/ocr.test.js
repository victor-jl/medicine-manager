const { extractMedicineName } = require('../../utils/ocr');

describe('ocr.js - extractMedicineName', () => {
  test('should extract medicine name containing keyword', () => {
    const text = '阿莫西林胶囊 0.5g*20粒 国药准字H12345678';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with dosage form keywords', () => {
    expect(extractMedicineName('布洛芬片 100片')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*12袋')).toContain('感冒灵');
    expect(extractMedicineName('维生素C口服液 10ml*10支')).toContain('维生素');
  });

  test('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return first line when no keyword matches', () => {
    const text = '未知药品名称\n生产厂家：XXX公司\n规格：100mg';
    const result = extractMedicineName(text);
    expect(result).toBe('未知药品名称');
  });

  test('should handle text with only keyword', () => {
    expect(extractMedicineName('胶囊')).toBe('胶囊');
    expect(extractMedicineName('片')).toBe('片');
  });

  test('should handle lowercase input', () => {
    const text = 'amoxicillin capsules 阿莫西林胶囊';
    const result = extractMedicineName(text);
    expect(result.toLowerCase()).toContain('阿莫西林');
  });

  test('should extract around keyword with context', () => {
    const text = '【药品名称】头孢克肟分散片【规格】50mg';
    const result = extractMedicineName(text);
    expect(result).toContain('头孢');
  });
});