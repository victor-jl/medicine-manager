// tests/ai.test.js
const { analyzeMedicineInfo, formatExpiryDate } = require('../utils/ai');

describe('analyzeMedicineInfo', () => {
  test('应返回空对象当输入为空', () => {
    const result = analyzeMedicineInfo('');
    expect(result.name).toBe('');
    expect(result.expiryDate).toBe('');
  });

  test('应正确提取包含药品关键词的名称', () => {
    const text = '阿莫西林胶囊\n有效期至2025-12-31\n规格：0.25g*12粒';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toContain('阿莫西林');
  });

  test('应提取药品名称为第一行当无关键词匹配', () => {
    const text = '某种药品\n有效期至2025-12-31';
    const result = analyzeMedicineInfo(text);
    expect(result.name).toBe('某种药品');
  });

  test('应正确提取有效期 (YYYY-MM-DD格式)', () => {
    const text = '布洛芬片\n有效期至2025-12-31';
    const result = analyzeMedicineInfo(text);
    expect(result.expiryDate).toBe('2025-12-31');
  });

  test('应正确提取有效期 (点分隔格式)', () => {
    const text = '布洛芬片\n有效期至2025.12.31';
    const result = analyzeMedicineInfo(text);
    expect(result.expiryDate).toBe('2025.12.31');
  });

  test('应正确提取规格信息', () => {
    const text = '维生素C\n规格：100mg*30片';
    const result = analyzeMedicineInfo(text);
    expect(result.specification).toBe('100mg*30片');
  });

  test('应正确提取生产厂家', () => {
    const text = '感冒灵\n生产厂家：某制药厂';
    const result = analyzeMedicineInfo(text);
    expect(result.manufacturer).toBe('某制药厂');
  });

  test('应正确提取用法用量', () => {
    const text = '退烧药\n用法用量：口服，一次1片';
    const result = analyzeMedicineInfo(text);
    expect(result.usage).toBe('口服，一次1片');
  });

  test('应正确提取国药准字', () => {
    const text = '板蓝根\n国药准字Z12345678';
    const result = analyzeMedicineInfo(text);
    expect(result.approvalNumber).toBe('Z12345678');
  });

  test('应正确提取贮藏条件', () => {
    const text = '胰岛素\n贮藏：2-8°C冷藏';
    const result = analyzeMedicineInfo(text);
    expect(result.storage).toBe('2-8°C冷藏');
  });

  test('应正确提取成分信息', () => {
    const text = '复方感冒灵\n主要成分：对乙酰氨基酚、咖啡因';
    const result = analyzeMedicineInfo(text);
    expect(result.ingredients).toBe('对乙酰氨基酚、咖啡因');
  });

  test('应处理多行文本并正确提取各字段', () => {
    const text = `头孢克肟胶囊
规格：100mg*6粒
生产厂家：某药企
用法：口服，一次1粒
国药准字H12345678
贮藏：密封，遮光
有效期至2026-06-30`;
    const result = analyzeMedicineInfo(text);
    expect(result.name).toContain('头孢');
    expect(result.specification).toBe('100mg*6粒');
    expect(result.manufacturer).toBe('某药企');
    expect(result.usage).toBe('口服，一次1粒');
    expect(result.approvalNumber).toBe('H12345678');
    expect(result.storage).toBe('密封，遮光');
  });
});

describe('formatExpiryDate', () => {
  test('应返回空字符串当输入为空', () => {
    expect(formatExpiryDate('')).toBe('');
  });

  test('应正确格式化 YYYY-MM-DD 格式', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
  });

  test('应处理年月日分隔符', () => {
    expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
  });

  test('应处理点分隔格式', () => {
    expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
  });

  test('应处理斜杠分隔格式', () => {
    expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
  });

  test('应补齐单位数月份和日期', () => {
    expect(formatExpiryDate('2025-1-5')).toBe('2025-01-05');
  });

  test('应保留原始值当无法解析格式', () => {
    expect(formatExpiryDate('无效日期')).toBe('无效日期');
  });

  test('应处理带前缀的日期', () => {
    expect(formatExpiryDate('有效期至2025-12-31')).toBe('2025-12-31');
  });
});
