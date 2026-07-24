const { analyzeMedicineInfo, formatExpiryDate } = require('../utils/ai');

describe('analyzeMedicineInfo', () => {
  test('空输入返回默认空对象', () => {
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

  test('null 输入返回默认空对象', () => {
    const result = analyzeMedicineInfo(null);
    expect(result.name).toBe('');
    expect(result.expiryDate).toBe('');
  });

  test('undefined 输入返回默认空对象', () => {
    const result = analyzeMedicineInfo(undefined);
    expect(result.name).toBe('');
  });

  test('非字符串输入返回默认空对象', () => {
    const result = analyzeMedicineInfo(12345);
    expect(result.name).toBe('');
  });

  test('提取胶囊类药品名称', () => {
    const text = '阿莫西林胶囊\n规格: 0.5g*24粒';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toContain('阿莫西林');
    expect(result.specification).toContain('0.5g');
  });

  test('提取有效期', () => {
    const text = '布洛芬片\n有效期至: 2025-12-31';
    const result = analyzeMedicineInfo(text);
    expect(result.expiryDate).toContain('2025');
    expect(result.expiryDate).toContain('12');
  });

  test('提取生产日期格式的有效期', () => {
    const text = '维生素C片\n生产日期: 2023年06月15日';
    const result = analyzeMedicineInfo(text);
    expect(result.expiryDate).toContain('2023');
  });

  test('提取生产厂家', () => {
    const text = '奥美拉唑肠溶胶囊\n生产厂家: 山东新华制药股份有限公司';
    const result = analyzeMedicineInfo(text);
    expect(result.manufacturer).toContain('山东新华制药');
  });

  test('提取用法用量', () => {
    const text = '布洛芬片\n用法用量: 口服，一次1片，一日3次';
    const result = analyzeMedicineInfo(text);
    expect(result.usage).toContain('口服');
    expect(result.usage).toContain('一次1片');
  });

  test('提取国药准字', () => {
    const text = '阿莫西林胶囊\n国药准字H37020332';
    const result = analyzeMedicineInfo(text);
    expect(result.approvalNumber).toContain('H37020332');
  });

  test('提取贮藏条件', () => {
    const text = '胰岛素注射液\n贮藏: 2-8℃冷藏保存';
    const result = analyzeMedicineInfo(text);
    expect(result.storage).toContain('冷藏');
  });

  test('提取成分', () => {
    const text = '布洛芬缓释胶囊\n主要成分: 布洛芬0.3g';
    const result = analyzeMedicineInfo(text);
    expect(result.ingredients).toContain('布洛芬');
  });

  test('完整药盒信息解析', () => {
    const text = `阿莫西林胶囊
规格: 0.5g*24粒
生产厂家: 珠海联邦制药股份有限公司
有效期至: 2025-06-30
用法用量: 口服，一次0.5g，每6-8小时1次
国药准字H44021518
贮藏: 遮光，密封保存
主要成分: 阿莫西林`;
    const result = analyzeMedicineInfo(text);
    expect(result.name).toContain('阿莫西林');
    expect(result.specification).toContain('0.5g');
    expect(result.manufacturer).toContain('珠海联邦');
    expect(result.expiryDate).toContain('2025');
    expect(result.usage).toContain('口服');
    expect(result.approvalNumber).toContain('H44021518');
    expect(result.storage).toContain('遮光');
    expect(result.ingredients).toContain('阿莫西林');
  });

  test('无关键词时取第一行作为名称', () => {
    const text = '神秘药品A\n其他信息';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('神秘药品A');
  });
});

describe('formatExpiryDate', () => {
  test('空字符串返回空', () => {
    expect(formatExpiryDate('')).toBe('');
  });

  test('null 返回空', () => {
    expect(formatExpiryDate(null)).toBe('');
  });

  test('undefined 返回空', () => {
    expect(formatExpiryDate(undefined)).toBe('');
  });

  test('标准日期格式 2025-12-31', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
  });

  test('斜杠格式 2025/12/31', () => {
    expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
  });

  test('中文格式 2025年12月31日', () => {
    expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
  });

  test('中文格式无日 2025年12月', () => {
    expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
  });

  test('年月格式 2025-12', () => {
    expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
  });

  test('仅有年份 2025', () => {
    expect(formatExpiryDate('2025')).toBe('2025-01-01');
  });

  test('点号格式 2025.12.31', () => {
    expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
  });

  test('补零处理 2025-1-1', () => {
    expect(formatExpiryDate('2025-1-1')).toBe('2025-01-01');
  });

  test('前后有空格', () => {
    expect(formatExpiryDate('  2025-12-31  ')).toBe('2025-12-31');
  });

  test('无数字的字符串', () => {
    expect(formatExpiryDate('暂无')).toBe('暂无');
  });
});
