// __tests__/ai.test.js
// 测试 utils/ai.js 中的药品信息分析和日期格式化逻辑

const {
  analyzeMedicineInfo,
  formatExpiryDate,
  extractName,
  extractExpiryDate,
  extractSpecification,
  extractManufacturer,
  extractUsage,
  extractApprovalNumber,
  extractStorage,
  extractIngredients
} = require('../utils/ai');

describe('formatExpiryDate', () => {
  describe('空值处理', () => {
    it('空字符串应返回空', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    it('null 应返回空', () => {
      expect(formatExpiryDate(null)).toBe('');
    });

    it('undefined 应返回空', () => {
      expect(formatExpiryDate(undefined)).toBe('');
    });
  });

  describe('标准日期格式', () => {
    it('应正确格式化 YYYY-MM-DD', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    it('应正确格式化 YYYY/MM/DD', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    it('应正确格式化 YYYY.MM.DD', () => {
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });
  });

  describe('中文日期格式', () => {
    it('应正确格式化 YYYY年MM月DD日', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    });

    it('应正确格式化 YYYY年MM月', () => {
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });
  });

  describe('补零处理', () => {
    it('月份和日期应补零', () => {
      expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
    });

    it('单数字月份日期应补零', () => {
      expect(formatExpiryDate('2025/3/8')).toBe('2025-03-08');
    });
  });

  describe('日期验证', () => {
    it('无效月份应返回原始字符串', () => {
      expect(formatExpiryDate('2025-13-01')).toBe('2025-13-01');
    });

    it('无效日期应返回原始字符串', () => {
      expect(formatExpiryDate('2025-12-32')).toBe('2025-12-32');
    });

    it('年份超出范围应返回原始字符串', () => {
      expect(formatExpiryDate('1800-01-01')).toBe('1800-01-01');
    });
  });

  describe('空白字符处理', () => {
    it('应忽略日期中的空格', () => {
      expect(formatExpiryDate('2025 - 12 - 31')).toBe('2025-12-31');
    });
  });
});

describe('analyzeMedicineInfo', () => {
  describe('空值处理', () => {
    it('空字符串应返回所有空字段', () => {
      const result = analyzeMedicineInfo('');
      expect(result).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });

    it('null 应返回所有空字段', () => {
      const result = analyzeMedicineInfo(null);
      expect(result).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });

    it('非字符串输入应返回所有空字段', () => {
      const result = analyzeMedicineInfo(123);
      expect(result).toEqual({
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      });
    });
  });

  describe('药品名称提取', () => {
    it('应从【药品名称】标签提取', () => {
      const text = '【药品名称】阿莫西林胶囊\n【规格】0.25g';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
    });

    it('应从"药品名称："标签提取', () => {
      const text = '药品名称：布洛芬缓释片\n规格：0.3g';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('布洛芬');
    });

    it('无标签时应通过关键词匹配', () => {
      const text = '头孢克肟片 100mg*6片';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('头孢');
    });
  });

  describe('有效期提取', () => {
    it('应提取"有效期至"后的日期', () => {
      const text = '有效期至：2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025-12-31');
    });

    it('应提取"有效期"后的日期', () => {
      const text = '有效期：2025年06月30日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025年06月30日');
    });

    it('应提取"失效期"后的日期', () => {
      const text = '失效期：2025/12/31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025/12/31');
    });
  });

  describe('规格提取', () => {
    it('应提取规格字段', () => {
      const text = '【规格】0.25g*24粒/盒';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toContain('0.25g');
    });

    it('应提取"规格："后的内容', () => {
      const text = '规格：10ml*10支';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toContain('10ml');
    });
  });

  describe('生产厂家提取', () => {
    it('应提取生产厂家字段', () => {
      const text = '【生产厂家】某某制药有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('制药');
    });

    it('应提取"生产企业："后的内容', () => {
      const text = '生产企业：某某药业股份有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('药业');
    });
  });

  describe('用法用量提取', () => {
    it('应提取用法用量字段', () => {
      const text = '【用法用量】口服，一次2粒，一日3次';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('口服');
    });

    it('应提取"用法用量："后的内容', () => {
      const text = '用法用量：饭后服用，一次1片';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('饭后');
    });
  });

  describe('批准文号提取', () => {
    it('应提取国药准字', () => {
      const text = '国药准字H20058765';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toContain('H20058765');
    });

    it('应提取批准文号字段', () => {
      const text = '【批准文号】国药准字Z10950068';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toContain('Z10950068');
    });
  });

  describe('贮藏提取', () => {
    it('应提取贮藏字段', () => {
      const text = '【贮藏】密封，置阴凉干燥处';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toContain('阴凉');
    });

    it('应提取"储存："后的内容', () => {
      const text = '储存：避光保存';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toContain('避光');
    });
  });

  describe('成分提取', () => {
    it('应提取成分字段', () => {
      const text = '【成分】本品主要成分为阿莫西林';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('阿莫西林');
    });

    it('应提取"主要成分："后的内容', () => {
      const text = '主要成分：布洛芬';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('布洛芬');
    });
  });

  describe('综合场景', () => {
    it('应从完整药品说明书提取所有字段', () => {
      const text = `
【药品名称】阿莫西林胶囊
【规格】0.25g*24粒
【生产厂家】华北制药股份有限公司
【用法用量】口服，一次0.5g，一日3次
【批准文号】国药准字H13021770
【贮藏】遮光，密封保存
【成分】阿莫西林
有效期至：2025-12-31
`;
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
      expect(result.specification).toContain('0.25g');
      expect(result.manufacturer).toContain('华北制药');
      expect(result.usage).toContain('口服');
      expect(result.approvalNumber).toContain('H13021770');
      expect(result.storage).toContain('密封');
      expect(result.ingredients).toContain('阿莫西林');
      expect(result.expiryDate).toBe('2025-12-31');
    });
  });
});

describe('单独提取函数', () => {
  it('extractName 应处理空输入', () => {
    expect(extractName('')).toBe('');
  });

  it('extractExpiryDate 应处理空输入', () => {
    expect(extractExpiryDate('')).toBe('');
  });

  it('extractSpecification 应处理空输入', () => {
    expect(extractSpecification('')).toBe('');
  });

  it('extractManufacturer 应处理空输入', () => {
    expect(extractManufacturer('')).toBe('');
  });

  it('extractUsage 应处理空输入', () => {
    expect(extractUsage('')).toBe('');
  });

  it('extractApprovalNumber 应处理空输入', () => {
    expect(extractApprovalNumber('')).toBe('');
  });

  it('extractStorage 应处理空输入', () => {
    expect(extractStorage('')).toBe('');
  });

  it('extractIngredients 应处理空输入', () => {
    expect(extractIngredients('')).toBe('');
  });
});
