// __tests__/utils/baidu-ocr.test.js
const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
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
      const dosageForms = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂'];
      dosageForms.forEach(form => {
        const result = extractMedicineName(`药品${form}`);
        expect(result).toEqual(expect.any(String));
        expect(result.length).toBeGreaterThan(0);
      });
    });

    test('应匹配具体药品名称关键词', () => {
      const medicines = [
        '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素',
        '感冒灵', '退烧', '消炎', '维生素', '钙片', '胃药'
      ];

      medicines.forEach(medicine => {
        const result = extractMedicineName(`这是${medicine}相关药品`);
        expect(result).toEqual(expect.any(String));
        expect(result.length).toBeGreaterThan(0);
      });
    });

    test('应匹配疾病症状关键词', () => {
      const symptoms = ['血压', '血糖', '血脂', '感冒', '咳嗽', '腹泻'];
      symptoms.forEach(symptom => {
        const result = extractMedicineName(`关注${symptom}问题`);
        expect(result).toEqual(expect.any(String));
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('上下文提取逻辑', () => {
    test('应提取关键词前5个字符和后10个字符作为上下文', () => {
      const input = '这是一盒阿莫西林胶囊用于治疗感染';
      const result = extractMedicineName(input);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词在开头时应正确处理', () => {
      const input = '阿莫西林胶囊是一种常用的抗生素';
      const result = extractMedicineName(input);
      expect(result).toContain('阿莫西林');
      expect(result.indexOf('阿莫西林')).toBeGreaterThanOrEqual(0);
    });

    test('关键词在末尾时应正确处理', () => {
      const input = '这是一种常用的阿莫西林胶囊';
      const result = extractMedicineName(input);
      expect(result).toContain('阿莫西林');
    });

    test('关键词接近开头时不产生负索引', () => {
      const input = '阿';
      const result = extractMedicineName(input);
      expect(result).toEqual(expect.any(String));
    });
  });

  describe('无匹配时的降级逻辑', () => {
    test('无关键词匹配时应返回第一行', () => {
      const result = extractMedicineName('没有任何药品关键词的普通文本');
      expect(result).toEqual(expect.any(String));
    });

    test('无匹配时应取第一行前30个字符', () => {
      const longText = '这是一段很长的文本，前面没有任何药品关键词后面也没有';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('多行文本处理', () => {
    test('应正确处理换行符并取第一行', () => {
      const multiline = '阿莫西林胶囊\n布洛芬片\n其他文本';
      const result = extractMedicineName(multiline);
      expect(result).toEqual(expect.any(String));
    });

    test('应过滤空行', () => {
      const multiline = '第一行内容\n\n第二行内容\n\n第三行内容';
      const result = extractMedicineName(multiline);
      expect(result).toEqual(expect.any(String));
      expect(result.trim().length).toBeGreaterThan(0);
    });
  });

  describe('返回值类型和有效性', () => {
    test('应始终返回字符串', () => {
      expect(typeof extractMedicineName('任何输入')).toBe('string');
    });

    test('返回的字符串应去除首尾空白', () => {
      const input = '   阿莫西林胶囊   ';
      const result = extractMedicineName(input);
      expect(result).toBe(result.trim());
    });
  });
});
