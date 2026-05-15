// tests/utils/ocr.test.js
// utils/ocr.js 单元测试 - 高优先级核心模块

describe('utils/ocr.js - 药品OCR识别模块', () => {
  let ocr;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    ocr = require('../../utils/ocr');
  });

  describe('extractMedicineName - 药品名称提取', () => {
    test('应从包含胶囊关键词的文本中提取药品名称', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应从包含片剂关键词的文本中提取药品名称', () => {
      const text = '布洛芬片 0.2g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    test('应从包含颗粒关键词的文本中提取药品名称', () => {
      const text = '感冒灵颗粒 10g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('感冒灵');
      expect(result).toContain('颗粒');
    });

    test('应处理空字符串输入', () => {
      const result = ocr.extractMedicineName('');
      expect(result).toBe('');
    });

    test('应处理null输入', () => {
      const result = ocr.extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应处理undefined输入', () => {
      const result = ocr.extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('应处理不含关键词的文本，返回第一行前30字符', () => {
      const text = '这是一段没有药品关键词的文本';
      const result = ocr.extractMedicineName(text);
      expect(result).toBe(text.substring(0, 30));
    });

    test('应处理中文大写关键词（不区分大小写）', () => {
      const text = '维生素C片';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('维');
    });

    test('应处理药品名称在文本中间的情况', () => {
      const text = '生产日期:2024-01-01 布洛芬片 0.2g 生产厂家';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应处理药品名称在文本末尾的情况', () => {
      const text = '用法:每日3次 每次1片 阿司匹林肠溶片';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿司匹林');
    });

    test('应处理OCR识别常见的多行文本格式', () => {
      const text = '阿奇霉素片\n0.25g\n每日一次';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应处理包含特殊字符的药品名称', () => {
      const text = '奥美拉唑肠溶胶囊 20mg';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应匹配复杂药品名称（带规格和品牌）', () => {
      const text = '【拜耳】阿司匹林肠溶片 100mg';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿司匹林');
    });
  });

  describe('recognizeWithBaidu - 百度OCR识别', () => {
    test('应处理识别失败的情况', async () => {
      wx.request.mockImplementation((options) => {
        if (options.url.includes('token')) {
          options.success({ data: { access_token: 'mock_token' } });
        } else {
          options.success({ data: {} });
        }
        return { errMsg: 'ok' };
      });

      await expect(ocr.recognizeWithBaidu('/mock/image.jpg'))
        .rejects.toThrow('识别失败');
    });
  });

  describe('recognizeWithWechat - 微信OCR识别', () => {
    beforeEach(() => {
      if (!wx.cloud) {
        wx.cloud = {
          init: jest.fn(),
          callFunction: jest.fn()
        };
      }
    });

    test('应正确调用微信云函数OCR', async () => {
      wx.cloud.init.mockReturnValue();
      wx.cloud.callFunction.mockImplementation((options) => {
        options.success({
          result: {
            text: '阿莫西林胶囊\n0.5g'
          }
        });
      });

      const result = await ocr.recognizeWithWechat('/mock/image.jpg');

      expect(result.success).toBe(true);
      expect(result.text).toBe('阿莫西林胶囊\n0.5g');
      expect(result.words).toEqual(['阿莫西林胶囊', '0.5g']);
    });

    test('应处理OCR识别无结果的情况', async () => {
      wx.cloud.init.mockReturnValue();
      wx.cloud.callFunction.mockImplementation((options) => {
        options.success({ result: null });
      });

      await expect(ocr.recognizeWithWechat('/mock/image.jpg'))
        .rejects.toThrow('识别失败');
    });
  });
});
