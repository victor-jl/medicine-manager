const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('should extract medicine name with common keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊')).toBe('阿莫西林胶囊');
    expect(extractMedicineName('布洛芬片')).toBe('布洛芬片');
    expect(extractMedicineName('头孢克肟颗粒')).toBe('头孢克肟颗粒');
  });

  test('should extract from detailed OCR result', () => {
    const text = `布洛芬缓释胶囊
    规格：0.3克
    生产厂家：中美史克
    有效期至：2025-12-31`;
    expect(extractMedicineName(text)).toBe('布洛芬缓释胶囊');
  });

  test('should handle null and undefined', () => {
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should handle empty string', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('should extract medical condition keywords', () => {
    expect(extractMedicineName('退烧药 对乙酰氨基酚')).toBe('退烧药 对乙酰氨基酚');
    expect(extractMedicineName('感冒药 感冒灵颗粒')).toBe('感冒药 感冒灵颗粒');
  });

  test('should return first line when no keywords match', () => {
    const text = '某不知名药品\n批号：20230101\n生产日期：2023-01-01';
    expect(extractMedicineName(text)).toBe('某不知名药品');
  });

  test('should handle short text with no keywords', () => {
    expect(extractMedicineName('测试药品')).toBe('测试药品');
  });

  test('should extract based on disease keywords', () => {
    expect(extractMedicineName('治疗高血压的药物')).toBe('治疗高血压的药物');
    expect(extractMedicineName('治感冒的药')).toBe('治感冒的药');
  });
});