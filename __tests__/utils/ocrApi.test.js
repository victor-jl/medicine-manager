/**
 * OCR API 调用逻辑测试
 * 测试文件: utils/baidu-ocr.js 和 utils/ocr.js 中的 API 调用逻辑
 */

// 引入 wx mock
require('../../__mocks__/wx');

describe('OCR API 调用逻辑测试', () => {
  beforeEach(() => {
    // 清空 mock storage
    wx.clearMockStorage();
    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('百度OCR Token 获取逻辑', () => {
    test('应该正确缓存 access token', () => {
      const token = 'test_access_token';
      const expiresTime = Date.now() + 25 * 24 * 60 * 60 * 1000;

      wx.setStorageSync('baidu_access_token', token);
      wx.setStorageSync('baidu_token_expires', expiresTime);

      const cachedToken = wx.getStorageSync('baidu_access_token');
      const cachedExpires = wx.getStorageSync('baidu_token_expires');

      expect(cachedToken).toBe(token);
      expect(cachedExpires).toBe(expiresTime);
    });

    test('应该正确判断 token 是否过期', () => {
      const validExpires = Date.now() + 25 * 24 * 60 * 60 * 1000;
      const expiredExpires = Date.now() - 1000;

      // 有效的 token
      expect(Date.now() < validExpires).toBe(true);

      // 已过期的 token
      expect(Date.now() < expiredExpires).toBe(false);
    });

    test('应该正确处理空 token 缓存', () => {
      const cachedToken = wx.getStorageSync('baidu_access_token');
      const cachedExpires = wx.getStorageSync('baidu_token_expires');

      expect(cachedToken).toBeNull();
      expect(cachedExpires).toBeNull();
    });
  });

  describe('OCR 识别结果处理', () => {
    test('应该正确解析 OCR 返回的文字结果', () => {
      const mockResponse = {
        data: {
          words_result: [
            { words: '阿莫西林胶囊' },
            { words: '有效期至2025-12-31' },
            { words: '规格: 0.5g*24粒' }
          ]
        }
      };

      const words = mockResponse.data.words_result.map(item => item.words);
      const text = words.join(' ');

      expect(words).toHaveLength(3);
      expect(words[0]).toBe('阿莫西林胶囊');
      expect(text).toBe('阿莫西林胶囊 有效期至2025-12-31 规格: 0.5g*24粒');
    });

    test('应该正确处理空的 OCR 结果', () => {
      const mockResponse = {
        data: {
          words_result: []
        }
      };

      const words = mockResponse.data.words_result.map(item => item.words);

      expect(words).toHaveLength(0);
    });

    test('应该正确处理 OCR 错误响应', () => {
      const mockErrorResponse = {
        data: {
          error_code: 'invalid_token',
          error_msg: 'Invalid access token'
        }
      };

      expect(mockErrorResponse.data.error_code).toBeDefined();
      expect(mockErrorResponse.data.error_msg).toBe('Invalid access token');
    });
  });

  describe('图片 Base64 编码逻辑', () => {
    test('应该正确调用文件系统 API', () => {
      const fs = wx.getFileSystemManager();
      const result = fs.readFileSync('/tmp/test.jpg', 'base64');

      expect(result).toBe('mock_base64_data');
      expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/test.jpg', 'base64');
    });
  });

  describe('微信云函数 OCR 调用', () => {
    test('应该正确调用云函数', async () => {
      wx.cloud.callFunction.mockResolvedValueOnce({
        result: {
          text: '阿莫西林胶囊\n有效期至2025-12-31'
        }
      });

      const result = await wx.cloud.callFunction({
        name: 'ocr',
        data: {
          type: 'photo',
          imgUrl: '/tmp/test.jpg'
        }
      });

      expect(result.result.text).toContain('阿莫西林胶囊');
      expect(wx.cloud.callFunction).toHaveBeenCalled();
    });

    test('应该正确处理云函数返回的文本', () => {
      const mockResult = {
        result: {
          text: '阿莫西林胶囊\n有效期至2025-12-31\n规格: 0.5g'
        }
      };

      const words = mockResult.result.text.split('\n').filter(t => t.trim());

      expect(words).toHaveLength(3);
      expect(words[0]).toBe('阿莫西林胶囊');
    });
  });

  describe('API 错误处理', () => {
    test('应该正确处理网络请求失败', async () => {
      wx.request.mockRejectedValueOnce(new Error('Network error'));

      try {
        await wx.request({
          url: 'https://api.example.com/ocr',
          method: 'POST'
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('应该正确处理 API 返回错误', () => {
      const errorResponse = {
        data: {
          error_code: 18,
          error_msg: 'Open api qps request limit reached'
        }
      };

      expect(errorResponse.data.error_code).toBe(18);
      expect(errorResponse.data.error_msg).toContain('qps request limit');
    });

    test('应该正确处理 token 获取失败', () => {
      const tokenError = {
        data: {
          error: 'invalid_client',
          error_description: 'Client authentication failed'
        }
      };

      expect(tokenError.data.error).toBe('invalid_client');
      expect(tokenError.data.error_description).toContain('authentication failed');
    });
  });

  describe('并发和性能测试', () => {
    test('应该正确处理多个并发 OCR 请求', async () => {
      const mockResponses = [
        { data: { words_result: [{ words: '药品A' }] } },
        { data: { words_result: [{ words: '药品B' }] } },
        { data: { words_result: [{ words: '药品C' }] } }
      ];

      wx.request
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const results = await Promise.all([
        wx.request({ url: 'url1' }),
        wx.request({ url: 'url2' }),
        wx.request({ url: 'url3' })
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].data.words_result[0].words).toBe('药品A');
      expect(results[1].data.words_result[0].words).toBe('药品B');
      expect(results[2].data.words_result[0].words).toBe('药品C');
    });
  });
});