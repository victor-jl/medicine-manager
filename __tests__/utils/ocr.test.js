/**
 * utils/ocr.js 单元测试
 * 
 * 测试覆盖：
 * 1. extractMedicineName - 药品名称提取逻辑
 * 2. getBaiduToken - Token 缓存机制
 * 3. recognizeWithBaidu - OCR 识别流程
 * 4. 边界条件和错误处理
 */

const { extractMedicineName, getBaiduToken, recognizeWithBaidu } = require('../utils/ocr');

describe('extractMedicineName', () => {
  describe('基础药品类型识别', () => {
    test('应识别胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.5g×12粒/盒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂类药品', () => {
      const text = '布洛芬片 0.2g×20片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒类药品', () => {
      const text = '感冒灵颗粒 10g×9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别口服液类药品', () => {
      const text = '小儿止咳口服液 10ml×6支';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别注射液类药品', () => {
      const text = '头孢注射液 2ml:0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏类药品', () => {
      const text = '红霉素软膏 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应识别滴眼液类药品', () => {
      const text = '氯霉素滴眼液 8ml';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应识别糖浆类药品', () => {
      const text = '止咳糖浆 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('常见药品名称识别', () => {
    test('应识别阿莫西林', () => {
      const text = '阿莫西林胶囊 国药准字H12345678';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应识别布洛芬', () => {
      const text = '布洛芬缓释胶囊 0.3g×20粒';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应识别对乙酰氨基酚', () => {
      const text = '对乙酰氨基酚片 0.5g×12片';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应识别头孢类药品', () => {
      const text = '头孢克肟分散片 0.1g×6片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应识别感冒灵', () => {
      const text = '999感冒灵颗粒 10g×9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别莲花清瘟', () => {
      const text = '莲花清瘟胶囊 0.35g×24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('莲花清瘟');
    });

    test('应识别维生素类', () => {
      const text = '维生素C片 0.1g×100片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别奥美拉唑', () => {
      const text = '奥美拉唑肠溶胶囊 20mg×14粒';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应识别二甲双胍', () => {
      const text = '二甲双胍片 0.25g×60片';
      const result = extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });

    test('应识别阿司匹林', () => {
      const text = '阿司匹林肠溶片 100mg×30片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿司匹林');
    });
  });

  describe('边界条件', () => {
    test('空字符串应返回空', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('null 应返回空', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('undefined 应返回空', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('无关键词时返回第一行（截取前30字符）', () => {
      const text = '未知药品名称\n第二行内容';
      const result = extractMedicineName(text);
      expect(result).toBe('未知药品名称');
    });

    test('应处理纯数字文本', () => {
      const text = '1234567890';
      const result = extractMedicineName(text);
      expect(result).toBe('1234567890');
    });

    test('应处理特殊字符', () => {
      const text = '药品@#$%胶囊说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应处理多行文本', () => {
      const text = `阿莫西林胶囊
规格：0.5g×12粒
批号：20240101
有效期至：2026年12月`;
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应处理超长药品名称（截取合理长度）', () => {
      const longName = '这是一个非常非常非常非常非常非常非常非常非常长的药品名称胶囊';
      const result = extractMedicineName(longName);
      // 提取的名称应该包含关键词，且长度合理
      expect(result).toContain('胶囊');
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('大小写处理', () => {
    test('应处理大写字母', () => {
      const text = 'VITAMIN C 片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应处理混合大小写', () => {
      const text = 'Amoxicillin 胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('功能关键词识别', () => {
    test('应识别止咳类药品', () => {
      const text = '止咳糖浆 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('止咳');
    });

    test('应识别祛痰类药品', () => {
      const text = '祛痰口服液 10ml';
      const result = extractMedicineName(text);
      expect(result).toContain('祛痰');
    });

    test('应识别退烧类药品', () => {
      const text = '退烧药片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });

    test('应识别消炎类药品', () => {
      const text = '消炎胶囊 0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('消炎');
    });

    test('应识别止痛类药品', () => {
      const text = '止痛贴剂 5cm×7cm';
      const result = extractMedicineName(text);
      expect(result).toContain('止痛');
    });
  });
});

describe('getBaiduToken', () => {
  beforeEach(() => {
    // 重置 mock 存储
    global.__mockStorage__ = {};
  });

  describe('缓存机制', () => {
    test('应使用有效的缓存 Token', async () => {
      const cachedToken = 'cached_access_token_123';
      const futureExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1天后
      
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: cachedToken,
          expires: futureExpiry
        }
      };

      // 由于 getBaiduToken 会检查缓存，这里需要 mock wx.request 不被调用
      const token = await getBaiduToken();
      
      // 缓存有效时应返回缓存值
      expect(token).toBe(cachedToken);
    });

    test('应忽略过期的缓存 Token', async () => {
      const expiredToken = 'expired_token';
      const pastExpiry = Date.now() - 1000; // 已过期
      
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: expiredToken,
          expires: pastExpiry
        }
      };

      // Mock wx.request 返回新 token
      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'new_token_456'
          }
        });
      });

      const token = await getBaiduToken();
      expect(token).toBe('new_token_456');
    });

    test('无缓存时应请求新 Token', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'fresh_token_789'
          }
        });
      });

      const token = await getBaiduToken();
      expect(token).toBe('fresh_token_789');
    });
  });

  describe('API 调用', () => {
    test('应正确构造请求参数', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        expect(options.url).toBe('https://aip.baidubce.com/oauth/2.0/token');
        expect(options.method).toBe('POST');
        expect(options.data.grant_type).toBe('client_credentials');
        options.success({
          data: {
            access_token: 'test_token'
          }
        });
      });

      await getBaiduToken();
    });

    test('应正确缓存新获取的 Token', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'token_to_cache'
          }
        });
      });

      await getBaiduToken();

      // 验证缓存被设置
      const cached = global.__mockStorage__['baidu_token'];
      expect(cached).toBeDefined();
      expect(cached.access_token).toBe('token_to_cache');
      // Token 有效期应为 25 天
      expect(cached.expires).toBeGreaterThan(Date.now());
    });

    test('API 请求失败应抛出错误', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.fail(new Error('Network error'));
      });

      await expect(getBaiduToken()).rejects.toThrow();
    });
  });
});

describe('recognizeWithBaidu', () => {
  beforeEach(() => {
    global.__mockStorage__ = {};
    jest.clearAllMocks();
  });

  describe('OCR 识别流程', () => {
    test('成功识别应返回文字结果', async () => {
      // Mock getBaiduToken
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: 'test_token',
          expires: Date.now() + 24 * 60 * 60 * 1000
        }
      };

      // Mock 文件系统
      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      // Mock OCR API 响应
      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.success({
            data: {
              words_result: [
                { words: '阿莫西林胶囊' },
                { words: '规格：0.5g×12粒' }
              ]
            }
          });
        }
      });

      const result = await recognizeWithBaidu('/path/to/image.jpg');
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('阿莫西林胶囊');
      expect(result.text).toContain('阿莫西林胶囊');
    });

    test('无识别结果应抛出错误', async () => {
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: 'test_token',
          expires: Date.now() + 24 * 60 * 60 * 1000
        }
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.success({
            data: {
              words_result: []
            }
          });
        }
      });

      await expect(recognizeWithBaidu('/path/to/image.jpg')).rejects.toThrow();
    });

    test('API 返回错误应抛出错误', async () => {
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: 'test_token',
          expires: Date.now() + 24 * 60 * 60 * 1000
        }
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.fail(new Error('API Error'));
        }
      });

      await expect(recognizeWithBaidu('/path/to/image.jpg')).rejects.toThrow();
    });
  });

  describe('图片处理', () => {
    test('应正确读取图片并转为 base64', async () => {
      global.__mockStorage__ = {
        'baidu_token': {
          access_token: 'test_token',
          expires: Date.now() + 24 * 60 * 60 * 1000
        }
      };

      const mockReadFileSync = jest.fn(() => 'mock_base64_data');
      wx.getFileSystemManager.mockReturnValue({
        readFileSync: mockReadFileSync
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          // 验证 base64 数据被正确传递
          expect(options.data.image).toBe('mock_base64_data');
          options.success({
            data: {
              words_result: [{ words: 'test' }]
            }
          });
        }
      });

      await recognizeWithBaidu('/path/to/image.jpg');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/image.jpg', 'base64');
    });
  });
});

describe('recognizeWithWechat', () => {
  const { recognizeWithWechat } = require('../utils/ocr');

  test('成功识别应返回结果', async () => {
    wx.cloud.callFunction.mockImplementation((options) => {
      options.success({
        result: {
          text: '阿莫西林胶囊\n规格：0.5g'
        }
      });
    });

    const result = await recognizeWithWechat('/path/to/image.jpg');
    
    expect(result.success).toBe(true);
    expect(result.words).toContain('阿莫西林胶囊');
  });

  test('识别失败应抛出错误', async () => {
    wx.cloud.callFunction.mockImplementation((options) => {
      options.fail(new Error('Cloud function error'));
    });

    await expect(recognizeWithWechat('/path/to/image.jpg')).rejects.toThrow();
  });

  test('无结果应抛出错误', async () => {
    wx.cloud.callFunction.mockImplementation((options) => {
      options.success({
        result: null
      });
    });

    await expect(recognizeWithWechat('/path/to/image.jpg')).rejects.toThrow('识别失败');
  });
});