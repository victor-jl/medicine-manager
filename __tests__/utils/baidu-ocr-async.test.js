/**
 * utils/baidu-ocr.js 异步函数测试
 * 测试百度OCR API调用逻辑（需要Mock wx API）
 */

const { wx, resetMockStorage, setMockStorage } = require('../mocks/wx');

// 在加载模块前设置全局wx
global.wx = wx;

const { getAccessToken, recognizeText } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js 异步函数', () => {
  
  beforeEach(() => {
    resetMockStorage();
    jest.clearAllMocks();
  });
  
  describe('getAccessToken', () => {
    
    test('应该从缓存返回有效的token', async () => {
      const cachedToken = 'cached_token_12345';
      const futureExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000;
      
      setMockStorage('baidu_access_token', cachedToken);
      setMockStorage('baidu_token_expires', futureExpiry);
      
      const token = await getAccessToken();
      expect(token).toBe(cachedToken);
      expect(wx.request).not.toHaveBeenCalled();
    });
    
    test('应该在缓存过期时获取新token', async () => {
      const pastExpiry = Date.now() - 1000;
      setMockStorage('baidu_access_token', 'old_token');
      setMockStorage('baidu_token_expires', pastExpiry);
      
      const token = await getAccessToken();
      expect(token).toBe('mock_access_token_12345');
      expect(wx.request).toHaveBeenCalled();
    });
    
    test('应该在无缓存时获取新token', async () => {
      const token = await getAccessToken();
      expect(token).toBe('mock_access_token_12345');
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('oauth/2.0/token')
        })
      );
    });
    
    test('应该缓存获取到的新token', async () => {
      await getAccessToken();
      
      expect(wx.setStorageSync).toHaveBeenCalledWith(
        'baidu_access_token',
        'mock_access_token_12345'
      );
      expect(wx.setStorageSync).toHaveBeenCalledWith(
        'baidu_token_expires',
        expect.any(Number)
      );
    });
  });
  
  describe('recognizeText', () => {
    
    test('应该正确识别图片中的文字', async () => {
      const imagePath = '/tmp/test-image.jpg';
      
      const result = await recognizeText(imagePath);
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('words');
      expect(result).toHaveProperty('text');
      expect(Array.isArray(result.words)).toBe(true);
    });
    
    test('应该将识别结果转换为数组', async () => {
      const imagePath = '/tmp/test-image.jpg';
      
      const result = await recognizeText(imagePath);
      
      expect(result.words).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/阿莫西林/)
        ])
      );
    });
    
    test('应该调用百度OCR API', async () => {
      const imagePath = '/tmp/test-image.jpg';
      
      await recognizeText(imagePath);
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('ocr/v1/general_basic')
        })
      );
    });
    
    test('应该将图片转换为base64', async () => {
      const imagePath = '/tmp/test-image.jpg';
      
      await recognizeText(imagePath);
      
      expect(wx.getFileSystemManager).toHaveBeenCalled();
    });
    
    test('应该先获取access token再调用OCR', async () => {
      const imagePath = '/tmp/test-image.jpg';
      
      await recognizeText(imagePath);
      
      const requestCalls = wx.request.mock.calls;
      const tokenCall = requestCalls.find(call => 
        call[0].url && call[0].url.includes('oauth/2.0/token')
      );
      const ocrCall = requestCalls.find(call => 
        call[0].url && call[0].url.includes('ocr/v1/general_basic')
      );
      
      expect(tokenCall).toBeDefined();
      expect(ocrCall).toBeDefined();
    });
    
    test('应该处理文件系统错误', async () => {
      wx.getFileSystemManager.mockReturnValueOnce({
        readFileSync: jest.fn(() => {
          throw new Error('文件读取失败');
        })
      });
      
      const imagePath = '/invalid/path.jpg';
      
      await expect(recognizeText(imagePath)).rejects.toThrow();
    });
  });
});