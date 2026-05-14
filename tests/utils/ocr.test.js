const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  describe('关键词匹配', () => {
    test('应匹配药品剂型关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toBe('阿莫西林胶囊');
      expect(extractMedicineName('布洛芬片剂')).toBe('布洛芬片剂');
      expect(extractMedicineName('感冒灵颗粒')).toBe('感冒灵颗粒');
      expect(extractMedicineName('止咳糖浆')).toBe('止咳糖浆');
    });

    test('应匹配药品名称关键词', () => {
      expect(extractMedicineName('头孢克肟分散片')).toBe('头孢克肟分散片');
      expect(extractMedicineName('对乙酰氨基酚口服液')).toBe('对乙酰氨基酚口服液');
      expect(extractMedicineName('阿奇霉素干混悬剂')).toBe('阿奇霉素干混悬剂');
    });

    test('应匹配医疗相关关键词', () => {
      expect(extractMedicineName('血压计')).toContain('血压');
      expect(extractMedicineName('血糖试纸')).toContain('血糖');
      expect(extractMedicineName('维生素C')).toBe('维生素C');
    });
  });

  describe('边界条件处理', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('无匹配时返回第一行前30字符', () => {
      const text = '这是一段没有任何药品关键词的普通文本描述';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result.startsWith('这是一段没有任何药品关键词的普通')).toBe(true);
    });
  });

  describe('大小写不敏感匹配', () => {
    test('应忽略大小写进行匹配', () => {
      expect(extractMedicineName('维生素C片')).toBe('维生素C片');
      expect(extractMedicineName('VITAMINC')).toBe('VITAMINC');
    });
  });

  describe('上下文提取', () => {
    test('应返回关键词周围的上下文', () => {
      const text = '药品名称：布洛芬缓释胶囊，规格：0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });
  });

  describe('多行文本处理', () => {
    test('应正确处理多行文本', () => {
      const text = '第一行内容\n第二行：阿莫西林胶囊\n第三行说明';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应过滤空行', () => {
      const text = '\n\n布洛芬片\n\n';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });
  });
});
