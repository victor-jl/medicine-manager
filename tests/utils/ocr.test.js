const { extractMedicineName } = require('../../utils/ocr');

describe('ocr.js - extractMedicineName', () => {
  test('提取包含关键词的药品名称', () => {
    const text = '阿莫西林胶囊 0.5g*24粒 国药准字H12345678';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('提取布洛芬相关药品', () => {
    const text = '布洛芬缓释胶囊 0.3g*20粒';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
  });

  test('提取中药感冒药', () => {
    const text = '感冒灵颗粒 10g*9袋';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒灵');
  });

  test('处理空字符串', () => {
    const result = extractMedicineName('');
    expect(result).toBe('');
  });

  test('处理undefined', () => {
    const result = extractMedicineName(undefined);
    expect(result).toBe('');
  });

  test('处理不包含关键词的文本', () => {
    const text = '这是一个测试文本，不包含药品关键词';
    const result = extractMedicineName(text);
    expect(result).toBe(text.substring(0, 30));
  });

  test('处理包含多个关键词的文本', () => {
    const text = '维生素C片 100mg*60片 生产厂家：XX制药';
    const result = extractMedicineName(text);
    expect(result).toContain('维生素');
  });

  test('处理口服液类型药品', () => {
    const text = '双黄连口服液 10ml*10支';
    const result = extractMedicineName(text);
    expect(result).toContain('双黄连');
    expect(result).toContain('口服液');
  });
});