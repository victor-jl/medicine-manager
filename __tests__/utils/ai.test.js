const { analyzeMedicineInfo, formatExpiryDate, extractValue, isLikelyMedicineName } = require('../../utils/ai');

describe('analyzeMedicineInfo', () => {
  describe('输入验证', () => {
    test('空输入返回空对象', () => {
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

    test('null/undefined 输入返回空对象', () => {
      const expectedEmpty = {
        name: '',
        expiryDate: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: ''
      };
      expect(analyzeMedicineInfo(null)).toEqual(expectedEmpty);
      expect(analyzeMedicineInfo(undefined)).toEqual(expectedEmpty);
    });

    test('非字符串输入返回空对象', () => {
      expect(analyzeMedicineInfo(123)).toEqual(expect.objectContaining({ name: '' }));
      expect(analyzeMedicineInfo({})).toEqual(expect.objectContaining({ name: '' }));
    });
  });

  describe('有效期提取', () => {
    test('提取"有效期至"格式', () => {
      const result = analyzeMedicineInfo('有效期至 2025-12-31');
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('提取"有效期"格式（带日期）', () => {
      const result = analyzeMedicineInfo('有效期：2025年12月31日');
      expect(result.expiryDate).toBe('2025年12月31日');
    });

    test('提取YYYY/MM/DD格式', () => {
      const result = analyzeMedicineInfo('有效期 2025/12/31');
      expect(result.expiryDate).toBe('2025/12/31');
    });

    test('提取YYYYMMDD格式（8位，带连字符）', () => {
      const result = analyzeMedicineInfo('效期 2025-12-31');
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('提取YYYYMM格式（6位）', () => {
      const result = analyzeMedicineInfo('效期 202512');
      expect(result.expiryDate).toBe('202512');
    });
  });

  describe('规格提取', () => {
    test('提取规格信息', () => {
      const result = analyzeMedicineInfo('规格：0.5g×12粒');
      expect(result.specification).toBe('0.5g×12粒');
    });

    test('规格字段只提取一次', () => {
      const result = analyzeMedicineInfo('规格：0.5g\n规格：1.0g');
      expect(result.specification).toBe('0.5g');
    });
  });

  describe('生产厂家提取', () => {
    test('提取"生产企业"格式', () => {
      const result = analyzeMedicineInfo('生产企业：XX制药有限公司');
      expect(result.manufacturer).toBe('XX制药有限公司');
    });

    test('提取"厂家"格式', () => {
      const result = analyzeMedicineInfo('厂家：YY药业');
      expect(result.manufacturer).toBe('YY药业');
    });
  });

  describe('国药准字提取', () => {
    test('提取国药准字', () => {
      const result = analyzeMedicineInfo('国药准字H12345678');
      expect(result.approvalNumber).toBe('国药准字H12345678');
    });

    test('提取带"批准文号"的格式', () => {
      const result = analyzeMedicineInfo('批准文号：国药准字Z12345678');
      expect(result.approvalNumber).toBe('国药准字Z12345678');
    });
  });

  describe('药品名称推断', () => {
    test('从包含剂型的文本推断名称', () => {
      const result = analyzeMedicineInfo('阿莫西林胶囊\n规格：0.5g');
      expect(result.name).toBe('阿莫西林胶囊');
    });

    test('无匹配时返回第一行', () => {
      const result = analyzeMedicineInfo('某药品名称\n其他信息');
      expect(result.name).toBe('某药品名称');
    });

    test('名称截取前30字符', () => {
      const longName = '这是一个非常非常非常非常非常非常非常非常长的药品名称';
      const result = analyzeMedicineInfo(longName);
      expect(result.name.length).toBeLessThanOrEqual(30);
    });
  });

  describe('完整OCR文本解析', () => {
    test('解析完整药品包装信息', () => {
      const ocrText = `
        阿莫西林胶囊
        规格：0.5g×12粒/盒
        有效期至：2025-12-31
        生产企业：XX制药有限公司
        国药准字H12345678
        用法用量：口服，一次1粒，一日3次
        贮藏：密封，在阴凉处保存
        成分：阿莫西林
      `;
      const result = analyzeMedicineInfo(ocrText);
      
      expect(result.name).toBe('阿莫西林胶囊');
      expect(result.specification).toBe('0.5g×12粒/盒');
      expect(result.expiryDate).toBe('2025-12-31');
      expect(result.manufacturer).toBe('XX制药有限公司');
      expect(result.approvalNumber).toBe('国药准字H12345678');
      expect(result.usage).toContain('口服');
      expect(result.storage).toContain('密封');
      expect(result.ingredients).toBe('阿莫西林');
    });
  });
});

describe('formatExpiryDate', () => {
  describe('空输入处理', () => {
    test('空字符串返回空', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    test('null/undefined 返回空', () => {
      expect(formatExpiryDate(null)).toBe('');
      expect(formatExpiryDate(undefined)).toBe('');
    });
  });

  describe('日期格式转换', () => {
    test('YYYY年MM月DD日 格式', () => {
      expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    });

    test('YYYY年MM月 格式', () => {
      expect(formatExpiryDate('2025年12月')).toBe('2025-12');
    });

    test('YYYY/MM/DD 格式', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    test('YYYY.MM.DD 格式', () => {
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    test('YYYYMMDD 格式（8位数字）', () => {
      expect(formatExpiryDate('20251231')).toBe('2025-12-31');
    });

    test('YYYYMM 格式（6位数字）', () => {
      expect(formatExpiryDate('202512')).toBe('2025-12');
    });
  });

  describe('月份补零', () => {
    test('单数月份补零', () => {
      expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
      expect(formatExpiryDate('2025年1月')).toBe('2025-01');
    });
  });

  describe('边界情况', () => {
    test('无法识别的格式原样返回', () => {
      expect(formatExpiryDate('未知日期')).toBe('未知日期');
    });

    test('纯数字格式', () => {
      expect(formatExpiryDate('2025')).toBe('2025');
    });
  });
});

describe('isLikelyMedicineName', () => {
  test('识别常见剂型', () => {
    expect(isLikelyMedicineName('阿莫西林胶囊')).toBe(true);
    expect(isLikelyMedicineName('布洛芬片')).toBe(true);
    expect(isLikelyMedicineName('感冒颗粒')).toBe(true);
    expect(isLikelyMedicineName('止咳糖浆')).toBe(true);
    expect(isLikelyMedicineName('六味地黄丸')).toBe(true);
  });

  test('非药品名称返回 false', () => {
    expect(isLikelyMedicineName('生产日期')).toBe(false);
    expect(isLikelyMedicineName('有效期至')).toBe(false);
    expect(isLikelyMedicineName('普通文本')).toBe(false);
  });

  test('大小写不敏感', () => {
    expect(isLikelyMedicineName('AMOXICILLIN胶囊')).toBe(true);
  });
});

describe('extractValue', () => {
  test('提取冒号后的值', () => {
    expect(extractValue('规格：0.5g', '规格')).toBe('0.5g');
  });

  test('提取空格后的值', () => {
    expect(extractValue('规格 0.5g', '规格')).toBe('0.5g');
  });

  test('关键词不存在返回空', () => {
    expect(extractValue('无关键词', '规格')).toBe('');
  });

  test('正则表达式匹配', () => {
    expect(extractValue('生产企业：XX药业', /生产企业|厂家/)).toBe('XX药业');
  });
});
