const { analyzeMedicineInfo, formatExpiryDate } = require('../ai');

describe('ai.js - analyzeMedicineInfo', () => {
  it('should return empty object for empty input', () => {
    const result = analyzeMedicineInfo('');
    expect(result).toEqual({
      name: '',
      expiryDate: '',
      specification: '',
      manufacturer: '',
      usage: '',
      approvalNumber: '',
      storage: '',
      ingredients: ''
    });
  });

  it('should extract name from text containing medicine keywords', () => {
    const result = analyzeMedicineInfo('阿莫西林胶囊');
    expect(result.name).toBe('阿莫西林胶囊');
  });

  it('should extract expiry date from various formats', () => {
    let result = analyzeMedicineInfo('有效期至：2026-12-31');
    expect(result.expiryDate).toBe('2026-12-31');

    result = analyzeMedicineInfo('有效期 2026/12/31');
    expect(result.expiryDate).toBe('2026/12/31');

    result = analyzeMedicineInfo('expires 2026-12-31');
    expect(result.expiryDate).toBe('2026-12-31');
  });

  it('should extract specification', () => {
    const result = analyzeMedicineInfo('规格：0.5g*20粒');
    expect(result.specification).toBe('0.5g*20粒');
  });

  it('should extract manufacturer', () => {
    const result = analyzeMedicineInfo('生产厂家：XX制药有限公司');
    expect(result.manufacturer).toBe('XX制药有限');
  });

  it('should extract approval number', () => {
    const result = analyzeMedicineInfo('国药准字H12345678');
    expect(result.approvalNumber).toBe('国药准字H12345678');
  });

  it('should extract multiple fields from complete medicine text', () => {
    const text = `
      阿莫西林胶囊
      规格：0.5g*20粒
      有效期至：2026-12-31
      生产厂家：XX制药厂
      国药准字H12345678
    `;
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('阿莫西林胶囊');
    expect(result.specification).toBe('0.5g*20粒');
    expect(result.expiryDate).toBe('2026-12-31');
    expect(result.approvalNumber).toBe('国药准字H12345678');
  });

  it('should return first line as name when no keywords found', () => {
    const text = `
      未知药品
      规格：100ml
    `;
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('未知药品');
  });
});

describe('ai.js - formatExpiryDate', () => {
  it('should return empty string for empty input', () => {
    expect(formatExpiryDate('')).toBe('');
    expect(formatExpiryDate(null)).toBe('');
    expect(formatExpiryDate(undefined)).toBe('');
  });

  it('should format YYYY-MM-DD correctly', () => {
    expect(formatExpiryDate('2026-12-31')).toBe('2026-12-31');
  });

  it('should format YYYY/MM/DD correctly', () => {
    expect(formatExpiryDate('2026/12/31')).toBe('2026-12-31');
  });

  it('should format YYYY年MM月DD日 correctly', () => {
    expect(formatExpiryDate('2026年12月31日')).toBe('2026-12-31');
  });

  it('should pad single digit months and days', () => {
    expect(formatExpiryDate('2026-1-1')).toBe('2026-01-01');
    expect(formatExpiryDate('2026/12/1')).toBe('2026-12-01');
  });

  it('should handle MM-DD format by adding current year', () => {
    const currentYear = new Date().getFullYear();
    const result = formatExpiryDate('12-31');
    expect(result).toBe(`${currentYear}-12-31`);
  });

  it('should handle incomplete dates', () => {
    expect(formatExpiryDate('2026')).toBe('2026');
    expect(formatExpiryDate('未知')).toBe('未知');
  });
});