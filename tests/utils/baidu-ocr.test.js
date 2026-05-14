const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
  describe('关键词匹配', () => {
    test('应匹配药品剂型关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toBe('阿莫西林胶囊');
      expect(extractMedicineName('布洛芬片')).toBe('布洛芬片');
      expect(extractMedicineName('感冒灵颗粒')).toBe('感冒灵颗粒');
      expect(extractMedicineName('止咳口服液')).toBe('止咳口服液');
    });

    test('应匹配常见药品名称', () => {
      expect(extractMedicineName('头孢克肟胶囊')).toContain('头孢');
      expect(extractMedicineName('阿奇霉素片')).toContain('阿奇霉素');
      expect(extractMedicineName('维生素钙片')).toContain('维生素');
    });

    test('应匹配症状关键词', () => {
      expect(extractMedicineName('退烧药')).toContain('退烧');
      expect(extractMedicineName('消炎药')).toContain('消炎');
      expect(extractMedicineName('胃药')).toBe('胃药');
    });
  });

  describe('边界条件处理', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('无匹配时返回第一行', () => {
      const text = '没有任何关键词的普通文本';
      const result = extractMedicineName(text);
      expect(result).toBe('没有任何关键词的普通文本');
    });

    test('应限制返回长度', () => {
      const text = '前缀阿莫西林胶囊后缀内容很多很多';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('上下文提取逻辑', () => {
    test('应包含关键词前5个字符', () => {
      const text = '药品名称布洛芬胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应包含关键词后10个字符', () => {
      const text = '布洛芬胶囊规格0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('规格');
    });
  });

  describe('多行文本处理', () => {
    test('应正确处理换行符', () => {
      const text = '第一行\n布洛芬片\n第三行';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应正确处理回车符', () => {
      const text = '第一行\r\n阿莫西林胶囊\r\n第三行';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });
});
