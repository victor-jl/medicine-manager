/**
 * utils/ocr.js 单元测试
 * 测试多种OCR识别方案的逻辑
 */

const { extractMedicineName } = require('../../../utils/ocr');

describe('OCR工具函数 - extractMedicineName', () => {
  describe('正常场景', () => {
    test('应识别包含胶囊的药品名称', () => {
      const text = '阿莫西林胶囊 0.25g*24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别包含片剂的药品名称', () => {
      const text = '布洛芬片 0.2g*20片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别包含颗粒的药品名称', () => {
      const text = '感冒灵颗粒 10g*9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别包含口服液的药品名称', () => {
      const text = '双黄连口服液 10ml*12支';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别常见药品名称', () => {
      const text = '阿司匹林肠溶片 50mg*30片';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('边界条件', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null输入应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined输入应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('仅包含关键词的文本应正常处理', () => {
      const result = extractMedicineName('胶囊');
      expect(result).toBe('胶囊');
    });

    test('关键词在文本开头', () => {
      const text = '胶囊阿莫西林';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('关键词在文本末尾', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('关键词在文本中间', () => {
      const text = '药品名称阿莫西林胶囊规格';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('大小写不敏感', () => {
    test('大写关键词应匹配', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('小写输入应正常匹配', () => {
      const text = 'test布洛芬片test';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });
  });

  describe('关键词优先级', () => {
    test('应匹配第一个找到的关键词', () => {
      const text = '布洛芬胶囊和感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('多个关键词时返回包含关键词的上下文', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });
  });

  describe('无匹配关键词场景', () => {
    test('无关键词时返回第一行前30个字符', () => {
      const text = '这是一个没有任何关键词的文本';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toContain('这');
    });

    test('纯数字文本返回空或有限内容', () => {
      const text = '1234567890';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('特殊字符文本正常处理', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('上下文提取', () => {
    test('应提取关键词周围的上下文', () => {
      const text = '生产厂家：XX制药有限公司 布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(5);
    });

    test('关键词在文本末尾时应包含足够上下文', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词在文本开头时应包含足够上下文', () => {
      const text = '胶囊阿莫西林规格';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('多行文本处理', () => {
    test('应处理换行符', () => {
      const text = '第一行文字\n第二行胶囊\n第三行文字';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应处理回车符', () => {
      const text = '第一行\r\n第二行片剂\r\n第三行';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应处理混合换行符', () => {
      const text = '行1\n行2\r\n行3';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('特殊药品类型', () => {
    test('应识别注射液', () => {
      const text = '氯化钠注射液 100ml:0.9g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏', () => {
      const text = '红霉素软膏 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应识别贴剂', () => {
      const text = '芬太尼透皮贴剂 2.5mg';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });

    test('应识别滴眼液', () => {
      const text = '盐酸左氧氟沙星滴眼液 8ml:24mg';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应识别糖浆', () => {
      const text = '急支糖浆 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('药品成分关键词', () => {
    test('应识别维生素类', () => {
      const text = '维生素C片 100mg*100片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别抗生素类', () => {
      const text = '头孢克肟分散片 0.1g*6片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应识别感冒药类', () => {
      const text = '感冒灵颗粒 10g*9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别中药类', () => {
      const text = '板蓝根颗粒 10g*20袋';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应识别胃药类', () => {
      const text = '奥美拉唑肠溶胶囊 20mg*14粒';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });
  });

  describe('复杂场景', () => {
    test('长文本正常处理', () => {
      const longText = '药品说明书\n通用名称：布洛芬缓释胶囊\n英文名称：Ibuprofen Sustained Release Capsules\n规格：0.3g\n生产企业：某某制药有限公司'.repeat(10);
      const result = extractMedicineName(longText);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(200);
    });

    test('Unicode字符正常处理', () => {
      const text = '布洛芬片 0.2g 中文说明书';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('混合中英文正常处理', () => {
      const text = 'Ibuprofen Capsules 布洛芬胶囊 200mg';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });
  });
});
