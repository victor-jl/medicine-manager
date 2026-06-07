/**
 * utils/baidu-ocr.js 单元测试
 * 测试 getAccessToken 和 extractMedicineName 函数
 */

const { getAccessToken, extractMedicineName, recognizeText } = require('../../utils/baidu-ocr');

describe('extractMedicineName (baidu-ocr)', () => {
  describe('关键词匹配', () => {
    test('匹配胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('匹配片剂类药品', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('匹配颗粒类药品', () => {
      const text = '感冒灵颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('匹配复方药品', () => {
      const text = '感冒灵颗粒 10袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });
  });

  describe('边界条件', () => {
    test('空字符串返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null输入返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('无匹配关键词时返回第一行', () => {
      const text = '没有任何药品关键词的文字';
      const result = extractMedicineName(text);
      expect(result).toBe(text.substring(0, 20));
    });

    test('关键词在文本中间位置', () => {
      const text = '生产企业: XXX 制药 胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('上下文提取', () => {
    test('返回包含关键词及其前后上下文', () => {
      const text = '阿莫西林胶囊 0.25g 某制药';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('多行文本取第一行', () => {
      const text = '阿莫西林胶囊\n0.25g\n用法: 口服';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });
});

describe('getAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wx._storageSync = {};
  });

  test('缓存有效时直接返回缓存的token', async () => {
    const cachedToken = 'cached_token_123';
    const expiresTime = Date.now() + 25 * 24 * 60 * 60 * 1000; // 25天后过期
    wx._storageSync['baidu_access_token'] = cachedToken;
    wx._storageSync['baidu_token_expires'] = expiresTime;

    const result = await getAccessToken();

    expect(result).toBe(cachedToken);
    expect(wx.request).not.toHaveBeenCalled();
  });

  test('缓存过期时发起新请求', async () => {
    const newToken = 'new_token_456';
    const expiredTime = Date.now() - 1000; // 已经过期
    wx._storageSync['baidu_access_token'] = 'old_token';
    wx._storageSync['baidu_token_expires'] = expiredTime;

    wx.request.mockImplementation((options) => {
      if (options.url.includes('oauth/2.0/token')) {
        options.success({ data: { access_token: newToken } });
      }
    });

    const result = await getAccessToken();

    expect(result).toBe(newToken);
    expect(wx.request).toHaveBeenCalled();
    expect(wx.setStorageSync).toHaveBeenCalledWith('baidu_access_token', newToken);
  });

  test('无缓存时发起新请求', async () => {
    const newToken = 'fresh_token_789';
    wx._storageSync = {}; // 清除缓存

    wx.request.mockImplementation((options) => {
      if (options.url.includes('oauth/2.0/token')) {
        options.success({ data: { access_token: newToken } });
      }
    });

    const result = await getAccessToken();

    expect(result).toBe(newToken);
    expect(wx.request).toHaveBeenCalled();
  });

  test('请求失败时调用fail回调', async () => {
    wx._storageSync = {};
    wx.request.mockReset();

    wx.request.mockImplementation((options) => {
      if (options.url.includes('oauth/2.0/token')) {
        options.fail({ errMsg: '网络错误' });
      }
    });

    let rejectionOccurred = false;
    try {
      await getAccessToken();
    } catch (e) {
      rejectionOccurred = true;
    }
    expect(rejectionOccurred).toBe(true);
  });

  test('token缓存25天', async () => {
    const newToken = 'token_with_expiry';
    wx._storageSync = {};

    wx.request.mockImplementation((options) => {
      if (options.url.includes('oauth/2.0/token')) {
        options.success({ data: { access_token: newToken } });
      }
    });

    await getAccessToken();

    const expiresCall = wx.setStorageSync.mock.calls.find(
      call => call[0] === 'baidu_token_expires'
    );
    expect(expiresCall).toBeDefined();

    const expiresTime = expiresCall[1];
    const expectedMinExpiry = Date.now() + 24 * 24 * 60 * 60 * 1000; // 至少24天
    expect(expiresTime).toBeGreaterThan(expectedMinExpiry);
  });
});

describe('recognizeText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wx._storageSync = {};
  });

  test('成功识别返回words数组', async () => {
    const mockToken = 'valid_token';
    wx._storageSync['baidu_access_token'] = mockToken;
    wx._storageSync['baidu_token_expires'] = Date.now() + 25 * 24 * 60 * 60 * 1000;

    wx.request.mockImplementation((options) => {
      if (options.url.includes('ocr/v1/general_basic')) {
        options.success({
          data: {
            words_result: [
              { words: '阿莫西林胶囊' },
              { words: '0.25g' }
            ]
          }
        });
      }
    });

    const result = await recognizeText('/path/to/image');

    expect(result.success).toBe(true);
    expect(result.words).toEqual(['阿莫西林胶囊', '0.25g']);
    expect(result.text).toBe('阿莫西林胶囊 0.25g');
  });

  test('OCR返回错误码时抛出异常', async () => {
    const mockToken = 'valid_token';
    wx._storageSync['baidu_access_token'] = mockToken;
    wx._storageSync['baidu_token_expires'] = Date.now() + 25 * 24 * 60 * 60 * 1000;

    wx.request.mockImplementation((options) => {
      if (options.url.includes('ocr/v1/general_basic')) {
        options.success({
          data: {
            error_code: 216015,
            error_msg: 'module closed'
          }
        });
      }
    });

    await expect(recognizeText('/path/to/image')).rejects.toThrow('OCR识别失败: module closed');
  });

  test('无words_result时抛出异常', async () => {
    const mockToken = 'valid_token';
    wx._storageSync['baidu_access_token'] = mockToken;
    wx._storageSync['baidu_token_expires'] = Date.now() + 25 * 24 * 60 * 60 * 1000;

    wx.request.mockImplementation((options) => {
      if (options.url.includes('ocr/v1/general_basic')) {
        options.success({ data: {} }); // 无 words_result
      }
    });

    await expect(recognizeText('/path/to/image')).rejects.toThrow('OCR识别失败，未返回有效数据');
  });
});
