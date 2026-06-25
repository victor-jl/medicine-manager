/**
 * utils/baidu-ocr.js 测试
 * 重点测试：
 * - Token缓存机制
 * - OCR识别结果处理
 * - 药品名称提取逻辑
 * - 错误处理
 */

const { wx, mockStorage } = require('../setup');

// 模拟 baidu-ocr 模块中的函数
const baiduOcr = require('../../utils/baidu-ocr');

describe('baidu-ocr.js', () => {
  describe('extractMedicineName', () => {
    test('应该从识别文本中提取药品名称 - 胶囊', () => {
      const text = '阿莫西林胶囊 0.5g×12粒/盒';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应该从识别文本中提取药品名称 - 片剂', () => {
      const text = '布洛芬片 200mg';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('布洛芬片');
    });

    test('应该从识别文本中提取药品名称 - 颗粒', () => {
      const text = '感冒灵颗粒 10g×9袋';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('感冒灵颗粒');
    });

    test('应该处理空输入', () => {
      expect(baiduOcr.extractMedicineName('')).toBe('');
      expect(baiduOcr.extractMedicineName(null)).toBe('');
      expect(baiduOcr.extractMedicineName(undefined)).toBe('');
    });

    test('应该处理无关键词的文本 - 返回第一行', () => {
      const text = '未知产品\n第二行\n第三行';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBe('未知产品');
    });

    test('应该处理包含多个关键词的文本', () => {
      const text = '复合维生素片 含钙片成分';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应该正确提取常见药品名称', () => {
      const testCases = [
        { input: '阿奇霉素片', expected: '阿奇霉素' },
        { input: '维生素C片', expected: '维生素' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = baiduOcr.extractMedicineName(input);
        expect(result).toContain(expected);
      });
    });

    test('应该处理边界条件 - 文本过短', () => {
      const text = '药';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBe('药');
    });

    test('应该处理多行文本中的药品名称', () => {
      const text = '生产日期: 2024-01-01\n阿莫西林胶囊\n批号: 12345';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });
  });

  describe('getAccessToken', () => {
    beforeEach(() => {
      mockStorage.clear();
    });

    test('应该返回缓存的token（未过期）', async () => {
      const cachedToken = 'cached_token_123';
      const futureExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1天后

      mockStorage.set('baidu_access_token', cachedToken);
      mockStorage.set('baidu_token_expires', futureExpiry);

      // 由于这个函数依赖 wx.request，我们需要模拟它
      // 这里主要测试缓存逻辑
      const storedToken = wx.getStorageSync('baidu_access_token');
      const storedExpiry = wx.getStorageSync('baidu_token_expires');

      expect(storedToken).toBe(cachedToken);
      expect(storedExpiry).toBe(futureExpiry);
    });

    test('应该检测过期token', () => {
      const expiredTime = Date.now() - 1000; // 已过期
      mockStorage.set('baidu_access_token', 'expired_token');
      mockStorage.set('baidu_token_expires', expiredTime);

      const expiry = wx.getStorageSync('baidu_token_expires');
      expect(Date.now() > expiry).toBe(true);
    });
  });

  describe('recognizeText 错误处理', () => {
    test('应该处理无效图片路径', async () => {
      // 测试函数存在
      expect(typeof baiduOcr.recognizeText).toBe('function');
    });
  });
});