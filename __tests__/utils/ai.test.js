/**
 * utils/ai.js 单元测试
 * 测试药品信息智能解析和日期处理逻辑
 */

const {
  analyzeMedicineInfo,
  formatExpiryDate,
  isExpiringSoon,
  validateMedicine
} = require('../../utils/ai');

describe('utils/ai.js', () => {
  
  describe('analyzeMedicineInfo', () => {
    
    test('应该正确处理空输入', () => {
      const result = analyzeMedicineInfo('');
      expect(result).toEqual({
        name: '',
        specification: '',
        manufacturer: '',
        usage: '',
        expiryDate: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });
    
    test('应该正确处理null和undefined输入', () => {
      expect(analyzeMedicineInfo(null)).toHaveProperty('name', '');
      expect(analyzeMedicineInfo(undefined)).toHaveProperty('name', '');
    });
    
    test('应该正确提取药品名称（胶囊）', () => {
      const text = '阿莫西林胶囊 生产企业：XX制药 有效期至 2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('胶囊');
      expect(result.name).toMatch(/阿莫西林/);
    });
    
    test('应该正确提取药品名称（片剂）', () => {
      const text = '布洛芬片 国药准字H12345678';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('片');
    });
    
    test('应该正确提取规格信息', () => {
      const text = '阿莫西林胶囊 规格 0.5g 250mg';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toMatch(/0\.5g/);
      expect(result.specification).toMatch(/250mg/);
    });
    
    test('应该正确提取生产厂家', () => {
      const text = '阿莫西林胶囊 生产企业：广州白云山制药 有效期至 2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('制药');
    });
    
    test('应该正确提取国药准字', () => {
      const text = '阿莫西林胶囊 国药准字H12345678 有效期至 2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('国药准字H12345678');
    });
    
    test('应该正确提取有效期', () => {
      const text = '阿莫西林胶囊 有效期至 2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toMatch(/2025.*12.*31/);
    });
    
    test('应该正确提取用法用量', () => {
      const text = '阿莫西林胶囊 用法用量：口服，一次0.5g，一日3次';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('口服');
    });
    
    test('应该正确提取贮藏条件', () => {
      const text = '阿莫西林胶囊 贮藏：遮光，密封保存';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toContain('遮光');
    });
    
    test('应该正确提取成分', () => {
      const text = '阿莫西林胶囊 主要成分：阿莫西林';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('阿莫西林');
    });
    
    test('应该在没有关键词匹配时返回第一行作为名称', () => {
      const text = '某种药品\n第二行\n第三行';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toBe('某种药品');
    });
    
    test('应该处理多行OCR文本', () => {
      const text = '阿莫西林胶囊\n规格: 0.5g\n生产企业: XX制药\n有效期至 2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('胶囊');
      expect(result.specification).toContain('0.5g');
      expect(result.manufacturer).toContain('制药');
    });
  });
  
  describe('formatExpiryDate', () => {
    
    test('应该处理空输入', () => {
      expect(formatExpiryDate('')).toBe('');
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
    });
    
    test('应该保持YYYY-MM-DD格式不变', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });
    
    test('应该转换中文日期格式', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });
    
    test('应该转换斜杠分隔格式', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
      expect(formatExpiryDate('2025/12')).toBe('2025-12-01');
    });
    
    test('应该处理单数字月份和日期', () => {
      expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
      expect(formatExpiryDate('2025年1月5日')).toBe('2025-01-05');
    });
    
    test('应该处理无效日期', () => {
      // 无效日期返回截取的原值
      expect(formatExpiryDate('invalid-date')).toBe('invalid-da');
      expect(formatExpiryDate('13月')).toBe('13月');
    });
    
    test('应该处理带空格的日期', () => {
      expect(formatExpiryDate(' 2025-12-31 ')).toBe('2025-12-31');
      expect(formatExpiryDate('2025 年 12 月 31 日')).toBe('2025-12-31');
    });
  });
  
  describe('isExpiringSoon', () => {
    
    beforeEach(() => {
      // 锁定当前日期为 2025-07-21
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-07-21'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('应该识别即将过期的药品（30天内）', () => {
      const soonExpiry = '2025-08-15'; // 25天后
      expect(isExpiringSoon(soonExpiry, 30)).toBe(true);
    });
    
    test('应该识别未过期但不在预警期的药品', () => {
      const futureExpiry = '2026-12-31'; // 超过30天
      expect(isExpiringSoon(futureExpiry, 30)).toBe(false);
    });
    
    test('应该识别已过期的药品', () => {
      const pastExpiry = '2025-06-01'; // 已过期
      expect(isExpiringSoon(pastExpiry, 30)).toBe(false);
    });
    
    test('应该处理临界值（正好30天）', () => {
      const boundaryExpiry = '2025-08-20'; // 正好30天
      expect(isExpiringSoon(boundaryExpiry, 30)).toBe(true);
    });
    
    test('应该处理空值输入', () => {
      expect(isExpiringSoon('', 30)).toBe(false);
      expect(isExpiringSoon(null, 30)).toBe(false);
    });
    
    test('应该处理无效日期', () => {
      expect(isExpiringSoon('invalid-date', 30)).toBe(false);
    });
    
    test('应该支持自定义预警天数', () => {
      const expiry = '2025-07-25'; // 4天后
      expect(isExpiringSoon(expiry, 7)).toBe(true);
      expect(isExpiringSoon(expiry, 3)).toBe(false);
    });
  });
  
  describe('validateMedicine', () => {
    
    test('应该验证有效药品信息', () => {
      const medicine = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        specification: '0.5g'
      };
      
      const result = validateMedicine(medicine);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('应该检测空名称', () => {
      const medicine = {
        name: '',
        expiryDate: '2025-12-31'
      };
      
      const result = validateMedicine(medicine);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });
    
    test('应该检测空白名称', () => {
      const medicine = {
        name: '   ',
        expiryDate: '2025-12-31'
      };
      
      const result = validateMedicine(medicine);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });
    
    test('应该检测无效的有效期格式', () => {
      const medicine = {
        name: '阿莫西林胶囊',
        expiryDate: 'invalid-date'
      };
      
      const result = validateMedicine(medicine);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('有效期格式不正确');
    });
    
    test('应该处理空对象', () => {
      const result = validateMedicine(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品信息不能为空');
    });
    
    test('应该处理undefined', () => {
      const result = validateMedicine(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('药品信息不能为空');
    });
    
    test('应该允许缺少有效期', () => {
      const medicine = {
        name: '阿莫西林胶囊'
      };
      
      const result = validateMedicine(medicine);
      expect(result.valid).toBe(true);
    });
  });
});