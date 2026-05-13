const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  describe('正常提取场景', () => {
    test('应正确提取包含药品关键词的文本', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应提取布洛芬相关药品名称', () => {
      const text = '布洛芬缓释胶囊 0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应提取头孢类药品名称', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应提取维生素类药品名称', () => {
      const text = '维生素C片 100mg';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应提取中药名称', () => {
      const text = '板蓝根颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应提取感冒灵类药品名称', () => {
      const text = '感冒灵颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });
  });

  describe('边界条件处理', () => {
    test('应处理空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('应处理null输入', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应处理undefined输入', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('应处理不包含任何关键词的文本', () => {
      const text = '这是一段普通文本';
      const result = extractMedicineName(text);
      expect(typeof result).toBe('string');
    });

    test('应正确处理关键词位于文本开头的情况', () => {
      const text = '胶囊装 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应正确处理关键词位于文本结尾的情况', () => {
      const text = '某种药片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应正确处理关键词位于文本中间的情况', () => {
      const text = '药品名：阿莫西林胶囊，规格0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应正确处理只有一行文本的情况', () => {
      const text = '阿莫西林';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应处理多行文本并取第一行作为默认', () => {
      const text = '阿莫西林胶囊\n布洛芬片\n维生素C';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('大小写敏感性', () => {
    test('应忽略大小写进行匹配', () => {
      const text = 'amoxicillin胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应正确处理混合大小写', () => {
      const text = 'bufenIn胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('剂型关键词覆盖', () => {
    test('应识别胶囊剂型', () => {
      const text = '某种胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂剂型', () => {
      const text = '某种片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒剂型', () => {
      const text = '某种颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别口服液剂型', () => {
      const text = '某种口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别滴眼液剂型', () => {
      const text = '某种滴眼液';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应识别糖浆剂型', () => {
      const text = '某种糖浆';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('返回值长度限制', () => {
    test('返回的第一行默认应限制在30个字符以内', () => {
      const longText = '这是一个非常长的药品名称描述可能会超过三十个字符需要被截断处理';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });
});
