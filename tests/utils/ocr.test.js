const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  test('提取包含药品关键词的文本', () => {
    const result1 = extractMedicineName('阿莫西林胶囊 0.5g*10粒');
    expect(result1).toContain('阿莫西林胶囊');
    
    const result2 = extractMedicineName('布洛芬片 200mg');
    expect(result2).toContain('布洛芬片');
    
    const result3 = extractMedicineName('感冒灵颗粒 10g*9袋');
    expect(result3).toContain('感冒灵颗粒');
  });

  test('提取包含剂型关键词的文本', () => {
    expect(extractMedicineName('维生素C片')).toBe('维生素C片');
    
    const result = extractMedicineName('葡萄糖注射液 500ml');
    expect(result).toContain('葡萄糖注射液');
    
    const result2 = extractMedicineName('红霉素软膏 10g');
    expect(result2).toContain('红霉素软膏');
  });

  test('处理空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('处理不包含关键词的文本', () => {
    const result = extractMedicineName('这是一个普通文本');
    expect(result.length).toBeGreaterThan(0);
    
    const result2 = extractMedicineName('药品说明书');
    expect(result2.length).toBeGreaterThan(0);
  });

  test('处理多行文本', () => {
    const text = `复方氨酚烷胺胶囊
国药准字H11022102
每粒含对乙酰氨基酚250毫克`;
    const result = extractMedicineName(text);
    expect(result).toContain('复方氨酚烷胺胶囊');
  });

  test('处理中文和数字混合文本', () => {
    const result = extractMedicineName('硝苯地平缓释片II 20mg');
    expect(result).toContain('硝苯地平');
    
    const result2 = extractMedicineName('格列齐特片 80mg*30片');
    expect(result2).toContain('格列齐特片');
  });

  test('关键词位置在文本末尾', () => {
    const result = extractMedicineName('请服用 阿司匹林');
    expect(result).toContain('阿司匹林');
  });

  test('关键词位置在文本开头', () => {
    const result = extractMedicineName('头孢克肟胶囊 请遵医嘱');
    expect(result).toContain('头孢克肟胶囊');
  });
});