// tests/utils/baidu-ocr.test.js
// utils/baidu-ocr.js 单元测试 - 百度OCR核心模块

describe('utils/baidu-ocr.js - 百度OCR识别模块', () => {
  let baiduOcr;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    baiduOcr = require('../../utils/baidu-ocr');
  });

  describe('getAccessToken - 获取访问令牌', () => {
    test('应从缓存返回有效的访问令牌', async () => {
      const cachedToken = 'cached_token_123';
      const futureTime = Date.now() + 24 * 60 * 60 * 1000;

      wx.getStorageSync.mockReturnValueOnce(cachedToken)
                       .mockReturnValueOnce(futureTime);

      const result = await baiduOcr.getAccessToken();

      expect(result).toBe(cachedToken);
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('令牌过期时应获取新令牌', async () => {
      const expiredTime = Date.now() - 1000;
      const newToken = 'new_token_456';

      wx.getStorageSync.mockReturnValueOnce('old_token')
                       .mockReturnValueOnce(expiredTime);

      wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: newToken } });
      });

      const result = await baiduOcr.getAccessToken();

      expect(result).toBe(newToken);
      expect(wx.setStorageSync).toHaveBeenCalledWith(
        'baidu_access_token',
        newToken
      );
    });

    test('无缓存时应获取新令牌', async () => {
      const newToken = 'fresh_token_789';

      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: newToken } });
      });

      const result = await baiduOcr.getAccessToken();

      expect(result).toBe(newToken);
    });

    test('API返回错误时应抛出异常', async () => {
      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation((options) => {
        options.success({ data: { error: 'invalid_client' } });
      });

      await expect(baiduOcr.getAccessToken())
        .rejects.toThrow('获取token失败');
    });
  });

  describe('extractMedicineName - 药品名称提取', () => {
    test('应从识别文本中提取胶囊类药品名称', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应从识别文本中提取片剂类药品名称', () => {
      const text = '布洛芬片 0.2g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应从识别文本中提取颗粒类药品名称', () => {
      const text = '感冒灵颗粒 10g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应处理空输入', () => {
      const result = baiduOcr.extractMedicineName('');
      expect(result).toBe('');
    });

    test('应处理null输入', () => {
      const result = baiduOcr.extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应处理无关键词的文本', () => {
      const text = '这是一段普通文本';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBe('这是一段普通文本');
    });

    test('应处理多行文本', () => {
      const text = '生产企业\n阿奇霉素片\n0.25g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应提取包含关键词的完整上下文', () => {
      const text = '用法:每日3次 头孢克肟分散片 0.1g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
