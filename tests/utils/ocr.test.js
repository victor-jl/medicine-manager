const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  test('should extract medicine name containing keyword', () => {
    const text = '阿莫西林胶囊 0.5g*24粒';
    expect(extractMedicineName(text)).toContain('阿莫西林');
  });

  test('should extract medicine name with 片 keyword', () => {
    const text = '布洛芬缓释片 300mg*10片';
    expect(extractMedicineName(text)).toContain('布洛芬');
  });

  test('should extract medicine name with 颗粒 keyword', () => {
    const text = '感冒灵颗粒 10g*9袋';
    expect(extractMedicineName(text)).toContain('感冒灵');
  });

  test('should return first line when no keyword matches', () => {
    const text = '未知药品\n规格: 10ml\n厂家: 测试厂';
    const result = extractMedicineName(text);
    expect(result).toBe('未知药品');
  });

  test('should handle empty string', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('should handle null input', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('should handle undefined input', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should handle text with newline characters', () => {
    const text = '对乙酰氨基酚片\n规格: 500mg\n有效期至: 2025-12-31';
    expect(extractMedicineName(text)).toContain('对乙酰氨基酚');
  });

  test('should return substring when keyword found', () => {
    const text = '复方氨酚烷胺胶囊 用于缓解普通感冒及流行性感冒引起的发热';
    const result = extractMedicineName(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('氨酚烷胺');
  });

  test('should limit result length to 30 characters for no keyword matches', () => {
    const text = '这是一个非常长的药品名称没有任何关键词匹配测试';
    const result = extractMedicineName(text);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('should handle vitamin keywords', () => {
    const text = '维生素C片 100mg*60片';
    expect(extractMedicineName(text)).toContain('维生素');
  });

  test('should handle Chinese medicine keywords', () => {
    const text = '板蓝根颗粒 10g*20袋';
    expect(extractMedicineName(text)).toContain('板蓝根');
  });
});