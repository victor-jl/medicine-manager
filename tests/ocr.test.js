// tests/ocr.test.js
const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName (utils/ocr.js)', () => {
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

  test('应提取包含口服液关键词的药品名', () => {
    const text = '止咳口服液 100ml';
    const result = extractMedicineName(text);
    expect(result).toContain('止咳');
    expect(result).toContain('口服液');
  });

  test('应处理大小写不敏感的匹配', () => {
    const text = 'TONGCHUANG阿莫西林CAPSULE';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应返回关键词前后文本作为上下文', () => {
    const text = '功能主治：阿莫西林胶囊用于敏感菌感染';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('应返回第一行当无关键词匹配', () => {
    const text = '某种未知药品名称';
    const result = extractMedicineName(text);
    expect(result).toBe('某种未知药品名称');
  });

  test('应限制返回名称的长度', () => {
    const longText = '这是一个非常长的药品名称描述' + 'X'.repeat(100);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('应正确处理多行文本', () => {
    const text = `阿莫西林胶囊
规格：0.25g
有效期至2025-12-31`;
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应匹配中药关键词', () => {
    const text = '板蓝根颗粒\n功能主治：清热解毒';
    const result = extractMedicineName(text);
    expect(result).toContain('板蓝根');
  });

  test('应匹配西药关键词', () => {
    const text = '硝苯地平缓释片\n规格：30mg';
    const result = extractMedicineName(text);
    expect(result).toContain('硝苯地平');
  });

  test('应匹配糖尿病用药关键词', () => {
    const text = '二甲双胍片 0.5g';
    const result = extractMedicineName(text);
    expect(result).toContain('二甲双胍');
  });

  test('应匹配心血管用药关键词', () => {
    const text = '氯吡格雷片 75mg';
    const result = extractMedicineName(text);
    expect(result).toContain('氯吡格雷');
  });

  test('应匹配抗过敏药关键词', () => {
    const text = '氯雷他定片 10mg';
    const result = extractMedicineName(text);
    expect(result).toContain('氯雷他定');
  });

  test('应处理OCR识别结果中的特殊字符', () => {
    const text = '维生素B族片剂（OTC）';
    const result = extractMedicineName(text);
    expect(result).toContain('维生素');
  });

  test('应优先匹配更长的关键词', () => {
    const text = '头孢克肟胶囊';
    const result = extractMedicineName(text);
    // 应该匹配完整关键词
    expect(result).toContain('头孢');
  });
});
