const { extractMedicineName: ocrExtract } = require('../utils/ocr');
const { extractMedicineName: baiduExtract } = require('../utils/baidu-ocr');

describe('utils/ocr.js extractMedicineName', () => {
  test('空输入返回空字符串', () => {
    expect(ocrExtract('')).toBe('');
  });

  test('从剂型关键词提取药品名', () => {
    expect(ocrExtract('阿莫西林胶囊 0.25g')).toContain('阿莫西林胶囊');
    expect(ocrExtract('布洛芬片 0.3g')).toContain('布洛芬片');
    expect(ocrExtract('感冒灵颗粒 12g')).toContain('感冒灵颗粒');
  });

  test('从有效成分关键词提取药品名', () => {
    expect(ocrExtract('对乙酰氨基酚 退烧')).toContain('对乙酰氨基酚');
    expect(ocrExtract('二甲双胍 降血糖')).toContain('二甲双胍');
  });

  test('无匹配关键词时返回第一行', () => {
    expect(ocrExtract('神秘药品\n其他说明')).toBe('神秘药品');
  });

  test('超长文本截断到30字符', () => {
    const long = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    expect(ocrExtract(long).length).toBeLessThanOrEqual(30);
  });
});

describe('utils/baidu-ocr.js extractMedicineName', () => {
  test('空输入返回空字符串', () => {
    expect(baiduExtract('')).toBe('');
  });

  test('从剂型关键词提取药品名', () => {
    expect(baiduExtract('阿莫西林胶囊')).toContain('阿莫西林胶囊');
    expect(baiduExtract('布洛芬缓释片')).toContain('布洛芬缓释片');
  });

  test('从有效成分关键词提取药品名', () => {
    expect(baiduExtract('奥美拉唑 胃药')).toContain('奥美拉唑');
  });

  test('无匹配关键词时返回第一行非空行', () => {
    expect(baiduExtract('\n\n第一行有效内容\n第二行')).toBe('第一行有效内容');
  });

  test('无关键词匹配的单行文本返回该行内容', () => {
    expect(baiduExtract('特殊药品名称')).toBe('特殊药品名称');
  });
});
