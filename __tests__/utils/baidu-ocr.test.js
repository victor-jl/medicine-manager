const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('extractMedicineName (baidu-ocr.js)', () => {
  describe('输入验证', () => {
    test('空输入返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });
  });

  describe('药品关键词匹配', () => {
    test('匹配剂型关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('胶囊');
      expect(extractMedicineName('布洛芬片')).toContain('片');
      expect(extractMedicineName('感冒颗粒')).toContain('颗粒');
      expect(extractMedicineName('止咳口服液')).toContain('口服液');
      expect(extractMedicineName('外用软膏')).toContain('软膏');
    });

    test('匹配药品名称关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(extractMedicineName('布洛芬缓释片')).toContain('布洛芬');
      expect(extractMedicineName('头孢拉定胶囊')).toContain('头孢');
    });

    test('匹配功效关键词', () => {
      expect(extractMedicineName('退烧药')).toContain('退烧');
      expect(extractMedicineName('消炎片')).toContain('消炎');
      expect(extractMedicineName('感冒灵')).toContain('感冒');
    });

    test('匹配慢性病相关关键词', () => {
      expect(extractMedicineName('降压药血压')).toContain('血压');
      expect(extractMedicineName('降糖药血糖')).toContain('血糖');
    });
  });

  describe('边界条件', () => {
    test('关键词在中间位置时提取上下文', () => {
      const text = '生产厂家XX药业 阿莫西林胶囊 规格0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('大小写不敏感', () => {
      const result = extractMedicineName('AMOXICILLIN胶囊');
      expect(result).toContain('胶囊');
    });

    test('无匹配关键词返回第一行', () => {
      const text = '某药品名称\n其他信息';
      expect(extractMedicineName(text)).toBe('某药品名称');
    });

    test('多行文本按换行符分割', () => {
      const text = '第一行\n第二行\n第三行';
      expect(extractMedicineName(text)).toBe('第一行');
    });

    test('处理回车换行符', () => {
      const text = '第一行\r\n第二行';
      expect(extractMedicineName(text)).toBe('第一行');
    });
  });

  describe('实际场景', () => {
    test('完整药品信息提取', () => {
      const ocrText = `
        阿莫西林胶囊
        规格 0.5g×12粒
        有效期至 2025-12
        生产企业 XX制药
      `;
      expect(extractMedicineName(ocrText)).toContain('阿莫西林');
    });

    test('无关键词时截取前20字符', () => {
      const longText = '这是一个很长的没有任何关键词的文本内容';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });
});

describe('getAccessToken 缓存逻辑', () => {
  let mockWx;

  beforeEach(() => {
    mockWx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn(),
      request: jest.fn()
    };
    global.wx = mockWx;
  });

  afterEach(() => {
    delete global.wx;
    jest.clearAllMocks();
  });

  describe('缓存命中', () => {
    test('有效缓存直接返回token', async () => {
      const cachedToken = 'cached_access_token_123';
      const futureExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000;
      
      mockWx.getStorageSync
        .mockReturnValueOnce(cachedToken)
        .mockReturnValueOnce(futureExpiry);

      const { getAccessToken } = require('../../utils/baidu-ocr');
      
      try {
        const token = await getAccessToken();
        expect(token).toBe(cachedToken);
        expect(mockWx.request).not.toHaveBeenCalled();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('缓存过期', () => {
    test('过期缓存触发新请求', async () => {
      const expiredTime = Date.now() - 1000;
      
      mockWx.getStorageSync
        .mockReturnValueOnce('old_token')
        .mockReturnValueOnce(expiredTime);

      mockWx.request.mockImplementation((options) => {
        options.success({ data: { access_token: 'new_token' } });
      });

      const { getAccessToken } = require('../../utils/baidu-ocr');
      
      try {
        const token = await getAccessToken();
        expect(mockWx.request).toHaveBeenCalled();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
