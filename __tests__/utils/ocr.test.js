/**
 * utils/ocr.js 测试
 * 重点测试：
 * - 药品名称提取逻辑（更全面的关键词列表）
 * - 边界条件处理
 * - 多种药品剂型识别
 */

const { wx, mockStorage } = require('../setup');
const ocr = require('../../utils/ocr');

describe('ocr.js', () => {
  describe('extractMedicineName', () => {
    test('应该提取胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.5g×12粒';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应该提取片剂类药品', () => {
      const text = '布洛芬片 200mg×20片';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('布洛芬片');
    });

    test('应该提取颗粒类药品', () => {
      const text = '感冒灵颗粒 10g×9袋';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('感冒灵颗粒');
    });

    test('应该提取口服液类药品', () => {
      const text = '对乙酰氨基酚口服液 10ml×10支';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚口服液');
    });

    test('应该提取注射液类药品', () => {
      const text = '头孢曲松注射液 1g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应该提取软膏类药品', () => {
      const text = '红霉素软膏 10g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('红霉素软膏');
    });

    test('应该提取贴剂类药品', () => {
      const text = '麝香壮骨贴剂 5贴';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('贴剂');
    });

    test('应该提取滴眼液类药品', () => {
      const text = '氯霉素滴眼液 8ml';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应该提取糖浆类药品', () => {
      const text = '小儿止咳糖浆 100ml';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('糖浆');
    });

    test('应该处理空输入', () => {
      expect(ocr.extractMedicineName('')).toBe('');
      expect(ocr.extractMedicineName(null)).toBe('');
      expect(ocr.extractMedicineName(undefined)).toBe('');
    });

    test('应该处理无关键词的文本', () => {
      const text = '未知产品说明书';
      const result = ocr.extractMedicineName(text);
      expect(result).toBe('未知产品说明书');
    });

    test('应该处理多行文本', () => {
      const text = '生产日期: 2024-01-01\n阿奇霉素片\n批号: 12345';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿奇霉素片');
    });

    test('应该提取常见药品 - 阿莫西林', () => {
      const text = '阿莫西林胶囊 抗生素';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应该提取常见药品 - 布洛芬', () => {
      const text = '布洛芬缓释胶囊 退烧止痛';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应该提取常见药品 - 维生素类', () => {
      const text = '维生素C片 补充营养';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应该提取常见药品 - 钙片', () => {
      const text = '碳酸钙片 补钙';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('钙片');
    });

    test('应该提取常见药品 - 胃药', () => {
      const text = '奥美拉唑肠溶胶囊 胃药';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应该提取常见药品 - 降压药', () => {
      const text = '硝苯地平缓释片 降压药';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('硝苯地平');
    });

    test('应该提取常见药品 - 降糖药', () => {
      const text = '二甲双胍片 降血糖';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });

    test('应该提取常见药品 - 抗过敏药', () => {
      const text = '氯雷他定片 抗过敏';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('氯雷他定');
    });

    test('应该处理文本前后有额外字符的情况', () => {
      const text = '【药品名称】阿莫西林胶囊【规格】0.5g';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应该处理超长文本', () => {
      const text = '这是一段很长的说明书文本，包含很多信息，最后才提到阿莫西林胶囊这个药品名称';
      const result = ocr.extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('应该处理大小写混合', () => {
      const text = '阿莫西林 CAPSULE';
      const result = ocr.extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('recognizeWithWechat', () => {
    test('应该是一个函数', () => {
      expect(typeof ocr.recognizeWithWechat).toBe('function');
    });
  });

  describe('recognizeWithBaidu', () => {
    test('应该是一个函数', () => {
      expect(typeof ocr.recognizeWithBaidu).toBe('function');
    });
  });
});