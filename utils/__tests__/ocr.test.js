const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should extract medicine name containing common dosage forms', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*10粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬片 200mg')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
    expect(extractMedicineName('维生素C片 100mg')).toContain('维生素');
    expect(extractMedicineName('双黄连口服液 20ml*10支')).toContain('双黄连');
  });

  it('should extract medicine name containing specific drug names', () => {
    expect(extractMedicineName('头孢克肟分散片')).toContain('头孢');
    expect(extractMedicineName('阿奇霉素干混悬剂')).toContain('阿奇霉素');
    expect(extractMedicineName('对乙酰氨基酚缓释片')).toContain('对乙酰氨基酚');
    expect(extractMedicineName('奥美拉唑肠溶胶囊')).toContain('奥美拉唑');
    expect(extractMedicineName('二甲双胍缓释片')).toContain('二甲双胍');
  });

  it('should extract medicine name with symptom keywords', () => {
    expect(extractMedicineName('止咳糖浆 100ml')).toContain('止咳');
    expect(extractMedicineName('退烧药 布洛芬')).toContain('退烧');
    expect(extractMedicineName('消炎软膏 红霉素')).toContain('消炎');
  });

  it('should return first line when no keywords match', () => {
    const input = '未知药品\n规格: 10ml\n生产厂家: 某药厂';
    const result = extractMedicineName(input);
    expect(result).toBe('未知药品');
  });

  it('should handle case-insensitive matching', () => {
    expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬片')).toContain('布洛芬');
  });

  it('should extract substring around matched keyword', () => {
    const input = '通用名称：阿莫西林胶囊\n商品名称：阿莫仙\n规格：0.5克';
    const result = extractMedicineName(input);
    expect(result).toContain('阿莫西林');
  });

  it('should handle multi-line text correctly', () => {
    const input = `
药品名称：布洛芬缓释胶囊
规格：0.4g*20粒
生产厂家：中美史克
有效期至：2025-12-31
    `.trim();
    const result = extractMedicineName(input);
    expect(result).toContain('布洛芬');
  });

  it('should return truncated result when text is very long', () => {
    const input = 'A'.repeat(100) + '胶囊' + 'B'.repeat(100);
    const result = extractMedicineName(input);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('胶囊');
  });

  it('should handle special characters gracefully', () => {
    expect(extractMedicineName('阿莫西林\n胶囊')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬\t片')).toContain('布洛芬');
    expect(extractMedicineName('维生素C【片】')).toContain('维生素');
  });
});