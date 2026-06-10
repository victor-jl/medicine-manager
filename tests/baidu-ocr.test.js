// tests/baidu-ocr.test.js
const { extractMedicineName } = require('../utils/baidu-ocr');

describe('extractMedicineName (utils/baidu-ocr.js)', () => {
  test('应返回空字符串当输入为空', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('应提取包含胶囊关键词的药品名', () => {
    const text = '阿莫西林胶囊 0.25g';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('应提取包含片剂关键词的药品名', () => {
    const text = '布洛芬片 0.2g';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  test('应提取包含颗粒关键词的药品名', () => {
    const text = '感冒灵颗粒 10g';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  test('应处理大小写不敏感的匹配（中文关键词）', () => {
    const text = '阿莫西林CAPSULE';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应返回关键词前后文本作为上下文', () => {
    const text = '【功能主治】阿莫西林胶囊适用于敏感菌';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应返回第一行当无关键词匹配', () => {
    const text = 'UNKNOWN_MEDICINE';
    const result = extractMedicineName(text);
    expect(result).toBe('UNKNOWN_MEDICINE');
  });

  test('应限制无匹配时返回第一行的长度', () => {
    const longText = '药品描述' + 'X'.repeat(50);
    const result = extractMedicineName(longText);
    // 无关键词匹配时返回第一行
    expect(result.length).toBe(longText.length);
  });

  test('应处理换行符分隔的多行文本', () => {
    const text = '板蓝根颗粒\n规格：10g*9袋';
    const result = extractMedicineName(text);
    expect(result).toContain('板蓝根');
  });

  test('应匹配退烧药关键词', () => {
    const text = '退烧止痛片';
    const result = extractMedicineName(text);
    expect(result).toContain('退烧');
  });

  test('应匹配消炎药关键词', () => {
    const text = '消炎药阿莫西林';
    const result = extractMedicineName(text);
    expect(result).toContain('消炎');
  });

  test('应匹配维生素类关键词', () => {
    const text = '维生素C片';
    const result = extractMedicineName(text);
    expect(result).toContain('维生素');
  });

  test('应匹配胃药关键词', () => {
    const text = '胃药奥美拉唑';
    const result = extractMedicineName(text);
    expect(result).toContain('胃药');
  });

  test('应处理CRLF换行符', () => {
    const text = '止咳糖浆\r\n用法：口服';
    const result = extractMedicineName(text);
    expect(result).toContain('止咳');
  });

  test('应处理中西医结合描述', () => {
    const text = '中西药复方制剂';
    const result = extractMedicineName(text);
    expect(result).toContain('复方制剂');
  });
});
