const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr.js - extractMedicineName', () => {
  it('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should extract medicine name containing keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊')).toBeTruthy();
    expect(extractMedicineName('对乙酰氨基酚片')).toBeTruthy();
    expect(extractMedicineName('阿奇霉素颗粒')).toBeTruthy();
  });

  it('should extract name from multi-line text', () => {
    const text = '对乙酰氨基酚片\n500mg*24片\n有效期至2025年12月';
    const result = extractMedicineName(text);
    expect(result).toContain('对乙酰氨基酚');
  });

  it('should return first non-empty line when no keywords found', () => {
    const text = '某种药品\n说明文字';
    const result = extractMedicineName(text);
    expect(result).toBe('某种药品');
  });

  it('should limit name length to 20 characters when no keywords', () => {
    const longText = 'a'.repeat(30);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});