const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('should extract medicine name with common keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*24粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释胶囊 0.3g*20粒')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
  });

  test('should extract medicine name with dosage form keywords', () => {
    expect(extractMedicineName('维生素C片 100mg*60片')).toContain('维生素');
    expect(extractMedicineName('葡萄糖酸钙口服液 10ml*12支')).toContain('葡萄糖酸钙');
    expect(extractMedicineName('创可贴 100片装')).toContain('创可贴');
  });

  test('should return first line when no keywords match', () => {
    expect(extractMedicineName('某药品名称\n规格：10mg\n生产厂家：XX制药')).toBe('某药品名称');
  });

  test('should handle empty text', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should handle short text', () => {
    expect(extractMedicineName('药片')).toBe('药片');
    expect(extractMedicineName('胶囊')).toBe('胶囊');
  });

  test('should handle text with special characters', () => {
    expect(extractMedicineName('【感冒清热颗粒】规格：12g*6袋')).toContain('感冒清热');
    expect(extractMedicineName('￥阿莫西林分散片 0.25g')).toContain('阿莫西林');
  });
});