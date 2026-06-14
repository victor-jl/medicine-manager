const { analyzeMedicineInfo, formatExpiryDate } = require('../ai');

describe('analyzeMedicineInfo', () => {
  test('should extract basic medicine info', () => {
    const text = `阿莫西林胶囊
规格：0.5g*24粒
生产厂家：XX制药有限公司
有效期至：2025年12月31日
国药准字H12345678
贮藏：密封，阴凉干燥处`;

    const result = analyzeMedicineInfo(text);

    expect(result.name).toContain('阿莫西林');
    expect(result.specification).toBe('0.5g*24粒');
    expect(result.manufacturer).toBe('XX制药有限公司');
    expect(result.expiryDate).toBe('2025-12-31');
    expect(result.approvalNumber).toBe('H12345678');
    expect(result.storage).toBe('密封，阴凉干燥处');
  });

  test('should extract expiry date with different formats', () => {
    expect(analyzeMedicineInfo('有效期：2025-12-31').expiryDate).toBe('2025-12-31');
    expect(analyzeMedicineInfo('有效期至2025年06月30日').expiryDate).toBe('2025-06-30');
    expect(analyzeMedicineInfo('效期：2025/12/31').expiryDate).toBe('2025-12-31');
  });

  test('should handle empty text', () => {
    expect(analyzeMedicineInfo('')).toEqual({
      name: '', expiryDate: '', specification: '', manufacturer: '',
      usage: '', approvalNumber: '', storage: '', ingredients: ''
    });
    expect(analyzeMedicineInfo(null)).toEqual({
      name: '', expiryDate: '', specification: '', manufacturer: '',
      usage: '', approvalNumber: '', storage: '', ingredients: ''
    });
  });

  test('should extract medicine name from keywords', () => {
    expect(analyzeMedicineInfo('布洛芬缓释胶囊 0.3g')).name.toContain('布洛芬');
    expect(analyzeMedicineInfo('感冒灵颗粒 10g')).name.toContain('感冒灵');
    expect(analyzeMedicineInfo('维生素C片 100mg')).name.toContain('维生素');
  });

  test('should return first line as name when no keywords found', () => {
    const text = '某未知药品\n规格：10mg\n厂家：XX';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('某未知药品');
  });
});

describe('formatExpiryDate', () => {
  test('should format date with hyphens', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    expect(formatExpiryDate('2025-6-1')).toBe('2025-06-01');
  });

  test('should format date with Chinese characters', () => {
    expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    expect(formatExpiryDate('2025年6月1日')).toBe('2025-06-01');
  });

  test('should format date with slashes', () => {
    expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
  });

  test('should format 8-digit date', () => {
    expect(formatExpiryDate('20251231')).toBe('2025-12-31');
    expect(formatExpiryDate('20250601')).toBe('2025-06-01');
  });

  test('should handle empty string', () => {
    expect(formatExpiryDate('')).toBe('');
    expect(formatExpiryDate(null)).toBe('');
  });

  test('should return original if unrecognized format', () => {
    expect(formatExpiryDate('2025年')).toBe('2025年');
    expect(formatExpiryDate('未知')).toBe('未知');
  });
});