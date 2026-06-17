/**
 * utils/baidu-ocr.js 单元测试
 * 
 * 测试覆盖：
 * 1. extractMedicineName - 药品名称提取逻辑
 * 2. getAccessToken - Token 缓存机制
 * 3. recognizeText - OCR 识别流程
 * 4. 错误处理和边界条件
 */

const { extractMedicineName, getAccessToken, recognizeText } = require('../utils/baidu-ocr');

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

    test('应识别贴剂类药品', () => {
      const text = '止痛贴剂 5cm×7cm';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
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

    test('应识别阿奇霉素', () => {
      const text = '阿奇霉素片 0.25g×6片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应识别罗红霉素', () => {
      const text = '罗红霉素胶囊 150mg×12粒';
      const result = extractMedicineName(text);
      expect(result).toContain('罗红霉素');
    });

    test('应识别感冒灵', () => {
      const text = '999感冒灵颗粒 10g×9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别感冒清热', () => {
      const text = '感冒清热颗粒 12g×10袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒清热');
    });

    test('应识别板蓝根', () => {
      const text = '板蓝根颗粒 10g×20袋';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应识别双黄连', () => {
      const text = '双黄连口服液 10ml×10支';
      const result = extractMedicineName(text);
      expect(result).toContain('双黄连');
    });

    test('应识别维生素类', () => {
      const text = '维生素C片 0.1g×100片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别钙片', () => {
      const text = '碳酸钙D3片 600mg×60片';
      const result = extractMedicineName(text);
      expect(result).toContain('钙片');
    });

    test('应识别胃药类', () => {
      const text = '胃药胶囊 0.5g×24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('胃药');
    });
  });

  describe('功能关键词识别', () => {
    test('应识别血压相关药品', () => {
      const text = '降压血压药片 10mg';
      const result = extractMedicineName(text);
      expect(result).toContain('血压');
    });

    test('应识别血糖相关药品', () => {
      const text = '降血糖胶囊 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('血糖');
    });

    test('应识别血脂相关药品', () => {
      const text = '降血脂片 20mg';
      const result = extractMedicineName(text);
      expect(result).toContain('血脂');
    });

    test('应识别感冒相关药品', () => {
      const text = '感冒胶囊 0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒');
    });

    test('应识别咳嗽相关药品', () => {
      const text = '止咳咳嗽糖浆 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('咳嗽');
    });

    test('应识别腹泻相关药品', () => {
      const text = '止泻腹泻药片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('腹泻');
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

    test('无关键词时返回第一行', () => {
      const text = '未知药品名称\n第二行内容';
      const result = extractMedicineName(text);
      expect(result).toBe('未知药品名称');
    });

    test('应处理纯数字文本', () => {
      const text = '1234567890';
      const result = extractMedicineName(text);
      expect(result).toBe('1234567890');
    });

    test('应处理超长文本（截取前20字符）', () => {
      const longText = '这是一个非常非常非常非常非常非常长的药品名称没有关键词';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(20);
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

    test('应处理包含换行符的文本', () => {
      const text = '药品名称\r\n第二行\r\n第三行';
      const result = extractMedicineName(text);
      expect(result).toBe('药品名称');
    });

    test('应处理只有空格的文本', () => {
      const text = '     ';
      const result = extractMedicineName(text);
      expect(result).toBe('');
    });

    test('应处理包含特殊字符的文本', () => {
      const text = '药品@#$%胶囊说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
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

  describe('关键词位置处理', () => {
    test('应正确提取关键词前的文本', () => {
      const text = '这是阿莫西林胶囊的说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应正确提取关键词后的文本', () => {
      const text = '阿莫西林胶囊规格0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });
  });
});

describe('getAccessToken', () => {
  beforeEach(() => {
    global.__mockStorage__ = {};
    jest.clearAllMocks();
  });

  describe('缓存机制', () => {
    test('应使用有效的缓存 Token', async () => {
      const cachedToken = 'cached_access_token_123';
      const futureExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1天后
      
      global.__mockStorage__ = {
        'baidu_access_token': cachedToken,
        'baidu_token_expires': futureExpiry
      };

      const token = await getAccessToken();
      expect(token).toBe(cachedToken);
      // 不应调用 API
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('应忽略过期的缓存 Token 并请求新 Token', async () => {
      const expiredToken = 'expired_token';
      const pastExpiry = Date.now() - 1000; // 已过期
      
      global.__mockStorage__ = {
        'baidu_access_token': expiredToken,
        'baidu_token_expires': pastExpiry
      };

      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'new_token_456'
          }
        });
      });

      const token = await getAccessToken();
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

      const token = await getAccessToken();
      expect(token).toBe('fresh_token_789');
    });

    test('缓存时间不足时应请求新 Token', async () => {
      const nearExpiry = Date.now() + 1000; // 即将过期
      
      global.__mockStorage__ = {
        'baidu_access_token': 'near_expired_token',
        'baidu_token_expires': nearExpiry
      };

      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'new_token'
          }
        });
      });

      const token = await getAccessToken();
      expect(token).toBe('new_token');
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

      await getAccessToken();
    });

    test('应正确缓存新获取的 Token（25天有效期）', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.success({
          data: {
            access_token: 'token_to_cache'
          }
        });
      });

      await getAccessToken();

      const cachedToken = global.__mockStorage__['baidu_access_token'];
      const expiresTime = global.__mockStorage__['baidu_token_expires'];

      expect(cachedToken).toBe('token_to_cache');
      // 验证过期时间约为 25 天后
      const expectedExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000;
      expect(expiresTime).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiresTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    test('API 请求失败应抛出错误', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.fail(new Error('Network error'));
      });

      await expect(getAccessToken()).rejects.toThrow();
    });

    test('API 返回无 access_token 应抛出错误', async () => {
      global.__mockStorage__ = {};

      wx.request.mockImplementation((options) => {
        options.success({
          data: {}
        });
      });

      await expect(getAccessToken()).rejects.toThrow('获取token失败');
    });
  });
});

describe('recognizeText', () => {
  beforeEach(() => {
    global.__mockStorage__ = {};
    jest.clearAllMocks();
  });

  describe('OCR 识别流程', () => {
    test('成功识别应返回文字结果', async () => {
      // Mock getAccessToken 返回缓存 token
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
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

      const result = await recognizeText('/path/to/image.jpg');
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['阿莫西林胶囊', '规格：0.5g×12粒']);
      expect(result.text).toBe('阿莫西林胶囊 规格：0.5g×12粒');
    });

    test('应正确处理空识别结果', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
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

      const result = await recognizeText('/path/to/image.jpg');
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual([]);
      expect(result.text).toBe('');
    });

    test('API 返回错误码应抛出错误', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.success({
            data: {
              error_code: 'INVALID_IMAGE',
              error_msg: '图片格式不正确'
            }
          });
        }
      });

      await expect(recognizeText('/path/to/image.jpg')).rejects.toThrow('图片格式不正确');
    });

    test('API 返回无有效数据应抛出错误', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.success({
            data: {}
          });
        }
      });

      await expect(recognizeText('/path/to/image.jpg')).rejects.toThrow('OCR识别失败，未返回有效数据');
    });

    test('API 请求失败应抛出错误', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          options.fail(new Error('Network error'));
        }
      });

      await expect(recognizeText('/path/to/image.jpg')).rejects.toThrow();
    });
  });

  describe('图片处理', () => {
    test('应正确读取图片并转为 base64', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
      };

      const mockReadFileSync = jest.fn(() => 'mock_base64_data');
      wx.getFileSystemManager.mockReturnValue({
        readFileSync: mockReadFileSync
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          expect(options.data.image).toBe('mock_base64_data');
          options.success({
            data: {
              words_result: [{ words: 'test' }]
            }
          });
        }
      });

      await recognizeText('/path/to/image.jpg');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/image.jpg', 'base64');
    });

    test('应正确设置请求头', async () => {
      global.__mockStorage__ = {
        'baidu_access_token': 'test_token',
        'baidu_token_expires': Date.now() + 24 * 60 * 60 * 1000
      };

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('ocr')) {
          expect(options.header['Content-Type']).toBe('application/x-www-form-urlencoded');
          options.success({
            data: {
              words_result: [{ words: 'test' }]
            }
          });
        }
      });

      await recognizeText('/path/to/image.jpg');
    });
  });

  describe('Token 获取流程', () => {
    test('无缓存 Token 时应先获取 Token', async () => {
      global.__mockStorage__ = {};

      let tokenRequested = false;
      let ocrRequested = false;

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_image_data')
      });

      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth')) {
          tokenRequested = true;
          options.success({
            data: {
              access_token: 'new_token_from_api'
            }
          });
        } else if (options.url.includes('ocr')) {
          ocrRequested = true;
          expect(options.url).toContain('new_token_from_api');
          options.success({
            data: {
              words_result: [{ words: 'test' }]
            }
          });
        }
      });

      await recognizeText('/path/to/image.jpg');
      
      expect(tokenRequested).toBe(true);
      expect(ocrRequested).toBe(true);
    });
  });
});