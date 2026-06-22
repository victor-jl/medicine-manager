const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn().mockReturnValue(''),
      setStorageSync: jest.fn()
    };
  });

  it('should return empty string when input is null', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  it('should return empty string when input is undefined', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should return empty string when input is empty', () => {
    expect(extractMedicineName('')).toBe('');
  });

  it('should extract medicine name with common keywords', () => {
    const input = '阿莫西林胶囊 规格0.5g 国药准字H12345678';
    const result = extractMedicineName(input);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  it('should extract medicine name with tablet keyword', () => {
    const input = '布洛芬片 每片0.4g';
    const result = extractMedicineName(input);
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  it('should extract medicine name with granule keyword', () => {
    const input = '感冒灵颗粒 10g*9袋';
    const result = extractMedicineName(input);
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  it('should return first line when no keywords matched', () => {
    const input = '不明药品\n生产日期：2024-01-01\n有效期至：2025-12-31';
    const result = extractMedicineName(input);
    expect(result).toBe('不明药品');
  });

  it('should return substring when no keywords matched and text is long', () => {
    const input = '这是一个很长的文本没有任何药品关键词信息';
    const result = extractMedicineName(input);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('should handle multiline input correctly', () => {
    const input = '对乙酰氨基酚片\n规格：0.5g\n生产厂家：XX制药';
    const result = extractMedicineName(input);
    expect(result).toContain('对乙酰氨基酚');
    expect(result).toContain('片');
  });

  it('should handle case insensitive matching', () => {
    const input = 'AMOXICILLIN胶囊 阿莫西林';
    const result = extractMedicineName(input);
    expect(result).toContain('阿莫西林');
  });

  it('should extract medicine name with injection keyword', () => {
    const input = '头孢曲松钠注射液 1.0g';
    const result = extractMedicineName(input);
    expect(result).toContain('头孢');
    expect(result).toContain('注射液');
  });
});