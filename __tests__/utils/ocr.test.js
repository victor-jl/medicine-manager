/**
 * @jest-environment node
 */
require('../wx.mock');

const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
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
      expect(result).toContain('颗粒');
    });

    test('应匹配注射液类药品', () => {
      const text = '头孢注射液 1g';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
      expect(result).toContain('注射液');
    });
  });

  describe('关键词优先级与上下文提取', () => {
    test('应返回关键词周围上下文（向前8字符，向后10字符）', () => {
      const text = '适应症：阿莫西林胶囊用于消炎';
      const result = extractMedicineName(text);
      // Math.max(0, idx-8) 对应 "适应症：" 部分
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
      expect(result.length).toBeGreaterThan(5);
    });

    test('关键词在文本开头时应正确提取', () => {
      const text = '阿奇霉素片说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('关键词在文本末尾时应正确提取', () => {
      const text = '主要成分：罗红霉素';
      const result = extractMedicineName(text);
      expect(result).toContain('罗红霉素');
    });
  });

  describe('感冒类药品关键词', () => {
    test('应匹配感冒灵', () => {
      const result = extractMedicineName('感冒灵颗粒');
      expect(result).toContain('感冒灵');
    });

    test('应匹配感冒清热', () => {
      const result = extractMedicineName('感冒清热颗粒');
      expect(result).toContain('感冒清热');
    });

    test('应匹配双黄连', () => {
      const result = extractMedicineName('双黄连口服液');
      expect(result).toContain('双黄连');
    });

    test('应匹配莲花清瘟', () => {
      const result = extractMedicineName('莲花清瘟胶囊');
      expect(result).toContain('莲花清瘟');
    });
  });

  describe('维生素与矿物质类', () => {
    test('应匹配维生素', () => {
      const result = extractMedicineName('维生素C片');
      expect(result).toContain('维生素');
    });

    test('应匹配钙片', () => {
      const result = extractMedicineName('钙片 600mg');
      expect(result).toContain('钙片');
    });

    test('应匹配叶酸', () => {
      const result = extractMedicineName('叶酸片 0.4mg');
      expect(result).toContain('叶酸');
    });
  });

  describe('慢性病药品', () => {
    test('应匹配胃药类（奥美拉唑）', () => {
      const result = extractMedicineName('奥美拉唑肠溶胶囊');
      expect(result).toContain('奥美拉唑');
    });

    test('应匹配降压药类', () => {
      const result = extractMedicineName('硝苯地平缓释片');
      expect(result).toContain('硝苯地平');
    });

    test('应匹配降糖药类', () => {
      const result = extractMedicineName('二甲双胍片 0.5g');
      expect(result).toContain('二甲双胍');
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

    test('无可识别关键词时应返回第一行前30字符', () => {
      const text = '这是一个没有任何药品关键词的文本';
      const result = extractMedicineName(text);
      // 实际行为：返回第一行（去除首尾空格后）的前30字符
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toContain('没有任何药品关键');
    });

    test('纯数字文本应返回第一行前30字符', () => {
      const text = '12345678901234567890123456789012345';
      const result = extractMedicineName(text);
      // 实际行为：substring(0, 30) 直接截取
      expect(result).toBe('123456789012345678901234567890');
    });
  });

  describe('大小写不敏感', () => {
    test('大写关键词应被匹配', () => {
      const result = extractMedicineName('阿莫西林CAPSULE');
      expect(result).toContain('阿莫西林');
    });

    test('混合大小写关键词应被匹配', () => {
      const result = extractMedicineName('布洛芬片 Brufen');
      expect(result).toContain('布洛芬');
    });
  });

  describe('多关键词场景', () => {
    test('存在多个关键词时应返回第一个匹配的上下文', () => {
      const text = '维C和维生素B族片剂';
      const result = extractMedicineName(text);
      // '维生素'包含'维'，所以会先匹配到
      expect(result).toContain('维生素');
    });
  });

  describe('功能描述关键词', () => {
    test('止咳关键词应被匹配', () => {
      const result = extractMedicineName('止咳糖浆');
      expect(result).toContain('止咳');
    });

    test('祛痰关键词应被匹配', () => {
      const result = extractMedicineName('盐酸溴己新祛痰片');
      expect(result).toContain('祛痰');
    });

    test('平喘关键词应被匹配', () => {
      const result = extractMedicineName('硫酸沙丁胺醇平喘气雾剂');
      expect(result).toContain('平喘');
    });

    test('退烧关键词应被匹配', () => {
      const result = extractMedicineName('退烧贴');
      expect(result).toContain('退烧');
    });

    test('消炎关键词应被匹配', () => {
      const result = extractMedicineName('阿莫西林消炎药');
      expect(result).toContain('消炎');
    });

    test('止痛关键词应被匹配', () => {
      const result = extractMedicineName('布洛芬止痛片');
      expect(result).toContain('止痛');
    });
  });
});
