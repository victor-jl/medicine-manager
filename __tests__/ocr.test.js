const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName (ocr.js)', () => {
  describe('边界情况', () => {
    test('空字符串返回空', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null 或 undefined 返回空', () => {
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('纯空白返回空', () => {
      expect(extractMedicineName('   ')).toBe('');
    });
  });

  describe('关键词匹配 - 剂型', () => {
    test('匹配胶囊', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.5g*24粒');
      expect(result).toContain('阿莫西林胶囊');
    });

    test('匹配片', () => {
      const result = extractMedicineName('布洛芬缓释片 0.3g*20片');
      expect(result).toContain('布洛芬缓释片');
    });

    test('匹配颗粒', () => {
      const result = extractMedicineName('感冒灵颗粒 10g*9袋');
      expect(result).toContain('感冒灵颗粒');
    });

    test('匹配口服液', () => {
      const result = extractMedicineName('双黄连口服液 10ml*10支');
      expect(result).toContain('双黄连口服液');
    });

    test('匹配注射液', () => {
      const result = extractMedicineName('头孢曲松钠注射液 1g');
      expect(result).toContain('头孢曲松钠注射液');
    });
  });

  describe('关键词匹配 - 药品通用名', () => {
    test('匹配阿莫西林', () => {
      const result = extractMedicineName('阿莫西林 0.25g*24粒');
      expect(result).toContain('阿莫西林');
    });

    test('匹配布洛芬', () => {
      const result = extractMedicineName('布洛芬 退烧止痛 0.3g');
      expect(result).toContain('布洛芬');
    });

    test('匹配维生素', () => {
      const result = extractMedicineName('维生素C片 100mg*100片');
      expect(result).toContain('维生素');
    });

    test('匹配奥美拉唑', () => {
      const result = extractMedicineName('奥美拉唑肠溶胶囊 20mg*14粒');
      expect(result).toContain('奥美拉唑');
    });

    test('匹配二甲双胍', () => {
      const result = extractMedicineName('盐酸二甲双胍片 0.5g*60片');
      expect(result).toContain('二甲双胍');
    });

    test('匹配阿司匹林', () => {
      const result = extractMedicineName('阿司匹林肠溶片 100mg*30片');
      expect(result).toContain('阿司匹林');
    });
  });

  describe('关键词匹配 - 症状/功效词', () => {
    test('匹配止咳', () => {
      const result = extractMedicineName('止咳糖浆 100ml');
      expect(result).toContain('止咳');
    });

    test('匹配退烧', () => {
      const result = extractMedicineName('退烧止痛片 20片');
      expect(result).toContain('退烧');
    });

    test('匹配消炎', () => {
      const result = extractMedicineName('消炎眼药水 8ml');
      expect(result).toContain('消炎');
    });
  });

  describe('无关键词时的默认行为', () => {
    test('无匹配关键词时返回第一行前30字符', () => {
      const text = '某种不知名的药品\n用于治疗某些疾病\n每日三次';
      const result = extractMedicineName(text);
      expect(result).toBe('某种不知名的药品');
    });

    test('单行文本时提取前30字符', () => {
      const text = '这是一个非常长的药品名称用来测试默认的截断行为是否正确工作';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('大小写不敏感', () => {
    test('大写英文中的剂型关键词能被匹配', () => {
      const result = extractMedicineName('AMOXICILLIN胶囊 0.5g');
      expect(result).toContain('胶囊');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('提取范围控制', () => {
    test('关键词在文本开头时正确截取', () => {
      const result = extractMedicineName('阿莫西林胶囊 规格0.5g*24粒 生产厂家某某制药');
      expect(result).toContain('阿莫西林胶囊');
    });

    test('关键词在文本中间时正确截取前后文', () => {
      const result = extractMedicineName('本品主要成分为 布洛芬缓释片 用于止痛退烧');
      expect(result).toContain('布洛芬缓释片');
    });
  });
});
