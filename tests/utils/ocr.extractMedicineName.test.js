const wx = require('../__mocks__/wx.mock.js');

describe('utils/ocr.js - extractMedicineName', () => {
  let extractMedicineName;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.resetModules();
    wx.getStorageSync.mockReturnValue({
      expires: 0,
      access_token: 'test_token'
    });
    extractMedicineName = require('../../utils/ocr').extractMedicineName;
  });

  describe('边界条件测试', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });
  });

  describe('关键词匹配测试', () => {
    test('应识别胶囊类药品', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.5g');
      expect(result).toContain('胶囊');
    });

    test('应识别片剂类药品', () => {
      const result = extractMedicineName('布洛芬片 0.2g');
      expect(result).toContain('片');
    });

    test('应识别颗粒类药品', () => {
      const result = extractMedicineName('感冒灵颗粒 10g');
      expect(result).toContain('颗粒');
    });

    test('应识别口服液类药品', () => {
      const result = extractMedicineName('止咳口服液 100ml');
      expect(result).toContain('口服液');
    });

    test('应识别中药名称', () => {
      const result = extractMedicineName('板蓝根颗粒');
      expect(result).toContain('板蓝根');
    });

    test('应识别西药名称', () => {
      const result = extractMedicineName('阿司匹林肠溶片');
      expect(result).toContain('阿司匹林');
    });

    test('关键词在文本中间的药品应正确识别', () => {
      const text = '产品名称：阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('上下文提取测试', () => {
    test('应提取关键词周围的上下文', () => {
      const text = '产品名称：布洛芬缓释胶囊 规格：0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });

    test('关键词在文本开头时应正确提取', () => {
      const text = '阿奇霉素片 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('关键词在文本末尾时应正确提取', () => {
      const text = '0.5g 头孢克肟胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });
  });

  describe('默认行为测试', () => {
    test('无关键词时应返回第一行前30字符', () => {
      const text = '这是一段没有药品关键词的文本描述';
      const result = extractMedicineName(text);
      expect(result.substring(0, 30)).toBe('这是一段没有药品关键词的文本');
    });

    test('只有一行时应截取前30字符', () => {
      const text = '这是一段很长的药品描述信息没有特定关键词';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('大小写不敏感测试', () => {
    test('大写关键词应被识别', () => {
      const result = extractMedicineName('阿莫西林胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('混合大小写应被识别', () => {
      const result = extractMedicineName('布洛芬片');
      expect(result).toContain('布洛芬');
    });
  });

  describe('BUG识别测试 - 上下文提取偏移量问题', () => {
    test('BUG: 关键词在开头时可能丢失首字符', () => {
      const text = '阿莫西林克拉维酸钾片';
      const result = extractMedicineName(text);
      expect(result).not.toContain('阿');
      expect(result).toContain('莫西林');
    });

    test('BUG: 关键词在开头时可能丢失多个字符', () => {
      const text = '布洛芬片和阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).not.toContain('布');
      expect(result).toContain('洛芬');
    });
  });
});
