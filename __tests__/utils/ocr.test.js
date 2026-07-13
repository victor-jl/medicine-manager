/**
 * utils/ocr.js 测试
 * 测试OCR识别和药品名称提取功能
 */

const { recognizeWithWechat, recognizeWithBaidu, extractMedicineName } = require('../../utils/ocr');

describe('ocr.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__mockStorage__.clear();
  });

  describe('recognizeWithWechat', () => {
    test('应该成功识别文本', async () => {
      const testImagePath = '/tmp/test.jpg';
      const recognizedText = '阿莫西林胶囊\n有效期至2025-12-31';

      wx.cloud.callFunction.mockImplementation((options) => {
        if (options.success) {
          options.success({
            result: {
              text: recognizedText
            }
          });
        }
      });

      const result = await recognizeWithWechat(testImagePath);
      
      expect(result.success).toBe(true);
      expect(result.text).toBe(recognizedText);
      expect(result.words).toEqual(['阿莫西林胶囊', '有效期至2025-12-31']);
    });

    test('识别失败应该抛出错误（无结果）', async () => {
      const testImagePath = '/tmp/test.jpg';

      wx.cloud.callFunction.mockImplementation((options) => {
        if (options.success) {
          options.success({
            result: null
          });
        }
      });

      await expect(recognizeWithWechat(testImagePath)).rejects.toThrow('识别失败');
    });

    test('云函数调用失败应该抛出错误', async () => {
      const testImagePath = '/tmp/test.jpg';

      wx.cloud.callFunction.mockImplementation((options) => {
        if (options.fail) {
          options.fail({ errMsg: 'cloud function error' });
        }
      });

      await expect(recognizeWithWechat(testImagePath)).rejects.toThrow();
    });
  });

  describe('recognizeWithBaidu', () => {
    test('应该成功识别文本', async () => {
      const testImagePath = '/tmp/test.jpg';
      const testToken = 'test-baidu-token';

      // 模拟获取token
      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          options.success({
            data: {
              access_token: testToken
            }
          });
        } else if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {
              words_result: [
                { words: '布洛芬片' },
                { words: '有效期：2025-12-31' }
              ]
            }
          });
        }
      });

      const result = await recognizeWithBaidu(testImagePath);
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['布洛芬片', '有效期：2025-12-31']);
      expect(result.text).toBe('布洛芬片 有效期：2025-12-31');
    });

    test('应该使用缓存的token', async () => {
      const testImagePath = '/tmp/test.jpg';
      const cachedToken = 'cached-token';

      // 设置缓存的token
      global.__mockStorage__.set('baidu_token', {
        access_token: cachedToken,
        expires: Date.now() + 24 * 60 * 60 * 1000
      });

      let tokenRequestCalled = false;

      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          tokenRequestCalled = true;
          options.success({ data: { access_token: 'new-token' } });
        } else if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {
              words_result: [{ words: '测试药品' }]
            }
          });
        }
      });

      await recognizeWithBaidu(testImagePath);
      
      // 不应该调用token请求
      expect(tokenRequestCalled).toBe(false);
    });

    test('识别失败应该抛出错误', async () => {
      const testImagePath = '/tmp/test.jpg';

      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth/2.0/token')) {
          options.success({ data: { access_token: 'test-token' } });
        } else if (options.url.includes('ocr/v1/general_basic')) {
          options.success({
            data: {
              error_code: 17,
              error_msg: 'Open API daily request limit reached'
            }
          });
        }
      });

      await expect(recognizeWithBaidu(testImagePath)).rejects.toThrow('识别失败');
    });
  });

  describe('extractMedicineName', () => {
    test('应该提取药品名称（胶囊）', () => {
      const text = '阿莫西林胶囊\n有效期至2025-12-31';
      const name = extractMedicineName(text);
      
      expect(name).toContain('胶囊');
    });

    test('应该提取药品名称（片剂）', () => {
      const text = '布洛芬片\n生产日期：2024-01-01';
      const name = extractMedicineName(text);
      
      expect(name).toContain('片');
    });

    test('应该提取药品名称（颗粒）', () => {
      const text = '感冒灵颗粒\n用于感冒发热';
      const name = extractMedicineName(text);
      
      expect(name).toContain('颗粒');
    });

    test('应该提取药品名称（口服液）', () => {
      const text = '小儿止咳糖浆口服液\n儿童用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('口服液');
    });

    test('应该提取药品名称（注射液）', () => {
      const text = '头孢注射液\n注射用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('注射液');
    });

    test('应该提取药品名称（软膏）', () => {
      const text = '皮炎平软膏\n外用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('软膏');
    });

    test('应该提取药品名称（贴剂）', () => {
      const text = '止痛贴剂\n外用贴剂';
      const name = extractMedicineName(text);
      
      expect(name).toContain('贴剂');
    });

    test('应该提取药品名称（滴眼液）', () => {
      const text = '左氧氟沙星滴眼液\n眼科用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('滴眼液');
    });

    test('应该提取药品名称（糖浆）', () => {
      const text = '小儿止咳糖浆\n儿童用药';
      const name = extractMedicineName(text);
      
      expect(name).toContain('糖浆');
    });

    test('应该提取药品名称（具体药品名）', () => {
      const testCases = [
        { text: '阿莫西林胶囊', keyword: '阿莫西林' },
        { text: '布洛芬片剂', keyword: '布洛芬' },
        { text: '对乙酰氨基酚片', keyword: '对乙酰氨基酚' },
        { text: '头孢拉定胶囊', keyword: '头孢' },
        { text: '阿奇霉素片', keyword: '阿奇霉素' },
        { text: '罗红霉素胶囊', keyword: '罗红霉素' },
        { text: '感冒灵颗粒', keyword: '感冒灵' },
        { text: '板蓝根颗粒', keyword: '板蓝根' },
        { text: '双黄连口服液', keyword: '双黄连' },
        { text: '莲花清瘟胶囊', keyword: '莲花清瘟' },
        { text: '维生素C片', keyword: '维生素' },
        { text: '钙片', keyword: '钙片' },
        { text: '奥美拉唑肠溶胶囊', keyword: '奥美拉唑' },
        { text: '硝苯地平片', keyword: '硝苯地平' },
        { text: '二甲双胍片', keyword: '二甲双胍' },
        { text: '阿司匹林片', keyword: '阿司匹林' },
        { text: '氯雷他定片', keyword: '氯雷他定' },
      ];

      testCases.forEach(({ text, keyword }) => {
        const name = extractMedicineName(text);
        expect(name.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });

    test('应该处理不包含关键词的文本', () => {
      const text = '这是一个普通文本';
      const name = extractMedicineName(text);
      
      expect(name).toBe('这是一个普通文本');
    });

    test('应该处理空文本', () => {
      const name = extractMedicineName('');
      
      expect(name).toBe('');
    });

    test('应该处理null值', () => {
      const name = extractMedicineName(null);
      
      expect(name).toBe('');
    });

    test('应该处理undefined值', () => {
      const name = extractMedicineName(undefined);
      
      expect(name).toBe('');
    });

    test('应该从多行文本提取（无关键词时返回第一行）', () => {
      const text = '产品说明书\n第二行\n第三行';
      const name = extractMedicineName(text);
      
      expect(name).toBe('产品说明书');
    });

    test('应该限制提取长度（第一行超过30字符）', () => {
      const longText = '这是一个非常长的产品名称超过三十个字符的文本内容应该被截断';
      const name = extractMedicineName(longText);
      
      expect(name.length).toBeLessThanOrEqual(30);
    });

    test('应该处理包含多个关键词的情况', () => {
      const text = '维生素钙片\n包含维生素C';
      const name = extractMedicineName(text);
      
      // 应该匹配第一个找到的关键词
      expect(name).toContain('钙片');
    });

    test('应该提取关键词周围的文本', () => {
      const text = '产品名称：阿莫西林胶囊\n有效期：2025-12-31';
      const name = extractMedicineName(text);
      
      expect(name).toContain('阿莫西林胶囊');
      // 应该包含关键词周围的部分文本
      expect(name.length).toBeGreaterThan(3);
    });

    test('应该处理大小写不敏感', () => {
      const text = '阿莫西林胶囊'.toUpperCase();
      const name = extractMedicineName(text);
      
      expect(name.toLowerCase()).toContain('胶囊');
    });

    test('应该处理包含换行符的文本', () => {
      const text = '阿莫西林胶囊\r\n有效期：2025-12-31\n生产日期：2024-01-01';
      const name = extractMedicineName(text);
      
      expect(name).toContain('胶囊');
    });
  });
});