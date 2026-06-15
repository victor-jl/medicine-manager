const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr.js - extractMedicineName', () => {
  test('should extract medicine name with common keywords', () => {
    const text = '阿奇霉素注射液 5ml:0.5g';
    const result = extractMedicineName(text);
    expect(result).toContain('阿奇霉素');
  });

  test('should match medicine type keywords', () => {
    expect(extractMedicineName('退烧口服液 10ml*6支')).toContain('退烧');
    expect(extractMedicineName('消炎软膏 15g')).toContain('消炎');
    expect(extractMedicineName('胃药胶囊 30粒')).toContain('胃药');
  });

  test('should handle empty or null input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
  });

  test('should return first line when no keyword found', () => {
    const text = '某药品\n生产批号：20230101\n有效期至：20251231';
    const result = extractMedicineName(text);
    expect(result).toBe('某药品');
  });

  test('should handle multi-line text with keyword', () => {
    const text = '【通用名称】\n对乙酰氨基酚片\n【商品名称】\n扑热息痛';
    const result = extractMedicineName(text);
    expect(result.toLowerCase()).toContain('对乙酰氨基酚');
  });

  test('should extract blood pressure related medicine', () => {
    const text = '硝苯地平缓释片 治疗高血压 规格：20mg';
    const result = extractMedicineName(text);
    expect(result).toContain('硝苯地平');
  });
});