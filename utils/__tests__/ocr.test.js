const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('should extract medicine name containing keywords', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*20粒')).toBe('阿莫西林胶囊');
    expect(extractMedicineName('布洛芬缓释胶囊 0.3g*10粒')).toBe('布洛芬缓释胶囊');
    expect(extractMedicineName('复方感冒灵颗粒 10g*9袋')).toBe('复方感冒灵颗粒');
  });

  test('should extract from multi-line text', () => {
    const text = `复方氨酚烷胺片
    国药准字H11022116
    规格: 每片含对乙酰氨基酚250毫克`;
    expect(extractMedicineName(text)).toBe('复方氨酚烷胺片');
  });

  test('should handle empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return first line when no keywords match', () => {
    const text = '未知药品名称\n生产厂家: 某某制药\n有效期: 2025-12';
    expect(extractMedicineName(text)).toBe('未知药品名称');
  });

  test('should handle vitamin and supplement keywords', () => {
    expect(extractMedicineName('维生素C片 100mg*30片')).toBe('维生素C片');
    expect(extractMedicineName('钙片 600mg*60粒')).toBe('钙片');
  });

  test('should handle Chinese medicine keywords', () => {
    expect(extractMedicineName('板蓝根颗粒 10g*20袋')).toBe('板蓝根颗粒');
    expect(extractMedicineName('双黄连口服液 10ml*10支')).toBe('双黄连口服液');
  });

  test('should handle short text', () => {
    expect(extractMedicineName('胶囊')).toBe('胶囊');
    expect(extractMedicineName('片')).toBe('片');
  });

  test('should handle mixed case text', () => {
    expect(extractMedicineName('Amoxicillin胶囊 阿莫西林')).toBe('Amoxicillin胶囊 阿莫西');
  });
});