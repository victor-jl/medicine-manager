// __tests__/baidu-ocr.test.js
// 测试 utils/baidu-ocr.js 中的纯函数逻辑

describe('baidu-ocr 纯函数测试', () => {
  describe('extractMedicineName', () => {
    let extractMedicineName;

    beforeAll(() => {
      const mod = require('../utils/baidu-ocr');
      extractMedicineName = mod.extractMedicineName;
    });

    it('空字符串应返回空', () => {
      expect(extractMedicineName('')).toBe('');
    });

    it('null 应返回空', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    it('undefined 应返回空', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    it('应提取包含"胶囊"的药品名', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.25g');
      expect(result).toContain('阿莫西林');
    });

    it('应提取包含"布洛芬"的药品名', () => {
      const result = extractMedicineName('布洛芬缓释片');
      expect(result).toContain('布洛芬');
    });

    it('应提取包含"维生素"的药品名', () => {
      const result = extractMedicineName('维生素C 100mg');
      expect(result).toContain('维生素');
    });

    it('无匹配关键词时返回第一行非空内容', () => {
      const text = '第一行信息\n第二行内容\n第三行说明';
      const result = extractMedicineName(text);
      expect(result).toBe('第一行信息');
    });

    it('无换行无关键词时返回完整文本', () => {
      const text = 'a'.repeat(30);
      const result = extractMedicineName(text);
      expect(result.length).toBe(30);
    });

    it('仅空白行时截取原始文本前20字符', () => {
      const text = '\n\n\n';
      const result = extractMedicineName(text);
      expect(result).toBe(text.substring(0, 20));
    });

    it('应正确处理关键词在文本中间的情况', () => {
      const result = extractMedicineName('本次购买的感冒灵颗粒很有效');
      expect(result).toContain('感冒灵');
    });

    it('应提取关键词前后的上下文', () => {
      const result = extractMedicineName('厂家推荐的头孢克肟片效果不错');
      expect(result).toContain('头孢');
    });
  });
});
