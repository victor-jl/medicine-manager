const { extractMedicineName, getAccessToken } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('提取包含关键词的药品名称', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释片')).toContain('布洛芬');
  });

  test('处理空输入', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
  });

  test('处理不含关键词的文本返回第一行', () => {
    const text = '药品名称\n规格: 100mg';
    expect(extractMedicineName(text)).toBe('药品名称');
  });

  test('处理感冒相关药品', () => {
    expect(extractMedicineName('感冒清热颗粒 10g*12袋')).toContain('感冒');
    expect(extractMedicineName('感冒灵胶囊')).toContain('感冒灵');
  });
});