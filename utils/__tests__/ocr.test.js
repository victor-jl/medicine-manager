const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('should extract medicine name containing keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*10粒')).toBe('阿莫西林胶囊');
    expect(extractMedicineName('布洛芬缓释胶囊 200mg')).toBe('布洛芬缓释胶囊');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toBe('感冒灵颗粒');
  });

  test('should return first line when no keyword matches', () => {
    expect(extractMedicineName('不明药品\n生产日期：2023-01-01')).toBe('不明药品');
    expect(extractMedicineName('某药物名称\n规格：500mg')).toBe('某药物名称');
  });

  test('should handle empty or null input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should handle various keyword positions', () => {
    expect(extractMedicineName('复方氨酚烷胺片')).toBe('复方氨酚烷胺片');
    expect(extractMedicineName('生产厂家：XX制药 头孢克肟颗粒')).toBe('头孢克肟颗粒');
    expect(extractMedicineName('维生素C片 每片含VC 100mg')).toBe('维生素C片');
  });

  test('should truncate long names', () => {
    const longName = '非常长的药品名称测试药品名称非常长的药品名称测试';
    expect(extractMedicineName(longName).length).toBeLessThanOrEqual(30);
  });
});