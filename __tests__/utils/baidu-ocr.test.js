/**
 * utils/baidu-ocr.js 测试
 * 测试百度OCR API的token缓存、OCR调用和药品名称提取
 */

const { recognizeText, extractMedicineName, getAccessToken } = require('../../utils/baidu-ocr');

describe('baidu-ocr.js', () => {
  beforeEach(() => {
    // 清空所有模拟调用
    jest.clearAllMocks();
    global.__mockStorage__.clear();
  });

  describe('getAccessToken', () => {
    test('应该返回缓存的token（未过期）', async () => {
      // 设置缓存的token（过期时间为未来）
      const cachedToken = 'cached-test-token';
      const futureExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1天后
      global.__mockStorage__.set('baidu_access_token', cachedToken);
      global.__mockStorage__.set('baidu_token_expires', futureExpiry);

      const token = await getAccessToken();
      
      expect(token).toBe(cachedToken);
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('应该获取新token（无缓存）', async () => {
      const newToken = 'new-test-token';
      
      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          options.success({
            data: {
              access_token: newToken,
              expires_in: 2592000
            }
          });
        }
      });

      const token = await getAccessToken();
      
      expect(token).toBe(newToken);
      expect(wx.request).toHaveBeenCalledTimes(1);
      expect(global.__mockStorage__.get('baidu_access_token')).toBe(newToken);
    });

    test('应该获取新token（缓存已过期）', async () => {
      // 设置过期的token
      global.__mockStorage__.set('baidu_access_token', 'expired-token');
      global.__mockStorage__.set('baidu_token_expires', Date.now() - 1000);

      const newToken = 'refreshed-token';
      
      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          options.success({
            data: {
              access_token: newToken,
              expires_in: 2592000
            }
          });
        }
      });

      const token = await getAccessToken();
      
      expect(token).toBe(newToken);
    });

    test('token获取失败应该抛出错误', async () => {
      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          options.success({
            data: {
              error: 'invalid_client',
              error_description: 'Invalid API key'
            }
          });
        }
      });

      await expect(getAccessToken()).rejects.toThrow('获取token失败');
    });
  });

  describe('recognizeText', () => {
    test('应该成功识别文本', async () => {
      const testImagePath = '/tmp/test.jpg';
      const testToken = 'test-access-token';
      
      // 设置token缓存
      global.__mockStorage__.set('baidu_access_token', testToken);
      global.__mockStorage__.set('baidu_token_expires', Date.now() + 24 * 60 * 60 * 1000);

      // 模拟OCR响应
      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {
              words_result: [
                { words: '阿莫西林胶囊' },
                { words: '有效期：2025-12-31' }
              ]
            }
          });
        }
      });

      const result = await recognizeText(testImagePath);
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('阿莫西林胶囊');
      expect(result.words).toContain('有效期：2025-12-31');
      expect(result.text).toContain('阿莫西林胶囊');
    });

    test('OCR识别失败应该抛出错误（error_code）', async () => {
      const testImagePath = '/tmp/test.jpg';
      const testToken = 'test-access-token';
      
      global.__mockStorage__.set('baidu_access_token', testToken);
      global.__mockStorage__.set('baidu_token_expires', Date.now() + 24 * 60 * 60 * 1000);

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {
              error_code: 17,
              error_msg: 'Open API daily request limit reached'
            }
          });
        }
      });

      await expect(recognizeText(testImagePath)).rejects.toThrow('OCR识别失败');
    });

    test('OCR识别失败应该抛出错误（无有效数据）', async () => {
      const testImagePath = '/tmp/test.jpg';
      const testToken = 'test-access-token';
      
      global.__mockStorage__.set('baidu_access_token', testToken);
      global.__mockStorage__.set('baidu_token_expires', Date.now() + 24 * 60 * 60 * 1000);

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {}
          });
        }
      });

      await expect(recognizeText(testImagePath)).rejects.toThrow('OCR识别失败');
    });

    test('网络请求失败应该抛出错误', async () => {
      const testImagePath = '/tmp/test.jpg';
      const testToken = 'test-access-token';
      
      global.__mockStorage__.set('baidu_access_token', testToken);
      global.__mockStorage__.set('baidu_token_expires', Date.now() + 24 * 60 * 60 * 1000);

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr/v1/general_basic')) {
          options.fail({ errMsg: 'request:fail' });
        }
      });

      await expect(recognizeText(testImagePath)).rejects.toThrow();
    });
  });

  describe('extractMedicineName', () => {
    test('应该从文本中提取药品名称（胶囊）', () => {
      const text = '阿莫西林胶囊\n有效期：2025-12-31';
      const name = extractMedicineName(text);
      
      expect(name).toContain('阿莫西林胶囊');
    });

    test('应该从文本中提取药品名称（片剂）', () => {
      const text = '布洛芬片\n生产日期：2024-01-01';
      const name = extractMedicineName(text);
      
      expect(name).toContain('布洛芬片');
    });

    test('应该从文本中提取药品名称（颗粒）', () => {
      const text = '感冒灵颗粒\n用于感冒发热';
      const name = extractMedicineName(text);
      
      expect(name).toContain('感冒灵颗粒');
    });

    test('应该从文本中提取药品名称（口服液）', () => {
      const text = '小儿止咳糖浆口服液\n儿童用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('口服液');
    });

    test('应该处理不包含关键词的文本', () => {
      const text = '这是一个普通文本';
      const name = extractMedicineName(text);
      
      expect(name).toBe('这是一个普通文本');
    });

    test('应该处理空文本', () => {
      const name = extractMedicineName('');
      
      expect(name).toBe('');
    });

    test('应该处理null值', () => {
      const name = extractMedicineName(null);
      
      expect(name).toBe('');
    });

    test('应该处理undefined值', () => {
      const name = extractMedicineName(undefined);
      
      expect(name).toBe('');
    });

    test('应该从多行文本的第一行提取（无关键词时）', () => {
      const text = '产品说明书\n第二行\n第三行';
      const name = extractMedicineName(text);
      
      expect(name).toBe('产品说明书');
    });

    test('应该处理包含多个关键词的情况', () => {
      const text = '维生素钙片\n包含维生素C';
      const name = extractMedicineName(text);
      
      // 应该匹配第一个找到的关键词
      expect(name).toContain('钙片');
    });
  });
});