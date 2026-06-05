const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('提取包含胶囊关键词的名称', () => {
    const text = '阿莫西林胶囊 0.5克';
    expect(extractMedicineName(text)).toContain('阿莫西林');
  });

  test('提取包含片关键词的名称', () => {
    const text = '对乙酰氨基酚片 500mg';
    expect(extractMedicineName(text)).toContain('对乙酰氨基酚');
  });

  test('提取包含颗粒关键词的名称', () => {
    const text = '感冒灵颗粒 10g';
    expect(extractMedicineName(text)).toContain('感冒灵');
  });

  test('提取包含注射液关键词的名称', () => {
    const text = '葡萄糖注射液 500ml';
    expect(extractMedicineName(text)).toContain('葡萄糖');
  });

  test('处理空字符串', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('处理null输入', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('无匹配关键词时返回第一行', () => {
    const text = '不明药品\n规格：10ml';
    const result = extractMedicineName(text);
    expect(result).toBe(text.substring(0, 20));
  });

  test('处理包含退烧关键词的文本', () => {
    const text = '退烧药 布洛芬缓释胶囊';
    expect(extractMedicineName(text)).toContain('退烧');
  });

  test('处理包含消炎关键词的文本', () => {
    const text = '消炎药 头孢拉定';
    expect(extractMedicineName(text)).toContain('消炎');
  });

  test('处理维生素类药品', () => {
    const text = '维生素B族片';
    expect(extractMedicineName(text)).toContain('维生素');
  });
});