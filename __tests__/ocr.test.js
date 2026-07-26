// __tests__/ocr.test.js
// 测试 utils/ocr.js 中的药品名称提取逻辑

const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName', () => {
  describe('边界情况', () => {
    it('空字符串应返回空', () => {
      expect(extractMedicineName('')).toBe('');
    });

    it('null 应返回空', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    it('undefined 应返回空', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    it('纯空白字符应返回空', () => {
      expect(extractMedicineName('   \n  \t  ')).toBe('');
    });
  });

  describe('关键词匹配 - 剂型关键词', () => {
    it('应提取包含"胶囊"的药品名', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.25g*24粒');
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    it('应提取包含"片"的药品名', () => {
      const result = extractMedicineName('布洛芬缓释片 0.3g');
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    it('应提取包含"颗粒"的药品名', () => {
      const result = extractMedicineName('感冒灵颗粒 10g*9袋');
      expect(result).toContain('感冒灵');
      expect(result).toContain('颗粒');
    });

    it('应提取包含"口服液"的药品名', () => {
      const result = extractMedicineName('双黄连口服液 10ml');
      expect(result).toContain('双黄连');
      expect(result).toContain('口服液');
    });
  });

  describe('关键词匹配 - 药品名称关键词', () => {
    it('应提取包含"阿莫西林"的药品名', () => {
      const result = extractMedicineName('处方药 阿莫西林 抗生素类');
      expect(result).toContain('阿莫西林');
    });

    it('应提取包含"布洛芬"的药品名', () => {
      const result = extractMedicineName('解热镇痛 布洛芬 0.3g');
      expect(result).toContain('布洛芬');
    });

    it('应提取包含"维生素"的药品名', () => {
      const result = extractMedicineName('营养补充 维生素C片 100mg');
      expect(result).toContain('维生素');
    });

    it('应提取包含"奥美拉唑"的药品名', () => {
      const result = extractMedicineName('消化系统用药 奥美拉唑肠溶胶囊');
      expect(result).toContain('奥美拉唑');
    });
  });

  describe('大小写不敏感匹配', () => {
    it('应匹配英文大小写混合的关键词', () => {
      const result = extractMedicineName('AMOXICILLIN胶囊');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('无关键词时的默认行为', () => {
    it('无匹配关键词时应返回第一行的前30字符', () => {
      const text = '这是第一行药品信息\n第二行详细说明\n第三行其他内容';
      const result = extractMedicineName(text);
      expect(result).toBe('这是第一行药品信息');
      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('单行文本应返回前30字符', () => {
      const longText = 'a'.repeat(50);
      const result = extractMedicineName(longText);
      expect(result.length).toBe(30);
    });
  });

  describe('上下文提取范围', () => {
    it('应提取关键词前后的上下文', () => {
      const result = extractMedicineName('某某制药厂生产的阿莫西林胶囊规格0.25g');
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    it('关键词在文本开头时应正确处理起始位置', () => {
      const result = extractMedicineName('阿莫西林胶囊 规格说明');
      expect(result).toContain('阿莫西林');
    });

    it('关键词在文本末尾时应正确处理结束位置', () => {
      const result = extractMedicineName('药品名称是 阿莫西林');
      expect(result).toContain('阿莫西林');
    });
  });
});
