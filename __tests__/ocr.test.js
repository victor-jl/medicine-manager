const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName (ocr.js)', () => {
  test('提取包含胶囊的药品名称', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*24粒');
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('提取包含片的药品名称', () => {
    const result = extractMedicineName('布洛芬缓释片 0.3g');
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  test('提取包含颗粒的药品名称', () => {
    const result = extractMedicineName('感冒清热颗粒 12g*10袋');
    expect(result).toContain('感冒清热');
    expect(result).toContain('颗粒');
  });

  test('提取包含维生素的药品名称', () => {
    const result = extractMedicineName('维生素C片 100mg*100片');
    expect(result).toContain('维生素');
  });

  test('空字符串返回空', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('null/undefined 输入返回空', () => {
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('无关键词时返回第一行', () => {
    const result = extractMedicineName('某种神秘药品\n第二行内容');
    expect(result).toBe('某种神秘药品');
  });

  test('多行文本中提取关键词', () => {
    const text = '产品说明书\n奥美拉唑肠溶胶囊\n20mg*14粒\n用法用量：口服';
    const result = extractMedicineName(text);
    expect(result).toContain('奥美拉唑');
    expect(result).toContain('胶囊');
  });

  test('对乙酰氨基酚识别', () => {
    const result = extractMedicineName('对乙酰氨基酚片 0.5g');
    expect(result).toContain('对乙酰氨基酚');
  });

  test('关键词匹配在中间时提取前后上下文', () => {
    const result = extractMedicineName('山东新华制药 布洛芬片 0.2g*100片');
    expect(result).toContain('布洛芬');
  });

  test('超长文本截断', () => {
    const longText = 'A'.repeat(100);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});
