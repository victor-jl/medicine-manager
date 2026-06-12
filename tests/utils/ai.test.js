const { analyzeMedicineInfo, formatExpiryDate } = require('../../utils/ai');

describe('analyzeMedicineInfo', () => {
  test('should return empty object for empty input', () => {
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

  test('should return empty object for null input', () => {
    const result = analyzeMedicineInfo(null);
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

  test('should extract medicine name from text', () => {
    const text = '阿莫西林胶囊\n规格: 0.5g\n厂家: 华北制药';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('阿莫西林胶囊');
  });

  test('should extract expiry date', () => {
    const text = '布洛芬缓释片\n有效期至：2025-12-31';
    const result = analyzeMedicineInfo(text);
    expect(result.expiryDate).toBe('2025-12-31');
  });

  test('should extract specification', () => {
    const text = '感冒灵颗粒\n规格: 10g*9袋';
    const result = analyzeMedicineInfo(text);
    expect(result.specification).toBe('10g*9袋');
  });

  test('should extract manufacturer', () => {
    const text = '维生素C片\n生产厂家: 养生堂';
    const result = analyzeMedicineInfo(text);
    expect(result.manufacturer).toBe('养生堂');
  });

  test('should extract approval number', () => {
    const text = '头孢克肟胶囊\n国药准字H20051234';
    const result = analyzeMedicineInfo(text);
    expect(result.approvalNumber).toBe('H20051234');
  });

  test('should extract name from first line when no keyword matches', () => {
    const text = '未知药品名称\n规格: 10ml';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('未知药品名称');
  });

  test('should handle full medicine label text', () => {
    const text = `阿莫西林胶囊
规格: 0.5g*24粒
生产厂家: 华北制药股份有限公司
有效期至：2025-12-31
国药准字H13024138`;
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('阿莫西林胶囊');
    expect(result.specification).toBe('0.5g*24粒');
    expect(result.manufacturer).toBe('华北制药股份有限公司');
    expect(result.expiryDate).toBe('2025-12-31');
    expect(result.approvalNumber).toBe('H13024138');
  });

  test('should limit name to 30 characters', () => {
    const text = '这是一个非常长的药品名称没有任何关键词匹配测试文本内容';
    const result = analyzeMedicineInfo(text);
    expect(result.name.length).toBeLessThanOrEqual(30);
  });
});

describe('formatExpiryDate', () => {
  test('should format date with year/month/day format', () => {
    expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
  });

  test('should format date with hyphen separator', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
  });

  test('should format date with slash separator', () => {
    expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
  });

  test('should handle single digit month and day', () => {
    expect(formatExpiryDate('2025-5-1')).toBe('2025-05-01');
  });

  test('should handle date with 号 suffix', () => {
    expect(formatExpiryDate('2025年12月31号')).toBe('2025-12-31');
  });

  test('should return empty string for empty input', () => {
    expect(formatExpiryDate('')).toBe('');
  });

  test('should return original string for unrecognized format', () => {
    expect(formatExpiryDate('有效期至2025年底')).toBe('有效期至2025年底');
  });

  test('should handle date without day', () => {
    expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
  });

  test('should handle null input', () => {
    expect(formatExpiryDate(null)).toBe('');
  });
});