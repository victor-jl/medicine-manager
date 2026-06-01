const baiduOcr = require('../baidu-ocr');

describe('utils/baidu-ocr.js', () => {
  describe('extractMedicineName', () => {
    test('应返回空字符串当输入为空', () => {
      expect(baiduOcr.extractMedicineName('')).toBe('');
      expect(baiduOcr.extractMedicineName(null)).toBe('');
      expect(baiduOcr.extractMedicineName(undefined)).toBe('');
    });

    test('应返回空字符串当输入为undefined', () => {
      expect(baiduOcr.extractMedicineName()).toBe('');
    });

    test('应识别胶囊剂型', () => {
      const text = '阿莫西林克拉维酸钾胶囊\n规格：0.5g*12粒';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂', () => {
      const text = '硝苯地平控释片\n30mg*7片';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒剂型', () => {
      const text = '蒙脱石散颗粒\n3g*10袋';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别口服液', () => {
      const text = '复方甘草口服溶液\n100ml';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('口服');
    });

    test('应识别常见药品名称', () => {
      expect(baiduOcr.extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(baiduOcr.extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
      expect(baiduOcr.extractMedicineName('头孢克肟颗粒')).toContain('头孢');
    });

    test('应识别功效关键词', () => {
      expect(baiduOcr.extractMedicineName('退烧片')).toContain('退烧');
      expect(baiduOcr.extractMedicineName('消炎胶囊')).toContain('消炎');
      expect(baiduOcr.extractMedicineName('止咳糖浆')).toContain('止咳');
      expect(baiduOcr.extractMedicineName('平喘口服液')).toContain('平喘');
    });

    test('应处理中英文混合文本', () => {
      const text = 'Amoxicillin Capsule\n阿莫西林胶囊';
      const result = baiduOcr.extractMedicineName(text.toLowerCase());
      expect(result).toContain('阿莫西林');
    });

    test('应返回第一行当无关键词匹配', () => {
      const text = 'XYZ12345\n其他内容';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBe('XYZ12345');
    });

    test('应返回第一行当无关键词匹配', () => {
      const text = 'XYZ第一行内容\n第二行内容';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toBe('XYZ第一行内容');
      expect(result.length).toBeLessThan(30);
    });

    test('应处理包含空行的多行文本', () => {
      const text = '布洛芬缓释胶囊\n\n\n规格：0.3g';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应正确处理关键词的上下文提取', () => {
      const text = 'XX制药厂出品\n布洛芬缓释胶囊\n有效期至2026年';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });

    test('应处理Unicode中文字符', () => {
      const text = '维生素软膏';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应处理带特殊字符的文本', () => {
      const text = '阿莫西林@#胶囊%^';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应返回包含关键词的完整词组', () => {
      const text = '主要功效：退热止痛的布洛芬缓释胶囊';
      const result = baiduOcr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });
  });

  describe('recognizeText', () => {
    test('recognizeText函数存在', () => {
      expect(typeof baiduOcr.recognizeText).toBe('function');
    });

    test('getAccessToken函数存在', () => {
      expect(typeof baiduOcr.getAccessToken).toBe('function');
    });
  });

  describe('模块导出', () => {
    test('应导出recognizeText', () => {
      expect(baiduOcr.recognizeText).toBeDefined();
    });

    test('应导出extractMedicineName', () => {
      expect(baiduOcr.extractMedicineName).toBeDefined();
    });

    test('应导出getAccessToken', () => {
      expect(baiduOcr.getAccessToken).toBeDefined();
    });
  });
});
