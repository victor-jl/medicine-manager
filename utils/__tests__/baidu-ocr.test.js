const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should extract substring around Chinese medicine keywords', () => {
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
    expect(extractMedicineName('阿莫西林胶囊 0.5g*20粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
    expect(extractMedicineName('头孢克肟颗粒')).toContain('头孢');
  });

  test('should extract substring around disease-related keywords', () => {
    expect(extractMedicineName('降压药硝苯地平片')).toContain('硝苯地平');
    expect(extractMedicineName('降糖药二甲双胍')).toContain('二甲双胍');
    expect(extractMedicineName('感冒药复方氨酚烷胺')).toContain('感冒');
    expect(extractMedicineName('止咳糖浆')).toContain('止咳');
    expect(extractMedicineName('止泻药蒙脱石散')).toContain('止泻');
  });

  test('should extract substring around dosage form keywords', () => {
    expect(extractMedicineName('维生素C片')).toContain('维生素');
    expect(extractMedicineName('葡萄糖酸钙口服液')).toContain('口服液');
    expect(extractMedicineName('红霉素软膏')).toContain('软膏');
    expect(extractMedicineName('云南白药膏')).toContain('药膏');
    expect(extractMedicineName('头孢注射液')).toContain('注射液');
  });

  test('should return first non-empty line when no keywords match', () => {
    const input = '\n\n未知药品\n生产批号：20240101\n有效期至：20261231';
    const result = extractMedicineName(input);
    expect(result).toBe('未知药品');
  });

  test('should return first 20 characters when no keywords match and single line', () => {
    const input = '这是一个没有任何药品关键词的长文本';
    const result = extractMedicineName(input);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test('should extract substring around tablet keyword', () => {
    const input = '头孢地尼分散片';
    const result = extractMedicineName(input);
    expect(result).toContain('分散片');
  });

  test('should return substring around keyword for long text', () => {
    const input = '生产厂家：某制药厂 药品名称：阿莫西林胶囊 规格：0.5g';
    const result = extractMedicineName(input);
    expect(result).toContain('阿莫西林');
  });
});