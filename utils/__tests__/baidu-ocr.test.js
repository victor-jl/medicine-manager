const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('should extract medicine name with common keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*24粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释胶囊 0.3g*20粒')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
  });

  test('should extract medicine name with disease keywords', () => {
    expect(extractMedicineName('退烧药 对乙酰氨基酚片')).toContain('退烧');
    expect(extractMedicineName('消炎药 头孢克肟胶囊')).toContain('消炎');
    expect(extractMedicineName('感冒药 复方氨酚烷胺片')).toContain('感冒');
  });

  test('should return first line when no keywords match', () => {
    expect(extractMedicineName('某未知药品\n规格：10mg\n厂家：XX')).toBe('某未知药品');
  });

  test('should handle empty text', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return substring when text is too long', () => {
    const longText = '这是一个非常长的药品名称描述文本，超过了20个字符的限制';
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test('should handle text with newlines', () => {
    const text = `阿莫西林胶囊
规格：0.5g*24粒
生产厂家：XX制药有限公司
国药准字：H12345678`;
    expect(extractMedicineName(text)).toContain('阿莫西林');
  });

  test('should handle text with carriage returns', () => {
    const text = '维生素C片\r\n100mg*60片\r\nXX制药';
    expect(extractMedicineName(text)).toContain('维生素');
  });
});