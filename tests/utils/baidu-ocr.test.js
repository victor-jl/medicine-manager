const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr.js - extractMedicineName', () => {
  test('提取包含胶囊关键词的药品', () => {
    const text = '头孢克肟胶囊 50mg*12粒';
    const result = extractMedicineName(text);
    expect(result).toContain('头孢');
    expect(result).toContain('胶囊');
  });

  test('提取颗粒类型药品', () => {
    const text = '板蓝根颗粒 10g*20袋';
    const result = extractMedicineName(text);
    expect(result).toContain('板蓝根');
  });

  test('提取注射液类型药品', () => {
    const text = '氯化钠注射液 500ml';
    const result = extractMedicineName(text);
    expect(result).toContain('氯化钠');
    expect(result).toContain('注射液');
  });

  test('处理空字符串', () => {
    const result = extractMedicineName('');
    expect(result).toBe('');
  });

  test('处理不包含关键词的文本返回第一行', () => {
    const text = '药品名称未知\n生产批号：12345\n有效期至：2025-12-31';
    const result = extractMedicineName(text);
    expect(result).toBe('药品名称未知');
  });

  test('处理单行文本', () => {
    const text = '简单药品名称';
    const result = extractMedicineName(text);
    expect(result).toBe('简单药品名称');
  });

  test('处理超短文本', () => {
    const text = '药';
    const result = extractMedicineName(text);
    expect(result).toBe('药');
  });

  test('提取不含片剂的退烧药品', () => {
    const text = '感冒清热退烧颗粒 10g*9袋';
    const result = extractMedicineName(text);
    expect(result).toContain('退烧');
  });

  test('提取包含药片关键词的药品', () => {
    const text = '对乙酰氨基酚片 0.5g*10片';
    const result = extractMedicineName(text);
    expect(result).toContain('片');
  });

  test('提取不含常见关键词的药品名称', () => {
    const text = '特殊药品名称ABC';
    const result = extractMedicineName(text);
    expect(result).toBe('特殊药品名称ABC'.substring(0, 20));
  });
});