const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  test('应提取包含药品剂型的名称', () => {
    const text = '阿莫西林胶囊 0.5g';
    const result = extractMedicineName(text);
    expect(result).toMatch(/阿莫西林.*胶囊/);
  });

  test('应匹配药品关键词 - 片剂', () => {
    const text = '布洛芬片 0.2g';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
  });

  test('应匹配药品关键词 - 颗粒', () => {
    const text = '感冒灵颗粒 10g';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒灵');
  });

  test('应匹配药品关键词 - 口服液', () => {
    const text = '双黄连口服液 10ml';
    const result = extractMedicineName(text);
    expect(result).toContain('双黄连');
  });

  test('应匹配药品关键词 - 软膏', () => {
    const text = '红霉素软膏 10g';
    const result = extractMedicineName(text);
    expect(result).toContain('红霉素');
  });

  test('应匹配药品关键词 - 注射液', () => {
    const text = '头孢注射液 1.0g';
    const result = extractMedicineName(text);
    expect(result).toContain('头孢');
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

  test('应匹配感冒药关键词', () => {
    const text = '感冒药感冒灵颗粒';
    const result = extractMedicineName(text);
    expect(result).toContain('感冒');
  });

  test('应匹配咳嗽药关键词', () => {
    const text = '咳嗽药复方甘草';
    const result = extractMedicineName(text);
    expect(result).toContain('咳嗽');
  });

  test('应匹配腹泻药关键词', () => {
    const text = '腹泻药蒙脱石散';
    const result = extractMedicineName(text);
    expect(result).toContain('腹泻');
  });

  test('应处理包含多个关键词的文本 - 返回第一个匹配', () => {
    const text = '阿莫西林胶囊\n布洛芬片\n感冒灵颗粒';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应处理换行符分隔的文本', () => {
    const text = '第一行\n阿莫西林胶囊\n布洛芬片';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应处理回车符分隔的文本', () => {
    const text = '第一行\r\n阿莫西林胶囊\r\n布洛芬片';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应处理空字符串', () => {
    const result = extractMedicineName('');
    expect(result).toBe('');
  });

  test('应处理 null 输入', () => {
    const result = extractMedicineName(null);
    expect(result).toBe('');
  });

  test('应处理 undefined 输入', () => {
    const result = extractMedicineName(undefined);
    expect(result).toBe('');
  });

  test('当无关键词匹配时应返回第一行', () => {
    const text = 'random text without medicine keywords';
    const result = extractMedicineName(text);
    expect(result).toBe('random text without medicine keywords'.substring(0, 30));
  });

  test('当无关键词匹配时应限制长度为30字符', () => {
    const longText = 'a'.repeat(50);
    const result = extractMedicineName(longText);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('应处理大小写不敏感的匹配', () => {
    const text = 'AMOXICILLIN CAPSULE';
    const result = extractMedicineName(text);
    expect(result).toBeTruthy();
  });

  test('应处理混合大小写的文本', () => {
    const text = 'Amoxicillin 胶囊';
    const result = extractMedicineName(text);
    expect(result).toBeTruthy();
  });

  test('应提取包含关键词的上下文', () => {
    const text = '产品名称：阿莫西林胶囊 规格：0.5g';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('应处理只有一个关键词的文本', () => {
    const text = '维生素';
    const result = extractMedicineName(text);
    expect(result).toBe('维生素');
  });

  test('当关键词在文本中间时应正确提取', () => {
    const text = '产品：阿莫西林胶囊，生产日期2024';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('应处理真实OCR识别结果格式', () => {
    const ocrResult = `阿莫西林胶囊
国药准字H12345678
规格：0.5g
生产厂家：某某制药
有效期：2025-12-31`;
    const result = extractMedicineName(ocrResult);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });
});
