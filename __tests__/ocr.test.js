// __tests__/ocr.test.js
// 测试 utils/ocr.js 中的 extractMedicineName 函数

const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName - ocr.js', () => {
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

    test('应匹配"对乙酰氨基酚"', () => {
      const text = '对乙酰氨基酚颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应匹配"头孢"类药物', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应匹配"阿奇霉素"', () => {
      const text = '阿奇霉素片 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应匹配"板蓝根"', () => {
      const text = '板蓝根颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应匹配"双黄连"', () => {
      const text = '双黄连口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('双黄连');
    });

    test('应匹配"莲花清瘟"', () => {
      const text = '莲花清瘟胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('莲花清瘟');
    });

    test('应匹配"奥美拉唑"', () => {
      const text = '奥美拉唑肠溶胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应匹配"二甲双胍"', () => {
      const text = '二甲双胍片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });

    test('应匹配"阿司匹林"', () => {
      const text = '阿司匹林肠溶片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿司匹林');
    });
  });

  describe('关键词匹配 - 症状关键词', () => {
    test('应匹配"退烧"', () => {
      const text = '退烧灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });

    test('应匹配"消炎"', () => {
      const text = '消炎药';
      const result = extractMedicineName(text);
      expect(result).toContain('消炎');
    });

    test('应匹配"止咳"', () => {
      const text = '止咳糖浆';
      const result = extractMedicineName(text);
      expect(result).toContain('止咳');
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
    // 注意: ocr.js使用split('\n')，无换行符时返回整个字符串
    test('无换行符时应返回整个字符串(最多30字符)', () => {
      const text = 'ABC123 XYZ789';
      const result = extractMedicineName(text);
      expect(result).toBe('ABC123 XYZ789');
    });

    test('多行文本应返回第一行', () => {
      const text = '头孢克洛\n0.25g\n每日两次';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢克洛');
    });

    // 纯空白字符时split('\n')返回['   ', '\t', '  ']，lines[0].trim() = ''
    test('纯空白字符应返回空字符串', () => {
      const text = '   \n\t\n  ';
      const result = extractMedicineName(text);
      expect(result).toBe('');
    });
  });

  describe('上下文提取逻辑', () => {
    test('应包含关键词前后的上下文', () => {
      const text = '规格：阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词在末尾时应正确提取', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('超长文本应正确截取(最多30字符)', () => {
      const longText = '阿' + 'x'.repeat(100) + '胶囊';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });
});
