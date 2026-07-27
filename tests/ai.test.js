const { analyzeMedicineInfo, formatExpiryDate } = require('../utils/ai');

describe('formatExpiryDate - 有效期格式化', () => {
  describe('边界条件 - 空值处理', () => {
    it('空字符串应返回空字符串', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    it('null 应返回空字符串', () => {
      expect(formatExpiryDate(null)).toBe('');
    });

    it('undefined 应返回空字符串', () => {
      expect(formatExpiryDate(undefined)).toBe('');
    });

    it('非字符串类型应返回空字符串', () => {
      expect(formatExpiryDate(123)).toBe('');
      expect(formatExpiryDate({})).toBe('');
    });
  });

  describe('中文日期格式转换', () => {
    it('应将"2025年12月31日"转为"2025-12-31"', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    });

    it('应将"2025年6月1日"转为"2025-06-01"', () => {
      expect(formatExpiryDate('2025年6月1日')).toBe('2025-06-01');
    });

    it('应将"2025年12月"转为"2025-12-01"（无日期默认01）', () => {
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });
  });

  describe('横杠日期格式', () => {
    it('应将"2025-12-31"保持不变', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    it('应将"2025-6-1"补零为"2025-06-01"', () => {
      expect(formatExpiryDate('2025-6-1')).toBe('2025-06-01');
    });

    it('应将"2025-12"补日为"2025-12-01"', () => {
      expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
    });
  });

  describe('点号分隔日期', () => {
    it('应将"2025.12.31"转为"2025-12-31"', () => {
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    it('应将"2025.6.1"转为"2025-06-01"', () => {
      expect(formatExpiryDate('2025.6.1')).toBe('2025-06-01');
    });
  });

  describe('斜杠分隔日期', () => {
    it('应将"2025/12/31"转为"2025-12-31"', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });
  });

  describe('纯数字紧凑格式', () => {
    it('应将"20251231"转为"2025-12-31"', () => {
      expect(formatExpiryDate('20251231')).toBe('2025-12-31');
    });
  });

  describe('前后空白处理', () => {
    it('应去除前后空白字符', () => {
      expect(formatExpiryDate('  2025-12-31  ')).toBe('2025-12-31');
    });
  });

  describe('无法识别的格式', () => {
    it('无法识别的格式应原样返回', () => {
      expect(formatExpiryDate('明年年底')).toBe('明年年底');
    });
  });
});

describe('analyzeMedicineInfo - 药品信息智能分析', () => {
  describe('边界条件 - 空值处理', () => {
    it('空字符串应返回全空字段对象', () => {
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

    it('null 应返回全空字段对象', () => {
      const result = analyzeMedicineInfo(null);
      expect(result.name).toBe('');
      expect(result.expiryDate).toBe('');
    });

    it('非字符串应返回全空字段对象', () => {
      const result = analyzeMedicineInfo(123);
      expect(result.name).toBe('');
    });
  });

  describe('药品名称提取', () => {
    it('应从剂型关键词行提取名称', () => {
      const text = '阿莫西林胶囊\n0.25g*24粒';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
      expect(result.name).toContain('胶囊');
    });

    it('应识别"片"剂型', () => {
      const text = '布洛芬缓释片\n0.3g*20片';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('布洛芬');
    });

    it('无关键词时应返回第一行', () => {
      const text = '通用名：某种药品\n规格：10mg';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('通用名');
    });
  });

  describe('有效期提取', () => {
    it('应提取"有效期至2025年12月31日"', () => {
      const text = '药品名称\n有效期至2025年12月31日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025年12月31日');
    });

    it('应提取"有效期：2025-12-31"', () => {
      const text = '药品说明\n有效期：2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025-12-31');
    });

    it('应提取"失效期2025.06.30"', () => {
      const text = '失效期2025.06.30';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025.06.30');
    });
  });

  describe('规格提取', () => {
    it('应提取"规格：0.25g*24粒"', () => {
      const text = '阿莫西林胶囊\n规格：0.25g*24粒';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toBe('0.25g*24粒');
    });

    it('应提取"规格 10mg*100片"（无冒号）', () => {
      const text = '规格 10mg*100片';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toBe('10mg*100片');
    });
  });

  describe('生产厂家提取', () => {
    it('应提取"生产厂家：某某制药有限公司"', () => {
      const text = '生产厂家：某某制药有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('某某制药有限公司');
    });

    it('应提取"厂家：华北制药"', () => {
      const text = '厂家：华北制药';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('华北制药');
    });
  });

  describe('用法用量提取', () => {
    it('应提取"用法用量：口服一次1粒一日3次"', () => {
      const text = '用法用量：口服一次1粒一日3次';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('一次1粒');
    });

    it('应提取"口服：一次2片"', () => {
      const text = '口服：一次2片';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('一次2片');
    });
  });

  describe('批准文号提取', () => {
    it('应提取"国药准字H12345678"', () => {
      const text = '国药准字H12345678';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H12345678');
    });

    it('应提取"批准文号：Z87654321"', () => {
      const text = '批准文号：Z87654321';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('Z87654321');
    });
  });

  describe('贮藏条件提取', () => {
    it('应提取"贮藏：密封阴凉干燥处"', () => {
      const text = '贮藏：密封阴凉干燥处';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toBe('密封阴凉干燥处');
    });

    it('应提取"保存：避光冷藏"', () => {
      const text = '保存：避光冷藏';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toBe('避光冷藏');
    });
  });

  describe('成分提取', () => {
    it('应提取"成分：阿莫西林"', () => {
      const text = '成分：阿莫西林';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toBe('阿莫西林');
    });

    it('应提取"主要成分：对乙酰氨基酚 咖啡因"', () => {
      const text = '主要成分：对乙酰氨基酚 咖啡因';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('对乙酰氨基酚');
    });
  });

  describe('完整药盒信息解析', () => {
    it('应从完整药盒文本中提取所有字段', () => {
      const text = `阿莫西林胶囊
规格：0.25g*24粒
生产厂家：华北制药股份有限公司
用法用量：口服 一次0.5g 一日3次
国药准字H13021770
有效期至2025年12月31日
贮藏：密封 遮光
成分：阿莫西林`;

      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
      expect(result.specification).toBe('0.25g*24粒');
      expect(result.manufacturer).toContain('华北制药');
      expect(result.usage).toContain('一次0.5g');
      expect(result.approvalNumber).toBe('H13021770');
      expect(result.expiryDate).toContain('2025');
      expect(result.storage).toContain('密封');
      expect(result.ingredients).toBe('阿莫西林');
    });
  });
});
