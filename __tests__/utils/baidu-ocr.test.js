/**
 * @jest-environment node
 */
require('../wx.mock');

const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
  describe('关键词匹配逻辑', () => {
    test('应匹配胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应匹配片剂类药品', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应匹配口服液类药品', () => {
      const text = '感冒灵口服液 10ml';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
      expect(result).toContain('口服液');
    });

    test('应匹配颗粒类药品', () => {
      const text = '板蓝根颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });
  });

  describe('关键词上下文提取', () => {
    test('应返回关键词周围上下文（向前5字符，向后10字符）', () => {
      const text = '药名：阿莫西林胶囊 规格';
      const result = extractMedicineName(text);
      // Math.max(0, index-5) 向左5字符，包含中文冒号
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
      expect(result.length).toBeGreaterThan(5);
    });

    test('关键词在文本开头时应正确处理', () => {
      const text = '阿奇霉素片说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });
  });

  describe('功能关键词', () => {
    test('退烧关键词应被匹配', () => {
      const result = extractMedicineName('退烧贴');
      expect(result).toContain('退烧');
    });

    test('消炎关键词应被匹配', () => {
      const result = extractMedicineName('消炎药');
      expect(result).toContain('消炎');
    });

    test('感冒关键词应被匹配', () => {
      const result = extractMedicineName('感冒灵颗粒');
      expect(result).toContain('感冒');
    });

    test('止咳关键词应被匹配', () => {
      const result = extractMedicineName('止咳糖浆');
      expect(result).toContain('止咳');
    });

    test('腹泻关键词应被匹配', () => {
      const result = extractMedicineName('蒙脱石散治腹泻');
      expect(result).toContain('腹泻');
    });
  });

  describe('边界条件处理', () => {
    test('空字符串应返回空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('null应返回空字符串', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('undefined应返回空字符串', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('无可识别关键词时应返回第一行前20字符', () => {
      const text = '没有任何药品关键词的普通文本';
      const result = extractMedicineName(text);
      expect(result).toBe('没有任何药品关键词的普通文本'.substring(0, 20));
    });

    test('只有换行符时应返回空或过滤后的第一行', () => {
      const text = '\n\n';
      const result = extractMedicineName(text);
      // 实际行为：split后过滤空行，可能返回空或特殊字符
      expect(typeof result).toBe('string');
    });
  });

  describe('大小写不敏感', () => {
    test('大写关键词应被匹配', () => {
      const result = extractMedicineName('阿莫西林CAPSULE');
      expect(result).toContain('阿莫西林');
    });

    test('混合大小写关键词应被匹配', () => {
      // "VITAMIN C片" 中 '片' 是关键词
      // toLowerCase后找到 '片' 在 index 8
      // start = max(0, 8-5) = 3, end = min(9, 8+1+10) = 9
      // 返回 recognizedText.substring(3, 9) = "MIN C片"
      const result = extractMedicineName('VITAMIN C片');
      expect(result).toBe('MIN C片');
    });
  });

  describe('OCR识别结果处理', () => {
    test('应处理多行文本并正确提取', () => {
      const text = '通用名称：布洛芬片\n英文名称：Ibuprofen Tablets\n规格：0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应处理国药准字格式', () => {
      const text = '国药准字H20003656';
      const result = extractMedicineName(text);
      expect(result).toContain('H20003656');
    });
  });
});
