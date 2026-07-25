const { analyzeMedicineInfo, formatExpiryDate } = require('../utils/ai');

describe('formatExpiryDate', () => {
  describe('边界情况', () => {
    test('空字符串返回空', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    test('null 返回空', () => {
      expect(formatExpiryDate(null)).toBe('');
    });

    test('undefined 返回空', () => {
      expect(formatExpiryDate(undefined)).toBe('');
    });
  });

  describe('中文日期格式', () => {
    test('2025年12月31日 格式', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    });

    test('2025年6月1日 格式（个位数月日）', () => {
      expect(formatExpiryDate('2025年6月1日')).toBe('2025-06-01');
    });

    test('2025年12月 格式（无日）', () => {
      expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
    });
  });

  describe('短横线分隔', () => {
    test('2025-12-31', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    test('2025-6-1（个位数月日）', () => {
      expect(formatExpiryDate('2025-6-1')).toBe('2025-06-01');
    });

    test('2025-12（无日）', () => {
      expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
    });
  });

  describe('斜杠分隔', () => {
    test('2025/12/31', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    test('2025/6/1', () => {
      expect(formatExpiryDate('2025/6/1')).toBe('2025-06-01');
    });
  });

  describe('点号分隔', () => {
    test('2025.12.31', () => {
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    test('2025.6.1', () => {
      expect(formatExpiryDate('2025.6.1')).toBe('2025-06-01');
    });
  });

  describe('年份补充', () => {
    test('两位年份自动补全为20xx', () => {
      expect(formatExpiryDate('25-12-31')).toBe('2025-12-31');
    });
  });

  describe('无效日期返回原值', () => {
    test('月份超过12', () => {
      expect(formatExpiryDate('2025-13-01')).toBe('2025-13-01');
    });

    test('日期超过31', () => {
      expect(formatExpiryDate('2025-12-32')).toBe('2025-12-32');
    });

    test('完全无关的文本', () => {
      expect(formatExpiryDate('见说明书')).toBe('见说明书');
    });

    test('只有年月不足', () => {
      expect(formatExpiryDate('2025')).toBe('2025');
    });
  });
});

describe('analyzeMedicineInfo', () => {
  describe('边界情况', () => {
    test('空字符串返回所有字段为空的对象', () => {
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

    test('null 返回所有字段为空的对象', () => {
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

    test('undefined 返回所有字段为空的对象', () => {
      const result = analyzeMedicineInfo(undefined);
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
    test('通过"药品名称"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n规格：0.5g*24粒';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toBe('阿莫西林胶囊');
    });

    test('通过"通用名"标签提取', () => {
      const text = '通用名：布洛芬缓释片\n规格：0.3g*20片';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toBe('布洛芬缓释片');
    });

    test('通过剂型关键词匹配', () => {
      const text = '本品为头孢克肟胶囊，用于敏感菌所致感染';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('头孢克肟胶囊');
    });

    test('无标签和关键词时取第一行', () => {
      const text = '某药品\n规格：0.5g\n厂家：某某制药';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toBe('某药品');
    });
  });

  describe('有效期提取', () => {
    test('通过"有效期"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n有效期：2025年12月31日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025年12月31日');
    });

    test('通过"有效期至"标签提取', () => {
      const text = '药品名称：布洛芬片\n有效期至：2026-06-30';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2026-06-30');
    });

    test('通过"EXP"标签提取', () => {
      const text = '药品名称：维生素C片\nEXP: 2025/12/31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025/12/31');
    });

    test('通过日期模式匹配', () => {
      const text = '阿莫西林胶囊 生产批号：20230101 2025年12月31日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025年12月31日');
    });
  });

  describe('规格提取', () => {
    test('通过"规格"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n规格：0.5g*24粒';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toBe('0.5g*24粒');
    });

    test('通过"包装规格"标签提取', () => {
      const text = '药品名称：布洛芬片\n包装规格：0.3g*20片/盒';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toBe('0.3g*20片/盒');
    });
  });

  describe('生产厂家提取', () => {
    test('通过"生产厂家"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n生产厂家：华北制药股份有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('华北制药股份有限公司');
    });

    test('通过"厂家"标签提取', () => {
      const text = '药品名称：布洛芬片\n厂家：中美史克';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('中美史克');
    });

    test('通过"生产企业"标签提取', () => {
      const text = '药品名称：维生素C片\n生产企业：东北制药';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('东北制药');
    });
  });

  describe('用法用量提取', () => {
    test('通过"用法用量"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n用法用量：口服。成人一次0.5g，每6-8小时1次';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('口服');
      expect(result.usage).toContain('0.5g');
    });

    test('通过"用法"标签提取', () => {
      const text = '药品名称：布洛芬片\n用法：饭后口服';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toBe('饭后口服');
    });
  });

  describe('国药准字提取', () => {
    test('通过"国药准字"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n国药准字：H13021770';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H13021770');
    });

    test('通过"批准文号"标签提取', () => {
      const text = '药品名称：布洛芬片\n批准文号：国药准字H10900089';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H10900089');
    });

    test('直接匹配国药准字模式', () => {
      const text = '阿莫西林胶囊 国药准字H20003146 规格0.5g';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H20003146');
    });
  });

  describe('贮藏条件提取', () => {
    test('通过"贮藏"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n贮藏：密封，在干燥处保存';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toBe('密封，在干燥处保存');
    });

    test('通过"储存"标签提取', () => {
      const text = '药品名称：胰岛素注射液\n储存：2-8℃冷藏';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toBe('2-8℃冷藏');
    });

    test('通过"保存"标签提取', () => {
      const text = '药品名称：维生素C片\n保存：避光，阴凉处';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toBe('避光，阴凉处');
    });
  });

  describe('成分提取', () => {
    test('通过"成份"标签提取', () => {
      const text = '药品名称：阿莫西林胶囊\n成份：本品主要成份为阿莫西林';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toBe('本品主要成份为阿莫西林');
    });

    test('通过"成分"标签提取', () => {
      const text = '药品名称：布洛芬片\n成分：每片含布洛芬0.3g';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toBe('每片含布洛芬0.3g');
    });

    test('通过"主要成份"标签提取', () => {
      const text = '药品名称：感冒灵颗粒\n主要成份：三叉苦、金盏银盘、野菊花';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('三叉苦');
    });
  });

  describe('完整药品说明书场景', () => {
    test('典型药品说明书完整解析', () => {
      const text = `药品名称：阿莫西林胶囊
通用名：阿莫西林胶囊
规格：0.5g*24粒
生产厂家：华北制药股份有限公司
用法用量：口服。成人一次0.5g，每6-8小时1次，一日剂量不超过4g。
国药准字：H13021770
贮藏：密封，在干燥处保存
成份：本品主要成份为阿莫西林
有效期：2025年12月31日`;

      const result = analyzeMedicineInfo(text);

      expect(result.name).toBe('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g*24粒');
      expect(result.manufacturer).toBe('华北制药股份有限公司');
      expect(result.usage).toContain('口服');
      expect(result.approvalNumber).toBe('H13021770');
      expect(result.storage).toBe('密封，在干燥处保存');
      expect(result.ingredients).toBe('本品主要成份为阿莫西林');
      expect(result.expiryDate).toBe('2025年12月31日');
    });

    test('英文标签的药品说明书', () => {
      const text = `药品名称：布洛芬缓释片
EXP: 2026/06/30
规格：0.3g*20片
厂家：中美史克`;

      const result = analyzeMedicineInfo(text);

      expect(result.name).toBe('布洛芬缓释片');
      expect(result.expiryDate).toBe('2026/06/30');
      expect(result.specification).toBe('0.3g*20片');
      expect(result.manufacturer).toBe('中美史克');
    });
  });
});
