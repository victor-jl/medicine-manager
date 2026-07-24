const { extractMedicineName } = require('../utils/baidu-ocr');

describe('extractMedicineName (baidu-ocr.js)', () => {
  test('空字符串返回空', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('null 输入返回空', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('undefined 输入返回空', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('剂型关键词（胶囊）优先匹配', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*24粒');
    expect(result).toContain('胶囊');
  });

  test('剂型关键词（片）优先匹配', () => {
    const result = extractMedicineName('布洛芬缓释片 0.3g');
    expect(result).toContain('片');
  });

  test('剂型关键词（颗粒）优先匹配', () => {
    const result = extractMedicineName('感冒清热颗粒 12g*10袋');
    expect(result).toContain('颗粒');
  });

  test('剂型词优先于药品名匹配（已知行为特征）', () => {
    const result = extractMedicineName('维生素C片 100mg');
    expect(result).toContain('片');
  });

  test('剂型词优先导致治疗领域关键词不被匹配', () => {
    const result = extractMedicineName('血压监测 硝苯地平片');
    expect(result).toContain('片');
    expect(result).not.toContain('血压');
  });

  test('无关键词时返回第一行', () => {
    const result = extractMedicineName('某种神秘药品\n第二行内容');
    expect(result).toBe('某种神秘药品');
  });

  test('上下文窗口只有5字符，药品名前缀可能被截断', () => {
    const result = extractMedicineName('产品说明书 奥美拉唑肠溶胶囊 20mg');
    expect(result).toContain('胶囊');
  });

  test('剂型词在前，对乙酰氨基酚被截断', () => {
    const result = extractMedicineName('对乙酰氨基酚片 0.5g');
    expect(result).toContain('片');
    expect(result).toContain('乙酰氨基酚');
  });

  test('关键词在中间时提取前后上下文', () => {
    const result = extractMedicineName('山东新华制药 布洛芬片 0.2g*100片');
    expect(result).toContain('片');
  });
});
