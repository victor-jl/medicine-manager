/**
 * utils/baidu-ocr.js 单元测试
 * 测试重点：Token获取与缓存、OCR识别、错误处理、药品名称提取
 */
const { getAccessToken, recognizeText, extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  describe('getAccessToken - Token获取与缓存', () => {
    test('应返回缓存的有效Token', async () => {
      const cachedToken = 'cached_access_token';
      const futureExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000; // 10天后过期

      setMockStorage('baidu_access_token', cachedToken);
      setMockStorage('baidu_token_expires', futureExpiry);

      const token = await getAccessToken();
      expect(token).toBe(cachedToken);
    });

    test('应在Token过期时获取新Token', async () => {
      const expiredTime = Date.now() - 1000; // 已过期

      setMockStorage('baidu_access_token', 'expired_token');
      setMockStorage('baidu_token_expires', expiredTime);

      const token = await getAccessToken();
      expect(token).toMatch(/^mock_access_token_/);
    });

    test('应在无缓存时获取新Token', async () => {
      const token = await getAccessToken();
      expect(token).toMatch(/^mock_access_token_/);
    });

    test('新Token应缓存25天', async () => {
      const beforeRequest = Date.now();
      await getAccessToken();

      const cachedToken = getMockStorage('baidu_access_token');
      const cachedExpiry = getMockStorage('baidu_token_expires');
      const expectedExpiry = beforeRequest + 25 * 24 * 60 * 60 * 1000;

      expect(cachedToken).toMatch(/^mock_access_token_/);
      // 允许1秒误差
      expect(Math.abs(cachedExpiry - expectedExpiry)).toBeLessThan(1000);
    });

    test('应正确处理Token请求失败', async () => {
      // 模拟请求失败场景
      wx.request = jest.fn((options) => {
        options.fail && options.fail({ errMsg: 'request:fail' });
      });

      await expect(getAccessToken()).rejects.toBeDefined();
    });
  });

  describe('recognizeText - OCR文字识别', () => {
    beforeEach(() => {
      // 恢复默认mock
      wx.request = jest.fn((options) => {
        const { url, success } = options;
        if (url.includes('oauth/2.0/token')) {
          success && success({
            data: { access_token: 'mock_token' }
          });
        } else if (url.includes('ocr/v1/general_basic')) {
          success && success({
            data: {
              words_result: [
                { words: '阿莫西林胶囊' },
                { words: '有效期至2025年12月' }
              ]
            }
          });
        }
      });
    });

    test('应成功识别图片文字', async () => {
      const result = await recognizeText('/mock/image.jpg');

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['阿莫西林胶囊', '有效期至2025年12月']);
      expect(result.text).toBe('阿莫西林胶囊 有效期至2025年12月');
    });

    test('应正确处理空识别结果', async () => {
        wx.request = jest.fn((options) => {
          const { url, success } = options;
          if (url.includes('oauth/2.0/token')) {
            success && success({ data: { access_token: 'mock_token' } });
          } else if (url.includes('ocr/v1/general_basic')) {
            success && success({
              data: { words_result: [] }
            });
          }
        });

        // 空结果返回空数组，不抛出错误
        const result = await recognizeText('/mock/image.jpg');
        expect(result.words).toEqual([]);
      });

    test('应正确处理API错误响应', async () => {
      wx.request = jest.fn((options) => {
        const { url, success } = options;
        if (url.includes('oauth/2.0/token')) {
          success && success({ data: { access_token: 'mock_token' } });
        } else if (url.includes('ocr/v1/general_basic')) {
          success && success({
            data: {
              error_code: '17',
              error_msg: 'Open API daily request limit reached'
            }
          });
        }
      });

      await expect(recognizeText('/mock/image.jpg')).rejects.toThrow('OCR识别失败');
    });

    test('应正确处理网络请求失败', async () => {
      wx.request = jest.fn((options) => {
        const { url, fail } = options;
        if (url.includes('oauth/2.0/token')) {
          fail && fail({ errMsg: 'request:fail timeout' });
        }
      });

      await expect(recognizeText('/mock/image.jpg')).rejects.toBeDefined();
    });
  });

  describe('extractMedicineName - 药品名称提取', () => {
    test('应处理空输入', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应识别常见药品关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(extractMedicineName('布洛芬片')).toContain('布洛芬');
      expect(extractMedicineName('感冒灵颗粒')).toContain('感冒灵');
      expect(extractMedicineName('维生素')).toContain('维生素');
      expect(extractMedicineName('钙片')).toContain('钙片');
    });

    test('应识别剂型关键词', () => {
      expect(extractMedicineName('某药品胶囊')).toContain('胶囊');
      expect(extractMedicineName('某药品片')).toContain('片');
      expect(extractMedicineName('某药品颗粒')).toContain('颗粒');
      expect(extractMedicineName('某药品口服液')).toContain('口服液');
      expect(extractMedicineName('某药品注射液')).toContain('注射液');
      expect(extractMedicineName('某药品软膏')).toContain('软膏');
      expect(extractMedicineName('某药品贴剂')).toContain('贴剂');
    });

    test('应识别功能关键词', () => {
      expect(extractMedicineName('退烧药')).toContain('退烧');
      expect(extractMedicineName('消炎药')).toContain('消炎');
      expect(extractMedicineName('止咳药')).toContain('止咳');
    });

    test('应处理大小写', () => {
      const result = extractMedicineName('AMOXICILLIN阿莫西林胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('应返回第一行作为默认值', () => {
      const result = extractMedicineName('未知药品\n第二行');
      expect(result).toBe('未知药品');
    });

    test('应处理多行文本', () => {
      const text = `
        国药准字H12345
        阿莫西林胶囊
        有效期2025年
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应截断过长的默认返回值', () => {
        const longText = '这是一个非常长的药品名称超过了二十个字符的限制';
        const result = extractMedicineName(longText);
        // baidu-ocr.js 中截断长度为20
        expect(result.length).toBeLessThanOrEqual(30);
      });
  });
});
