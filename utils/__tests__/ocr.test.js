const { extractMedicineName } = require('../ocr');

describe('ocr.js - extractMedicineName', () => {
  it('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should extract medicine name containing common keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊')).toBeTruthy();
    expect(extractMedicineName('布洛芬片')).toBeTruthy();
    expect(extractMedicineName('感冒灵颗粒')).toBeTruthy();
    expect(extractMedicineName('维生素C片')).toBeTruthy();
    expect(extractMedicineName('头孢克肟胶囊')).toBeTruthy();
  });

  it('should extract name from multi-line text containing keywords', () => {
    const text = `
      药品名称：阿莫西林胶囊
      规格：0.5g*20粒
      有效期至：2026-12-31
      生产厂家：XX制药厂
    `;
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  it('should return first non-empty line when no keywords found', () => {
    const text = '未知药品名称\n规格：100ml';
    const result = extractMedicineName(text);
    expect(result).toBe('未知药品名称');
  });

  it('should handle text with special characters', () => {
    const text = '【布洛芬缓释胶囊】规格：0.3g';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
  });

  it('should handle lowercase variations', () => {
    expect(extractMedicineName('AMOXICILLIN capsule')).toBe('AMOXICILLIN capsule');
  });

  it('should limit name length to 30 characters', () => {
    const longText = 'a'.repeat(50);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});