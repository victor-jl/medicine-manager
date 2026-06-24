/**
 * 测试 utils/ocr.js 中的 extractMedicineName 函数
 *
 * 测试覆盖：
 * - 关键词匹配：胶囊、片、颗粒等药品剂型
 * - 药品名称提取：阿莫西林、布洛芬等常见药品
 * - 边界条件：空字符串、纯数字、无匹配关键词
 * - 返回值格式：确保提取的是完整词组而非截断
 */

// 提取的纯函数逻辑用于测试（避免依赖微信API）
function extractMedicineName(text) {
  if (!text) return '';

  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟',
    '维生素', '钙片', '铁剂', '锌', '叶酸',
    '奥美拉唑', '兰索拉唑', '泮托拉唑',
    '硝苯地平', '氨氯地平', '贝那普利',
    '二甲双胍', '格列本脲', '胰岛素',
    '阿司匹林', '氯吡格雷', '他汀',
    '氯雷他定', '西替利嗪', '蒙脱石',
    '止咳', '祛痰', '平喘', '消炎', '退烧', '止痛'
  ];

  const lowerText = text.toLowerCase();

  for (const kw of keywords) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const start = Math.max(0, idx - 8);
      const end = Math.min(text.length, idx + kw.length + 10);
      return text.substring(start, end).trim();
    }
  }

  // 返回第一行作为默认
  return text.split('\n')[0].trim().substring(0, 30);
}

describe('extractMedicineName (utils/ocr.js)', () => {
  describe('药品剂型关键词匹配', () => {
    test('应识别胶囊剂型', () => {
      const result = extractMedicineName('阿莫西林胶囊 0.25g');
      expect(result).toBe('阿莫西林胶囊 0.25g');
    });

    test('应识别片剂', () => {
      const result = extractMedicineName('布洛芬片 200mg');
      expect(result).toBe('布洛芬片 200mg');
    });

    test('应识别颗粒剂型', () => {
      const result = extractMedicineName('感冒灵颗粒 10袋/盒');
      expect(result).toBe('感冒灵颗粒 10袋/盒');
    });

    test('应识别口服液', () => {
      const result = extractMedicineName('双黄连口服液 10ml*10支');
      expect(result).toBe('双黄连口服液 10ml*10支');
    });
  });

  describe('常见药品名称匹配', () => {
    test('应识别抗生素类', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(extractMedicineName('头孢克洛分散片')).toContain('头孢');
    });

    test('应识别解热镇痛类', () => {
      expect(extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
      expect(extractMedicineName('对乙酰氨基酚片')).toContain('对乙酰氨基酚');
    });

    test('应识别感冒药类', () => {
      expect(extractMedicineName('感冒灵颗粒')).toContain('感冒灵');
      expect(extractMedicineName('莲花清瘟胶囊')).toContain('莲花清瘟');
    });

    test('应识别维生素类', () => {
      expect(extractMedicineName('维生素C片')).toContain('维生素');
      expect(extractMedicineName('钙片')).toContain('钙片');
    });
  });

  describe('边界条件处理', () => {
    test('空字符串应返回空', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null应返回空', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined应返回空', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('无关键词时应返回第一行', () => {
      const result = extractMedicineName('这是一个没有药品信息的普通文本');
      expect(result).toBe('这是一个没有药品信息的普通文本');
    });

    test('纯数字应返回空或默认值', () => {
      const result = extractMedicineName('12345');
      expect(result).toBe('12345');
    });
  });

  describe('上下文提取逻辑', () => {
    test('应包含关键词前后的上下文', () => {
      const result = extractMedicineName('药品名称：阿莫西林胶囊，规格：0.25g');
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词在末尾时应正常提取', () => {
      const result = extractMedicineName('阿莫西林');
      expect(result).toBe('阿莫西林');
    });

    test('关键词在开头时应正常提取', () => {
      const result = extractMedicineName('胶囊');
      expect(result).toBe('胶囊');
    });
  });

  describe('返回值格式验证', () => {
    test('返回字符串类型', () => {
      const result = extractMedicineName('测试药品');
      expect(typeof result).toBe('string');
    });

    test('不应包含首尾空格', () => {
      const result = extractMedicineName('  阿莫西林胶囊  ');
      expect(result).toBe('阿莫西林胶囊');
    });

    test('长文本应被合理截断', () => {
      const longText = '这是一个非常长的药品描述，包含阿莫西林胶囊0.25g和很多其他信息' +
                       '这是一个非常长的药品描述，包含阿莫西林胶囊0.25g和很多其他信息';
      const result = extractMedicineName(longText);
      // 第一行就匹配到关键词，不应该被截断到30字符
      expect(result).toContain('阿莫西林');
    });
  });
});
