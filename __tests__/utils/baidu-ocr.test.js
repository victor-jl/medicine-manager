const { extractMedicineName, getAccessToken } = require('../../utils/baidu-ocr');

describe('baidu-ocr.js - extractMedicineName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return empty string when input is null', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('should return empty string when input is undefined', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('should return empty string when input is empty', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('should extract medicine name with 胶囊 keyword', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*20粒');
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with 片 keyword', () => {
    const result = extractMedicineName('布洛芬片 0.1g*100片');
    expect(result).toContain('布洛芬');
    expect(result).toContain('片');
  });

  test('should extract medicine name with 颗粒 keyword', () => {
    const result = extractMedicineName('感冒灵颗粒 10g*9袋');
    expect(result).toContain('感冒灵');
    expect(result).toContain('颗粒');
  });

  test('should extract medicine name with 口服液 keyword', () => {
    const result = extractMedicineName('双黄连口服液 10ml*10支');
    expect(result).toContain('双黄连');
    expect(result).toContain('口服液');
  });

  test('should extract medicine name with western medicine keywords', () => {
    const result = extractMedicineName('阿莫西林胶囊 0.5g*12片');
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with traditional Chinese medicine keywords', () => {
    const result = extractMedicineName('板蓝根颗粒 10g*20袋');
    expect(result).toContain('板蓝根');
  });

  test('should return first line when no keyword matches', () => {
    const text = '不明药品\n规格：500mg\n生产日期：2023-01-01';
    const result = extractMedicineName(text);
    expect(result).toBe('不明药品');
  });

  test('should handle text with newline characters', () => {
    const text = '药品名称\n阿莫西林胶囊\n规格：0.5g\n有效期至：2025-12-31';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
    expect(result).toContain('胶囊');
  });

  test('should handle text with special characters', () => {
    const text = '【药品名称】布洛芬缓释胶囊\n【规格】0.3g';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
    expect(result).toContain('胶囊');
  });

  test('should return first line when no keyword matches', () => {
    const text = '不明药品\n规格：500mg\n生产日期：2023-01-01';
    const result = extractMedicineName(text);
    expect(result).toBe('不明药品');
  });

  test('should return first line when no keyword matches and text is long', () => {
    const text = '这是一段很长的文本，没有任何药品关键词，用于测试默认截取行为。';
    const result = extractMedicineName(text);
    const lines = text.split(/[\n\r]/).filter(line => line.trim());
    expect(result).toBe(lines[0]);
  });

  test('should handle case-insensitive keyword matching', () => {
    const result = extractMedicineName('AMOXICILLIN胶囊 0.5g');
    expect(result).toContain('胶囊');
  });

  test('should extract medicine name with 感冒 keyword', () => {
    const result = extractMedicineName('感冒清热颗粒 12g*6袋');
    expect(result).toContain('感冒');
  });

  test('should extract medicine name with 咳嗽 keyword', () => {
    const result = extractMedicineName('止咳糖浆 100ml');
    expect(result).toContain('止咳');
  });

  test('should extract medicine name with 腹泻 keyword', () => {
    const result = extractMedicineName('止泻药 蒙脱石散 3g*10袋');
    expect(result).toContain('止泻');
  });

  test('should extract medicine name with 血压 keyword', () => {
    const result = extractMedicineName('硝苯地平缓释片 用于高血压 10mg*30片');
    expect(result).toContain('血压');
  });

  test('should extract medicine name with 血糖 keyword', () => {
    const result = extractMedicineName('二甲双胍片 用于降血糖 500mg*60片');
    expect(result).toContain('血糖');
  });
});

describe('baidu-ocr.js - getAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return cached token when available and not expired', async () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'baidu_access_token') return 'cached_token';
      if (key === 'baidu_token_expires') return Date.now() + 100000;
      return null;
    });

    const token = await getAccessToken();
    expect(token).toBe('cached_token');
    expect(wx.request).not.toHaveBeenCalled();
  });

  test('should fetch new token when cached token is expired', async () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'baidu_access_token') return 'cached_token';
      if (key === 'baidu_token_expires') return Date.now() - 100000;
      return null;
    });

    await getAccessToken();
    expect(wx.request).toHaveBeenCalled();
  });

  test('should fetch new token when no cached token exists', async () => {
    wx.getStorageSync.mockReturnValue(null);
    await getAccessToken();
    expect(wx.request).toHaveBeenCalled();
  });
});
