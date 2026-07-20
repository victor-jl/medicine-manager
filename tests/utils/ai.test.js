const { analyzeMedicineInfo, formatExpiryDate } = require('../../utils/ai');

describe('utils/ai.analyzeMedicineInfo', () => {
  it('空输入应返回包含空字段的对象', () => {
    const result = analyzeMedicineInfo('');
    expect(result).toMatchObject({
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

  it('应从文本中提取药品名称', () => {
    const result = analyzeMedicineInfo('本品为阿莫西林胶囊，每粒0.25g');
    expect(result.name).toContain('阿莫西林胶囊');
  });

  it('应提取有效期并格式化为 YYYY-MM', () => {
    const result = analyzeMedicineInfo('有效期至 2026年08月');
    expect(result.expiryDate).toBe('2026-08');
  });
});

describe('utils/ai.formatExpiryDate', () => {
  it('应原样返回有效日期', () => {
    expect(formatExpiryDate('2026-08-01')).toBe('2026-08-01');
  });

  it('空值应返回空字符串', () => {
    expect(formatExpiryDate('')).toBe('');
    expect(formatExpiryDate(null)).toBe('');
    expect(formatExpiryDate(undefined)).toBe('');
  });
});
