const { extractMedicineName } = require('../ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  describe('基础功能', () => {
    test('应返回空字符串当输入为空', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应正确处理undefined输入', () => {
      const result = extractMedicineName();
      expect(result).toBe('');
    });
  });

  describe('药品剂型识别', () => {
    test('应识别胶囊剂型', () => {
      const text = '阿莫西林胶囊\n0.25g*12粒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂', () => {
      const text = '布洛芬片 500mg\n退热镇痛';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应识别颗粒剂型', () => {
      const text = '感冒灵颗粒\n10g*9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别口服液剂型', () => {
      const text = '止咳口服液\n100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别注射液剂型', () => {
      const text = '胰岛素注射液\n3ml:300单位';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏剂型', () => {
      const text = '红霉素软膏\n10g';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应识别贴剂', () => {
      const text = '布洛芬缓释贴剂\n7贴/盒';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });

    test('应识别滴眼液', () => {
      const text = '氯霉素滴眼液\n8ml';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应识别糖浆剂型', () => {
      const text = '小儿止咳糖浆\n100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('药品名称识别', () => {
    test('应识别抗生素类药品', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(extractMedicineName('头孢克肟颗粒')).toContain('头孢');
      expect(extractMedicineName('阿奇霉素片')).toContain('阿奇霉素');
      expect(extractMedicineName('罗红霉素分散片')).toContain('罗红霉素');
    });

    test('应识别解热镇痛类药品', () => {
      expect(extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
      expect(extractMedicineName('对乙酰氨基酚片')).toContain('对乙酰氨基酚');
      expect(extractMedicineName('阿司匹林肠溶片')).toContain('阿司匹林');
    });

    test('应识别感冒用药', () => {
      expect(extractMedicineName('感冒灵颗粒')).toContain('感冒灵');
      expect(extractMedicineName('感冒清热颗粒')).toContain('感冒清热');
      expect(extractMedicineName('板蓝根颗粒')).toContain('板蓝根');
      expect(extractMedicineName('双黄连口服液')).toContain('双黄连');
      expect(extractMedicineName('连花清瘟胶囊')).toContain('连花清瘟');
    });

    test('应识别营养补充类药品', () => {
      expect(extractMedicineName('维生素C片')).toContain('维生素');
      expect(extractMedicineName('钙片咀嚼片')).toContain('钙片');
      expect(extractMedicineName('叶酸片')).toContain('叶酸');
    });

    test('应识别消化系统药品', () => {
      expect(extractMedicineName('奥美拉唑肠溶胶囊')).toContain('奥美拉唑');
      expect(extractMedicineName('兰索拉唑片')).toContain('兰索拉唑');
      expect(extractMedicineName('泮托拉唑钠肠溶片')).toContain('泮托拉唑');
    });

    test('应识别心血管系统药品', () => {
      expect(extractMedicineName('硝苯地平缓释片')).toContain('硝苯地平');
      expect(extractMedicineName('氨氯地平片')).toContain('氨氯地平');
      expect(extractMedicineName('贝那普利片')).toContain('贝那普利');
    });

    test('应识别糖尿病药品', () => {
      expect(extractMedicineName('二甲双胍片')).toContain('二甲双胍');
      expect(extractMedicineName('格列本脲片')).toContain('格列本脲');
    });

    test('应识别抗过敏药品', () => {
      expect(extractMedicineName('氯雷他定片')).toContain('氯雷他定');
      expect(extractMedicineName('西替利嗪片')).toContain('西替利嗪');
    });

    test('应识别止泻药品', () => {
      expect(extractMedicineName('蒙脱石散')).toContain('蒙脱石');
    });

    test('应识别功效关键词', () => {
      expect(extractMedicineName('退烧片')).toContain('退烧');
      expect(extractMedicineName('消炎胶囊')).toContain('消炎');
      expect(extractMedicineName('止咳糖浆')).toContain('止咳');
    });
  });

  describe('文本处理逻辑', () => {
    test('应返回包含关键词的上下文片段', () => {
      const text = 'XX制药\n阿莫西林胶囊\n0.25g*12粒';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应处理多行文本', () => {
      const text = '生产企业：XX药业\n阿莫西林胶囊\n有效期至2025年';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应处理包含空行的文本', () => {
      const text = '布洛芬缓释胶囊\n\n规格：0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应处理大写文本', () => {
      const text = 'AMOXICILLIN CAPSULES';
      const result = extractMedicineName(text.toLowerCase());
      expect(result).toContain('capsules');
    });

    test('应返回第一行当无关键词匹配', () => {
      const text = 'UNKNOWN123\n其他内容';
      const result = extractMedicineName(text);
      expect(result).toBe('UNKNOWN123');
    });

    test('应截断过长的返回结果', () => {
      const text = '非常非常非常非常非常非常非常非常非常非常长的药品名称胶囊'.repeat(3);
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('边界条件', () => {
    test('应处理纯数字字符串', () => {
      const result = extractMedicineName('123456789');
      expect(result).toBe('123456789');
    });

    test('应处理特殊字符', () => {
      const text = '@#$%^&*()布洛芬胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应处理Unicode字符', () => {
      const text = '维生素💊胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('关键词在文本开头时应正确提取', () => {
      const text = '布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('关键词在文本末尾时应正确提取', () => {
      const text = '主要成分是对乙酰氨基酚的感冒药胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });
});
