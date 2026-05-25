const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
  describe('基本关键词匹配', () => {
    test('应识别胶囊类', () => {
      const text = '阿莫西林胶囊 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂', () => {
      const text = '布洛芬片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒类', () => {
      const text = '感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });
  });

  describe('品牌药名', () => {
    test('应识别阿莫西林', () => {
      const result = extractMedicineName('阿莫西林分散片');
      expect(result).toContain('莫西林');
    });

    test('应识别布洛芬', () => {
      const result = extractMedicineName('布洛芬缓释胶囊');
      expect(result).toContain('布洛芬');
    });

    test('应识别对乙酰氨基酚', () => {
      const result = extractMedicineName('对乙酰氨基酚颗粒');
      expect(result).toContain('乙酰氨基酚');
    });

    test('应识别头孢', () => {
      const result = extractMedicineName('头孢克肟胶囊');
      expect(result).toContain('头孢');
    });

    test('应识别阿奇霉素', () => {
      const result = extractMedicineName('阿奇霉素片');
      expect(result).toContain('阿奇霉素');
    });

    test('应识别感冒灵', () => {
      const result = extractMedicineName('感冒灵颗粒');
      expect(result).toContain('感冒灵');
    });
  });

  describe('分类关键词', () => {
    test('应识别维生素', () => {
      const result = extractMedicineName('维生素B族片剂');
      expect(result).toContain('维生素');
    });

    test('应识别钙片', () => {
      const result = extractMedicineName('钙片补充剂');
      expect(result).toContain('钙');
    });

    test('应识别退烧', () => {
      const result = extractMedicineName('退烧贴');
      expect(result).toContain('退烧');
    });

    test('应识别消炎', () => {
      const result = extractMedicineName('消炎药膏');
      expect(result).toContain('消炎');
    });

    test('应识别感冒', () => {
      const result = extractMedicineName('感冒冲剂');
      expect(result).toContain('感冒');
    });

    test('应识别咳嗽', () => {
      const result = extractMedicineName('止咳糖浆');
      expect(result).toContain('止咳');
    });

    test('应识别腹泻', () => {
      const result = extractMedicineName('腹泻宁胶囊');
      expect(result).toContain('腹泻');
    });
  });

  describe('边界条件', () => {
    test('空字符串返回空', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('null 返回空', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('undefined 返回空', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('无关键词时返回第一行', () => {
      const text = '无相关关键词的文字';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('返回结果长度限制', () => {
      const text = '这是第一行内容包含关键词胶囊关键词';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(text.length);
    });
  });

  describe('上下文提取', () => {
    test('关键词位于文本开头', () => {
      const result = extractMedicineName('胶囊包装产品');
      expect(result).toContain('胶囊');
    });

    test('关键词位于文本中间', () => {
      const result = extractMedicineName('某品牌阿莫西林胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('关键词位于文本末尾', () => {
      const result = extractMedicineName('药品名称：阿莫西林胶囊');
      expect(result).toContain('胶囊');
    });

    test('多个关键词时返回第一个匹配', () => {
      const result = extractMedicineName('布洛芬胶囊和感冒灵颗粒');
      expect(result.toLowerCase()).toContain('布洛芬');
    });
  });

  describe('多行文本处理', () => {
    test('处理换行符', () => {
      const text = '第一行\n第二行含胶囊关键词\n第三行';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('处理回车符', () => {
      const text = '第一行\r第二行含片剂\r第三行';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });
});
