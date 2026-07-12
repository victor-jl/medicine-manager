/**
 * OCR 工具函数测试
 * 测试药品名称提取和数据解析功能
 */

const { extractMedicineName } = require('../../utils/ocr');
const { extractMedicineName: extractMedicineNameBaidu } = require('../../utils/baidu-ocr');

describe('OCR 工具函数测试', () => {
  
  describe('extractMedicineName - 药品名称提取', () => {
    
    test('应该能从包含药品剂型的文本中提取药品名称', () => {
      const text = '阿莫西林胶囊 0.5g×12粒/盒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toBeTruthy();
    });
    
    test('应该能识别常见药品关键词', () => {
      const testCases = [
        { input: '布洛芬片剂', expectedKeyword: '片' },
        { input: '感冒灵颗粒', expectedKeyword: '颗粒' },
        { input: '维生素C口服液', expectedKeyword: '口服液' },
        { input: '阿奇霉素注射液', expectedKeyword: '注射液' },
        { input: '红霉素软膏', expectedKeyword: '软膏' },
      ];
      
      testCases.forEach(({ input, expectedKeyword }) => {
        const result = extractMedicineName(input);
        expect(result).toContain(expectedKeyword);
      });
    });
    
    test('应该能处理包含多个药品关键词的文本', () => {
      const text = '复合维生素片 包含维生素C和维生素E';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
      expect(result).toContain('维生素');
    });
    
    test('应该能处理空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });
    
    test('应该能处理 null 或 undefined', () => {
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });
    
    test('应该能处理没有关键词的文本（返回第一行）', () => {
      const text = '药品说明书\n通用名称\n生产企业';
      const result = extractMedicineName(text);
      expect(result).toContain('药品说明书');
    });
    
    test('应该能处理多行文本', () => {
      const text = '生产企业：某某制药\n产品名称：阿莫西林胶囊\n有效期：2025年';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该能识别特定药品品牌名称', () => {
      const testCases = [
        '阿莫西林分散片',
        '布洛芬缓释胶囊',
        '对乙酰氨基酚片',
        '头孢拉定胶囊',
        '阿奇霉素片'
      ];
      
      testCases.forEach(text => {
        const result = extractMedicineName(text);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      });
    });
    
    test('应该能处理大小写混合的文本', () => {
      const text = 'Vitamin C 片 100mg';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
    
    test('应该能处理包含特殊字符的文本', () => {
      const text = '药品名称：【感冒灵】颗粒（无糖型）';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });
    
    test('提取的药品名称长度应该合理（不超过原始文本）', () => {
      const text = '这是一个非常非常非常非常长的药品说明书文本';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(text.length);
    });
  });
  
  describe('extractMedicineNameBaidu - 百度OCR药品名称提取', () => {
    
    test('应该能从识别结果中提取药品名称', () => {
      const text = '阿莫西林胶囊 生产企业：某某制药';
      const result = extractMedicineNameBaidu(text);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    test('应该能处理空输入', () => {
      expect(extractMedicineNameBaidu('')).toBe('');
      expect(extractMedicineNameBaidu(null)).toBe('');
    });
    
    test('应该能识别有效期相关关键词', () => {
      const text = '有效期至 2025年12月 阿莫西林胶囊';
      const result = extractMedicineNameBaidu(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该能处理包含数字和单位的文本', () => {
      const text = '规格：0.5g×12粒/盒 布洛芬片';
      const result = extractMedicineNameBaidu(text);
      expect(result).toBeTruthy();
    });
  });
  
  describe('药品名称提取 - 边界条件测试', () => {
    
    test('应该能处理极短的文本', () => {
      const text = '片';
      const result = extractMedicineName(text);
      expect(result).toBe('片');
    });
    
    test('应该能处理极长的文本', () => {
      const longText = '阿莫西林胶囊 '.repeat(100);
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
    
    test('应该能处理只有空格的文本', () => {
      const result = extractMedicineName('   ');
      expect(result).toBe('');
    });
    
    test('应该能处理包含换行符的文本', () => {
      const text = '药品名称\n\n阿莫西林胶囊\n有效期2025';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该能处理包含特殊符号的文本', () => {
      const text = '药品@#$名称%^&*阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });
});