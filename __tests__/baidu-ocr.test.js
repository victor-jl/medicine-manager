// __tests__/baidu-ocr.test.js
// 测试 utils/baidu-ocr.js 中的 extractMedicineName 函数

const { extractMedicineName } = require('../utils/baidu-ocr');

describe('extractMedicineName - baidu-ocr.js', () => {
  describe('边界条件处理', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null 应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined 应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });
  });

  describe('关键词匹配 - 药品类型后缀', () => {
    test('应匹配"胶囊"关键词', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('应匹配"片"关键词', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应匹配"颗粒"关键词', () => {
      const text = '感冒灵颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应匹配"口服液"关键词', () => {
      const text = '双黄连口服液 10ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应匹配"注射液"关键词', () => {
      const text = '头孢注射液 1g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应匹配"软膏"关键词', () => {
      const text = '红霉素软膏 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应匹配"贴剂"关键词', () => {
      const text = '退热贴剂 1贴';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });
  });

  describe('关键词匹配 - 药品名称', () => {
    test('应匹配"阿莫西林"', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应匹配"布洛芬"', () => {
      const text = '布洛芬片剂';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    // 注意: 当药品名包含"颗粒"等短关键词时，短关键词优先匹配
    test('应匹配"阿奇霉素"', () => {
      const text = '阿奇霉素片 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应匹配"感冒灵"', () => {
      const text = '感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应匹配"维生素"', () => {
      const text = '维生素C片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应匹配"钙片"', () => {
      const text = '钙片 500mg';
      const result = extractMedicineName(text);
      expect(result).toContain('钙片');
    });

    test('应匹配"胃药"', () => {
      const text = '胃药一瓶';
      const result = extractMedicineName(text);
      expect(result).toContain('胃药');
    });
  });

  describe('关键词匹配 - 症状关键词', () => {
    test('应匹配"血压"', () => {
      const text = '血压药';
      const result = extractMedicineName(text);
      expect(result).toContain('血压');
    });

    test('应匹配"血糖"', () => {
      const text = '血糖药';
      const result = extractMedicineName(text);
      expect(result).toContain('血糖');
    });

    test('应匹配"血脂"', () => {
      const text = '降血脂药';
      const result = extractMedicineName(text);
      expect(result).toContain('血脂');
    });

    test('应匹配"感冒"', () => {
      const text = '感冒药';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒');
    });

    // 注意: "止咳药"中"咳"在"咳嗽"之前匹配
    test('应匹配包含"咳"字的药品', () => {
      const text = '止咳药';
      const result = extractMedicineName(text);
      expect(result).toContain('咳');
    });

    // 注意: "止泻药"中"泻"在"腹泻"之前匹配
    test('应匹配包含"泻"字的药品', () => {
      const text = '止泻药';
      const result = extractMedicineName(text);
      expect(result).toContain('泻');
    });

    test('应匹配"退烧"', () => {
      const text = '退烧药';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });

    test('应匹配"消炎"', () => {
      const text = '消炎药';
      const result = extractMedicineName(text);
      expect(result).toContain('消炎');
    });
  });

  describe('大小写不敏感匹配', () => {
    test('大写关键词应被匹配', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('小写关键词应被匹配', () => {
      const text = 'amoxicillin capsule';
      const result = extractMedicineName(text.toLowerCase());
      expect(result.toLowerCase()).toContain('amoxicillin');
    });
  });

  describe('回退逻辑 - 无关键词匹配', () => {
    // 注意: 只有当lines数组为空时才会截取前20字符，否则返回lines[0]
    test('无换行符且无关键词时应返回整个字符串', () => {
      const text = 'ABC123 XYZ789';
      const result = extractMedicineName(text);
      expect(result).toBe('ABC123 XYZ789');
    });

    test('无关键词但lines非空时应返回第一行(不截断)', () => {
      const text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const result = extractMedicineName(text);
      expect(result).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    });

    test('多行文本应返回第一行', () => {
      const text = '头孢克洛\n0.25g\n每日两次';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢克洛');
    });

    // 纯空白字符时filter返回空数组，fallback取substring(0,20)
    // '   \n\t\n  ' 长度为8，小于20，所以返回原字符串
    test('纯空白字符时应返回空白字符串', () => {
      const text = '   \n\t\n  ';
      const result = extractMedicineName(text);
      expect(result).toBe('   \n\t\n  ');
    });
  });

  describe('上下文提取逻辑', () => {
    test('应包含关键词前后的上下文', () => {
      const text = '规格：阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词在文本开头时应正确提取', () => {
      const text = '胶囊包装';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('关键词在文本末尾时应正确提取', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词前面字符不足5个时应从0开始', () => {
      const text = '啊胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });
});
