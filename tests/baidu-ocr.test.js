// tests/baidu-ocr.test.js
// 百度OCR工具函数单元测试

const {
  recognizeText,
  extractMedicineName,
  getAccessToken
} = require('../utils/baidu-ocr');

// Mock wx API
global.wx = {
  request: jest.fn(),
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  getFileSystemManager: jest.fn()
};

describe('百度OCR工具函数测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken - 获取访问令牌', () => {
    test('应返回缓存的未过期token', async () => {
      const mockToken = 'cached_token_123';
      const futureTime = Date.now() + 1000000;

      wx.getStorageSync
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(futureTime);

      const result = await getAccessToken();

      expect(result).toBe(mockToken);
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('缓存token过期应获取新token', async () => {
      const mockToken = 'new_token_456';
      const expiredTime = Date.now() - 1000;

      wx.getStorageSync
        .mockReturnValueOnce('old_token')
        .mockReturnValueOnce(expiredTime);

      wx.request.mockImplementation(({ success }) => {
        success({ data: { access_token: mockToken } });
      });

      const result = await getAccessToken();

      expect(result).toBe(mockToken);
      expect(wx.setStorageSync).toHaveBeenCalledWith(
        'baidu_access_token',
        mockToken
      );
    });

    test('无缓存应获取新token', async () => {
      const mockToken = 'fresh_token_789';

      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation(({ success }) => {
        success({ data: { access_token: mockToken } });
      });

      const result = await getAccessToken();

      expect(result).toBe(mockToken);
      expect(wx.setStorageSync).toHaveBeenCalled();
    });

    test('获取token失败应抛出错误', async () => {
      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation(({ success }) => {
        success({ data: {} });
      });

      await expect(getAccessToken()).rejects.toThrow('获取token失败');
    });

    test('网络请求失败应抛出错误', async () => {
      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation(({ fail }) => {
        fail(new Error('网络错误'));
      });

      await expect(getAccessToken()).rejects.toThrow('网络错误');
    });
  });

  describe('recognizeText - 文字识别', () => {
    test('成功识别应返回正确格式', async () => {
      const mockToken = 'test_token';
      const mockWords = [
        { words: '阿莫西林胶囊' },
        { words: '规格: 0.5g×12粒' }
      ];

      wx.request
        .mockImplementationOnce(({ success }) => {
          success({ data: { access_token: mockToken } });
        })
        .mockImplementationOnce(({ success }) => {
          success({ data: { words_result: mockWords } });
        });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64imagedata')
      });

      const result = await recognizeText('test.jpg');

      expect(result).toEqual({
        success: true,
        words: ['阿莫西林胶囊', '规格: 0.5g×12粒'],
        text: '阿莫西林胶囊 规格: 0.5g×12粒'
      });
    });

    test('识别失败应返回错误信息', async () => {
      const mockToken = 'test_token';

      wx.request
        .mockImplementationOnce(({ success }) => {
          success({ data: { access_token: mockToken } });
        })
        .mockImplementationOnce(({ success }) => {
          success({
            data: {
              error_code: 1,
              error_msg: '图片格式错误'
            }
          });
        });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64imagedata')
      });

      await expect(recognizeText('test.jpg')).rejects.toThrow('OCR识别失败');
    });

    test('无有效数据应抛出错误', async () => {
      const mockToken = 'test_token';

      wx.request
        .mockImplementationOnce(({ success }) => {
          success({ data: { access_token: mockToken } });
        })
        .mockImplementationOnce(({ success }) => {
          success({ data: {} });
        });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64imagedata')
      });

      await expect(recognizeText('test.jpg')).rejects.toThrow('OCR识别失败，未返回有效数据');
    });
  });

  describe('extractMedicineName - 药品名称提取', () => {
    test('应提取常见药品剂型', () => {
      const testCases = [
        { input: '阿莫西林胶囊', contains: '胶囊' },
        { input: '布洛芬片', contains: '片' },
        { input: '感冒颗粒', contains: '颗粒' },
        { input: '止咳口服液', contains: '口服液' },
        { input: '皮炎平软膏', contains: '软膏' },
        { input: '止痛贴剂', contains: '贴剂' }
      ];

      testCases.forEach(({ input, contains }) => {
        const result = extractMedicineName(input);
        expect(result.toLowerCase()).toContain(contains);
      });
    });

    test('应识别常见药品名称', () => {
      // 测试能提取到药品关键词的情况
      const testCases = [
        { input: '布洛芬缓释胶囊', keyword: '布洛芬' },
        { input: '感冒灵颗粒', keyword: '感冒灵' },
        { input: '退烧药', keyword: '退烧' },
        { input: '消炎止痛片', keyword: '消炎' },
        { input: '维生素片', keyword: '维生素' },
        { input: '钙片', keyword: '钙片' }
      ];

      testCases.forEach(({ input, keyword }) => {
        const result = extractMedicineName(input);
        expect(result.toLowerCase()).toContain(keyword.toLowerCase());
      });

      // 测试截取范围（可能不完全匹配完整关键词）
      const result = extractMedicineName('阿莫西林分散片');
      expect(result).toContain('莫西林');
    });

    test('应处理包含上下文的信息', () => {
      const result = extractMedicineName('生产日期: 2023-01-01 阿莫西林胶囊 规格0.5g');
      expect(result.toLowerCase()).toContain('阿莫西林');
    });

    test('应处理多行文本', () => {
      const multilineText = '批准文号: 国药准字H12345678\n阿莫西林胶囊\n规格: 0.5g×12粒';
      const result = extractMedicineName(multilineText);
      expect(result.toLowerCase()).toContain('阿莫西林');
    });

    test('应处理边界情况', () => {
      // 空输入
      expect(extractMedicineName('')).toBe('');

      // 短文本
      expect(extractMedicineName('药')).toBeTruthy();

      // 只有非药品文本
      const result = extractMedicineName('这是一段普通文本');
      expect(result).toBe('这是一段普通文本');
    });

    test('应提取关键词周围的上下文', () => {
      const result = extractMedicineName('厂家:XX制药 阿莫西林胶囊 规格:0.5g');
      // 应该提取关键词及其周围一定范围的文本
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(30);
    });
  });
});