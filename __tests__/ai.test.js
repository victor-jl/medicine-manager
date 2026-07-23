const { extractMedicineName, formatExpiryDate, analyzeMedicineInfo } = require('../utils/ai');

describe('extractMedicineName', () => {
  test('空输入返回空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('从包含剂型关键词的文本中提取药品名称', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.25g*24粒')).toContain('阿莫西林胶囊');
    expect(extractMedicineName('布洛芬缓释片 0.3g')).toContain('布洛芬缓释片');
    expect(extractMedicineName('感冒清热颗粒 12g*10袋')).toContain('感冒清热颗粒');
    expect(extractMedicineName('双黄连口服液 10ml*10支')).toContain('双黄连口服液');
  });

  test('从包含有效成分关键词的文本中提取药品名称', () => {
    expect(extractMedicineName('对乙酰氨基酚 退烧止痛')).toContain('对乙酰氨基酚');
    expect(extractMedicineName('二甲双胍缓释片 0.5g')).toContain('二甲双胍');
    expect(extractMedicineName('奥美拉唑肠溶胶囊 20mg')).toContain('奥美拉唑');
  });

  test('关键词出现在文本中间时正确截取上下文', () => {
    const result = extractMedicineName('【药品名称】通用名称：阿莫西林胶囊\n本品主要成份为阿莫西林');
    expect(result).toContain('阿莫西林胶囊');
  });

  test('无关键词时返回第一行文本', () => {
    expect(extractMedicineName('某种神秘药品\n详细说明\n更多信息')).toBe('某种神秘药品');
  });

  test('单行无关键词时返回该行前30字符', () => {
    const longText = '这是一个非常非常非常非常非常非常非常非常长的药品名称描述';
    expect(extractMedicineName(longText)).toBe(longText.substring(0, 30));
  });

  test('剂型关键词优先于成分关键词匹配', () => {
    const result = extractMedicineName('阿莫西林胶囊 本品含阿莫西林');
    expect(result).toContain('胶囊');
  });
});

describe('formatExpiryDate', () => {
  test('空输入返回空字符串', () => {
    expect(formatExpiryDate('')).toBe('');
    expect(formatExpiryDate(null)).toBe('');
    expect(formatExpiryDate(undefined)).toBe('');
  });

  test('格式化中文日期格式', () => {
    expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
    expect(formatExpiryDate('2025年06月15日')).toBe('2025-06-15');
  });

  test('格式化带点分隔的日期', () => {
    expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    expect(formatExpiryDate('2025.06.01')).toBe('2025-06-01');
  });

  test('格式化带斜杠分隔的日期', () => {
    expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    expect(formatExpiryDate('2025/06/01')).toBe('2025-06-01');
  });

  test('格式化已是标准格式的日期', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
  });

  test('只有年月的日期', () => {
    expect(formatExpiryDate('2025-12')).toBe('2025-12');
    expect(formatExpiryDate('2025年12月')).toBe('2025-12');
  });

  test('补全年份前缀', () => {
    expect(formatExpiryDate('25-12-31')).toBe('2025-12-31');
  });

  test('补齐月份和日期的前导零', () => {
    expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
    expect(formatExpiryDate('2025年1月5日')).toBe('2025-01-05');
  });

  test('处理含空格的日期字符串', () => {
    expect(formatExpiryDate('2025 - 12 - 31')).toBe('2025-12-31');
  });
});

describe('analyzeMedicineInfo', () => {
  test('空输入返回空结果对象', () => {
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

  test('非字符串输入返回空结果对象', () => {
    expect(analyzeMedicineInfo(null)).toEqual(expect.objectContaining({ name: '' }));
    expect(analyzeMedicineInfo(undefined)).toEqual(expect.objectContaining({ name: '' }));
  });

  test('从药品说明书文本中提取全部字段', () => {
    const text = `【药品名称】阿莫西林胶囊
【规格】0.25g*24粒
【生产厂家】华北制药股份有限公司
【用法用量】口服，一次0.5g，每6-8小时1次
【国药准字】H13021770
【贮藏】遮光，密封保存
【成分】本品主要成份为阿莫西林
【有效期】2025年12月31日`;

    const result = analyzeMedicineInfo(text);
    expect(result.name).toContain('阿莫西林胶囊');
    expect(result.expiryDate).toBe('2025-12-31');
    expect(result.specification).toBe('0.25g*24粒');
    expect(result.manufacturer).toBe('华北制药股份有限公司');
    expect(result.usage).toContain('口服');
    expect(result.approvalNumber).toBe('H13021770');
    expect(result.storage).toContain('密封');
    expect(result.ingredients).toContain('阿莫西林');
  });

  test('提取有效期的多种格式', () => {
    expect(analyzeMedicineInfo('有效期至：2025-12-31\n阿莫西林胶囊').expiryDate).toBe('2025-12-31');
    expect(analyzeMedicineInfo('失效期：2025.06.30\n布洛芬片').expiryDate).toBe('2025-06-30');
    expect(analyzeMedicineInfo('EXP: 2025/03/15\n感冒灵颗粒').expiryDate).toBe('2025-03-15');
  });

  test('仅包含药品名称的简单文本', () => {
    const result = analyzeMedicineInfo('布洛芬缓释片');
    expect(result.name).toContain('布洛芬缓释片');
    expect(result.expiryDate).toBe('');
    expect(result.specification).toBe('');
  });

  test('自动从文本中识别有效成分', () => {
    const result = analyzeMedicineInfo('本品为复方制剂，含布洛芬和对乙酰氨基酚');
    expect(result.ingredients).toContain('布洛芬');
    expect(result.ingredients).toContain('对乙酰氨基酚');
  });

  test('不覆盖已显式提取的成分字段', () => {
    const text = `【成分】阿莫西林
文本中还提到了布洛芬作为辅助成分`;
    const result = analyzeMedicineInfo(text);
    expect(result.ingredients).toBe('阿莫西林');
  });
});
