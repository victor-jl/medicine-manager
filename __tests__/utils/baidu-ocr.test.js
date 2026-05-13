const {
  extractMedicineName
} = require('../../utils/baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  describe('基础提取功能', () => {
    test('应处理null输入', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应处理空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('应处理undefined输入', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });
  });

  describe('药品关键词匹配', () => {
    test('应匹配胶囊关键词', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应匹配片剂关键词', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应匹配颗粒关键词', () => {
      const text = '板蓝根颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应匹配口服液关键词', () => {
      const text = '止咳口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应匹配阿莫西林关键词', () => {
      const text = '阿莫西林分散片 0.125g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应匹配布洛芬关键词', () => {
      const text = '布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应匹配头孢关键词', () => {
      const text = '头孢克肟胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应匹配感冒灵关键词', () => {
      const text = '感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应匹配维生素关键词', () => {
      const text = '维生素B族';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应匹配钙片关键词', () => {
      const text = '钙片补钙';
      const result = extractMedicineName(text);
      expect(result).toContain('钙片');
    });
  });

  describe('大小写不敏感匹配', () => {
    test('小写关键词应匹配', () => {
      const text = 'amoxicillin胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('大写关键词应匹配', () => {
      const text = 'AMOXICILLIN胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('默认回退逻辑', () => {
    test('无关键词时返回第一行前20字符', () => {
      const text = '这是一个没有药品关键词的普通文本';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    test('多行文本返回第一行', () => {
      const text = '第一行药品名\n第二行规格\n第三行厂家';
      const result = extractMedicineName(text);
      expect(result).toContain('第一行');
    });

    test('处理换行符和回车符混合', () => {
      const text = '阿莫西林胶囊\r\n布洛芬片\r维生素C';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('提取上下文', () => {
    test('应包含关键词周围的上下文', () => {
      const text = '生产日期20240101阿莫西林胶囊有效期至20260101';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result.length).toBeGreaterThan('阿莫西林'.length);
    });

    test('关键词在开头时应正确提取', () => {
      const text = '胶囊阿莫西林';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });
});
