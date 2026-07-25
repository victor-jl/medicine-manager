const { extractMedicineName } = require('../utils/baidu-ocr');

describe('extractMedicineName (baidu-ocr.js)', () => {
  describe('边界情况', () => {
    test('空字符串返回空', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null 返回空', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined 返回空', () => {
      expect(extractMedicineName(undefined)).toBe('');
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

    test('匹配软膏', () => {
      const result = extractMedicineName('红霉素软膏 10g');
      expect(result).toContain('红霉素软膏');
    });

    test('匹配贴剂', () => {
      const result = extractMedicineName('止痛贴剂 5贴装');
      expect(result).toContain('止痛贴剂');
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

    test('匹配对乙酰氨基酚', () => {
      const result = extractMedicineName('对乙酰氨基酚 500mg 退烧');
      expect(result).toContain('对乙酰氨基酚');
    });

    test('匹配头孢', () => {
      const result = extractMedicineName('头孢类抗生素 消炎药');
      expect(result).toContain('头孢');
    });

    test('匹配阿奇霉素', () => {
      const result = extractMedicineName('阿奇霉素 0.25g*6袋');
      expect(result).toContain('阿奇霉素');
    });
  });

  describe('关键词匹配 - 症状/类别词', () => {
    test('匹配感冒灵', () => {
      const result = extractMedicineName('999感冒灵 治疗感冒');
      expect(result).toContain('感冒灵');
    });

    test('匹配维生素', () => {
      const result = extractMedicineName('复合维生素 每日一次');
      expect(result).toContain('维生素');
    });

    test('匹配钙片', () => {
      const result = extractMedicineName('中老年钙片 补钙');
      expect(result).toContain('钙片');
    });

    test('匹配胃药', () => {
      const result = extractMedicineName('胃药 治疗胃酸过多');
      expect(result).toContain('胃药');
    });

    test('匹配血压', () => {
      const result = extractMedicineName('降血压药 高血压');
      expect(result).toContain('血压');
    });

    test('匹配血糖', () => {
      const result = extractMedicineName('降血糖 糖尿病用药');
      expect(result).toContain('血糖');
    });

    test('匹配咳嗽', () => {
      const result = extractMedicineName('咳嗽药水 止咳化痰');
      expect(result).toContain('咳嗽');
    });

    test('匹配腹泻', () => {
      const result = extractMedicineName('止泻药 治疗腹泻');
      expect(result).toContain('腹泻');
    });
  });

  describe('无关键词时的默认行为', () => {
    test('无匹配关键词时返回第一行非空行', () => {
      const text = '某种不知名的药品\n用于治疗某些疾病\n每日三次';
      const result = extractMedicineName(text);
      expect(result).toBe('某种不知名的药品');
    });

    test('跳过空行返回第一个有内容的行', () => {
      const text = '\n\n第一行有效内容\n其他行';
      const result = extractMedicineName(text);
      expect(result).toBe('第一行有效内容');
    });

    test('单行无换行时返回原文本截断', () => {
      const text = '这是一个非常长的药品名称用来测试默认的截断行为';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    test('全是空行时返回空', () => {
      const result = extractMedicineName('\n\n\n');
      expect(result).toBe('');
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

    test('关键词在文本中间时正确截取前后5字符', () => {
      const result = extractMedicineName('本品主要成分为布洛芬缓释片用于止痛退烧');
      expect(result).toContain('布洛芬缓释片');
    });
  });
});
