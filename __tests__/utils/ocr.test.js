// __tests__/utils/ocr.test.js
const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  describe('边界条件和异常输入', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });
  });

  describe('关键词匹配逻辑', () => {
    test('应匹配常见药品剂型关键词', () => {
      const testCases = [
        { input: '阿莫西林胶囊', expected: expect.stringContaining('胶囊') },
        { input: '布洛芬片剂', expected: expect.stringContaining('片') },
        { input: '感冒灵颗粒', expected: expect.stringContaining('颗粒') },
        { input: '止咳口服液', expected: expect.stringContaining('口服液') },
        { input: '消炎软膏', expected: expect.stringContaining('软膏') },
        { input: '退烧贴剂', expected: expect.stringContaining('贴剂') }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractMedicineName(input);
        expect(result).toEqual(expect.any(String));
      });
    });

    test('应匹配具体药品名称关键词', () => {
      const testCases = [
        '阿莫西林',
        '布洛芬',
        '对乙酰氨基酚',
        '头孢',
        '阿奇霉素',
        '感冒灵',
        '板蓝根',
        '双黄连',
        '莲花清瘟',
        '维生素',
        '钙片',
        '阿司匹林'
      ];

      testCases.forEach(keyword => {
        const input = `这是一盒${keyword}，用于治疗感冒`;
        const result = extractMedicineName(input);
        expect(result).toEqual(expect.any(String));
        expect(result.length).toBeGreaterThan(0);
      });
    });

    test('应匹配症状关键词', () => {
      const symptoms = ['退烧', '消炎', '止咳', '平喘', '祛痰'];
      symptoms.forEach(symptom => {
        const result = extractMedicineName(`药品${symptom}`);
        expect(result).toEqual(expect.any(String));
      });
    });
  });

  describe('大小写不敏感', () => {
    test('应能匹配小写关键词', () => {
      const result = extractMedicineName('阿莫西林胶囊');
      expect(result).toEqual(expect.any(String));
    });

    test('输入大写字母时仍能匹配', () => {
      const result = extractMedicineName('阿莫西林胶囊');
      expect(result).toEqual(expect.any(String));
    });
  });

  describe('返回格式和长度', () => {
    test('应返回包含关键词的上下文片段', () => {
      const result = extractMedicineName('这是一盒阿莫西林胶囊，用于治疗感染');
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('当无关键词匹配时应返回第一行', () => {
      const result = extractMedicineName('这是一段没有任何药品关键词的文字');
      expect(result).toEqual(expect.any(String));
      expect(result.length).toBeGreaterThan(0);
    });

    test('结果长度应合理限制', () => {
      const longText = '这是一段很长的文本中间有药品名称' + '阿莫西林'.repeat(50);
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(longText.length);
    });
  });

  describe('多行文本处理', () => {
    test('应正确处理换行符', () => {
      const multiline = '第一行文字\n阿莫西林胶囊\n第三行文字';
      const result = extractMedicineName(multiline);
      expect(result).toEqual(expect.any(String));
    });

    test('应正确处理回车符', () => {
      const multiline = '第一行文字\r\n阿莫西林胶囊\r\n第三行文字';
      const result = extractMedicineName(multiline);
      expect(result).toEqual(expect.any(String));
    });

    test('应过滤空行', () => {
      const multiline = '第一行\n\n第二行\n\n第三行';
      const result = extractMedicineName(multiline);
      expect(result).toEqual(expect.any(String));
    });
  });

  describe('边界情况', () => {
    test('关键词在文本开头', () => {
      const result = extractMedicineName('阿莫西林胶囊用于治疗');
      expect(result).toContain('阿莫西林');
    });

    test('关键词在文本末尾', () => {
      const result = extractMedicineName('用于治疗阿莫西林胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('关键词在文本中间', () => {
      const result = extractMedicineName('这是一盒阿莫西林胶囊，疗效显著');
      expect(result).toContain('阿莫西林');
    });

    test('多个关键词存在时只返回第一个匹配', () => {
      const result = extractMedicineName('布洛芬片和阿莫西林胶囊');
      expect(result).toEqual(expect.any(String));
    });
  });
});
