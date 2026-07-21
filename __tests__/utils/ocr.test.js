/**
 * utils/ocr.js 和 utils/baidu-ocr.js 单元测试
 * 测试OCR识别和药品名称提取逻辑
 */

// Mock wx API
global.wx = require('../mocks/wx').wx;

const { extractMedicineName } = require('../../utils/baidu-ocr');
const { extractMedicineName: extractMedicineNameAlt } = require('../../utils/ocr');

describe('OCR Utils', () => {
  
  describe('extractMedicineName (baidu-ocr.js)', () => {
    
    test('应该正确提取胶囊类药品名称', () => {
      const text = '阿莫西林胶囊 规格：0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toMatch(/阿莫西林/);
    });
    
    test('应该正确提取片剂类药品名称', () => {
      const text = '布洛芬片 生产厂家：XX制药';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });
    
    test('应该正确提取颗粒类药品名称', () => {
      const text = '感冒清热颗粒 用法：开水冲服';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });
    
    test('应该正确提取口服液类药品名称', () => {
      const text = '蓝芩口服液 有效期至2025-12-31';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });
    
    test('应该正确处理注射液类药品', () => {
      const text = '头孢注射液 医院专用';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });
    
    test('应该正确处理软膏类药品', () => {
      const text = '红霉素软膏 外用药';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });
    
    test('应该处理大小写混合文本', () => {
      const text = '阿莫西林胶囊 AMOXICILLIN CAPSULES';
      const result = extractMedicineName(text);
      expect(result).toMatch(/阿莫西林|AMOXICILLIN/i);
    });
    
    test('应该处理没有关键词的文本（返回第一行）', () => {
      const text = '某种药品\n第二行\n第三行';
      const result = extractMedicineName(text);
      expect(result).toBe('某种药品');
    });
    
    test('应该处理空输入', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });
    
    test('应该处理纯空白文本', () => {
      const text = '   \n   \n   ';
      const result = extractMedicineName(text);
      // 应该返回空字符串或截取的前20个字符
      expect(result).toBeDefined();
    });
    
    test('应该提取包含关键词的完整词组', () => {
      const text = 'XX牌阿莫西林胶囊生产企业';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(3);
      expect(result.length).toBeLessThan(20);
    });
    
    test('应该正确识别常见药品关键词', () => {
      const testCases = [
        { text: '阿莫西林胶囊', keyword: '阿莫西林' },
        { text: '布洛芬缓释胶囊', keyword: '布洛芬' },
        { text: '对乙酰氨基酚片', keyword: '乙酰氨基酚' },
        { text: '头孢拉定胶囊', keyword: '头孢' },
        { text: '感冒灵颗粒', keyword: '感冒灵' },
        { text: '维生素C片', keyword: '维生素' }
      ];
      
      testCases.forEach(({ text, keyword }) => {
        const result = extractMedicineName(text);
        expect(result.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });
  });
  
  describe('extractMedicineName (ocr.js)', () => {
    
    test('应该正确提取药品名称', () => {
      const text = '阿莫西林胶囊 规格 0.5g';
      const result = extractMedicineNameAlt(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该处理更全面的药品关键词', () => {
      const testCases = [
        { text: '止咳糖浆', keyword: '糖浆' },
        { text: '氯雷他定片', keyword: '片' },
        { text: '蒙脱石散', keyword: '蒙脱石' }
      ];
      
      testCases.forEach(({ text, keyword }) => {
        const result = extractMedicineNameAlt(text);
        expect(result).toContain(keyword);
      });
    });
    
    test('应该处理空输入', () => {
      expect(extractMedicineNameAlt('')).toBe('');
      expect(extractMedicineNameAlt(null)).toBe('');
    });
    
    test('应该在没有匹配时返回第一行', () => {
      const text = '某种药品名称\n第二行';
      const result = extractMedicineNameAlt(text);
      expect(result).toBe('某种药品名称');
    });
    
    test('应该限制返回长度（最多30字符）', () => {
      const longText = '这是一个非常非常非常非常非常非常非常非常长的药品名称';
      const result = extractMedicineNameAlt(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });
  
  describe('边界条件和异常情况', () => {
    
    test('应该处理多行文本中的药品名称', () => {
      const text = `
        国药准字H12345678
        阿莫西林胶囊
        规格: 0.5g
        有效期至 2025-12-31
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该处理包含数字的药品名称', () => {
      const text = '阿莫西林胶囊 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该处理特殊字符', () => {
      const text = '阿莫西林胶囊（0.5g）';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该处理中文标点符号', () => {
      const text = '阿莫西林胶囊，规格：0.5克。';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
    
    test('应该提取关键词前后合理范围的文本', () => {
      const text = 'XX制药阿莫西林胶囊生产企业';
      const result = extractMedicineName(text);
      // 应该包含关键词，且长度合理
      expect(result.length).toBeGreaterThan(3);
      expect(result.length).toBeLessThan(25);
    });
    
    test('应该处理连续的药品关键词', () => {
      const text = '维生素C钙片复合制剂';
      const result = extractMedicineName(text);
      expect(result).toMatch(/维生素|钙片/);
    });
  });
  
  describe('实际药品包装文本场景', () => {
    
    test('应该处理完整的药品包装文本（案例1）', () => {
      const text = `
        国药准字H20093609
        阿莫西林胶囊
        Amoxicillin Capsules
        规格: 0.5g（按C16H19N3O5S计）
        有效期至 2025年12月
        生产企业：广州白云山制药股份有限公司
        贮藏：遮光，密封保存
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toMatch(/阿莫西林|Amoxicillin/i);
    });
    
    test('应该处理完整的药品包装文本（案例2）', () => {
      const text = `
        布洛芬缓释胶囊
        Ibuprofen Sustained Release Capsules
        每粒含主要成分布洛芬0.3克
        国药准字H20093609
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toMatch(/布洛芬|Ibuprofen/i);
    });
    
    test('应该处理处方药包装文本', () => {
      const text = `
        【药品名称】
        通用名称：头孢拉定胶囊
        英文名称：Cefradine Capsules
        
        【规格】
        0.25g（按C16H19N3O4S计）
      `;
      const result = extractMedicineName(text);
      expect(result).toMatch(/头孢|胶囊/i);
    });
    
    test('应该处理中药包装文本', () => {
      const text = `
        感冒清热颗粒
        批准文号：国药准字Z11020234
        规格：每袋装12g
        用法用量：开水冲服，一次1袋，一日2次
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });
    
    test('应该处理外用药包装文本', () => {
      const text = `
        红霉素软膏
        Erythromycin Ointment
        10g:10mg
        外用，涂于患处
      `;
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });
  });
});