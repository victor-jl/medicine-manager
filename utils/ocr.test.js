const { extractMedicineName } = require('./ocr');
const baiduOcr = require('./baidu-ocr');

describe('extractMedicineName (from ocr.js)', () => {
  test('returns empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('extracts medicine with keyword like 胶囊', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*24粒')).toContain('阿莫西林胶囊');
    expect(extractMedicineName('感冒灵颗粒 10g*10袋')).toContain('感冒灵颗粒');
    expect(extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
  });

  test('returns first line if no keywords found', () => {
    expect(extractMedicineName('Unknown Medicine\nOther Line')).toBe('Unknown Medicine');
  });

  test('limits result length when no keywords', () => {
    const longText = 'Very long medicine name that should be truncated to 30 characters';
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});

describe('extractMedicineName (from baidu-ocr.js)', () => {
  test('returns empty string for empty input', () => {
    expect(baiduOcr.extractMedicineName('')).toBe('');
  });

  test('extracts medicine with keyword like 片', () => {
    expect(baiduOcr.extractMedicineName('对乙酰氨基酚片 0.3g*20片')).toContain('片');
  });

  test('returns first line if no keywords found', () => {
    expect(baiduOcr.extractMedicineName('My Medicine\nInstructions')).toBe('My Medicine');
  });
});
