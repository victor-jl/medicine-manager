const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  it('should extract medicine name with common Chinese keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释胶囊 300mg')).toContain('布洛芬');
    expect(extractMedicineName('维生素D钙片')).toContain('维生素');
  });

  it('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('should return first line if no keywords match', () => {
    const result = extractMedicineName('Generic Medicine\nManufacturer: ABC');
    expect(result).toBe('Generic Medicine');
  });

  it('should handle multi-line text', () => {
    const text = `复方感冒灵颗粒
    国药准字Z44021469
    规格: 14g*9袋`;
    expect(extractMedicineName(text)).toContain('感冒');
  });

  it('should handle health condition keywords', () => {
    expect(extractMedicineName('高血压用药 硝苯地平')).toContain('血压');
    expect(extractMedicineName('退烧药 对乙酰氨基酚')).toContain('退烧');
    expect(extractMedicineName('感冒药 复方制剂')).toContain('感冒');
  });

  it('should return first line for long text without keywords', () => {
    const longText = 'This is a very long text without any medicine keywords';
    const result = extractMedicineName(longText);
    expect(result).toBe('This is a very long text without any medicine keywords');
  });

  it('should return substring when text is all whitespace separated', () => {
    const longText = '                                                                 ';
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});