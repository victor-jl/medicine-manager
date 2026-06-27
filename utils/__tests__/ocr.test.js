const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('should return empty string for empty input', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should extract substring around keyword', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*20粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释胶囊 0.3g*10粒')).toContain('布洛芬');
    expect(extractMedicineName('头孢克肟颗粒 50mg*6袋')).toContain('头孢');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
  });

  test('should extract substring around dosage form keywords', () => {
    expect(extractMedicineName('维生素C片')).toContain('维生素');
    expect(extractMedicineName('葡萄糖酸钙口服液')).toContain('口服液');
    expect(extractMedicineName('红霉素软膏')).toContain('软膏');
    expect(extractMedicineName('云南白药膏')).toContain('药膏');
    expect(extractMedicineName('左氧氟沙星滴眼液')).toContain('滴眼液');
  });

  test('should extract substring around drug name keywords', () => {
    const result = extractMedicineName('某药厂生产的奥美拉唑肠溶胶囊');
    expect(result).toContain('奥美拉唑');
  });

  test('should return first line when no keywords match', () => {
    const input = '未知药品名称\n生产批号：20240101\n有效期至：20261231';
    const result = extractMedicineName(input);
    expect(result).toBe('未知药品名称');
  });

  test('should limit result length to 30 characters for fallback', () => {
    const input = '这是一个非常长的没有任何药品关键词的文本内容用于测试';
    const result = extractMedicineName(input);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('should handle text containing keywords', () => {
    const input = '【药品名称】头孢地尼分散片\n【规格】100mg*6片';
    const result = extractMedicineName(input);
    expect(result).toContain('头孢');
  });
});