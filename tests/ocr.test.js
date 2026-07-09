// tests/ocr.test.js
// OCR工具函数单元测试

const {
  recognizeWithWechat,
  recognizeWithBaidu,
  extractMedicineName
} = require('../utils/ocr');

// Mock wx API
global.wx = {
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  request: jest.fn(),
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  getFileSystemManager: jest.fn()
};

describe('OCR工具函数测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMedicineName - 药品名称提取', () => {
    test('应正确提取包含药品剂型的文本', () => {
      const testCases = [
        {
          input: '阿莫西林胶囊 规格:0.5g',
          expected: '阿莫西林胶囊'
        },
        {
          input: '布洛芬片 0.2g×12片/盒',
          expected: '布洛芬片'
        },
        {
          input: '小儿感冒颗粒',
          expected: '小儿感冒颗粒'
        },
        {
          input: '头孢克肟口服液',
          expected: '头孢克肟口服液'
        },
        {
          input: '外用软膏',
          expected: '外用软膏'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractMedicineName(input);
        expect(result).toContain(expected.substring(0, 3));
      });
    });

    test('应正确提取包含药品名称关键词的文本', () => {
      const testCases = [
        { input: '阿莫西林胶囊', keyword: '阿莫西林' },
        { input: '布洛芬缓释胶囊', keyword: '布洛芬' },
        { input: '对乙酰氨基酚片', keyword: '对乙酰氨基酚' },
        { input: '感冒灵颗粒', keyword: '感冒灵' }
      ];

      testCases.forEach(({ input, keyword }) => {
        const result = extractMedicineName(input);
        expect(result.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });

    test('应处理空输入和无效输入', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应处理没有药品关键词的文本', () => {
      const result = extractMedicineName('普通文本第一行\n第二行');
      expect(result).toBe('普通文本第一行');
    });

    test('应正确处理包含多个关键词的文本', () => {
      const result = extractMedicineName('复方氨酚烷胺片 感冒药');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    test('应提取包含贮藏条件的药品信息', () => {
      const result = extractMedicineName('维生素C片 密封保存');
      expect(result).toContain('维生素');
    });
  });

  describe('recognizeWithWechat - 微信云函数OCR', () => {
    test('成功识别应返回正确格式', async () => {
      const mockText = '阿莫西林胶囊\n规格0.5g';

      wx.cloud.callFunction.mockImplementation(({ success }) => {
        success({ result: { text: mockText } });
      });

      const result = await recognizeWithWechat('test.jpg');

      expect(result).toEqual({
        success: true,
        words: ['阿莫西林胶囊', '规格0.5g'],
        text: mockText
      });
      expect(wx.cloud.init).toHaveBeenCalled();
    });

    test('云函数调用失败应抛出错误', async () => {
      const mockError = new Error('云函数调用失败');

      wx.cloud.callFunction.mockImplementation(({ fail }) => {
        fail(mockError);
      });

      await expect(recognizeWithWechat('test.jpg')).rejects.toThrow(mockError);
    });

    test('返回结果无效应抛出错误', async () => {
      wx.cloud.callFunction.mockImplementation(({ success }) => {
        success({ result: {} });
      });

      await expect(recognizeWithWechat('test.jpg')).rejects.toThrow('识别失败');
    });
  });

  describe('recognizeWithBaidu - 百度OCR识别', () => {
    test('成功识别应返回正确格式', async () => {
      const mockToken = 'mock_access_token';
      const mockWords = [
        { words: '阿莫西林胶囊' },
        { words: '规格: 0.5g' }
      ];

      wx.getStorageSync.mockReturnValue({
        access_token: mockToken,
        expires: Date.now() + 1000000
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64string')
      });

      wx.request.mockImplementation(({ success }) => {
        success({ data: { words_result: mockWords } });
      });

      const result = await recognizeWithBaidu('test.jpg');

      expect(result).toEqual({
        success: true,
        words: ['阿莫西林胶囊', '规格: 0.5g'],
        text: '阿莫西林胶囊 规格: 0.5g'
      });
    });

    test('Token过期应重新获取', async () => {
      const mockToken = 'new_access_token';
      const mockWords = [{ words: '测试药品' }];

      wx.getStorageSync.mockReturnValueOnce({
        access_token: 'old_token',
        expires: Date.now() - 1000 // 已过期
      }).mockReturnValueOnce({
        access_token: mockToken,
        expires: Date.now() + 1000000
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64string')
      });

      let tokenRequestCalled = false;
      let ocrRequestCalled = false;

      wx.request.mockImplementation(({ url, success }) => {
        if (url.includes('oauth/2.0/token')) {
          tokenRequestCalled = true;
          success({ data: { access_token: mockToken } });
        } else if (url.includes('ocr/v1')) {
          ocrRequestCalled = true;
          success({ data: { words_result: mockWords } });
        }
      });

      const result = await recognizeWithBaidu('test.jpg');

      expect(tokenRequestCalled).toBe(true);
      expect(ocrRequestCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    test('OCR识别失败应抛出错误', async () => {
      wx.getStorageSync.mockReturnValue({
        access_token: 'token',
        expires: Date.now() + 1000000
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn().mockReturnValue('base64string')
      });

      wx.request.mockImplementation(({ success }) => {
        success({ data: { error_msg: '识别失败' } });
      });

      await expect(recognizeWithBaidu('test.jpg')).rejects.toThrow();
    });
  });
});