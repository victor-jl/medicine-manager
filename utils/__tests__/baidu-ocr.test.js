const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('should extract medicine name with keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g')).toBe('阿莫西林胶囊');
    expect(extractMedicineName('对乙酰氨基酚片')).toBe('对乙酰氨基酚片');
    expect(extractMedicineName('头孢拉定颗粒')).toBe('头孢拉定颗粒');
  });

  test('should handle multi-line text', () => {
    const text = `药品名称：感冒灵颗粒
规格：10g*9袋
生产厂家：XX制药`;
    expect(extractMedicineName(text)).toBe('感冒灵颗粒');
  });

  test('should return first 20 chars when no keyword found', () => {
    expect(extractMedicineName('无关键字药品测试名称')).toHaveLength(20);
  });

  test('should handle empty input', () => {
    expect(extractMedicineName('')).toBe('');
  });
});