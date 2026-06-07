/**
 * utils/ocr.js 单元测试
 * 测试 extractMedicineName 函数的各种场景
 */

const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  describe('关键词匹配', () => {
    test('匹配胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('匹配片剂类药品', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('匹配颗粒类药品', () => {
      const text = '感冒灵颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('匹配口服液类药品', () => {
      const text = '双黄连口服液 10ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('匹配中药名称', () => {
      const text = '板蓝根 10袋装';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('匹配西药名称', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });
  });

  describe('边界条件和极端情况', () => {
    test('空字符串返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null输入返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined输入返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('无匹配关键词时返回第一行前30字符', () => {
      const text = '这是一段没有任何药品关键词的文字描述';
      const result = extractMedicineName(text);
      expect(result).toContain('这是一段没有任何药品关键词');
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('关键词在文本开头', () => {
      const text = '胶囊 某制药公司出品';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('大小写不敏感', () => {
    test('英文关键词大小写不敏感', () => {
      const text = 'VITAMIN C 片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });
  });

  describe('上下文提取', () => {
    test('返回包含关键词及其前后上下文', () => {
      const text = '生产企业: XXX制药 阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林胶囊');
    });

    test('关键词靠近文本开头时正确提取', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('关键词靠近文本末尾时正确截取', () => {
      const text = '阿莫西林';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('多行文本处理', () => {
    test('处理多行文本时包含关键词', () => {
      const text = '阿莫西林胶囊\n0.25g\n某制药';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('过滤空白行时仍包含关键词', () => {
      const text = '阿莫西林胶囊\n\n\n0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });
});
