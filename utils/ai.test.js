// utils/ai.test.js
const {
  analyzeMedicineInfo,
  formatExpiryDate,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired
} = require('./ai');

describe('analyzeMedicineInfo - 药品信息分析函数', () => {
  
  describe('正常场景', () => {
    test('应该从完整OCR文本中提取所有字段', () => {
      const ocrText = `阿莫西林胶囊
0.5g×12粒/盒
用法用量：口服，一次1粒，一日3次
有效期至：2025-12-31
生产企业：某某制药有限公司
国药准字：H12345678
贮藏：密封，在阴凉处保存
主要成分：阿莫西林`;
      
      const result = analyzeMedicineInfo(ocrText);
      
      expect(result.name).toBeTruthy();
      expect(result.specification).toContain('0.5g');
      expect(result.usage).toContain('口服');
      expect(result.manufacturer).toContain('制药');
      expect(result.approvalNumber).toContain('H12345678');
      expect(result.storage).toContain('密封');
      expect(result.ingredients).toContain('阿莫西林');
    });

    test('应该从简单文本中提取基本信息', () => {
      const text = '布洛芬片 0.1g';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toBeTruthy();
      expect(result.specification).toContain('0.1g');
    });
  });

  describe('边界条件', () => {
    test('应该处理空字符串', () => {
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

    test('应该处理null值', () => {
      const result = analyzeMedicineInfo(null);
      expect(result.name).toBe('');
    });

    test('应该处理undefined值', () => {
      const result = analyzeMedicineInfo(undefined);
      expect(result.name).toBe('');
    });

    test('应该处理不包含任何信息的文本', () => {
      const result = analyzeMedicineInfo('这是一段普通文字');
      expect(result.name).toBe('这是一段普通文字');
    });

    test('应该处理超长字段值', () => {
      const longManu = '厂家'.repeat(100);
      const text = `药品名称\n厂家：${longManu}`;
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer.length).toBeLessThanOrEqual(100);
    });
  });

  describe('字段提取准确性', () => {
    test('应该正确提取规格', () => {
      const text = '0.5g×12片/盒';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toMatch(/\d+\.?\d*\s*[mg|g|ml]/);
    });

    test('应该正确提取厂家信息（冒号分隔）', () => {
      const text = '生产企业：华北制药股份有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('华北制药');
    });

    test('应该正确提取厂家信息（中文冒号）', () => {
      const text = '生产厂商：华北制药股份有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('华北制药');
    });

    test('应该正确提取用法用量', () => {
      const text = '用法用量：口服，一次1片，一日3次';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('口服');
    });

    test('应该正确提取有效期（标准格式）', () => {
      const text = '有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBeTruthy();
    });

    test('应该正确提取有效期（中文格式）', () => {
      const text = '有效期至：2025年12月31日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBeTruthy();
    });

    test('应该正确提取国药准字', () => {
      const text = '国药准字：H12345678';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toContain('H12345678');
    });

    test('应该正确提取贮藏条件', () => {
      const text = '贮藏：密封保存';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toContain('密封');
    });

    test('应该正确提取成分', () => {
      const text = '主要成分：阿莫西林、克拉维酸钾';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('阿莫西林');
    });
  });
});

describe('formatExpiryDate - 日期格式化函数', () => {
  
  describe('正常格式转换', () => {
    test('应该格式化标准日期格式 YYYY-MM-DD', () => {
      const result = formatExpiryDate('2025-12-31');
      expect(result).toBe('2025-12-31');
    });

    test('应该格式化斜线分隔的日期', () => {
      const result = formatExpiryDate('2025/12/31');
      expect(result).toBe('2025-12-31');
    });

    test('应该格式化中文日期格式', () => {
      const result = formatExpiryDate('2025年12月31日');
      expect(result).toBe('2025-12-31');
    });

    test('应该格式化年月格式（补充默认日期）', () => {
      const result = formatExpiryDate('2025-12');
      expect(result).toBe('2025-12-01');
    });

    test('应该格式化中文年月格式', () => {
      const result = formatExpiryDate('2025年12月');
      expect(result).toBe('2025-12-01');
    });

    test('应该格式化YYYYMMDD格式', () => {
      const result = formatExpiryDate('20251231');
      expect(result).toBe('2025-12-31');
    });

    test('应该处理点分隔符', () => {
      const result = formatExpiryDate('2025.12.31');
      expect(result).toBe('2025-12-31');
    });
  });

  describe('边界条件', () => {
    test('应该处理空字符串', () => {
      const result = formatExpiryDate('');
      expect(result).toBe('');
    });

    test('应该处理null值', () => {
      const result = formatExpiryDate(null);
      expect(result).toBe('');
    });

    test('应该处理undefined值', () => {
      const result = formatExpiryDate(undefined);
      expect(result).toBe('');
    });

    test('应该处理无效日期格式', () => {
      const result = formatExpiryDate('invalid-date');
      expect(result).toBe('invalid-date');
    });

    test('应该处理不完整的日期', () => {
      const result = formatExpiryDate('2025');
      expect(result).toBeTruthy();
    });

    test('应该处理只有年和月的情况', () => {
      const result = formatExpiryDate('2025-06');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('日期验证', () => {
    test('应该验证有效日期', () => {
      const result = formatExpiryDate('2025-12-31');
      const date = new Date(result);
      expect(date instanceof Date && !isNaN(date)).toBe(true);
    });

    test('应该处理闰年日期', () => {
      const result = formatExpiryDate('2024-02-29');
      expect(result).toBe('2024-02-29');
    });

    test('应该处理月份补零', () => {
      const result = formatExpiryDate('2025-1-5');
      expect(result).toBe('2025-01-05');
    });
  });
});

describe('daysUntilExpiry - 过期天数计算', () => {
  
  beforeEach(() => {
    // 固定当前时间以使测试可重复
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('正常计算', () => {
    test('应该正确计算未来过期天数', () => {
      const result = daysUntilExpiry('2025-12-31');
      expect(result).toBe(364);
    });

    test('应该正确计算已过期天数（负数）', () => {
      const result = daysUntilExpiry('2024-12-31');
      expect(result).toBe(-1);
    });

    test('应该返回0表示今天过期', () => {
      const result = daysUntilExpiry('2025-01-01');
      expect(result).toBe(0);
    });

    test('应该返回30天内即将过期', () => {
      const result = daysUntilExpiry('2025-01-31');
      expect(result).toBe(30);
    });
  });

  describe('边界条件', () => {
    test('应该处理空字符串', () => {
      const result = daysUntilExpiry('');
      expect(result).toBe(Infinity);
    });

    test('应该处理null值', () => {
      const result = daysUntilExpiry(null);
      expect(result).toBe(Infinity);
    });

    test('应该处理无效日期', () => {
      const result = daysUntilExpiry('invalid');
      expect(result).toBe(Infinity);
    });
  });
});

describe('isExpiringSoon - 即将过期判断', () => {
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应该识别30天内过期的药品', () => {
    expect(isExpiringSoon('2025-01-15')).toBe(true);
    expect(isExpiringSoon('2025-01-31')).toBe(true);
  });

  test('应该识别未即将过期的药品', () => {
    expect(isExpiringSoon('2025-12-31')).toBe(false);
    expect(isExpiringSoon('2026-01-01')).toBe(false);
  });

  test('应该识别已过期药品为false', () => {
    expect(isExpiringSoon('2024-12-31')).toBe(false);
  });

  test('应该处理边界值（刚好30天）', () => {
    expect(isExpiringSoon('2025-01-31')).toBe(true);
    expect(isExpiringSoon('2025-02-01')).toBe(false);
  });

  test('应该处理今天过期的情况', () => {
    expect(isExpiringSoon('2025-01-01')).toBe(true);
  });
});

describe('isExpired - 过期判断', () => {
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应该识别已过期药品', () => {
    expect(isExpired('2024-12-31')).toBe(true);
    expect(isExpired('2024-01-01')).toBe(true);
  });

  test('应该识别未过期药品', () => {
    expect(isExpired('2025-01-02')).toBe(false);
    expect(isExpired('2025-12-31')).toBe(false);
  });

  test('应该处理今天的情况（未过期）', () => {
    expect(isExpired('2025-01-01')).toBe(false);
  });

  test('应该处理无效日期', () => {
    expect(isExpired('')).toBe(false);
    expect(isExpired(null)).toBe(false);
  });
});

describe('集成测试 - 真实OCR数据', () => {
  
  test('应该从真实OCR文本中提取完整信息', () => {
    const realOcrText = `阿莫西林胶囊
0.5g×12粒/盒
批准文号：国药准字H20064286
生产企业：华北制药股份有限公司
用法用量：口服，成人一次1粒，一日3次
有效期至：2025年12月
贮藏：密封，在凉暗处保存
主要成分：阿莫西林三水合物`;
    
    const result = analyzeMedicineInfo(realOcrText);
    
    expect(result.name).toContain('阿莫西林');
    expect(result.specification).toContain('0.5g');
    expect(result.approvalNumber).toContain('H20064286');
    expect(result.manufacturer).toContain('华北制药');
    expect(result.usage).toContain('口服');
    expect(result.storage).toContain('密封');
    expect(result.ingredients).toContain('阿莫西林');
    
    // 验证日期可以正确处理
    const formattedDate = formatExpiryDate(result.expiryDate);
    expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('应该正确处理复杂的药品信息', () => {
    const complexText = `复方氨酚烷胺片
每片含：对乙酰氨基酚250mg、盐酸金刚烷胺100mg
规格：12片/盒
国药准字：H21023895
生产厂家：沈阳益生堂制药有限公司
用法：口服，成人一次1片，一日2次
有效期：2025-06-30
贮藏条件：遮光，密封保存`;
    
    const result = analyzeMedicineInfo(complexText);
    
    expect(result.name).toBeTruthy();
    expect(result.specification).toContain('12片');
    expect(result.approvalNumber).toContain('H21023895');
    expect(result.usage).toBeTruthy();
    expect(result.storage).toBeTruthy();
  });
});