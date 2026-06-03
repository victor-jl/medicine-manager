const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('提取常见药品名称', () => {
    expect(extractMedicineName('阿莫西林胶囊')).toBe('阿莫西林胶囊');
    
    const result = extractMedicineName('布洛芬缓释胶囊 0.3g');
    expect(result).toContain('布洛芬缓释胶囊');
  });

  test('处理包含症状关键词的文本', () => {
    const result1 = extractMedicineName('感冒灵颗粒 用于感冒引起的头痛');
    expect(result1).toContain('感冒灵颗粒');
    
    const result2 = extractMedicineName('退烧口服液 发热时服用');
    expect(result2).toContain('退烧口服液');
  });

  test('处理空输入', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
  });

  test('处理无匹配关键词的文本', () => {
    const result = extractMedicineName('普通文本没有药品信息');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe('普通文本没有药品信息'.substring(0, 20));
  });

  test('处理多行文本返回第一行', () => {
    const text = `第一行是药品名
第二行是规格
第三行是说明`;
    expect(extractMedicineName(text)).toBe('第一行是药品名');
  });
});