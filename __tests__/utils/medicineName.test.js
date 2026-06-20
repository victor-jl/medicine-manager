/**
 * 药品名称提取函数测试
 * 测试文件: utils/ocr.js 和 utils/baidu-ocr.js 中的 extractMedicineName 函数
 */

const { extractMedicineName } = require('../../utils/ocr');
const { extractMedicineName: extractMedicineNameBaidu } = require('../../utils/baidu-ocr');

describe('extractMedicineName - 药品名称提取', () => {
  describe('基础功能测试', () => {
    test('应该从包含药品关键词的文本中提取药品名称', () => {
      const text = '阿莫西林胶囊 有效期至2025-12-31';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应该正确提取布洛芬片', () => {
      const text = '布洛芬片 用于退烧止痛';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该正确提取颗粒类药品', () => {
      const text = '感冒清热颗粒 冲剂';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应该正确提取口服液类药品', () => {
      const text = '小儿止咳口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });
  });

  describe('边界条件测试', () => {
    test('空字符串应返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null 应返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined 应返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('不包含关键词时应返回第一行文本', () => {
      const text = '未知药品名称\n第二行内容';
      const result = extractMedicineName(text);
      expect(result).toBe('未知药品名称');
    });

    test('不包含关键词且无换行符时应返回前30个字符', () => {
      const text = '这是一个很长的未知药品名称超过三十个字符的情况';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('复杂场景测试', () => {
    test('应该正确处理多行文本', () => {
      const text = `国药准字H12345678
阿莫西林胶囊
规格: 0.5g*24粒
有效期至: 2025-12-31`;
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应该正确处理包含多个关键词的文本', () => {
      const text = '维生素钙片复合制剂';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应该正确处理大小写混合的文本', () => {
      const text = 'AMOXICILLIN 胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应该正确处理包含特殊字符的文本', () => {
      const text = '头孢【胶囊】(处方药)';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });
  });

  describe('常见药品关键词测试', () => {
    test('应该识别注射液类药品', () => {
      const text = '青霉素注射液';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应该识别软膏类药品', () => {
      const text = '红霉素软膏';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应该识别贴剂类药品', () => {
      const text = '麝香壮骨贴剂';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });

    test('应该识别滴眼液类药品', () => {
      const text = '氯霉素滴眼液';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应该识别糖浆类药品', () => {
      const text = '小儿止咳糖浆';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('特定药品名称测试', () => {
    test('应该识别阿莫西林', () => {
      const text = '阿莫西林分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应该识别布洛芬', () => {
      const text = '布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应该识别对乙酰氨基酚', () => {
      const text = '对乙酰氨基酚片';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应该识别头孢类药品', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应该识别阿奇霉素', () => {
      const text = '阿奇霉素片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });
  });
});

describe('extractMedicineName (baidu-ocr) - 百度OCR药品名称提取', () => {
  test('应该从包含药品关键词的文本中提取药品名称', () => {
    const text = '阿莫西林胶囊 有效期至2025-12-31';
    const result = extractMedicineNameBaidu(text);
    expect(result).toContain('阿莫西林');
  });

  test('空字符串应返回空字符串', () => {
    expect(extractMedicineNameBaidu('')).toBe('');
  });

  test('null 应返回空字符串', () => {
    expect(extractMedicineNameBaidu(null)).toBe('');
  });

  test('不包含关键词时应返回第一行文本', () => {
    const text = '未知药品\n第二行';
    const result = extractMedicineNameBaidu(text);
    expect(result).toBe('未知药品');
  });
});