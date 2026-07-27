const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName - 药品名称提取', () => {
  describe('边界条件 - 空值处理', () => {
    it('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    it('null 应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    it('undefined 应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    it('仅空白字符应返回空字符串', () => {
      expect(extractMedicineName('   \n  \t  ')).toBe('');
    });
  });

  describe('剂型关键词匹配', () => {
    it('应从包含"胶囊"的文本中提取药品名', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.25g*24粒');
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    it('应从包含"片"的文本中提取药品名', () => {
      const result = extractMedicineName('布洛芬缓释片 0.3g*20片');
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    it('应从包含"颗粒"的文本中提取药品名', () => {
      const result = extractMedicineName('感冒清热颗粒 12g*10袋');
      expect(result).toContain('感冒清热');
      expect(result).toContain('颗粒');
    });

    it('应从包含"口服液"的文本中提取药品名', () => {
      const result = extractMedicineName('双黄连口服液 10ml*10支');
      expect(result).toContain('双黄连');
      expect(result).toContain('口服液');
    });
  });

  describe('药品名称关键词匹配', () => {
    it('应识别"阿莫西林"关键词', () => {
      const result = extractMedicineName('本品为阿莫西林 广谱抗生素');
      expect(result).toContain('阿莫西林');
    });

    it('应识别"对乙酰氨基酚"关键词', () => {
      const result = extractMedicineName('主要成分对乙酰氨基酚 解热镇痛');
      expect(result).toContain('对乙酰氨基酚');
    });

    it('应识别"维生素"关键词', () => {
      const result = extractMedicineName('补充维生素C 增强免疫力');
      expect(result).toContain('维生素');
    });

    it('应识别"奥美拉唑"关键词', () => {
      const result = extractMedicineName('奥美拉唑肠溶胶囊 治胃酸');
      expect(result).toContain('奥美拉唑');
    });
  });

  describe('多行文本处理', () => {
    it('应从多行文本中提取含关键词的行', () => {
      const text = '产品说明书\n\n布洛芬缓释胶囊\n0.3g*20粒\n口服一次1粒';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });

    it('无关键词时应返回第一行', () => {
      const text = '神秘药品\n成分未知\n用法用量请遵医嘱';
      const result = extractMedicineName(text);
      expect(result).toBe('神秘药品');
    });
  });

  describe('大小写不敏感匹配', () => {
    it('应忽略大小写匹配关键词', () => {
      const result = extractMedicineName('VITAMIN C 维生素片 100片');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('提取范围限制', () => {
    it('提取结果应控制在合理长度内', () => {
      const result = extractMedicineName('第一行文本作为默认药品名称这里有很多很多很多很多很多很多很多很多字');
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });
});
