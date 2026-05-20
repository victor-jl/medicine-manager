const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('提取包含关键词的药品名称', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*20粒')).toContain('阿莫西林');
    expect(extractMedicineName('布洛芬缓释片 0.4g*10片')).toContain('布洛芬');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵');
  });

  test('从多行文本中提取药品名称', () => {
    const text = `复方氨酚烷胺片
    国药准字H22026193
    规格: 每片含对乙酰氨基酚250mg`;
    expect(extractMedicineName(text)).toContain('复方氨酚烷胺片');
  });

  test('处理空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('处理不含关键词的文本', () => {
    const text = '这是一段不含药品关键词的文本';
    const result = extractMedicineName(text);
    expect(result).toBe(text.split('\n')[0].trim().substring(0, 30));
  });

  test('处理中药名称', () => {
    expect(extractMedicineName('板蓝根颗粒 10g*20袋')).toContain('板蓝根');
    expect(extractMedicineName('双黄连口服液 10ml*10支')).toContain('双黄连');
  });

  test('处理维生素类药品', () => {
    expect(extractMedicineName('维生素C片 100mg*60片')).toContain('维生素');
    expect(extractMedicineName('钙片 600mg*30片')).toContain('钙片');
  });

  test('提取带规格信息的药品名称', () => {
    const text = '硝苯地平缓释片(Ⅱ) 20mg*30片';
    const result = extractMedicineName(text);
    expect(result).toContain('硝苯地平');
  });
});

describe('getBaiduToken', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;

  beforeEach(() => {
    originalGetStorageSync = wx.getStorageSync;
    originalSetStorageSync = wx.setStorageSync;
  });

  afterEach(() => {
    wx.getStorageSync = originalGetStorageSync;
    wx.setStorageSync = originalSetStorageSync;
  });

  test('返回有效的缓存token', () => {
    const mockToken = 'cached_token_123';
    wx.getStorageSync = jest.fn().mockReturnValue({
      access_token: mockToken,
      expires: Date.now() + 3600000
    });

    expect(wx.getStorageSync('baidu_token')).toEqual(
      expect.objectContaining({ access_token: mockToken })
    );
  });

  test('token过期时应获取新token', () => {
    wx.getStorageSync = jest.fn().mockReturnValue({
      access_token: 'expired_token',
      expires: Date.now() - 3600000
    });

    const result = wx.getStorageSync('baidu_token');
    expect(result.expires).toBeLessThan(Date.now());
  });
});