// utils/ocr.test.js
const { extractMedicineName } = require('./ocr');

describe('extractMedicineName - 药品名称提取函数', () => {
  
  describe('正常场景', () => {
    test('应该从包含药品剂型的文本中提取名称', () => {
      const text = '阿莫西林胶囊 0.5g×12粒/盒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(30);
    });

    test('应该从包含常见药品关键词的文本中提取名称', () => {
      const text = '布洛芬片 用于退烧止痛';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该从包含颗粒剂型的文本中提取名称', () => {
      const text = '感冒灵颗粒 冲剂';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应该从包含口服液剂型的文本中提取名称', () => {
      const text = '小儿止咳糖浆 口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('边界条件', () => {
    test('应该处理空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('应该处理null值', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应该处理undefined值', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('应该处理不包含药品关键词的文本', () => {
      const text = '这是一段普通文字';
      const result = extractMedicineName(text);
      // 应该返回第一行作为默认
      expect(result).toBe(text);
    });

    test('应该处理多行文本', () => {
      const text = '第一行\n第二行胶囊\n第三行';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应该处理超长文本', () => {
      const longText = 'a'.repeat(1000) + '胶囊' + 'b'.repeat(1000);
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThan(50);
    });
  });

  describe('特殊药品类型', () => {
    test('应该识别注射液', () => {
      const text = '头孢注射液 2ml';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应该识别软膏', () => {
      const text = '皮炎平软膏 外用';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应该识别贴剂', () => {
      const text = '麝香壮骨膏贴剂';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });
  });

  describe('常见药品名称', () => {
    test('应该识别阿莫西林', () => {
      const text = '阿莫西林分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应该识别布洛芬', () => {
      const text = '布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应该识别维生素', () => {
      const text = '维生素C片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应该识别感冒灵', () => {
      const text = '999感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });
  });

  describe('大小写和格式处理', () => {
    test('应该处理大小写混合', () => {
      const text = 'AMOXICILLIN胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应该处理包含空格的文本', () => {
      const text = '阿莫西林 胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应该处理包含特殊字符的文本', () => {
      const text = '阿莫西林-胶囊（0.5g）';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('实际使用场景', () => {
    test('应该从OCR识别的真实文本中提取药品名称', () => {
      const ocrText = `阿莫西林胶囊
0.5g×12粒/盒
批准文号：国药准字H12345678
生产企业：某某制药有限公司
有效期至：2025年12月`;
      
      const result = extractMedicineName(ocrText);
      expect(result).toContain('胶囊');
    });

    test('应该处理包含多个药品关键词的文本', () => {
      const text = '复方氨酚烷胺片 感冒药';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });
});