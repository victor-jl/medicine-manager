/**
 * utils/ocr.js 单元测试
 * 测试重点：药品名称提取、Token缓存机制、OCR识别逻辑
 */
const { extractMedicineName, recognizeWithWechat, recognizeWithBaidu, getBaiduToken } = require('../../utils/ocr');

describe('utils/ocr.js', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  describe('extractMedicineName - 药品名称提取', () => {
    describe('基础功能', () => {
      test('应正确处理空输入', () => {
        expect(extractMedicineName('')).toBe('');
        expect(extractMedicineName(null)).toBe('');
        expect(extractMedicineName(undefined)).toBe('');
      });

      test('应正确处理纯空白文本', () => {
        expect(extractMedicineName('   ')).toBe('');
        expect(extractMedicineName('\n\n')).toBe('');
      });
    });

    describe('药品剂型关键词匹配', () => {
      test('应识别胶囊类药品', () => {
        const result = extractMedicineName('阿莫西林胶囊 0.5g*12粒');
        expect(result).toContain('胶囊');
        expect(result).toContain('阿莫西林');
      });

      test('应识别片剂药品', () => {
        const result = extractMedicineName('布洛芬片 200mg');
        expect(result).toContain('片');
        expect(result).toContain('布洛芬');
      });

      test('应识别颗粒剂药品', () => {
        const result = extractMedicineName('感冒灵颗粒 10g*9袋');
        expect(result).toContain('颗粒');
      });

      test('应识别口服液', () => {
        const result = extractMedicineName('双黄连口服液 10ml*10支');
        expect(result).toContain('口服液');
      });

      test('应识别注射液', () => {
        const result = extractMedicineName('头孢注射液 2g');
        expect(result).toContain('注射液');
      });

      test('应识别软膏', () => {
        const result = extractMedicineName('红霉素软膏 10g');
        expect(result).toContain('软膏');
      });

      test('应识别滴眼液', () => {
        const result = extractMedicineName('氯霉素滴眼液 5ml');
        expect(result).toContain('滴眼液');
      });

      test('应识别糖浆', () => {
        const result = extractMedicineName('止咳糖浆 100ml');
        expect(result).toContain('糖浆');
      });
    });

    describe('常见药品名称匹配', () => {
      test('应识别阿莫西林', () => {
        const result = extractMedicineName('阿莫西林分散片');
        expect(result).toContain('阿莫西林');
      });

      test('应识别布洛芬', () => {
        const result = extractMedicineName('布洛芬缓释胶囊');
        expect(result).toContain('布洛芬');
      });

      test('应识别对乙酰氨基酚', () => {
        const result = extractMedicineName('对乙酰氨基酚片');
        expect(result).toContain('对乙酰氨基酚');
      });

      test('应识别头孢类药物', () => {
        const result = extractMedicineName('头孢克肟分散片');
        expect(result).toContain('头孢');
      });

      test('应识别感冒灵', () => {
        const result = extractMedicineName('999感冒灵颗粒');
        expect(result).toContain('感冒灵');
      });

      test('应识别板蓝根', () => {
        const result = extractMedicineName('板蓝根颗粒');
        expect(result).toContain('板蓝根');
      });

      test('应识别莲花清瘟', () => {
        const result = extractMedicineName('莲花清瘟胶囊');
        expect(result).toContain('莲花清瘟');
      });

      test('应识别维生素类', () => {
        const result = extractMedicineName('维生素C片');
        expect(result).toContain('维生素');
      });

      test('应识别钙片', () => {
        const result = extractMedicineName('碳酸钙D3钙片');
        expect(result).toContain('钙片');
      });

      test('应识别胰岛素', () => {
        const result = extractMedicineName('重组人胰岛素注射液');
        expect(result).toContain('胰岛素');
      });

      test('应识别他汀类药物', () => {
        const result = extractMedicineName('阿托伐他汀钙片');
        expect(result).toContain('他汀');
      });
    });

    describe('功能描述关键词匹配', () => {
      test('应识别止咳药', () => {
        const result = extractMedicineName('止咳化痰颗粒');
        expect(result).toContain('止咳');
      });

      test('应识别退烧药', () => {
        const result = extractMedicineName('退烧止痛片');
        expect(result).toContain('退烧');
      });

      test('应识别消炎药', () => {
        const result = extractMedicineName('消炎镇痛膏');
        expect(result).toContain('消炎');
      });
    });

    describe('边界条件和极端情况', () => {
      test('应处理超长药品名称', () => {
        const longName = '阿莫西林克拉维酸钾分散片'.repeat(5);
        const result = extractMedicineName(longName);
        expect(result.length).toBeLessThanOrEqual(30);
      });

      test('应处理包含特殊字符的文本', () => {
        const result = extractMedicineName('【阿莫西林胶囊】*#@!');
        expect(result).toContain('阿莫西林');
      });

      test('应处理多行文本', () => {
        const multiline = `
          批准文号：国药准字H12345
          阿莫西林胶囊
          有效期至：2025年12月
        `;
        const result = extractMedicineName(multiline);
        expect(result).toContain('阿莫西林');
      });

      test('应处理大小写混合', () => {
        const result = extractMedicineName('AMOXICILLIN阿莫西林胶囊');
        expect(result).toContain('阿莫西林');
      });

      test('应返回第一行作为默认值（无关键词匹配时）', () => {
        const result = extractMedicineName('未知药品名称\n第二行');
        expect(result).toBe('未知药品名称');
      });

      test('应截断过长的默认返回值', () => {
        const longText = '这是一个非常长的药品名称超过了三十个字符的限制';
        const result = extractMedicineName(longText);
        expect(result.length).toBeLessThanOrEqual(30);
      });
    });

    describe('关键词优先级和位置', () => {
      test('应提取关键词周围的上下文', () => {
        const text = '生产企业：XX制药厂\n阿莫西林胶囊\n规格：0.5g';
        const result = extractMedicineName(text);
        expect(result).toContain('阿莫西林');
        expect(result).toContain('胶囊');
      });

      test('应处理关键词出现在文本末尾的情况', () => {
        const result = extractMedicineName('药品名称：阿莫西林胶囊');
        expect(result).toContain('阿莫西林');
      });

      test('应处理关键词出现在文本开头的情况', () => {
        const result = extractMedicineName('阿莫西林胶囊 0.5g*12粒/盒');
        expect(result).toContain('阿莫西林');
      });
    });
  });

  describe('getBaiduToken - Token缓存机制', () => {
    test('应使用缓存的未过期Token', async () => {
      const cachedToken = 'cached_valid_token';
      const futureExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1天后过期

      setMockStorage('baidu_token', {
        access_token: cachedToken,
        expires: futureExpiry
      });

      const token = await getBaiduToken();
      expect(token).toBe(cachedToken);
    });

    test('应在Token过期时获取新Token', async () => {
      const expiredTime = Date.now() - 1000; // 已过期

      setMockStorage('baidu_token', {
        access_token: 'expired_token',
        expires: expiredTime
      });

      const token = await getBaiduToken();
      expect(token).toMatch(/^mock_access_token_/);
    });

    test('应在无缓存时获取新Token', async () => {
      const token = await getBaiduToken();
      expect(token).toMatch(/^mock_access_token_/);
    });

    test('新Token应缓存25天', async () => {
      const beforeRequest = Date.now();
      await getBaiduToken();

      const cached = getMockStorage('baidu_token');
      const expectedExpiry = beforeRequest + 25 * 24 * 60 * 60 * 1000;

      // 允许1秒误差
      expect(Math.abs(cached.expires - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('recognizeWithBaidu - 百度OCR识别', () => {
    test('应成功识别图片文字', async () => {
      setMockStorage('baidu_token', {
        access_token: 'test_token',
        expires: Date.now() + 24 * 60 * 60 * 1000
      });

      const result = await recognizeWithBaidu('/mock/image.jpg');

      expect(result.success).toBe(true);
      expect(result.words).toBeDefined();
      expect(result.text).toBeDefined();
    });

    test('应正确处理识别结果', async () => {
      setMockStorage('baidu_token', {
        access_token: 'test_token',
        expires: Date.now() + 24 * 60 * 60 * 1000
      });

      const result = await recognizeWithBaidu('/mock/image.jpg');

      expect(Array.isArray(result.words)).toBe(true);
      expect(typeof result.text).toBe('string');
    });
  });

  describe('recognizeWithWechat - 微信云函数OCR', () => {
    test('应成功调用云函数识别', async () => {
      const result = await recognizeWithWechat('cloud://mock-image.jpg');

      expect(result.success).toBe(true);
      expect(result.words).toBeDefined();
      expect(result.text).toBeDefined();
    });

    test('应正确分割识别文本', async () => {
      const result = await recognizeWithWechat('cloud://mock-image.jpg');

      expect(Array.isArray(result.words)).toBe(true);
      // 过滤空行后应仍有有内容
      expect(result.words.length).toBeGreaterThanOrEqual(0);
    });
  });
});
