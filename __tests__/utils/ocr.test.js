const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  describe('关键词匹配', () => {
    test('应识别胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.25g*24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('应识别片剂类药品', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒类药品', () => {
      const text = '感冒灵颗粒 10g*9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别口服液类药品', () => {
      const text = '强力枇杷露口服液 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别注射液类药品', () => {
      const text = '氯化钠注射液 250ml';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏类药品', () => {
      const text = '红霉素软膏 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应识别贴剂类药品', () => {
      const text = '关节止痛贴 10片装';
      const result = extractMedicineName(text);
      expect(result).toContain('贴');
    });
  });

  describe('品牌药名识别', () => {
    test('应识别常见西药名称', () => {
      const text = '阿莫西林胶囊 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应识别布洛芬', () => {
      const text = '芬必得布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result.toLowerCase()).toContain('布洛芬');
    });

    test('应识别对乙酰氨基酚', () => {
      const text = '对乙酰氨基酚片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应识别头孢类抗生素', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应识别阿奇霉素', () => {
      const text = '阿奇霉素片 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });
  });

  describe('中成药识别', () => {
    test('应识别感冒灵系列', () => {
      const text = '999感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别板蓝根', () => {
      const text = '板蓝根颗粒 10g*20袋';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应识别双黄连', () => {
      const text = '双黄连口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('双黄连');
    });

    test('应识别连花清瘟', () => {
      const text = '连花清瘟胶囊 0.35g*24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('连花清瘟');
    });
  });

  describe('分类关键词识别', () => {
    test('应识别维生素类', () => {
      const text = '维生素C片 100mg';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别钙片类', () => {
      const text = '钙尔奇钙片 600mg';
      const result = extractMedicineName(text);
      expect(result).toContain('钙');
    });

    test('应识别胃药类关键词', () => {
      const text = '奥美拉唑肠溶胶囊 20mg';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应识别血压类药品', () => {
      const text = '硝苯地平缓释片 30mg';
      const result = extractMedicineName(text);
      expect(result).toContain('硝苯地平');
    });

    test('应识别血糖类药品', () => {
      const text = '二甲双胍片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });

    test('应识别感冒关键词', () => {
      const text = '复方感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒');
    });

    test('应识别咳嗽关键词', () => {
      const text = '强力止咳糖浆';
      const result = extractMedicineName(text);
      expect(result).toContain('止咳');
    });

    test('应识别腹泻关键词', () => {
      const text = '蒙脱石散 3g*10袋';
      const result = extractMedicineName(text);
      expect(result).toContain('蒙脱石');
    });
  });

  describe('边界条件和异常输入', () => {
    test('空字符串应返回空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('null 输入应返回空字符串', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('undefined 输入应返回空字符串', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('无关键词时返回第一行', () => {
      const text = '这是一段没有任何药品关键词的普通文本';
      const result = extractMedicineName(text);
      expect(result).toContain('这');
    });

    test('长文本中能正确定位关键词', () => {
      const text = '【药品名称】通用名称：阿莫西林胶囊\n【规格】0.25g\n【适应症】消炎';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('多行文本正确分割', () => {
      const text = '第一行文本\n阿莫西林胶囊\n第三行文本';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('大小写处理', () => {
    test('大写输入应正确匹配', () => {
      const text = 'AMOXICILLIN CAPSULES';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('混合大小写应正确匹配', () => {
      const text = '布洛芬片 Ibuprofen Tablets';
      const result = extractMedicineName(text);
      expect(result.toLowerCase()).toContain('布洛芬');
    });
  });

  describe('上下文提取', () => {
    test('关键词前有足够上下文时正确提取', () => {
      const text = '商品名称：阿莫西林胶囊 规格：0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('关键词后有规格信息时包含完整', () => {
      const text = '布洛芬缓释胶囊 0.3g*20粒';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });
  });
});
